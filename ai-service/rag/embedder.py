"""Singleton dense embedding model using sentence-transformers."""
from functools import lru_cache
from sentence_transformers import SentenceTransformer
from config import settings


@lru_cache(maxsize=1)
def get_embedder() -> SentenceTransformer:
    """Load model once and cache for the process lifetime."""
    print(f"[embedder] Loading model: {settings.embedding_model}")
    model = SentenceTransformer(settings.embedding_model)
    print(f"[embedder] Model loaded — dim={model.get_sentence_embedding_dimension()}")
    return model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Return a list of float vectors, one per text."""
    model = get_embedder()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    return embed_texts([query])[0]
