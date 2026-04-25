from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.api.auth_routes import router as auth_router
from app.api.routes import router as api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, get_db
from app.graphql.schema import schema
from app.services.auth_service import get_user_by_token
from app.services.scan_service import bootstrap_demo_data


async def ensure_compatibility_schema() -> None:
    async with engine.begin() as conn:
        await conn.exec_driver_sql("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT ''")
        await conn.exec_driver_sql("ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS token VARCHAR(255)")
        await conn.exec_driver_sql("ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS token_jti VARCHAR(255)")
        await conn.exec_driver_sql("ALTER TABLE IF EXISTS user_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ")
        await conn.exec_driver_sql("ALTER TABLE IF EXISTS competitor_snapshots ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'mock-benchmark'")
        await conn.exec_driver_sql(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'user_sessions' AND column_name = 'token'
                ) THEN
                    UPDATE user_sessions
                    SET token_jti = token
                    WHERE token_jti IS NULL AND token IS NOT NULL;

                    UPDATE user_sessions
                    SET token = token_jti
                    WHERE token IS NULL AND token_jti IS NOT NULL;
                END IF;
            END $$;
            """
        )


async def graphql_context(request: Request, db=Depends(get_db)) -> dict:
    auth_header = request.headers.get("authorization", "")
    user = None
    if auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ").strip()
        user = await get_user_by_token(db, token)
    return {"db": db, "request": request, "user": user}


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await ensure_compatibility_schema()
    async for session in get_db():
        await bootstrap_demo_data(session)
        break
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)
app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(
    GraphQLRouter(schema=schema, context_getter=graphql_context),
    prefix="/graphql",
)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "MarketScan 360 backend is running"}
