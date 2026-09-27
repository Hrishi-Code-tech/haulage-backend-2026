"""Qdrant client singleton and collection management."""
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
)
from config import settings


_client: QdrantClient | None = None


def get_qdrant_client() -> QdrantClient:
    """Return a singleton Qdrant client with automatic in-memory fallback for local dev/testing."""
    global _client
    if _client is not None:
        return _client
    try:
        c = QdrantClient(url=settings.qdrant_url, timeout=2.0)
        c.get_collections()
        _client = c
        print(f"[qdrant] Connected to remote Qdrant at {settings.qdrant_url}")
    except Exception as exc:
        print(f"[qdrant] Remote Qdrant at {settings.qdrant_url} unreachable ({exc}). Falling back to local in-memory Qdrant instance.")
        _client = QdrantClient(":memory:")
    return _client


def ensure_collection() -> None:
    """Create the collection if it does not exist."""
    client = get_qdrant_client()
    existing = {c.name for c in client.get_collections().collections}
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(
                size=settings.embedding_dim,
                distance=Distance.COSINE,
            ),
        )
        print(f"[qdrant] Created collection: {settings.qdrant_collection}")
    else:
        print(f"[qdrant] Collection already exists: {settings.qdrant_collection}")


def upsert_points(points: list[PointStruct]) -> None:
    client = get_qdrant_client()
    client.upsert(collection_name=settings.qdrant_collection, points=points)


def search_dense(query_vector: list[float], top_k: int) -> list:
    """Return ScoredPoint list from Qdrant dense cosine search."""
    client = get_qdrant_client()
    if hasattr(client, "query_points"):
        res = client.query_points(
            collection_name=settings.qdrant_collection,
            query=query_vector,
            limit=top_k,
            with_payload=True,
        )
        return getattr(res, "points", res)
    elif hasattr(client, "search"):
        return client.search(
            collection_name=settings.qdrant_collection,
            query_vector=query_vector,
            limit=top_k,
            with_payload=True,
        )
    return []


def scroll_all_points() -> list:
    """Return all stored points (id + payload, no vectors) for BM25 corpus."""
    client = get_qdrant_client()
    try:
        results, _next = client.scroll(
            collection_name=settings.qdrant_collection,
            with_payload=True,
            with_vectors=False,
            limit=10_000,
        )
        return results
    except Exception:
        return []


def get_point_count() -> int:
    client = get_qdrant_client()
    try:
        info = client.get_collection(settings.qdrant_collection)
        return info.points_count or 0
    except Exception:
        return 0


