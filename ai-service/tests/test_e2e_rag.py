"""
End-to-end integration test for the AI service RAG pipeline.
Tests FastAPI app startup, seeding, hybrid search, and invoice auditing.
"""
import os
import sys
import pytest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from seed import seed_penalty_policies
from rag.ingestion import rebuild_bm25_from_qdrant


@pytest.fixture(scope="module")
def client():
    # Force seeding and BM25 index rebuild for the test session
    with TestClient(app) as test_client:
        seed_penalty_policies()
        rebuild_bm25_from_qdrant()
        yield test_client


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "haulage-ai-service"


def test_rag_status_endpoint(client):
    response = client.get("/rag/status")
    assert response.status_code == 200
    data = response.json()
    assert data["qdrant_points"] > 0
    assert data["bm25_index_size"] > 0
    assert data["status"] == "ready"


def test_hybrid_search_penalty_clause(client):
    """
    Search for late delivery penalty clauses and verify that hybrid retrieval
    returns ranked results with dense_rank, bm25_rank, and rrf_score.
    """
    payload = {
        "query": "penalty clause for late delivery delay charges",
        "top_k": 3,
    }
    response = client.post("/rag/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] > 0
    assert len(data["results"]) <= 3

    top_result = data["results"][0]
    assert "point_id" in top_result
    assert "text" in top_result
    assert "rrf_score" in top_result
    assert top_result["rrf_score"] > 0
    # Must contain relevant late delivery penalty clause
    assert "penalty" in top_result["clause_type"] or "late delivery" in top_result["text"].lower()


def test_invoice_audit_with_penalty_discrepancy(client):
    """
    Audit an invoice where the carrier billed €1500 but agreed rate was €1200.
    Verify that the audit flags overbilling and includes retrieved penalty clauses.
    """
    payload = {
        "order_id": "99999999-9999-9999-9999-999999999999",
        "billed_amount": 1500.0,
        "agreed_rate": 1200.0,
        "invoice_text": "Invoice #INV-2026-004. Route: Rotterdam to Berlin. Total: EUR 1,500.00",
    }
    response = client.post("/rag/audit", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["audit_status"] == "DISCREPANCY"
    assert len(data["discrepancy_flags"]) > 0
    assert any("OVERBILLED" in flag for flag in data["discrepancy_flags"])
    assert data["clause_count"] > 0
    assert len(data["relevant_clauses"]) > 0
    # Findings should include both mathematical discrepancy and applicable penalty clauses
    findings_flags = [f["flag"] for f in data["findings"]]
    assert any("OVERBILLED" in f for f in findings_flags)
