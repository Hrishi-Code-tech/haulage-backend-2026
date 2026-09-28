"""AI service main FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rag.qdrant_store import ensure_collection
from rag.ingestion import rebuild_bm25_from_qdrant, ingest_document
from rag.routes import router as rag_router
from ingestion.routes import router as ingestion_router
from seed import seed_penalty_policies


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """On startup: ensure Qdrant collection exists, seed docs, load BM25."""
    print("[startup] Ensuring Qdrant collection...")
    try:
        ensure_collection()
    except Exception as exc:
        print(f"[startup] WARNING: Qdrant not ready — {exc}")

    print("[startup] Seeding penalty policy documents if needed...")
    try:
        seed_penalty_policies()
    except Exception as exc:
        print(f"[startup] WARNING: Seed failed — {exc}")

    print("[startup] Rebuilding BM25 index from existing Qdrant documents...")
    try:
        rebuild_bm25_from_qdrant()
    except Exception as exc:
        print(f"[startup] WARNING: BM25 rebuild failed — {exc}")

    print("[startup] AI service ready.")
    yield
    print("[shutdown] AI service shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Haulage AI Service",
    version="1.0.0",
    description="Hybrid RAG, Agentic Email Ingestion, and Streaming LangGraph for haulage logistics.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(rag_router)
app.include_router(ingestion_router)


@app.get("/health")
def health() -> dict:
    return {"status": "healthy", "service": "haulage-ai-service"}
