import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

db_url = settings.DATABASE_URL

# Check if asyncpg is available; if not, fallback to sqlite+aiosqlite for testing/dev
try:
    import asyncpg
except ImportError:
    db_url = "sqlite+aiosqlite:///./test_stageside.db"
else:
    # Render provides Postgres URLs with the standard PostgreSQL scheme, while
    # SQLAlchemy's async engine needs the asyncpg driver named explicitly.
    if db_url.startswith("postgres://"):
        db_url = "postgresql+asyncpg://" + db_url[len("postgres://"):]
    elif db_url.startswith("postgresql://"):
        db_url = "postgresql+asyncpg://" + db_url[len("postgresql://"):]

engine_kwargs = {"echo": False, "future": True}
if "sqlite" not in db_url:
    engine_kwargs["pool_pre_ping"] = True

engine = create_async_engine(db_url, **engine_kwargs)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
