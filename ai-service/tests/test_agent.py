"""
Unit and integration tests for Feature 3: Streaming Multi-Agent LangGraph Workflow.
Tests state machine transitions, node execution, SSE event streaming, error handling,
and absence of private chain-of-thought.
"""
import os
import sys
import json
import pytest
from starlette.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from agent.state import AgentWorkflowState
from agent.nodes import (
    ingest_email_node,
    extract_load_node,
    validate_load_node,
    search_documents_node,
    audit_invoice_node,
)
from agent.graph import execute_workflow_sync, workflow_graph


def test_graph_state_initialization_and_ingestion_node():
    """
    Test initial state ingestion node adds INGESTING_EMAIL event.
    """
    state: AgentWorkflowState = {
        "email_text": "Need reefer from Mumbai to Delhi. Rate is 45000 INR. Weight 12000 kg.",
        "events": [],
    }
    next_state = ingest_email_node(state)
    assert next_state["current_status"] == "INGESTING_EMAIL"
    assert len(next_state["events"]) == 1
    assert next_state["events"][0]["event"] == "status"
    assert next_state["events"][0]["status"] == "INGESTING_EMAIL"


def test_ingest_email_node_empty_text_fails():
    """
    Empty email text should emit error event and mark state failed.
    """
    state: AgentWorkflowState = {
        "email_text": "",
        "events": [],
    }
    next_state = ingest_email_node(state)
    assert next_state["current_status"] == "FAILED"
    assert next_state["is_valid"] is False
    assert any(e["event"] == "error" for e in next_state["events"])


def test_validate_load_node_catches_invalid_data():
    """
    Test validation node fails if required fields are missing.
    """
    state: AgentWorkflowState = {
        "current_status": "EXTRACTING_LOAD",
        "events": [],
        "dispatch_load": {
            "origin": "",
            "destination": "Delhi",
            "rate": -100.0,
        },
    }
    next_state = validate_load_node(state)
    assert next_state["current_status"] == "FAILED"
    assert next_state["is_valid"] is False
    assert any(e["event"] == "error" for e in next_state["events"])


def test_full_graph_execution_sequence():
    """
    Verify complete LangGraph execution runs through the target sequence:
    INGESTING_EMAIL -> EXTRACTING_LOAD -> VALIDATING_DATA -> SEARCHING_DOCUMENTS -> AUDITING_INVOICE -> COMPLETED
    """
    email_text = (
        "Urgent dispatch notice:\n"
        "Load pickup from Mumbai to Delhi.\n"
        "Rate is ₹45,000.\n"
        "Need a reefer truck.\n"
        "Weight 12,000 kg."
    )
    final_state = execute_workflow_sync(email_text=email_text, invoice_amount=45000.0)

    assert final_state["current_status"] == "COMPLETED"
    assert final_state["dispatch_load"] is not None
    assert final_state["dispatch_load"]["origin"] == "Mumbai"
    assert final_state["dispatch_load"]["destination"] == "Delhi"
    assert final_state["dispatch_load"]["rate"] == 45000.0
    assert final_state["audit_result"] is not None

    # Verify event sequence
    statuses = [e.get("status") for e in final_state["events"]]
    expected_statuses = [
        "INGESTING_EMAIL",
        "EXTRACTING_LOAD",
        "VALIDATING_DATA",
        "SEARCHING_DOCUMENTS",
        "AUDITING_INVOICE",
        "COMPLETED",
    ]
    for exp in expected_statuses:
        assert exp in statuses, f"Expected status '{exp}' not found in event sequence {statuses}"


def test_graph_audit_overcharge_detection():
    """
    Verify graph audits discrepancies when invoice amount exceeds agreed rate.
    """
    email_text = "Offering transport from Rotterdam to Berlin. Rate is 1200 EUR. Dry van."
    # Billed 1500 vs agreed 1200
    final_state = execute_workflow_sync(email_text=email_text, invoice_amount=1500.0)

    assert final_state["current_status"] == "COMPLETED"
    audit = final_state["audit_result"]
    assert audit["audit_status"] == "DISCREPANCY"
    assert any("OVERBILLED" in f or "RATE" in f for f in audit["discrepancy_flags"])


def test_sse_streaming_endpoint():
    """
    Test FastAPI POST /graph/stream returns valid Server-Sent Events (SSE).
    """
    client = TestClient(app)
    payload = {
        "email_text": "Need reefer from Mumbai to Delhi. Rate is 45000 INR. Weight 12000 kg.",
        "invoice_amount": 45000.0,
    }
    response = client.post("/graph/stream", json=payload)
    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    # Parse SSE data events
    raw_text = response.text
    assert "data: " in raw_text

    events = []
    for line in raw_text.splitlines():
        line = line.strip()
        if line.startswith("data: "):
            event_json = json.loads(line[6:])
            events.append(event_json)

    assert len(events) >= 5
    # Verify first and last events
    assert events[0]["status"] == "INGESTING_EMAIL"
    completed_event = [e for e in events if e.get("event") == "completed"]
    assert len(completed_event) == 1
    assert completed_event[0]["status"] == "COMPLETED"
    assert "load" in completed_event[0]
    assert "audit" in completed_event[0]


def test_no_private_chain_of_thought_in_events():
    """
    Verify that streamed events strictly contain only safe status/metadata,
    with zero exposure of internal chain-of-thought or reasoning prompts.
    """
    client = TestClient(app)
    payload = {
        "email_text": "Need reefer from Mumbai to Delhi. Rate is 45000 INR. Weight 12000 kg.",
    }
    response = client.post("/graph/stream", json=payload)
    raw_text = response.text.lower()

    # Disallowed internal keys
    disallowed_keywords = ["thought", "chain_of_thought", "reasoning_steps", "hidden_prompt", "system_prompt"]
    for kw in disallowed_keywords:
        assert kw not in raw_text, f"Private reasoning key '{kw}' leaked in SSE stream!"
