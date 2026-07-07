from collections.abc import Callable
from typing import Any

from fastapi import HTTPException

from app.agents.context_builder import CopilotContextBuilder
from app.services.audit_service import create_audit_event as create_audit_event_service
from app.services.msme_service import get_msme
from app.services.prospect_service import generate_prospect_signals
from app.services.scoring_service import generate_score
from app.services.transaction_summary_service import get_transaction_summary


def get_msme_profile(msme_id: str) -> dict:
    return get_msme(msme_id).model_dump(mode="json")


def get_financial_health_score(msme_id: str) -> dict:
    return generate_score(msme_id, persist=True, include_trace=True).model_dump(mode="json")


def get_risk_factors(msme_id: str) -> dict:
    score = generate_score(msme_id, persist=True, include_trace=True)
    return {
        "negative_factors": [item.model_dump(mode="json") for item in score.negative_factors],
        "early_warning_triggers": [item.model_dump(mode="json") for item in score.early_warning_triggers],
        "missing_data_warnings": score.missing_data_warnings,
    }


def get_missing_documents(msme_id: str) -> list[str]:
    return list(get_msme(msme_id).documents.missing_documents)


def get_prospect_signals(msme_id: str) -> dict:
    return generate_prospect_signals(msme_id, persist=True).model_dump(mode="json")


def create_audit_event(msme_id: str, action: str, metadata: dict, request_id: str | None = None) -> dict:
    return create_audit_event_service(action, msme_id, metadata, request_id=request_id).model_dump(mode="json")


ALLOWLIST: dict[str, Callable[..., Any]] = {
    "get_msme_profile": get_msme_profile,
    "get_financial_health_score": get_financial_health_score,
    "get_risk_factors": get_risk_factors,
    "get_missing_documents": get_missing_documents,
    "get_transaction_summary": lambda msme_id: get_transaction_summary(msme_id).model_dump(mode="json"),
    "get_prospect_signals": get_prospect_signals,
    "create_audit_event": create_audit_event,
}


def execute_tool(name: str, *args: Any, **kwargs: Any) -> Any:
    tool = ALLOWLIST.get(name)
    if not tool:
        raise HTTPException(status_code=403, detail={"code": "COPILOT_TOOL_DENIED", "message": f"Tool '{name}' is not allowlisted."})
    return tool(*args, **kwargs)


def get_langchain_tools() -> list[Any]:
    try:
        from langchain_core.tools import StructuredTool
    except ImportError:
        return []
    return [
        StructuredTool.from_function(func=func, name=name, description=f"Allowlisted Credit Copilot backend tool: {name}.")
        for name, func in ALLOWLIST.items()
    ]


def build_sanitized_context(msme_id: str):
    return CopilotContextBuilder().build(msme_id)
