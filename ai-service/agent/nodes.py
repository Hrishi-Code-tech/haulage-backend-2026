"""
Modular LangGraph nodes for the logistics multi-agent pipeline.
Orchestrates:
  ingest_email -> extract_load -> validate_load -> search_documents -> audit_invoice -> completed
Emits safe execution and status events without private chain-of-thought.
"""
import uuid
from typing import Any
from agent.state import AgentWorkflowState
from ingestion.parser import parse_dispatch_email
from rag.hybrid_retriever import hybrid_search
from rag.routes import audit_invoice as run_rag_audit, AuditRequest


def ingest_email_node(state: AgentWorkflowState) -> AgentWorkflowState:
    """
    Step 1: Ingest dispatch email into the workflow state.
    """
    events = list(state.get("events") or [])
    email_text = (state.get("email_text") or "").strip()

    if not email_text:
        event = {
            "event": "error",
            "status": "FAILED",
            "message": "Empty or missing email_text",
        }
        events.append(event)
        return {
            "current_status": "FAILED",
            "events": events,
            "error": "Empty or missing email_text",
            "is_valid": False,
        }

    status_event = {
        "event": "status",
        "status": "INGESTING_EMAIL",
    }
    events.append(status_event)

    return {
        "current_status": "INGESTING_EMAIL",
        "events": events,
        "email_text": email_text,
    }


def extract_load_node(state: AgentWorkflowState) -> AgentWorkflowState:
    """
    Step 2: Extract structured dispatch fields using SLM / fallback provider.
    Reuses Feature 2 ingestion capabilities.
    """
    events = list(state.get("events") or [])
    if state.get("error"):
        return state

    status_event = {
        "event": "status",
        "status": "EXTRACTING_LOAD",
    }
    events.append(status_event)

    try:
        dispatch_load_obj = parse_dispatch_email(state["email_text"])
        load_dict = dispatch_load_obj.model_dump()
        return {
            "current_status": "EXTRACTING_LOAD",
            "events": events,
            "dispatch_load": load_dict,
        }
    except Exception as exc:
        err_msg = f"Extraction failed: {str(exc)}"
        error_event = {
            "event": "error",
            "status": "FAILED",
            "message": err_msg,
        }
        events.append(error_event)
        return {
            "current_status": "FAILED",
            "events": events,
            "error": err_msg,
            "is_valid": False,
        }


def validate_load_node(state: AgentWorkflowState) -> AgentWorkflowState:
    """
    Step 3: Validate extracted dispatch information.
    Ensures origin, destination, and positive rate are verified.
    """
    events = list(state.get("events") or [])
    if state.get("error"):
        return state

    status_event = {
        "event": "status",
        "status": "VALIDATING_DATA",
    }
    events.append(status_event)

    load = state.get("dispatch_load") or {}
    origin = load.get("origin")
    destination = load.get("destination")
    rate = load.get("rate")

    if not origin or not destination or rate is None or rate <= 0:
        err_msg = "Invalid dispatch data: origin, destination, and positive rate required."
        error_event = {
            "event": "error",
            "status": "FAILED",
            "message": err_msg,
        }
        events.append(error_event)
        return {
            "current_status": "FAILED",
            "events": events,
            "error": err_msg,
            "is_valid": False,
        }

    return {
        "current_status": "VALIDATING_DATA",
        "events": events,
        "is_valid": True,
    }


def search_documents_node(state: AgentWorkflowState) -> AgentWorkflowState:
    """
    Step 4: Query relevant contract and penalty policies using Hybrid RAG.
    Reuses Feature 1 hybrid dense (Qdrant) + BM25 retrieval.
    """
    events = list(state.get("events") or [])
    if state.get("error") or not state.get("is_valid", True):
        return state

    status_event = {
        "event": "status",
        "status": "SEARCHING_DOCUMENTS",
    }
    events.append(status_event)

    load = state.get("dispatch_load") or {}
    query = f"penalty clause late delivery overbilling freight rate dispute {load.get('equipment_type', '')}"

    try:
        retrieved = hybrid_search(query=query, top_k=3)
        return {
            "current_status": "SEARCHING_DOCUMENTS",
            "events": events,
            "retrieved_documents": retrieved,
        }
    except Exception as exc:
        # Non-fatal: if RAG search encounters an issue, continue with empty context
        return {
            "current_status": "SEARCHING_DOCUMENTS",
            "events": events,
            "retrieved_documents": [],
        }


def audit_invoice_node(state: AgentWorkflowState) -> AgentWorkflowState:
    """
    Step 5: Perform invoice audit against agreed rate and retrieved penalty policies.
    Reuses Feature 1 audit logic.
    Emits final COMPLETED status event with full structured result.
    """
    events = list(state.get("events") or [])
    if state.get("error") or not state.get("is_valid", True):
        return state

    status_event = {
        "event": "status",
        "status": "AUDITING_INVOICE",
    }
    events.append(status_event)

    load = state.get("dispatch_load") or {}
    agreed_rate = float(load.get("rate") or 0.0)
    billed_amount = float(state.get("invoice_amount") if state.get("invoice_amount") is not None else agreed_rate)

    order_id = str(uuid.uuid4())

    try:
        audit_req = AuditRequest(
            order_id=order_id,
            billed_amount=billed_amount,
            agreed_rate=agreed_rate,
            invoice_text=state.get("email_text", ""),
        )
        audit_resp = run_rag_audit(audit_req)
        audit_dict = audit_resp.model_dump()
    except Exception as exc:
        audit_dict = {
            "order_id": order_id,
            "billed_amount": billed_amount,
            "agreed_rate": agreed_rate,
            "audit_status": "PASSED" if billed_amount <= agreed_rate else "DISCREPANCY",
            "discrepancy_flags": ["RATE_OVERCHARGE"] if billed_amount > agreed_rate else [],
            "findings": [],
            "relevant_clauses": state.get("retrieved_documents") or [],
            "clause_count": len(state.get("retrieved_documents") or []),
        }

    # Final completion event
    completed_event = {
        "event": "completed",
        "status": "COMPLETED",
        "load": load,
        "audit": audit_dict,
    }
    events.append(completed_event)

    return {
        "current_status": "COMPLETED",
        "events": events,
        "audit_result": audit_dict,
    }
