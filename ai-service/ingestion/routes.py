"""
FastAPI routes for Agentic Data Ingestion Engine.
Exposes endpoints to extract structured dispatch information from raw emails.
"""
from fastapi import APIRouter, HTTPException
from ingestion.schemas import IngestEmailRequest, IngestEmailResponse, DispatchLoad
from ingestion.parser import parse_dispatch_email

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/email", response_model=IngestEmailResponse)
def ingest_email_endpoint(req: IngestEmailRequest) -> IngestEmailResponse:
    """
    Parse an unstructured dispatch email into deterministic structured JSON
    validated through strict Pydantic models.
    """
    try:
        load = parse_dispatch_email(req.email_text)
        snippet = req.email_text[:120] + ("..." if len(req.email_text) > 120 else "")
        return IngestEmailResponse(
            success=True,
            load=load,
            raw_email_snippet=snippet,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=422,
            detail=f"Dispatch email extraction failed: {str(ve)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Internal error processing dispatch email: {str(exc)}",
        )
