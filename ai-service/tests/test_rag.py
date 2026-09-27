import os
import sys
import pytest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rag.bm25_index import BM25Index
from rag.ingestion import chunk_text
from rag.hybrid_retriever import reciprocal_rank_fusion
from rag.routes import audit_invoice, AuditRequest


def test_chunk_text():
    """Verify that chunk_text generates overlapping word-level chunks."""
    text = "word " * 500  # 500 words
    chunks = chunk_text(text, chunk_size=100, overlap=20)
    assert len(chunks) > 1
    # Each chunk should contain words
    for c in chunks:
        assert len(c.split()) <= 100


def test_bm25_exact_keyword_retrieval():
    """
    Verify BM25 retrieval works independently from dense embeddings
    and scores documents with matching terms higher.
    """
    index = BM25Index()
    docs = [
        "Penalty Clause 4.1: Late delivery results in a 0.5% per hour penalty up to 15%.",
        "Standard dry van shipping rates within European Union corridors.",
        "Dispute resolution must be submitted within 14 calendar days.",
        "Overbilling exceeding 5% without written approval is prohibited under Clause 4.2.",
    ]
    point_ids = [f"id-{i}" for i in range(len(docs))]
    payloads = [{"text": d, "clause_type": "penalty" if "penalty" in d.lower() or "overbilling" in d.lower() else "terms"} for d in docs]

    index.build(point_ids, docs, payloads)
    assert index.size == 4

    # Query for 'penalty' should match docs 0 and 3
    results = index.search("penalty 4.1 late delivery", top_k=2)
    assert len(results) > 0
    top_id, top_score = results[0]
    assert top_id == "id-0"
    assert top_score > 0.0

    # Query for 'overbilling' should match doc 3
    results_overbill = index.search("overbilling 5%", top_k=2)
    assert len(results_overbill) > 0
    assert results_overbill[0][0] == "id-3"
    assert results_overbill[0][1] > 0.0


def test_reciprocal_rank_fusion():
    """
    Verify RRF merges dense and sparse results positionally,
    rewarding documents present in both lists.
    """
    # Create mock ScoredPoint objects for dense
    dense_p1 = MagicMock(id="doc-A", score=0.85, payload={"text": "Clause A", "source": "contract.pdf"})
    dense_p2 = MagicMock(id="doc-B", score=0.72, payload={"text": "Clause B", "source": "contract.pdf"})
    dense_results = [dense_p1, dense_p2]

    # BM25 returned doc-B at rank 1, and doc-C at rank 2
    bm25_results = [("doc-B", 4.5), ("doc-C", 3.2)]

    fused = reciprocal_rank_fusion(
        dense_results=dense_results,
        bm25_results=bm25_results,
        top_k=3,
        k=60,
    )

    assert len(fused) == 3
    # doc-B was in BOTH lists (rank 2 in dense, rank 1 in BM25)
    # doc-B score: 1/(60+2) + 1/(60+1) = 0.016129 + 0.016393 = ~0.0325
    # doc-A score: 1/(60+1) = 0.016393
    # doc-C score: 1/(60+2) = 0.016129
    # Therefore doc-B MUST be rank 1 in fused results
    assert fused[0]["point_id"] == "doc-B"
    assert fused[0]["dense_rank"] == 2
    assert fused[0]["bm25_rank"] == 1
    assert fused[0]["rrf_score"] > fused[1]["rrf_score"]


def test_audit_invoice_overbilling_detection(monkeypatch):
    """
    Verify invoice audit flags overbilling and applies penalty clause findings.
    """
    # Mock hybrid_search to return a known penalty clause
    mock_clauses = [
        {
            "point_id": "test-uuid",
            "text": "Penalty Clause 4.2: Invoices exceeding agreed rate by >5% are subject to dispute.",
            "source": "contract-2026.pdf",
            "clause_type": "penalty",
            "rrf_score": 0.032,
        }
    ]
    monkeypatch.setattr("rag.routes.hybrid_search", lambda query, top_k: mock_clauses)

    req = AuditRequest(
        order_id="11111111-1111-1111-1111-111111111111",
        billed_amount=1500.0,
        agreed_rate=1200.0,  # 25% overbilled
        invoice_text="Carrier invoice for order #1234",
    )

    resp = audit_invoice(req)
    assert resp.audit_status == "DISCREPANCY"
    assert any("OVERBILLED" in flag for flag in resp.discrepancy_flags)
    assert resp.clause_count == 1
    assert len(resp.findings) >= 2  # Rate discrepancy + Penalty clause applicable


def test_audit_invoice_passed(monkeypatch):
    """
    Verify invoice audit passes when billed amount matches agreed rate.
    """
    monkeypatch.setattr("rag.routes.hybrid_search", lambda query, top_k: [])

    req = AuditRequest(
        order_id="11111111-1111-1111-1111-111111111111",
        billed_amount=1200.0,
        agreed_rate=1200.0,
        invoice_text="Accurate invoice",
    )

    resp = audit_invoice(req)
    assert resp.audit_status == "PASSED"
    assert len(resp.discrepancy_flags) == 0
