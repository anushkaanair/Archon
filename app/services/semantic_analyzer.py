"""Semantic analysis service.

Uses sentence-transformer embeddings to detect AI tasks from natural-language
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

# Pre-computed task anchor embeddings (lazy-loaded)
_task_embeddings: np.ndarray | None = None
_task_labels: list[dict[str, str]] | None = None


def _get_task_embeddings() -> tuple[np.ndarray, list[dict[str, str]]]:
    """Lazy-compute embeddings for all task anchors.

    Cached after first call so subsequent analyses are instant.
    """
    global _task_embeddings, _task_labels

    if _task_embeddings is None:
        anchors = [t["anchor"] for t in TASK_DEFINITIONS]
        _task_embeddings = embed_texts(anchors)
        _task_labels = TASK_DEFINITIONS

    return _task_embeddings, _task_labels


def detect_tasks(
    input_text: str,
    threshold: float = 0.3,
    max_tasks: int = 5,
) -> list[DetectedTask]:
    """Detect AI tasks from natural-language input using cosine similarity.

    Embeds the input text and computes cosine similarity against pre-defined
    task anchor embeddings. Tasks with similarity above the threshold are
    returned, sorted by confidence descending.

    Args:
        input_text: The user's product idea or description.
        threshold: Minimum cosine similarity to consider a task detected.
        max_tasks: Maximum number of tasks to return.

    Returns:
        List of ``DetectedTask`` objects sorted by confidence.
    """
    task_embs, task_defs = _get_task_embeddings()

    # Embed the input
    input_emb = embed_texts([input_text])[0]

    # Compute cosine similarities (embeddings are already normalised)
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

    # Sort by confidence descending, cap at max_tasks
    detected.sort(key=lambda t: t.confidence, reverse=True)
    return detected[:max_tasks]
