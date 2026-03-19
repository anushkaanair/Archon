import asyncio
import hashlib
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.config import get_settings
from app.db.base import Base
from app.db.models.user import User
from app.db.models.api_key import ApiKey
from app.db.models.model_registry import ModelRegistry

async def init_db():
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with async_session() as session:
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com", name="Test User", tier="pro", is_active=True)
        session.add(user)
        
        raw_key = "arch_test_key"
        key_hash = hashlib.sha256((raw_key + settings.api_key_hash_secret).encode()).hexdigest()
        api_key = ApiKey(id=str(uuid.uuid4()), user_id=user_id, name="Test Key", key_hash=key_hash, revoked_at=None, is_active=True)
        session.add(api_key)
        
        # Add a dummy model
        model = ModelRegistry(
            id="gpt-4",
            name="GPT-4",
            provider="openai",
            description="OpenAI's GPT-4 model",
            capabilities=["chat", "code"],
            cost_per_1k_tokens=0.03,
            avg_latency_ms=1500,
            ragas_score=0.95,
            is_active=True
        )
        session.add(model)
        
        await session.commit()
    
    print("Database initialized successfully. Dummy user/API key created.")
    print(f"API Key: Bearer {raw_key}")

if __name__ == "__main__":
    asyncio.run(init_db())
