"""
Document ingestion pipeline.

Takes raw text documents, chunks them, embeds with dense model,
stores in Qdrant, then rebuilds the BM25 in-memory index.
"""
import uuid
from dataclasses import dataclass
from qdrant_client.models import PointStruct

from rag.embedder import embed_texts
from rag.qdrant_store import upsert_points, scroll_all_points
from rag.bm25_index import get_bm25_index


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> list[str]:
    """
    Split text into overlapping word-level chunks.
    Returns list of chunk strings.
    """
    words = text.split()
    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return [c for c in chunks if c.strip()]


# ---------------------------------------------------------------------------
# Public ingestion API
# ---------------------------------------------------------------------------

@dataclass
class IngestedChunk:
    point_id: str
    chunk_index: int
    text: str


def ingest_document(
    text: str,
    source: str,
    clause_type: str = "general",
    order_id: str | None = None,
) -> list[IngestedChunk]:
    """
    Chunk a document, embed it, upsert to Qdrant, and rebuild the BM25 index.
    Returns list of ingested chunk metadata.
    """
    chunks = chunk_text(text)
    if not chunks:
        return []

    # Dense embed all chunks in one batch
    vectors = embed_texts(chunks)

    points: list[PointStruct] = []
    results: list[IngestedChunk] = []

    for idx, (chunk_text_val, vector) in enumerate(zip(chunks, vectors)):
        point_id = str(uuid.uuid4())
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "text": chunk_text_val,
                    "source": source,
                    "clause_type": clause_type,
                    "chunk_index": idx,
                    "order_id": order_id,
                },
            )
        )
        results.append(IngestedChunk(point_id=point_id, chunk_index=idx, text=chunk_text_val))

    upsert_points(points)
    print(f"[ingestion] Upserted {len(points)} chunks from '{source}'")

    # Rebuild BM25 index so new documents are searchable immediately
    _rebuild_bm25()

    return results


def rebuild_bm25_from_qdrant() -> None:
    """Reload all stored chunks from Qdrant and rebuild the BM25 index."""
    _rebuild_bm25()


def _rebuild_bm25() -> None:
    all_points = scroll_all_points()
    point_ids = [str(p.id) for p in all_points]
    texts = [p.payload.get("text", "") for p in all_points]
    payloads = [p.payload or {} for p in all_points]
    get_bm25_index().build(point_ids, texts, payloads)
