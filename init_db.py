import asyncio
import hashlib
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from app.config import get_settings
from app.db.base import Base
from app.db.models.user import User
from app.db.models.api_key import ApiKey
from app.db.models.model_registry import ModelRegistryEntry


# ─── 47-model comprehensive registry ────────────────────────────────────────
MODELS_SEED = [

    # ════════════════════════════════════════════════════════════════
    # OPENAI  (7 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "openai", "model_name": "gpt-4o",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 5.0, "output_per_1m_tokens": 15.0},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 1200, "latency_p95_ms": 2500,
        "latency_source": "https://artificialanalysis.ai/models/gpt-4o",
        "quality_scores": {"arena_elo": 1290, "mmlu": 88.7, "humaneval": 90.2},
        "is_active": True,
    },
    {
        "provider": "openai", "model_name": "gpt-4o-mini",
        "capabilities": ["chat", "code", "classification", "summarisation", "translation"],
        "pricing": {"input_per_1m_tokens": 0.15, "output_per_1m_tokens": 0.60},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 500, "latency_p95_ms": 1200,
        "latency_source": "https://artificialanalysis.ai/models/gpt-4o-mini",
        "quality_scores": {"arena_elo": 1190, "mmlu": 82.0, "humaneval": 87.2},
        "is_active": True,
    },
    {
        "provider": "openai", "model_name": "gpt-4-turbo",
        "capabilities": ["chat", "code", "rag", "agent", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 10.0, "output_per_1m_tokens": 30.0},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 1800, "latency_p95_ms": 3500,
        "latency_source": "https://artificialanalysis.ai/models/gpt-4-turbo",
        "quality_scores": {"arena_elo": 1260, "mmlu": 86.5, "humaneval": 87.1},
        "is_active": True,
    },
    {
        "provider": "openai", "model_name": "gpt-3.5-turbo",
        "capabilities": ["chat", "classification", "translation", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.50, "output_per_1m_tokens": 1.50},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 400, "latency_p95_ms": 900,
        "latency_source": "https://artificialanalysis.ai/models/gpt-35-turbo",
        "quality_scores": {"arena_elo": 1115, "mmlu": 70.0},
        "is_active": True,
    },
    {
        "provider": "openai", "model_name": "o1",
        "capabilities": ["code", "data_analysis", "agent", "chat"],
        "pricing": {"input_per_1m_tokens": 15.0, "output_per_1m_tokens": 60.0},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 8000, "latency_p95_ms": 20000,
        "latency_source": "https://artificialanalysis.ai/models/o1",
        "quality_scores": {"arena_elo": 1350, "mmlu": 92.3, "humaneval": 94.4},
        "is_active": True,
    },
    {
        "provider": "openai", "model_name": "o1-mini",
        "capabilities": ["code", "data_analysis", "chat"],
        "pricing": {"input_per_1m_tokens": 1.10, "output_per_1m_tokens": 4.40},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 5000, "latency_p95_ms": 15000,
        "latency_source": "https://artificialanalysis.ai/models/o1-mini",
        "quality_scores": {"arena_elo": 1280, "mmlu": 88.0, "humaneval": 91.0},
        "is_active": True,
    },
    {
        "provider": "openai", "model_name": "o3-mini",
        "capabilities": ["code", "data_analysis", "agent", "chat"],
        "pricing": {"input_per_1m_tokens": 1.10, "output_per_1m_tokens": 4.40},
        "pricing_source": "https://openai.com/api/pricing",
        "latency_p50_ms": 4000, "latency_p95_ms": 12000,
        "latency_source": "https://artificialanalysis.ai/models/o3-mini",
        "quality_scores": {"arena_elo": 1305, "mmlu": 91.5, "humaneval": 93.2},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # ANTHROPIC  (5 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "anthropic", "model_name": "claude-opus-4-5",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 15.0, "output_per_1m_tokens": 75.0},
        "pricing_source": "https://www.anthropic.com/pricing",
        "latency_p50_ms": 2500, "latency_p95_ms": 5000,
        "latency_source": "https://artificialanalysis.ai/models/claude-3-opus",
        "quality_scores": {"arena_elo": 1340, "mmlu": 91.2, "humaneval": 94.7},
        "is_active": True,
    },
    {
        "provider": "anthropic", "model_name": "claude-sonnet-4-5",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 3.0, "output_per_1m_tokens": 15.0},
        "pricing_source": "https://www.anthropic.com/pricing",
        "latency_p50_ms": 1000, "latency_p95_ms": 2000,
        "latency_source": "https://artificialanalysis.ai/models/claude-3-5-sonnet",
        "quality_scores": {"arena_elo": 1300, "mmlu": 90.0, "humaneval": 92.0},
        "is_active": True,
    },
    {
        "provider": "anthropic", "model_name": "claude-3-5-sonnet-20241022",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 3.0, "output_per_1m_tokens": 15.0},
        "pricing_source": "https://www.anthropic.com/pricing",
        "latency_p50_ms": 1000, "latency_p95_ms": 2000,
        "latency_source": "https://artificialanalysis.ai/models/claude-3-5-sonnet",
        "quality_scores": {"arena_elo": 1298, "mmlu": 90.0, "humaneval": 92.0},
        "is_active": True,
    },
    {
        "provider": "anthropic", "model_name": "claude-3-5-haiku-20241022",
        "capabilities": ["chat", "classification", "summarisation", "translation", "code"],
        "pricing": {"input_per_1m_tokens": 0.80, "output_per_1m_tokens": 4.0},
        "pricing_source": "https://www.anthropic.com/pricing",
        "latency_p50_ms": 450, "latency_p95_ms": 1000,
        "latency_source": "https://artificialanalysis.ai/models/claude-3-5-haiku",
        "quality_scores": {"arena_elo": 1210, "mmlu": 82.0},
        "is_active": True,
    },
    {
        "provider": "anthropic", "model_name": "claude-3-haiku-20240307",
        "capabilities": ["chat", "classification", "summarisation", "translation"],
        "pricing": {"input_per_1m_tokens": 0.25, "output_per_1m_tokens": 1.25},
        "pricing_source": "https://www.anthropic.com/pricing",
        "latency_p50_ms": 350, "latency_p95_ms": 800,
        "latency_source": "https://artificialanalysis.ai/models/claude-3-haiku",
        "quality_scores": {"arena_elo": 1180, "mmlu": 75.2},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # GOOGLE GEMINI  (5 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "google", "model_name": "gemini-2.5-pro",
        "capabilities": ["chat", "code", "rag", "agent", "data_analysis", "multimodal"],
        "pricing": {"input_per_1m_tokens": 1.25, "output_per_1m_tokens": 10.0},
        "pricing_source": "https://ai.google.dev/pricing",
        "latency_p50_ms": 2000, "latency_p95_ms": 4000,
        "latency_source": "https://artificialanalysis.ai/models/gemini-2-5-pro",
        "quality_scores": {"arena_elo": 1380, "mmlu": 91.8, "humaneval": 95.2},
        "is_active": True,
    },
    {
        "provider": "google", "model_name": "gemini-2.0-flash",
        "capabilities": ["chat", "code", "rag", "multimodal", "summarisation", "agent"],
        "pricing": {"input_per_1m_tokens": 0.10, "output_per_1m_tokens": 0.40},
        "pricing_source": "https://ai.google.dev/pricing",
        "latency_p50_ms": 800, "latency_p95_ms": 1500,
        "latency_source": "https://artificialanalysis.ai/models/gemini-2-0-flash",
        "quality_scores": {"arena_elo": 1250, "mmlu": 87.0},
        "is_active": True,
    },
    {
        "provider": "google", "model_name": "gemini-2.0-flash-lite",
        "capabilities": ["chat", "classification", "summarisation", "translation"],
        "pricing": {"input_per_1m_tokens": 0.075, "output_per_1m_tokens": 0.30},
        "pricing_source": "https://ai.google.dev/pricing",
        "latency_p50_ms": 400, "latency_p95_ms": 900,
        "latency_source": "https://ai.google.dev/gemini-api/docs/models",
        "quality_scores": {"arena_elo": 1150, "mmlu": 78.0},
        "is_active": True,
    },
    {
        "provider": "google", "model_name": "gemini-1.5-pro",
        "capabilities": ["chat", "code", "rag", "agent", "data_analysis", "multimodal"],
        "pricing": {"input_per_1m_tokens": 1.25, "output_per_1m_tokens": 5.00},
        "pricing_source": "https://ai.google.dev/pricing",
        "latency_p50_ms": 1100, "latency_p95_ms": 2200,
        "latency_source": "https://artificialanalysis.ai/models/gemini-1-5-pro",
        "quality_scores": {"arena_elo": 1260, "mmlu": 85.9},
        "is_active": True,
    },
    {
        "provider": "google", "model_name": "gemini-1.5-flash",
        "capabilities": ["chat", "classification", "summarisation", "translation", "multimodal"],
        "pricing": {"input_per_1m_tokens": 0.075, "output_per_1m_tokens": 0.30},
        "pricing_source": "https://ai.google.dev/pricing",
        "latency_p50_ms": 500, "latency_p95_ms": 1100,
        "latency_source": "https://artificialanalysis.ai/models/gemini-1-5-flash",
        "quality_scores": {"arena_elo": 1160, "mmlu": 78.9},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # META LLAMA  (6 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "meta", "model_name": "llama-3.3-70b-instruct",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.50, "output_per_1m_tokens": 0.50},
        "pricing_source": "https://openrouter.ai/meta-llama/llama-3.3-70b-instruct",
        "latency_p50_ms": 700, "latency_p95_ms": 1500,
        "latency_source": "https://artificialanalysis.ai/models/llama-3-3-70b-instruct",
        "quality_scores": {"arena_elo": 1250, "mmlu": 86.0, "humaneval": 85.0},
        "is_active": True,
    },
    {
        "provider": "meta", "model_name": "llama-3.1-405b-instruct",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 2.70, "output_per_1m_tokens": 2.70},
        "pricing_source": "https://openrouter.ai/meta-llama/llama-3.1-405b-instruct",
        "latency_p50_ms": 2000, "latency_p95_ms": 4500,
        "latency_source": "https://artificialanalysis.ai/models/llama-3-1-405b-instruct",
        "quality_scores": {"arena_elo": 1265, "mmlu": 88.6, "humaneval": 89.0},
        "is_active": True,
    },
    {
        "provider": "meta", "model_name": "llama-3.1-70b-instruct",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.72, "output_per_1m_tokens": 0.72},
        "pricing_source": "https://openrouter.ai/meta-llama/llama-3.1-70b-instruct",
        "latency_p50_ms": 900, "latency_p95_ms": 1800,
        "latency_source": "https://artificialanalysis.ai/models/llama-3-1-70b-instruct",
        "quality_scores": {"arena_elo": 1200, "mmlu": 83.6, "humaneval": 80.5},
        "is_active": True,
    },
    {
        "provider": "meta", "model_name": "llama-3.1-8b-instruct",
        "capabilities": ["chat", "classification", "summarisation", "translation"],
        "pricing": {"input_per_1m_tokens": 0.05, "output_per_1m_tokens": 0.05},
        "pricing_source": "https://openrouter.ai/meta-llama/llama-3.1-8b-instruct",
        "latency_p50_ms": 200, "latency_p95_ms": 500,
        "latency_source": "https://artificialanalysis.ai/models/llama-3-1-8b-instruct",
        "quality_scores": {"arena_elo": 1090, "mmlu": 66.7},
        "is_active": True,
    },
    {
        "provider": "meta", "model_name": "llama-3.2-11b-vision",
        "capabilities": ["chat", "multimodal", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.055, "output_per_1m_tokens": 0.055},
        "pricing_source": "https://openrouter.ai/meta-llama/llama-3.2-11b-vision-instruct",
        "latency_p50_ms": 400, "latency_p95_ms": 900,
        "latency_source": "https://artificialanalysis.ai/models/llama-3-2-11b-vision-instruct",
        "quality_scores": {"arena_elo": 1110, "mmlu": 72.0},
        "is_active": True,
    },
    {
        "provider": "meta", "model_name": "llama-3.2-3b-instruct",
        "capabilities": ["chat", "classification", "translation"],
        "pricing": {"input_per_1m_tokens": 0.015, "output_per_1m_tokens": 0.015},
        "pricing_source": "https://openrouter.ai/meta-llama/llama-3.2-3b-instruct",
        "latency_p50_ms": 100, "latency_p95_ms": 300,
        "latency_source": "https://artificialanalysis.ai/models/llama-3-2-3b-instruct",
        "quality_scores": {"arena_elo": 1050, "mmlu": 55.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # MISTRAL AI  (5 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "mistral", "model_name": "mistral-large-latest",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 2.0, "output_per_1m_tokens": 6.0},
        "pricing_source": "https://mistral.ai/technology/#pricing",
        "latency_p50_ms": 950, "latency_p95_ms": 1900,
        "latency_source": "https://artificialanalysis.ai/models/mistral-large-2",
        "quality_scores": {"arena_elo": 1223, "mmlu": 81.2},
        "is_active": True,
    },
    {
        "provider": "mistral", "model_name": "mistral-small-latest",
        "capabilities": ["chat", "classification", "translation", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.20, "output_per_1m_tokens": 0.60},
        "pricing_source": "https://mistral.ai/technology/#pricing",
        "latency_p50_ms": 350, "latency_p95_ms": 750,
        "latency_source": "https://artificialanalysis.ai/models/mistral-small",
        "quality_scores": {"arena_elo": 1140, "mmlu": 72.5},
        "is_active": True,
    },
    {
        "provider": "mistral", "model_name": "mixtral-8x22b-instruct",
        "capabilities": ["chat", "code", "rag", "summarisation", "agent"],
        "pricing": {"input_per_1m_tokens": 0.90, "output_per_1m_tokens": 2.80},
        "pricing_source": "https://mistral.ai/technology/#pricing",
        "latency_p50_ms": 700, "latency_p95_ms": 1600,
        "latency_source": "https://artificialanalysis.ai/models/mixtral-8x22b",
        "quality_scores": {"arena_elo": 1152, "mmlu": 77.8},
        "is_active": True,
    },
    {
        "provider": "mistral", "model_name": "mixtral-8x7b-instruct",
        "capabilities": ["chat", "code", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.24, "output_per_1m_tokens": 0.24},
        "pricing_source": "https://openrouter.ai/mistralai/mixtral-8x7b-instruct",
        "latency_p50_ms": 500, "latency_p95_ms": 1200,
        "latency_source": "https://artificialanalysis.ai/models/mixtral-8x7b",
        "quality_scores": {"arena_elo": 1114, "mmlu": 70.6},
        "is_active": True,
    },
    {
        "provider": "mistral", "model_name": "codestral-latest",
        "capabilities": ["code", "agent"],
        "pricing": {"input_per_1m_tokens": 0.20, "output_per_1m_tokens": 0.60},
        "pricing_source": "https://mistral.ai/technology/#pricing",
        "latency_p50_ms": 600, "latency_p95_ms": 1300,
        "latency_source": "https://docs.mistral.ai/api/",
        "quality_scores": {"arena_elo": 1180, "humaneval": 91.2},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # COHERE  (3 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "cohere", "model_name": "command-r-plus",
        "capabilities": ["rag", "search", "chat", "summarisation", "agent"],
        "pricing": {"input_per_1m_tokens": 2.50, "output_per_1m_tokens": 10.0},
        "pricing_source": "https://cohere.com/pricing",
        "latency_p50_ms": 1100, "latency_p95_ms": 2200,
        "latency_source": "https://docs.cohere.com/docs/command-r-plus",
        "quality_scores": {"arena_elo": 1195, "mmlu": 75.7},
        "is_active": True,
    },
    {
        "provider": "cohere", "model_name": "command-r",
        "capabilities": ["rag", "search", "chat", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.50, "output_per_1m_tokens": 1.50},
        "pricing_source": "https://cohere.com/pricing",
        "latency_p50_ms": 600, "latency_p95_ms": 1300,
        "latency_source": "https://docs.cohere.com/docs/command-r",
        "quality_scores": {"arena_elo": 1130, "mmlu": 68.2},
        "is_active": True,
    },
    {
        "provider": "cohere", "model_name": "command-light",
        "capabilities": ["chat", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.30, "output_per_1m_tokens": 0.60},
        "pricing_source": "https://cohere.com/pricing",
        "latency_p50_ms": 300, "latency_p95_ms": 700,
        "latency_source": "https://docs.cohere.com/docs/command-light",
        "quality_scores": {"arena_elo": 1070, "mmlu": 60.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # DEEPSEEK  (3 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "deepseek", "model_name": "deepseek-v3",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 0.27, "output_per_1m_tokens": 1.10},
        "pricing_source": "https://platform.deepseek.com/usage",
        "latency_p50_ms": 1300, "latency_p95_ms": 2800,
        "latency_source": "https://artificialanalysis.ai/models/deepseek-v3",
        "quality_scores": {"arena_elo": 1282, "mmlu": 87.1, "humaneval": 89.1},
        "is_active": True,
    },
    {
        "provider": "deepseek", "model_name": "deepseek-r1",
        "capabilities": ["code", "data_analysis", "agent", "chat"],
        "pricing": {"input_per_1m_tokens": 0.55, "output_per_1m_tokens": 2.19},
        "pricing_source": "https://platform.deepseek.com/usage",
        "latency_p50_ms": 5000, "latency_p95_ms": 12000,
        "latency_source": "https://artificialanalysis.ai/models/deepseek-r1",
        "quality_scores": {"arena_elo": 1358, "mmlu": 90.8, "humaneval": 92.9},
        "is_active": True,
    },
    {
        "provider": "deepseek", "model_name": "deepseek-coder-v2",
        "capabilities": ["code", "agent", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 0.14, "output_per_1m_tokens": 0.28},
        "pricing_source": "https://platform.deepseek.com/usage",
        "latency_p50_ms": 1500, "latency_p95_ms": 3000,
        "latency_source": "https://artificialanalysis.ai/models/deepseek-coder-v2",
        "quality_scores": {"arena_elo": 1230, "humaneval": 90.2},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # XAI GROK  (2 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "xai", "model_name": "grok-3",
        "capabilities": ["chat", "code", "rag", "agent", "data_analysis", "search"],
        "pricing": {"input_per_1m_tokens": 3.0, "output_per_1m_tokens": 15.0},
        "pricing_source": "https://x.ai/api",
        "latency_p50_ms": 2000, "latency_p95_ms": 4500,
        "latency_source": "https://artificialanalysis.ai/models/grok-3",
        "quality_scores": {"arena_elo": 1320, "mmlu": 90.3},
        "is_active": True,
    },
    {
        "provider": "xai", "model_name": "grok-3-mini",
        "capabilities": ["chat", "code", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.30, "output_per_1m_tokens": 0.50},
        "pricing_source": "https://x.ai/api",
        "latency_p50_ms": 800, "latency_p95_ms": 1800,
        "latency_source": "https://artificialanalysis.ai/models/grok-3-mini",
        "quality_scores": {"arena_elo": 1220, "mmlu": 80.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # MICROSOFT PHI  (2 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "microsoft", "model_name": "phi-4",
        "capabilities": ["chat", "code", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.07, "output_per_1m_tokens": 0.14},
        "pricing_source": "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
        "latency_p50_ms": 300, "latency_p95_ms": 700,
        "latency_source": "https://artificialanalysis.ai/models/phi-4",
        "quality_scores": {"arena_elo": 1190, "mmlu": 84.8, "humaneval": 82.6},
        "is_active": True,
    },
    {
        "provider": "microsoft", "model_name": "phi-3.5-mini-instruct",
        "capabilities": ["chat", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.04, "output_per_1m_tokens": 0.13},
        "pricing_source": "https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/",
        "latency_p50_ms": 180, "latency_p95_ms": 450,
        "latency_source": "https://artificialanalysis.ai/models/phi-3-5-mini-instruct",
        "quality_scores": {"arena_elo": 1090, "mmlu": 69.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # ALIBABA QWEN  (3 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "alibaba", "model_name": "qwen2.5-72b-instruct",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 0.35, "output_per_1m_tokens": 0.40},
        "pricing_source": "https://openrouter.ai/qwen/qwen-2.5-72b-instruct",
        "latency_p50_ms": 900, "latency_p95_ms": 2000,
        "latency_source": "https://artificialanalysis.ai/models/qwen-2-5-72b-instruct",
        "quality_scores": {"arena_elo": 1247, "mmlu": 86.0, "humaneval": 86.7},
        "is_active": True,
    },
    {
        "provider": "alibaba", "model_name": "qwen2.5-coder-32b-instruct",
        "capabilities": ["code", "agent", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 0.07, "output_per_1m_tokens": 0.16},
        "pricing_source": "https://openrouter.ai/qwen/qwen-2.5-coder-32b-instruct",
        "latency_p50_ms": 600, "latency_p95_ms": 1500,
        "latency_source": "https://artificialanalysis.ai/models/qwen-2-5-coder-32b-instruct",
        "quality_scores": {"arena_elo": 1200, "humaneval": 90.2},
        "is_active": True,
    },
    {
        "provider": "alibaba", "model_name": "qwen2.5-7b-instruct",
        "capabilities": ["chat", "classification", "translation", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.03, "output_per_1m_tokens": 0.06},
        "pricing_source": "https://openrouter.ai/qwen/qwen-2.5-7b-instruct",
        "latency_p50_ms": 200, "latency_p95_ms": 500,
        "latency_source": "https://artificialanalysis.ai/models/qwen-2-5-7b-instruct",
        "quality_scores": {"arena_elo": 1105, "mmlu": 74.2},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # AMAZON NOVA (Bedrock)  (3 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "amazon", "model_name": "nova-pro",
        "capabilities": ["chat", "rag", "agent", "multimodal", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.80, "output_per_1m_tokens": 3.20},
        "pricing_source": "https://aws.amazon.com/bedrock/pricing/",
        "latency_p50_ms": 1200, "latency_p95_ms": 2500,
        "latency_source": "https://docs.aws.amazon.com/nova/latest/userguide/nova-pro.html",
        "quality_scores": {"arena_elo": 1210, "mmlu": 83.0},
        "is_active": True,
    },
    {
        "provider": "amazon", "model_name": "nova-lite",
        "capabilities": ["chat", "classification", "summarisation", "multimodal"],
        "pricing": {"input_per_1m_tokens": 0.06, "output_per_1m_tokens": 0.24},
        "pricing_source": "https://aws.amazon.com/bedrock/pricing/",
        "latency_p50_ms": 400, "latency_p95_ms": 900,
        "latency_source": "https://docs.aws.amazon.com/nova/latest/userguide/nova-lite.html",
        "quality_scores": {"arena_elo": 1120, "mmlu": 75.0},
        "is_active": True,
    },
    {
        "provider": "amazon", "model_name": "nova-micro",
        "capabilities": ["chat", "classification", "translation"],
        "pricing": {"input_per_1m_tokens": 0.035, "output_per_1m_tokens": 0.14},
        "pricing_source": "https://aws.amazon.com/bedrock/pricing/",
        "latency_p50_ms": 150, "latency_p95_ms": 400,
        "latency_source": "https://docs.aws.amazon.com/nova/latest/userguide/nova-micro.html",
        "quality_scores": {"arena_elo": 1080, "mmlu": 67.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # GROQ (ultra-low latency inference)  (3 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "groq", "model_name": "llama-3.3-70b-versatile",
        "capabilities": ["chat", "code", "rag", "agent", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.59, "output_per_1m_tokens": 0.79},
        "pricing_source": "https://console.groq.com/settings/billing",
        "latency_p50_ms": 120, "latency_p95_ms": 300,
        "latency_source": "https://groq.com/",
        "quality_scores": {"arena_elo": 1248, "mmlu": 85.9},
        "is_active": True,
    },
    {
        "provider": "groq", "model_name": "llama-3.1-8b-instant",
        "capabilities": ["chat", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.05, "output_per_1m_tokens": 0.08},
        "pricing_source": "https://console.groq.com/settings/billing",
        "latency_p50_ms": 40, "latency_p95_ms": 120,
        "latency_source": "https://groq.com/",
        "quality_scores": {"arena_elo": 1090, "mmlu": 66.7},
        "is_active": True,
    },
    {
        "provider": "groq", "model_name": "mixtral-8x7b-32768",
        "capabilities": ["chat", "code", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.24, "output_per_1m_tokens": 0.24},
        "pricing_source": "https://console.groq.com/settings/billing",
        "latency_p50_ms": 80, "latency_p95_ms": 200,
        "latency_source": "https://groq.com/",
        "quality_scores": {"arena_elo": 1114, "mmlu": 70.6},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # CEREBRAS (ultra-fast chips)  (2 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "cerebras", "model_name": "llama3.1-70b",
        "capabilities": ["chat", "code", "rag", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.60, "output_per_1m_tokens": 0.60},
        "pricing_source": "https://inference.cerebras.ai/",
        "latency_p50_ms": 60, "latency_p95_ms": 180,
        "latency_source": "https://cerebras.ai/blog/cerebras-inference",
        "quality_scores": {"arena_elo": 1200, "mmlu": 83.6},
        "is_active": True,
    },
    {
        "provider": "cerebras", "model_name": "llama3.1-8b",
        "capabilities": ["chat", "classification", "summarisation"],
        "pricing": {"input_per_1m_tokens": 0.10, "output_per_1m_tokens": 0.10},
        "pricing_source": "https://inference.cerebras.ai/",
        "latency_p50_ms": 20, "latency_p95_ms": 60,
        "latency_source": "https://cerebras.ai/blog/cerebras-inference",
        "quality_scores": {"arena_elo": 1090, "mmlu": 66.7},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # PERPLEXITY (search-augmented)  (2 models)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "perplexity", "model_name": "sonar-pro",
        "capabilities": ["search", "rag", "chat", "summarisation"],
        "pricing": {"input_per_1m_tokens": 3.0, "output_per_1m_tokens": 15.0},
        "pricing_source": "https://www.perplexity.ai/hub/blog/sonar-the-fastest-most-accurate-llm-api",
        "latency_p50_ms": 2500, "latency_p95_ms": 5000,
        "latency_source": "https://docs.perplexity.ai/",
        "quality_scores": {"arena_elo": 1215, "mmlu": 80.0},
        "is_active": True,
    },
    {
        "provider": "perplexity", "model_name": "sonar",
        "capabilities": ["search", "rag", "chat"],
        "pricing": {"input_per_1m_tokens": 1.0, "output_per_1m_tokens": 1.0},
        "pricing_source": "https://www.perplexity.ai/hub/blog/sonar-the-fastest-most-accurate-llm-api",
        "latency_p50_ms": 1500, "latency_p95_ms": 3000,
        "latency_source": "https://docs.perplexity.ai/",
        "quality_scores": {"arena_elo": 1155, "mmlu": 74.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # WRITER  (enterprise)  (1 model)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "writer", "model_name": "palmyra-x5",
        "capabilities": ["chat", "rag", "agent", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 1.0, "output_per_1m_tokens": 5.0},
        "pricing_source": "https://writer.com/pricing/",
        "latency_p50_ms": 900, "latency_p95_ms": 2000,
        "latency_source": "https://writer.com/engineering/palmyra-x5",
        "quality_scores": {"arena_elo": 1205, "mmlu": 81.0},
        "is_active": True,
    },

    # ════════════════════════════════════════════════════════════════
    # AI21 JAMBA  (1 model)
    # ════════════════════════════════════════════════════════════════
    {
        "provider": "ai21", "model_name": "jamba-1.5-large",
        "capabilities": ["chat", "rag", "summarisation", "data_analysis"],
        "pricing": {"input_per_1m_tokens": 2.0, "output_per_1m_tokens": 8.0},
        "pricing_source": "https://www.ai21.com/pricing",
        "latency_p50_ms": 800, "latency_p95_ms": 1800,
        "latency_source": "https://docs.ai21.com/reference/jamba-15-api-ref",
        "quality_scores": {"arena_elo": 1160, "mmlu": 78.2},
        "is_active": True,
    },
]


async def init_db():
    settings = get_settings()

    if settings.database_url.startswith("sqlite"):
        engine = create_async_engine(
            settings.database_url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    else:
        engine = create_async_engine(settings.database_url)

    async_session = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created.")

    async with async_session() as session:
        # Create test user
        user_id = uuid.uuid4()
        raw_password = "testpassword"
        hashed_pw = hashlib.sha256(raw_password.encode()).hexdigest()
        user = User(
            id=user_id,
            email="test@example.com",
            hashed_password=hashed_pw,
            tier="pro",
            is_active=True,
        )
        session.add(user)

        # Create test API key
        raw_key = "arch_test_key_dev"
        key_hash = hashlib.sha256((raw_key + settings.api_key_hash_secret).encode()).hexdigest()
        api_key = ApiKey(
            id=uuid.uuid4(),
            user_id=user_id,
            name="Dev Test Key",
            key_hash=key_hash,
            key_prefix=raw_key[:8],
            is_active=True,
        )
        session.add(api_key)

        # Seed all models
        for m in MODELS_SEED:
            session.add(ModelRegistryEntry(id=uuid.uuid4(), **m))

        await session.commit()

    print(f"✅ Database initialized — {len(MODELS_SEED)} models seeded across {len(set(m['provider'] for m in MODELS_SEED))} providers.")
    print(f"📧 Test user: test@example.com  |  password: {raw_password}")
    print(f"🔑 API Key: {raw_key}")


if __name__ == "__main__":
    asyncio.run(init_db())
