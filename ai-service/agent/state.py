"""
Typed state definition for the LangGraph multi-agent logistics workflow.
Stores only observable workflow state without private model chain-of-thought.
"""
from typing import TypedDict, Any


class AgentWorkflowState(TypedDict, total=False):
    """
    Observable state schema for the logistics agent state machine.
    """
    email_text: str
    invoice_amount: float | None
    current_status: str
    events: list[dict[str, Any]]
    dispatch_load: dict[str, Any] | None
    is_valid: bool
    validation_error: str | None
    retrieved_documents: list[dict[str, Any]] | None
    audit_result: dict[str, Any] | None
    error: str | None
