"""FastAPI routes for the RAG pipeline."""
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rag.ingestion import ingest_document, rebuild_bm25_from_qdrant
from rag.hybrid_retriever import hybrid_search
from rag.qdrant_store import get_point_count
from rag.bm25_index import get_bm25_index

router = APIRouter(prefix="/rag", tags=["rag"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class IngestRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Document text to ingest")
    source: str = Field(..., description="Human-readable source label, e.g. 'contract-2026-q3.pdf'")
    clause_type: str = Field("general", description="Category: penalty | rate | terms | general")
    order_id: str | None = Field(None, description="Optional OrderLoad ID to link this document to")


class IngestResponse(BaseModel):
    chunks_ingested: int
    source: str
    clause_type: str
    bm25_index_size: int


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Natural language query")
    top_k: int = Field(10, ge=1, le=50)


class AuditRequest(BaseModel):
    order_id: str
    billed_amount: float = Field(..., gt=0)
    invoice_text: str = Field("", description="Optional extracted invoice text for RAG context")
    agreed_rate: float | None = Field(None, description="Agreed rate from AiNegotiationLog")


class AuditFinding(BaseModel):
    flag: str
    detail: str
    severity: str   # "HIGH" | "MEDIUM" | "LOW"


class AuditResponse(BaseModel):
    order_id: str
    billed_amount: float
    agreed_rate: float | None
    audit_status: str           # "PASSED" | "DISCREPANCY" | "NEEDS_REVIEW"
    discrepancy_flags: list[str]
    findings: list[AuditFinding]
    relevant_clauses: list[dict]
    clause_count: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest) -> IngestResponse:
    """Chunk, embed, and store a document in Qdrant. Rebuilds BM25 index."""
    chunks = ingest_document(
        text=req.text,
        source=req.source,
        clause_type=req.clause_type,
        order_id=req.order_id,
    )
    return IngestResponse(
        chunks_ingested=len(chunks),
        source=req.source,
        clause_type=req.clause_type,
        bm25_index_size=get_bm25_index().size,
    )


@router.post("/search")
def search(req: SearchRequest) -> dict:
    """
    Hybrid search: dense (Qdrant cosine) + BM25 (in-memory), merged by RRF.
    Response includes per-result dense_rank, bm25_rank, and rrf_score.
    """
    results = hybrid_search(query=req.query, top_k=req.top_k)
    return {
        "query": req.query,
        "total_results": len(results),
        "results": results,
        "retrieval_info": {
            "dense_backend": "qdrant-cosine",
            "sparse_backend": "bm25-okapi-in-memory",
            "fusion": "reciprocal-rank-fusion",
            "bm25_index_size": get_bm25_index().size,
            "qdrant_points": get_point_count(),
        },
    }


@router.post("/audit", response_model=AuditResponse)
def audit_invoice(req: AuditRequest) -> AuditResponse:
    """
    Run a hybrid RAG-backed invoice audit.

    Steps:
    1. Build a search query from the invoice context.
    2. Retrieve relevant penalty/rate clauses via hybrid search.
    3. Apply deterministic rules (billed vs agreed rate).
    4. Return structured audit result with relevant clauses.
    """
    # --- Step 1: Build query from invoice context ---
    search_query = f"penalty clause late payment overcharge rate dispute {req.invoice_text[:200]}"

    # --- Step 2: Retrieve relevant clauses ---
    relevant_clauses = hybrid_search(query=search_query, top_k=5)

    # --- Step 3: Deterministic rate validation ---
    findings: list[AuditFinding] = []
    discrepancy_flags: list[str] = []

    if req.agreed_rate is not None:
        diff = req.billed_amount - req.agreed_rate
        pct = (diff / req.agreed_rate) * 100 if req.agreed_rate else 0

        if diff > 0:
            severity = "HIGH" if pct > 10 else "MEDIUM" if pct > 5 else "LOW"
            flag = f"OVERBILLED_{round(pct, 1)}PCT"
            discrepancy_flags.append(flag)
            findings.append(AuditFinding(
                flag=flag,
                detail=f"Billed €{req.billed_amount:.2f} vs agreed €{req.agreed_rate:.2f} (+{pct:.1f}%)",
                severity=severity,
            ))
        elif diff < -0.01:
            findings.append(AuditFinding(
                flag="UNDERBILLED",
                detail=f"Billed €{req.billed_amount:.2f} vs agreed €{req.agreed_rate:.2f} — underbilled by €{abs(diff):.2f}",
                severity="LOW",
            ))

    # --- Step 4: Clause-based findings ---
    penalty_clauses = [c for c in relevant_clauses if c.get("clause_type") == "penalty"]
    if penalty_clauses and discrepancy_flags:
        findings.append(AuditFinding(
            flag="PENALTY_CLAUSE_APPLICABLE",
            detail=f"Found {len(penalty_clauses)} relevant penalty clause(s). Manual review recommended.",
            severity="MEDIUM",
        ))

    # --- Determine status ---
    high_severity = any(f.severity == "HIGH" for f in findings)
    audit_status = "DISCREPANCY" if high_severity else ("NEEDS_REVIEW" if findings else "PASSED")

    return AuditResponse(
        order_id=req.order_id,
        billed_amount=req.billed_amount,
        agreed_rate=req.agreed_rate,
        audit_status=audit_status,
        discrepancy_flags=discrepancy_flags,
        findings=findings,
        relevant_clauses=relevant_clauses,
        clause_count=len(relevant_clauses),
    )


@router.get("/status")
def rag_status() -> dict:
    """Returns RAG pipeline status."""
    return {
        "qdrant_points": get_point_count(),
        "bm25_index_size": get_bm25_index().size,
        "status": "ready" if get_bm25_index().size > 0 else "empty — ingest documents first",
    }
