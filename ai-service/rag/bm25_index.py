"""
In-memory BM25 index built from document chunks stored in Qdrant.

This is INDEPENDENT of the dense retrieval path — it is NOT a filter applied
to dense results. Both retrievers run separately and are merged by RRF.
"""
import re
from dataclasses import dataclass, field
from rank_bm25 import BM25Okapi


# ---------------------------------------------------------------------------
# Simple whitespace tokeniser (no NLTK dependency at import time)
# ---------------------------------------------------------------------------

def _tokenise(text: str) -> list[str]:
    """Lowercase, strip punctuation, split on whitespace."""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return [t for t in text.split() if len(t) > 1]


# ---------------------------------------------------------------------------
# BM25 Index
# ---------------------------------------------------------------------------

@dataclass
class BM25Index:
    """
    Maintains a BM25Okapi index over document chunks.
    Each document has a point_id (Qdrant UUID), text content, and full payload metadata.
    """
    _point_ids: list[str] = field(default_factory=list)
    _texts: list[str] = field(default_factory=list)
    _payloads: dict[str, dict] = field(default_factory=dict)
    _bm25: BM25Okapi | None = None

    def build(self, point_ids: list[str], texts: list[str], payloads: list[dict] | None = None) -> None:
        """(Re)build the index from scratch."""
        if not texts:
            self._point_ids = []
            self._texts = []
            self._payloads = {}
            self._bm25 = None
            return
        self._point_ids = list(point_ids)
        self._texts = list(texts)
        if payloads:
            self._payloads = {pid: pl for pid, pl in zip(point_ids, payloads)}
        else:
            self._payloads = {pid: {"text": t} for pid, t in zip(point_ids, texts)}
        tokenised_corpus = [_tokenise(t) for t in texts]
        self._bm25 = BM25Okapi(tokenised_corpus)
        print(f"[bm25] Index built with {len(texts)} documents")

    def get_payload(self, point_id: str) -> dict:
        """Retrieve payload metadata for a point id."""
        return self._payloads.get(point_id, {})

    def search(self, query: str, top_k: int = 20) -> list[tuple[str, float]]:
        """
        Return (point_id, bm25_score) pairs sorted descending by score.
        Returns an empty list if the index has not been built yet.
        """
        if self._bm25 is None or not self._point_ids:
            return []
        tokens = _tokenise(query)
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(
            zip(self._point_ids, scores.tolist()),
            key=lambda x: x[1],
            reverse=True,
        )
        # Filter out zero-score results (no term overlap)
        ranked = [(pid, score) for pid, score in ranked if score > 0.0]
        return ranked[:top_k]

    @property
    def size(self) -> int:
        return len(self._point_ids)


# Module-level singleton
_bm25_index = BM25Index()


def get_bm25_index() -> BM25Index:
    return _bm25_index
