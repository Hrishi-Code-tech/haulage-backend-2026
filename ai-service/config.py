"""Centralised configuration via environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Qdrant
    qdrant_url: str = "http://qdrant:6333"
    qdrant_collection: str = "invoice_docs"

    # Embedding model (sentence-transformers)
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384

    # BM25
    bm25_top_k: int = 20

    # Hybrid retrieval
    dense_top_k: int = 20
    hybrid_top_k: int = 10
    rrf_k: int = 60  # RRF constant — higher = less rank-difference sensitivity

    # Postgres (read-only, for agent context in Feature 3)
    database_url: str = "postgresql+asyncpg://haulage:haulage@postgres:5432/haulage"

    # Node.js backend (for writing results back)
    node_backend_url: str = "http://api:3000"

    # SLM — Ollama (Feature 2)
    ollama_url: str = "http://ollama:11434"
    ollama_model: str = "phi3.5"

    # Redis (Feature 3 streaming)
    redis_url: str = "redis://redis:6379"


settings = Settings()
