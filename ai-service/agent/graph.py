"""
StateGraph assembly and execution engine for the logistics pipeline.
Provides compiled workflow and streaming event generator.
"""
import json
import asyncio
from typing import AsyncGenerator, Any

from langgraph.graph import StateGraph, START, END

from agent.state import AgentWorkflowState
from agent.nodes import (
    ingest_email_node,
    extract_load_node,
    validate_load_node,
    search_documents_node,
    audit_invoice_node,
)


def _check_validation(state: AgentWorkflowState) -> str:
    """Route to document search if valid, otherwise end workflow early."""
    if state.get("error") or not state.get("is_valid", True):
        return END
    return "search_documents"


def build_logistics_graph():
    """Build and compile the LangGraph state machine."""
    builder = StateGraph(AgentWorkflowState)

    builder.add_node("ingest_email", ingest_email_node)
    builder.add_node("extract_load", extract_load_node)
    builder.add_node("validate_load", validate_load_node)
    builder.add_node("search_documents", search_documents_node)
    builder.add_node("audit_invoice", audit_invoice_node)

    builder.add_edge(START, "ingest_email")
    builder.add_edge("ingest_email", "extract_load")
    builder.add_edge("extract_load", "validate_load")

    builder.add_conditional_edges(
        "validate_load",
        _check_validation,
        {
            "search_documents": "search_documents",
            END: END,
        },
    )
    builder.add_edge("search_documents", "audit_invoice")
    builder.add_edge("audit_invoice", END)

    return builder.compile()


# Compiled singleton graph
workflow_graph = build_logistics_graph()


def execute_workflow_sync(email_text: str, invoice_amount: float | None = None) -> AgentWorkflowState:
    """Run full workflow synchronously, returning the final state."""
    initial_state: AgentWorkflowState = {
        "email_text": email_text,
        "invoice_amount": invoice_amount,
        "current_status": "PENDING",
        "events": [],
    }
    return workflow_graph.invoke(initial_state)


async def execute_workflow_stream(
    email_text: str,
    invoice_amount: float | None = None,
) -> AsyncGenerator[str, None]:
    """
    Stream observable status events from LangGraph execution in standard SSE format:
    data: <JSON>\n\n
    """
    initial_state: AgentWorkflowState = {
        "email_text": email_text,
        "invoice_amount": invoice_amount,
        "current_status": "PENDING",
        "events": [],
    }

    emitted_count = 0

    try:
        # Step through graph nodes
        for output in workflow_graph.stream(initial_state):
            # output is a dict like {'node_name': {updated_state_keys...}}
            for node_name, node_state in output.items():
                node_events = node_state.get("events") or []
                while emitted_count < len(node_events):
                    event = node_events[emitted_count]
                    emitted_count += 1
                    yield f"data: {json.dumps(event)}\n\n"
                    await asyncio.sleep(0.01)  # allow event to flush

    except Exception as exc:
        error_event = {
            "event": "error",
            "status": "FAILED",
            "message": f"Graph execution error: {str(exc)}",
        }
        yield f"data: {json.dumps(error_event)}\n\n"
