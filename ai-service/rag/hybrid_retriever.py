"""
Hybrid retriever: runs Dense (Qdrant) and BM25 (in-memory) independently,
then merges ranked lists with Reciprocal Rank Fusion (RRF).

The BM25 and dense retrievers are COMPLETELY independent — BM25 is NOT
a post-filter on dense results. Both produce their own ranked lists,
and RRF scores combine them positionally.
"""
from dataclasses import dataclass

from rag.embedder import embed_query
from rag.qdrant_store import search_dense
from rag.bm25_index import get_bm25_index
from config import settings


@dataclass
class RetrievedChunk:
    point_id: str
    text: str
    source: str
    clause_type: str
    chunk_index: int
    order_id: str | None
    rrf_score: float
    dense_rank: int | None      # rank in dense result list (1-based), None if not present
    bm25_rank: int | None       # rank in BM25 result list (1-based), None if not present
    dense_score: float | None   # raw cosine similarity
    bm25_score: float | None    # raw BM25 score


# ---------------------------------------------------------------------------
# RRF fusion
# ---------------------------------------------------------------------------

def _rrf_score(rank: int, k: int = 60) -> float:
    """1 / (k + rank)  — standard RRF formula."""
    return 1.0 / (k + rank)


def reciprocal_rank_fusion(
    dense_results: list,          # list of qdrant ScoredPoint
    bm25_results: list[tuple],    # list of (point_id_str, bm25_score)
    top_k: int,
    k: int = 60,
) -> list[dict]:
    """
    Merge two ranked lists using RRF.
    Returns up to top_k dicts sorted by descending rrf_score.
    """
    rrf_scores: dict[str, float] = {}
    dense_rank_map: dict[str, int] = {}
    dense_score_map: dict[str, float] = {}
    bm25_rank_map: dict[str, int] = {}
    bm25_score_map: dict[str, float] = {}

    # --- Dense contribution ---
    for rank, point in enumerate(dense_results, start=1):
        pid = str(point.id)
        rrf_scores[pid] = rrf_scores.get(pid, 0.0) + _rrf_score(rank, k)
        dense_rank_map[pid] = rank
        dense_score_map[pid] = point.score

    # --- BM25 contribution ---
    for rank, (pid, score) in enumerate(bm25_results, start=1):
        rrf_scores[pid] = rrf_scores.get(pid, 0.0) + _rrf_score(rank, k)
        bm25_rank_map[pid] = rank
        bm25_score_map[pid] = score

    # Build payload lookup from dense results
    payload_map: dict[str, dict] = {}
    for point in dense_results:
        pid = str(point.id)
        payload_map[pid] = point.payload or {}

    # Also lookup payload from BM25 index for any BM25-only matches
    for pid, _score in bm25_results:
        if pid not in payload_map:
            payload_map[pid] = get_bm25_index().get_payload(pid) or {}

    # Sort by RRF score descending
    sorted_pids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:top_k]

    fused: list[dict] = []
    for pid in sorted_pids:
        payload = payload_map.get(pid, {})
        fused.append({
            "point_id": pid,
            "text": payload.get("text", ""),
            "source": payload.get("source", ""),
            "clause_type": payload.get("clause_type", ""),
            "chunk_index": payload.get("chunk_index", 0),
            "order_id": payload.get("order_id"),
            "rrf_score": round(rrf_scores[pid], 6),
            "dense_rank": dense_rank_map.get(pid),
            "bm25_rank": bm25_rank_map.get(pid),
            "dense_score": round(dense_score_map[pid], 4) if pid in dense_score_map else None,
            "bm25_score": round(bm25_score_map[pid], 4) if pid in bm25_score_map else None,
        })

    return fused


# ---------------------------------------------------------------------------
# Main hybrid search entry point
# ---------------------------------------------------------------------------

def hybrid_search(query: str, top_k: int | None = None) -> list[dict]:
    """
    1. Embed query → dense cosine search in Qdrant (independent)
    2. Tokenise query → BM25 search in memory (independent)
    3. RRF merge → top_k results
    """
    top_k = top_k or settings.hybrid_top_k

    # Step 1: Dense retrieval
    query_vector = embed_query(query)
    dense_results = search_dense(query_vector, top_k=settings.dense_top_k)

    # Step 2: BM25 retrieval (completely separate code path)
    bm25_results = get_bm25_index().search(query, top_k=settings.bm25_top_k)

    # Step 3: RRF fusion
    fused = reciprocal_rank_fusion(
        dense_results=dense_results,
        bm25_results=bm25_results,
        top_k=top_k,
        k=settings.rrf_k,
    )

    # Enrich with any BM25-only results (found by BM25 but not in dense top-k)
    # These need payload lookup — for MVP we skip if not already in dense results
    # (Their text is not in payload_map; would need a Qdrant point fetch by ID)

    return fused
