"""Architecture generator service.

Builds a structured workflow graph: input → router → models → tools → output.
Outputs as both JSON and a human-readable Mermaid diagram.
"""

from __future__ import annotations

from app.schemas.common import ModelRecommendation


def generate_architecture(
    input_text: str,
    detected_tasks: list[dict],
    recommendations: list[ModelRecommendation],
) -> tuple[dict, str]:
    """Generate a complete architecture blueprint.

    Builds a workflow graph from the detected tasks and model recommendations,
    producing both a structured JSON representation and a Mermaid diagram.

    Args:
        input_text: Original user input.
        detected_tasks: AI tasks detected from the input.
        recommendations: Ranked model recommendations.

    Returns:
        Tuple of (architecture_json, mermaid_diagram).
    """
    # ── Build workflow nodes ─────────────────────────────────────
    nodes: list[dict] = []
    edges: list[dict] = []

    # Input node
    nodes.append({
        "id": "input",
        "type": "input",
        "label": "User Input",
        "description": "Natural language query from the end user",
    })

    # Router node (if multiple tasks)
    if len(detected_tasks) > 1:
        nodes.append({
            "id": "router",
            "type": "router",
            "label": "Task Router",
            "description": "Routes input to appropriate model based on detected task",
        })
        edges.append({"from": "input", "to": "router"})
        router_id = "router"
    else:
        router_id = "input"

    # Model nodes (one per unique model recommendation)
    seen_models: set[str] = set()
    task_model_map: dict[str, list[str]] = {}

    for rec in recommendations:
        model_id = f"model_{rec.provider}_{rec.model_name}".replace("-", "_").replace(".", "_")
        if model_id not in seen_models:
            seen_models.add(model_id)
            nodes.append({
                "id": model_id,
                "type": "model",
                "label": f"{rec.model_name}",
                "provider": rec.provider,
                "model_name": rec.model_name,
                "task": rec.task,
                "pricing": rec.pricing,
                "pricing_source": rec.pricing_source,
            })
            edges.append({"from": router_id, "to": model_id})

        if rec.task not in task_model_map:
            task_model_map[rec.task] = []
        task_model_map[rec.task].append(model_id)

    # Tool nodes (based on detected tasks)
    tool_mapping: dict[str, list[dict]] = {
        "rag": [
            {"id": "tool_vector_db", "label": "Vector Database", "description": "Qdrant for dense retrieval"},
            {"id": "tool_bm25", "label": "BM25 Index", "description": "Sparse retrieval for hybrid search"},
            {"id": "tool_reranker", "label": "CrossEncoder", "description": "Re-ranking for precision"},
        ],
        "search": [
            {"id": "tool_search_index", "label": "Search Index", "description": "Full-text + semantic search"},
        ],
        "data_analysis": [
            {"id": "tool_pandas", "label": "Data Processing", "description": "pandas / numpy pipeline"},
        ],
        "image_generation": [
            {"id": "tool_image_store", "label": "Image Storage", "description": "CDN / blob storage"},
        ],
        "code_generation": [
            {"id": "tool_sandbox", "label": "Code Sandbox", "description": "Isolated code execution"},
        ],
        "agent": [
            {"id": "tool_executor", "label": "Tool Executor", "description": "Function calling runtime"},
        ],
    }

    added_tools: set[str] = set()
    for task_info in detected_tasks:
        task = task_info["task"] if isinstance(task_info, dict) else task_info.task
        tools = tool_mapping.get(task, [])
        for tool in tools:
            if tool["id"] not in added_tools:
                added_tools.add(tool["id"])
                tool_node = {
                    "id": tool["id"],
                    "type": "tool",
                    "label": tool["label"],
                    "description": tool["description"],
                }
                nodes.append(tool_node)

                # Connect relevant models to this tool
                for model_id in task_model_map.get(task, []):
                    edges.append({"from": model_id, "to": tool["id"]})

    # Output node
    nodes.append({
        "id": "output",
        "type": "output",
        "label": "Response Output",
        "description": "Formatted response returned to the user",
    })

    # Connect all leaf nodes to output
    leaf_ids = set()
    from_ids = {e["from"] for e in edges}
    to_ids = {e["to"] for e in edges}
    for node in nodes:
        if node["id"] in to_ids and node["id"] not in from_ids and node["id"] != "output":
            leaf_ids.add(node["id"])
    # If no leaf nodes found (simple case), connect models directly
    if not leaf_ids:
        for mid in seen_models:
            leaf_ids.add(mid)

    for leaf_id in leaf_ids:
        edges.append({"from": leaf_id, "to": "output"})

    architecture_json = {
        "nodes": nodes,
        "edges": edges,
        "metadata": {
            "input_text": input_text,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "detected_tasks": [
                t["task"] if isinstance(t, dict) else t.task
                for t in detected_tasks
            ],
        },
    }

    # ── Generate Mermaid diagram ─────────────────────────────────
    mermaid = _generate_mermaid(nodes, edges)

    return architecture_json, mermaid


def _generate_mermaid(nodes: list[dict], edges: list[dict]) -> str:
    """Generate a Mermaid flowchart from nodes and edges.

    Uses different shapes for different node types:
    - input/output: stadium shape (rounded)
    - router: diamond
    - model: rectangle
    - tool: subroutine (double borders)
    """
    lines = ["graph LR"]

    # Node definitions
    for node in nodes:
        label = node["label"]
        nid = node["id"]
        ntype = node.get("type", "")

        if ntype == "input":
            lines.append(f'    {nid}(["{label}"])')
        elif ntype == "output":
            lines.append(f'    {nid}(["{label}"])')
        elif ntype == "router":
            lines.append(f'    {nid}{{"{label}"}}')
        elif ntype == "model":
            provider = node.get("provider", "")
            lines.append(f'    {nid}["{label}<br/><small>{provider}</small>"]')
        elif ntype == "tool":
            lines.append(f'    {nid}[["{label}"]]')
        else:
            lines.append(f'    {nid}["{label}"]')

    # Edges
    for edge in edges:
        lines.append(f'    {edge["from"]} --> {edge["to"]}')

    # Styling
    lines.append("")
    lines.append("    classDef inputNode fill:#534AB7,stroke:#3C3489,color:#fff")
    lines.append("    classDef modelNode fill:#0d0b18,stroke:#534AB7,color:#AFA9EC")
    lines.append("    classDef toolNode fill:#0d0b18,stroke:#5DCAA5,color:#5DCAA5")
    lines.append("    classDef outputNode fill:#5DCAA5,stroke:#3a8a70,color:#fff")

    # Apply styles
    for node in nodes:
        if node.get("type") == "input":
            lines.append(f"    class {node['id']} inputNode")
        elif node.get("type") == "model":
            lines.append(f"    class {node['id']} modelNode")
        elif node.get("type") == "tool":
            lines.append(f"    class {node['id']} toolNode")
        elif node.get("type") == "output":
            lines.append(f"    class {node['id']} outputNode")

    return "\n".join(lines)
