"""RAGAs evaluation engine.

Scores the full recommendation output using RAGAs metrics:
- Faithfulness: are claims supported by the retrieved context?
- Answer Relevancy: is the recommendation relevant to the query?
- Context Precision: are the retrieved chunks precise?
- Context Recall: do the retrieved chunks cover the answer?

Any composite score below 0.7 is flagged as low confidence.
"""

from __future__ import annotations

from app.config import get_settings
from app.schemas.common import EvalScoreDetail


async def evaluate_recommendation(
    question: str,
    answer: str,
    contexts: list[str],
) -> EvalScoreDetail:
    """Run RAGAs evaluation on a recommendation.

    Computes all four RAGAs metrics and a weighted composite score.
    Flags the result as low confidence if below the threshold.

    Args:
        question: The original user question/input.
        answer: The generated recommendation/explanation.
        contexts: List of retrieved context chunks used for the recommendation.

    Returns:
        ``EvalScoreDetail`` with per-metric scores and confidence flag.
    """
    settings = get_settings()

    try:
        from ragas import evaluate
        from ragas.metrics import (
            answer_relevancy,
            context_precision,
            context_recall,
            faithfulness,
        )
        from datasets import Dataset

        # Prepare dataset in RAGAs format
        eval_data = {
            "question": [question],
            "answer": [answer],
            "contexts": [contexts],
        }
        dataset = Dataset.from_dict(eval_data)

        # Run evaluation
        result = evaluate(
            dataset,
            metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
        )

        faith = result.get("faithfulness", None)
        relevancy = result.get("answer_relevancy", None)
        precision = result.get("context_precision", None)
        recall = result.get("context_recall", None)

        # Compute composite (equal weights)
        scores = [s for s in [faith, relevancy, precision, recall] if s is not None]
        composite = sum(scores) / len(scores) if scores else None

        is_low = composite is not None and composite < settings.ragas_low_confidence_threshold

        return EvalScoreDetail(
            faithfulness=round(faith, 4) if faith is not None else None,
            answer_relevancy=round(relevancy, 4) if relevancy is not None else None,
            context_precision=round(precision, 4) if precision is not None else None,
            context_recall=round(recall, 4) if recall is not None else None,
            composite=round(composite, 4) if composite is not None else None,
            is_low_confidence=is_low,
        )

    except ImportError:
        # RAGAs not available — return a placeholder that flags low confidence
        return EvalScoreDetail(
            faithfulness=None,
            answer_relevancy=None,
            context_precision=None,
            context_recall=None,
            composite=None,
            is_low_confidence=True,
        )
    except Exception:
        # Evaluation failed — flag as low confidence
        return EvalScoreDetail(
            faithfulness=None,
            answer_relevancy=None,
            context_precision=None,
            context_recall=None,
            composite=None,
            is_low_confidence=True,
        )
