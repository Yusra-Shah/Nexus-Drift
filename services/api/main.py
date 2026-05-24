from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from middleware.auth import ClerkAuthMiddleware
from middleware.logging import RequestLoggingMiddleware
from routers import agents, alerts, graph, health, risks, simulate, webhooks
from shared.graph.neo4j_client import NexusDriftGraph
from shared.graph.pinecone_client import NexusDriftVectors
from shared.utils.logger import get_logger
from shared.utils.security import generate_trace_id

logger = get_logger("nexusdrift-api")

limiter = Limiter(key_func=get_remote_address, default_limits=["1000/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    graph_client = NexusDriftGraph()
    try:
        await graph_client.connect()
        logger.info("Neo4j connected")
    except Exception as exc:
        logger.warning("Neo4j connection failed at startup: %s", exc)

    try:
        from google.cloud import firestore
        fs = firestore.Client(project=os.environ.get("FIRESTORE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT"))
        app.state.firestore = fs
        logger.info("Firestore connected")
    except Exception as exc:
        app.state.firestore = None
        logger.warning("Firestore connection failed at startup: %s", exc)

    try:
        vectors = NexusDriftVectors()
        app.state.vectors = vectors
        logger.info("Pinecone connected")
    except Exception as exc:
        app.state.vectors = None
        logger.warning("Pinecone connection failed at startup: %s", exc)

    app.state.graph = graph_client
    logger.info("Nexus Drift API ready")

    yield

    # Shutdown
    await graph_client.close()
    logger.info("Neo4j disconnected")


app = FastAPI(
    title="Nexus Drift API",
    version="0.1.0",
    description="Autonomous Organizational Cognition Engine",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware (applied in reverse order — logging runs outermost)
app.add_middleware(ClerkAuthMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Routers
app.include_router(health.router)
app.include_router(graph.router)
app.include_router(agents.router)
app.include_router(risks.router)
app.include_router(alerts.router)
app.include_router(simulate.router)
app.include_router(webhooks.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    trace_id = getattr(request.state, "trace_id", generate_trace_id())
    logger.error("Unhandled exception trace_id=%s: %s", trace_id, exc)
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
            "trace_id": trace_id,
        },
    )
