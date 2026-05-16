"""Semantic analysis service.

Uses Google text-embedding-004 to detect AI tasks from natural-language
input. Works by computing cosine similarity between the input embedding and
a set of pre-defined task label embeddings.

Supported tasks: RAG, image generation, speech, classification, code generation,
data analysis, chatbot, recommendation, translation, summarisation, search,
agent/workflow orchestration, fine-tuning.
"""

from __future__ import annotations

import numpy as np

from app.rag.embedder import embed_texts
from app.schemas.common import DetectedTask

# ── Task definitions with description anchors ────────────────────
# Each entry has a label (slug), display name, and description text that
# serves as the "semantic anchor" for cosine similarity comparison.
TASK_DEFINITIONS: list[dict[str, str]] = [
    {
        "task": "rag",
        "name": "Retrieval-Augmented Generation",
        "anchor": "retrieve relevant documents from a knowledge base and use them to generate accurate answers with citations",
    },
    {
        "task": "image_generation",
        "name": "Image Generation",
        "anchor": "generate images, create visual content, produce artwork, text-to-image synthesis",
    },
    {
        "task": "speech",
        "name": "Speech Processing",
        "anchor": "speech recognition, text-to-speech, voice synthesis, audio transcription, spoken language understanding",
    },
    {
        "task": "classification",
        "name": "Text Classification",
        "anchor": "categorize text, sentiment analysis, topic classification, spam detection, content moderation",
    },
    {
        "task": "code_generation",
        "name": "Code Generation",
        "anchor": "generate source code, write programs, code completion, code review, debugging assistance",
    },
    {
        "task": "data_analysis",
        "name": "Data Analysis",
        "anchor": "analyze data, statistical analysis, data visualization, reporting, business intelligence, trend detection",
    },
    {
        "task": "chatbot",
        "name": "Conversational AI",
        "anchor": "chat interface, conversational agent, customer support bot, dialogue system, question answering",
    },
    {
        "task": "recommendation",
        "name": "Recommendation System",
        "anchor": "recommend items, personalized suggestions, collaborative filtering, content recommendation",
    },
    {
        "task": "translation",
        "name": "Language Translation",
        "anchor": "translate between languages, multilingual support, localization, cross-language understanding",
    },
    {
        "task": "summarisation",
        "name": "Text Summarisation",
        "anchor": "summarize documents, extract key points, create abstracts, content condensation",
    },
    {
        "task": "search",
        "name": "Semantic Search",
        "anchor": "search engine, semantic search, information retrieval, document search, similarity search",
    },
    {
        "task": "agent",
        "name": "AI Agent / Workflow",
        "anchor": "autonomous agent, multi-step workflow, tool use, function calling, task orchestration, agentic system",
    },
    {
        "task": "fine_tuning",
        "name": "Model Fine-Tuning",
        "anchor": "fine-tune a model, custom training, domain adaptation, transfer learning, model customization",
    },
]

# Pre-computed task anchor embeddings (lazy-loaded, shared across requests)
_task_embeddings: np.ndarray | None = None
_task_labels: list[dict[str, str]] | None = None


async def _get_task_embeddings() -> tuple[np.ndarray, list[dict[str, str]]]:
    """Lazy-compute embeddings for all task anchors (async).

    Cached after first call so subsequent analyses skip the embedding step.
    Not lock-protected — a harmless race on cold start recomputes once.
    """
    global _task_embeddings, _task_labels

    if _task_embeddings is None:
        anchors = [t["anchor"] for t in TASK_DEFINITIONS]
        _task_embeddings = await embed_texts(anchors)
        _task_labels = TASK_DEFINITIONS

    return _task_embeddings, _task_labels  # type: ignore[return-value]


_KEYWORD_FALLBACK: dict[str, list[str]] = {
    "rag":            ["rag", "retrieval", "document", "pdf", "knowledge base", "knowledge-base", "vector", "embedding", "citation", "citations"],
    "image_generation": ["image gen", "text-to-image", "diffusion", "midjourney", "dall-e", "dalle", "stable diffusion", "image generation"],
    "speech":          ["speech", "voice", "audio", "transcription", "whisper", "tts", "stt", "speech-to-text", "text-to-speech"],
    "classification":  ["classify", "classification", "sentiment", "moderation", "category", "categorise", "categorize", "spam"],
    "code_generation": ["code", "coding", "programming", "developer", "github", "review", "debug", "sql", "function calling"],
    "data_analysis":   ["analyse", "analyze", "analysis", "report", "dashboard", "metric", "kpi", "data analysis", "business intelligence", "bi "],
    "chatbot":         ["chat", "chatbot", "assistant", "support", "customer", "helpdesk", "conversational", "faq"],
    "recommendation":  ["recommend", "recommendation", "personalised", "personalized", "suggestions", "collaborative filtering"],
    "translation":     ["translate", "translation", "multilingual", "localisation", "localization", "language"],
    "summarisation":   ["summarise", "summarize", "summary", "abstract", "tldr", "condense", "key points"],
    "search":          ["search", "lookup", "find", "discovery", "retrieval engine"],
    "agent":           ["agent", "workflow", "orchestrate", "orchestration", "tool use", "multi-step", "autonomous"],
    "fine_tuning":     ["fine-tune", "fine tuning", "finetune", "domain adaptation", "custom training", "lora"],
}


def _keyword_detect(input_text: str, max_tasks: int) -> list[DetectedTask]:
    """Deterministic keyword-based task detection used when the embedder is
    unavailable (no LLM API key, network failure, quota exhausted, etc.).

    Confidence is the share of matched keywords divided by the keyword-set
    size, clamped to [0.30, 0.92] so the score stays in a believable band
    rather than colliding with the embedding model's natural range.
    """
    lower = input_text.lower()
    matches: list[DetectedTask] = []
    for task_def in TASK_DEFINITIONS:
        kws = _KEYWORD_FALLBACK.get(task_def["task"], [])
        hits = sum(1 for kw in kws if kw in lower)
        if hits > 0:
            score = min(0.92, 0.30 + 0.15 * hits)
            matches.append(
                DetectedTask(
                    task=task_def["task"],
                    confidence=round(score, 4),
                    description=f"Detected: {task_def['name']} (keyword match: {hits})",
                )
            )

    # Always return at least one task — default to chatbot if nothing matched.
    if not matches:
        matches.append(
            DetectedTask(
                task="chatbot",
                confidence=0.35,
                description="Detected: Conversational AI (default fallback)",
            )
        )

    matches.sort(key=lambda t: t.confidence, reverse=True)
    return matches[:max_tasks]


async def detect_tasks(
    input_text: str,
    threshold: float = 0.3,
    max_tasks: int = 5,
) -> list[DetectedTask]:
    """Detect AI tasks from natural-language input using cosine similarity.

    Tries the embedding path first; falls back to deterministic keyword
    matching if the embedder fails (e.g. no Google API key configured).
    """
    try:
        task_embs, task_defs = await _get_task_embeddings()
        input_arr = await embed_texts([input_text])
        input_emb = input_arr[0]
        similarities = np.dot(task_embs, input_emb)

        detected: list[DetectedTask] = []
        for sim, task_def in zip(similarities, task_defs):
            if sim >= threshold:
                detected.append(
                    DetectedTask(
                        task=task_def["task"],
                        confidence=round(float(sim), 4),
                        description=f"Detected: {task_def['name']} (similarity: {sim:.3f})",
                    )
                )
        detected.sort(key=lambda t: t.confidence, reverse=True)

        # If embedding returns nothing useful, fall back to keywords.
        return detected[:max_tasks] if detected else _keyword_detect(input_text, max_tasks)

    except Exception:
        # No API key / quota / network — graceful keyword fallback.
        return _keyword_detect(input_text, max_tasks)
