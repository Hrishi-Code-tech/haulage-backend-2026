"""
FastAPI routes for LangGraph streaming multi-agent workflow.
Exposes POST /graph/stream for real-time SSE execution events.
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from agent.graph import execute_workflow_stream, execute_workflow_sync

router = APIRouter(prefix="/graph", tags=["agent"])


class GraphExecutionRequest(BaseModel):
    email_text: str = Field(..., min_length=5, description="Raw dispatch email text")
    invoice_amount: float | None = Field(None, description="Optional invoice amount to audit against agreed rate")


@router.post("/stream")
def stream_graph_execution(req: GraphExecutionRequest):
    """
    Stream observable status events from LangGraph execution via Server-Sent Events (SSE).
    Emits events: INGESTING_EMAIL -> EXTRACTING_LOAD -> VALIDATING_DATA -> SEARCHING_DOCUMENTS -> AUDITING_INVOICE -> COMPLETED.
    """
    return StreamingResponse(
        execute_workflow_stream(req.email_text, req.invoice_amount),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/run")
def run_graph_execution_sync(req: GraphExecutionRequest):
    """
    Run the LangGraph workflow synchronously and return the complete final state.
    """
    final_state = execute_workflow_sync(req.email_text, req.invoice_amount)
    return {
        "status": final_state.get("current_status"),
        "load": final_state.get("dispatch_load"),
        "audit": final_state.get("audit_result"),
        "error": final_state.get("error"),
        "events": final_state.get("events"),
    }
