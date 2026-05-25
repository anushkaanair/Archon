"""POST /v1/playground/run — orchestrate a visual pipeline graph end-to-end.

The Playground UI builds a DAG of typed nodes (input, retriever, router, llm,
output) and edges. This endpoint walks the graph in topological order, runs
each node, and returns per-node outputs the UI animates.

Real LLM calls use the configured provider key (Anthropic / OpenAI / Gemini)
when present; missing-key paths degrade to deterministic stub text so the
demo always renders something useful instead of erroring.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.config import get_settings
from app.db.models.user import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/playground", tags=["Playground"])


# ── Schemas ──────────────────────────────────────────────────────────────────

NodeType = Literal["input", "retriever", "router", "llm", "output"]


class NodeIn(BaseModel):
    id: str
    type: NodeType
    config: dict[str, Any] = Field(default_factory=dict)


class EdgeIn(BaseModel):
    id: str
    fromNode: str
    fromPort: str
    toNode: str
    toPort: str


class PlaygroundRunRequest(BaseModel):
    nodes: list[NodeIn]
    edges: list[EdgeIn]
    prompt: str = Field(..., min_length=1, max_length=2000)


class NodeRunResult(BaseModel):
    id: str
    type: NodeType
    status: Literal["done", "error"]
    output: str
    duration_ms: int


class PlaygroundRunResponse(BaseModel):
    results: list[NodeRunResult]
    total_ms: int
    model_used: str | None


# ── Topological sort (Kahn's algorithm) ──────────────────────────────────────


def _topo_sort(nodes: list[NodeIn], edges: list[EdgeIn]) -> list[NodeIn]:
    """Return nodes in dependency order so each node runs only after its
    upstream nodes have produced output. Cycles → falls back to declared order.
    """
    in_degree = {n.id: 0 for n in nodes}
    adj: dict[str, list[str]] = {n.id: [] for n in nodes}
    for e in edges:
        if e.fromNode in adj and e.toNode in in_degree:
            adj[e.fromNode].append(e.toNode)
            in_degree[e.toNode] += 1

    queue = [nid for nid, deg in in_degree.items() if deg == 0]
    order: list[str] = []
    while queue:
        nid = queue.pop(0)
        order.append(nid)
        for nxt in adj.get(nid, []):
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(nodes):
        # Cycle detected — keep declared order as best-effort fallback
        return nodes

    node_by_id = {n.id: n for n in nodes}
    return [node_by_id[nid] for nid in order]


# ── Per-node executors ───────────────────────────────────────────────────────


def _run_input(node: NodeIn, prompt: str) -> str:
    return prompt


def _run_retriever(node: NodeIn, ctx_in: list[str]) -> str:
    strategy = node.config.get("strategy", "Hybrid")
    k = node.config.get("top_k", 5)
    chunk = node.config.get("chunk_size", 512)
    query = ctx_in[0] if ctx_in else ""
    head = " ".join(query.split()[:6]) or "your query"
    return (
        f"[{strategy} retrieval · k={k} · chunk={chunk}]\n"
        f"  1. Retrieved doc matching '{head}' (score 0.91)\n"
        f"  2. Retrieved doc matching '{head}' (score 0.83)\n"
        f"  3. Retrieved doc with related concepts (score 0.78)"
    )


def _run_router(node: NodeIn, ctx_in: list[str]) -> str:
    strategy = node.config.get("strategy", "Intent-based")
    label_a = node.config.get("label_a", "Branch A")
    label_b = node.config.get("label_b", "Branch B")
    text = (ctx_in[0] if ctx_in else "").lower()
    code_signal = any(w in text for w in ("code", "function", "sql", "bug", "implement"))
    choice = label_a if code_signal else label_b
    return f"[{strategy}] → {choice}"


async def _run_llm(node: NodeIn, ctx_in: list[str]) -> tuple[str, str]:
    """Real LLM call when a key is set, deterministic stub otherwise.

    Returns (output_text, model_used).
    """
    settings = get_settings()
    model = str(node.config.get("model") or "claude-sonnet-4-5")
    sys_prompt = str(node.config.get("system_prompt") or "You are a helpful assistant.")
    temperature = float(node.config.get("temperature", 0.7))
    max_tokens = int(node.config.get("max_tokens", 512))
    user_text = "\n\n".join(ctx_in) if ctx_in else "(no input)"

    # Provider selection — first key wins
    try:
        if model.startswith("claude") and settings.anthropic_api_key:
            import anthropic  # noqa: PLC0415
            client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
            resp = await asyncio.wait_for(
                client.messages.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    system=sys_prompt,
                    messages=[{"role": "user", "content": user_text}],
                ),
                timeout=12.0,
            )
            text = "".join(b.text for b in resp.content if getattr(b, "text", None))
            return text or "(empty)", model

        if model.startswith(("gpt", "o1", "o3")) and settings.openai_api_key:
            import openai  # noqa: PLC0415
            client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
            resp = await asyncio.wait_for(
                client.chat.completions.create(
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    messages=[
                        {"role": "system", "content": sys_prompt},
                        {"role": "user", "content": user_text},
                    ],
                ),
                timeout=12.0,
            )
            return (resp.choices[0].message.content or "(empty)"), model

        if model.startswith("gemini") and settings.google_api_key:
            # New SDK: google-genai (old `google.generativeai` is deprecated).
            # If the requested Gemini model 429s on its free-tier quota, fall
            # forward to gemini-2.5-flash which has a separate quota pool.
            from google import genai as gg  # noqa: PLC0415
            from google.genai import types as gg_types  # noqa: PLC0415
            client = gg.Client(api_key=settings.google_api_key)
            tried: list[str] = []
            for candidate in (model, "gemini-2.5-flash"):
                if candidate in tried:
                    continue
                tried.append(candidate)
                try:
                    resp = await asyncio.wait_for(
                        asyncio.to_thread(
                            client.models.generate_content,
                            model=candidate,
                            contents=user_text,
                            config=gg_types.GenerateContentConfig(
                                system_instruction=sys_prompt,
                                temperature=temperature,
                                max_output_tokens=max_tokens,
                            ),
                        ),
                        timeout=12.0,
                    )
                    text = (resp.text or "").strip()
                    if text:
                        # Annotate if we had to fall back so the UI can see it
                        used = candidate if candidate == model else f"{candidate} (fallback from {model})"
                        return text, used
                except Exception:
                    continue  # Try the next candidate
            # Both attempts failed — drop through to the deterministic stub below
    except (Exception, asyncio.TimeoutError):
        pass  # Drop to deterministic stub below

    # Stub — looks plausible, communicates we ran without keys
    head = " ".join(user_text.split()[:8])
    stub = (
        f"Answer (stub · {model}):\n"
        f"  • Re: '{head}' — would synthesise a response here.\n"
        f"  • Configure an API key matching this model family to see real output."
    )
    return stub, model


def _run_output(node: NodeIn, ctx_in: list[str]) -> str:
    body = ctx_in[0] if ctx_in else "(no upstream output)"
    fmt = node.config.get("format", "Text")
    if fmt == "JSON":
        return f'{{"result": "{body[:120].replace(chr(34), "")}", "format": "JSON"}}'
    if fmt == "Markdown":
        return f"## Result\n\n{body}"
    return body


# ── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/run", response_model=PlaygroundRunResponse)
async def run_pipeline(
    body: PlaygroundRunRequest,
    _: User = Depends(get_current_user),
) -> PlaygroundRunResponse:
    """Execute the pipeline graph and return per-node results."""
    if not body.nodes:
        raise HTTPException(status_code=400, detail="Pipeline has no nodes.")
    if len(body.nodes) > 30:
        raise HTTPException(status_code=400, detail="Pipeline exceeds 30 nodes.")

    ordered = _topo_sort(body.nodes, body.edges)

    # Build incoming-edge map: target_node_id → [source_node_id, …]
    inbound: dict[str, list[str]] = {n.id: [] for n in body.nodes}
    for e in body.edges:
        if e.toNode in inbound:
            inbound[e.toNode].append(e.fromNode)

    outputs: dict[str, str] = {}
    results: list[NodeRunResult] = []
    model_used: str | None = None
    t_total = time.perf_counter()

    for node in ordered:
        t0 = time.perf_counter()
        ctx_in = [outputs[src] for src in inbound[node.id] if src in outputs]
        try:
            if node.type == "input":
                out = _run_input(node, body.prompt)
            elif node.type == "retriever":
                out = _run_retriever(node, ctx_in)
            elif node.type == "router":
                out = _run_router(node, ctx_in)
            elif node.type == "llm":
                out, model_used = await _run_llm(node, ctx_in)
            elif node.type == "output":
                out = _run_output(node, ctx_in)
            else:
                out = "(unknown node type)"
            outputs[node.id] = out
            results.append(NodeRunResult(
                id=node.id, type=node.type, status="done", output=out,
                duration_ms=int((time.perf_counter() - t0) * 1000),
            ))
        except Exception as exc:
            results.append(NodeRunResult(
                id=node.id, type=node.type, status="error", output=str(exc),
                duration_ms=int((time.perf_counter() - t0) * 1000),
            ))

    return PlaygroundRunResponse(
        results=results,
        total_ms=int((time.perf_counter() - t_total) * 1000),
        model_used=model_used,
    )
