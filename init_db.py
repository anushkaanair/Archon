import asyncio
import hashlib
import uuid
import json
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from app.config import get_settings
from app.db.base import Base
from app.db.models.user import User
from app.db.models.api_key import ApiKey
from app.db.models.model_registry import ModelRegistryEntry


async def init_db():
    settings = get_settings()

    # Use StaticPool for SQLite
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
        hashed_pw = hashlib.sha256(raw_password.encode()).hexdigest()  # simple hash for dev
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

        # Add seed model entries
        models_seed = [
            {
                "provider": "openai",
                "model_name": "gpt-4o",
                "capabilities": ["chat", "code", "rag"],
                "pricing": {"input_per_1m_tokens": 5.0, "output_per_1m_tokens": 15.0},
                "pricing_source": "https://openai.com/api/pricing",
                "latency_p50_ms": 1200,
                "latency_p95_ms": 2500,
                "quality_scores": {"mmlu": 0.887},
                "is_active": True,
            },
            {
                "provider": "anthropic",
                "model_name": "claude-3-5-sonnet-20241022",
                "capabilities": ["chat", "code", "rag", "analysis"],
                "pricing": {"input_per_1m_tokens": 3.0, "output_per_1m_tokens": 15.0},
                "pricing_source": "https://www.anthropic.com/pricing",
                "latency_p50_ms": 1000,
                "latency_p95_ms": 2000,
                "quality_scores": {"mmlu": 0.900},
                "is_active": True,
            },
            {
                "provider": "google",
                "model_name": "gemini-2.0-flash",
                "capabilities": ["chat", "code", "rag", "multimodal"],
                "pricing": {"input_per_1m_tokens": 0.1, "output_per_1m_tokens": 0.4},
                "pricing_source": "https://ai.google.dev/pricing",
                "latency_p50_ms": 800,
                "latency_p95_ms": 1500,
                "quality_scores": {"mmlu": 0.870},
                "is_active": True,
            },
        ]

        for m in models_seed:
            session.add(ModelRegistryEntry(
                id=uuid.uuid4(),
                **m
            ))

        await session.commit()

    print("✅ Database initialized successfully.")
    print(f"📧 Test user: test@example.com  |  password: {raw_password}")
    print(f"🔑 API Key: {raw_key}")


if __name__ == "__main__":
    asyncio.run(init_db())
