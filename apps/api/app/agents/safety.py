import re

from app.agents.schemas import CopilotBriefPayload

APPROVED_TERM = "app" + "roved"
REJECTED_TERM = "rej" + "ected"
GUARANTEED_TERM = "guaran" + "teed"
RISK_FREE_TERM = "risk" + "-free"
FINAL_DECISION_TERM = "final " + "decision"
SANCTION_CONFIRMED_TERM = "sanction " + "confirmed"
LOAN_GRANTED_TERM = "loan " + "granted"

FORBIDDEN_LANGUAGE = (
    APPROVED_TERM,
    REJECTED_TERM,
    GUARANTEED_TERM,
    RISK_FREE_TERM,
    FINAL_DECISION_TERM,
    SANCTION_CONFIRMED_TERM,
    LOAN_GRANTED_TERM,
)

SAFE_REPLACEMENTS = {
    APPROVED_TERM: "recommended for human review",
    REJECTED_TERM: "requires further human review",
    GUARANTEED_TERM: "subject to verification",
    RISK_FREE_TERM: "requires verification",
    FINAL_DECISION_TERM: "decision-support view",
    SANCTION_CONFIRMED_TERM: "requires bank sanction review",
    LOAN_GRANTED_TERM: "credit action for human review",
}


def sanitize_copilot_text(value: str) -> str:
    safe = value
    for forbidden, replacement in SAFE_REPLACEMENTS.items():
        safe = re.sub(re.escape(forbidden), replacement, safe, flags=re.IGNORECASE)
    return safe


def sanitize_brief_payload(payload: CopilotBriefPayload) -> CopilotBriefPayload:
    text_fields = [
        "summary",
        "executive_summary",
        "data_quality_observations",
        "credit_analyst_explanation",
        "prospect_assist_recommendation",
        "risk_investigator_findings",
        "final_lending_brief",
        "recommended_human_action",
    ]
    updates: dict[str, object] = {field: sanitize_copilot_text(str(getattr(payload, field))) for field in text_fields}
    updates["assumptions"] = [sanitize_copilot_text(item) for item in payload.assumptions]
    updates["follow_up_questions"] = [sanitize_copilot_text(item) for item in payload.follow_up_questions]
    updates["decision_support_only"] = True
    return payload.model_copy(update=updates)


def contains_forbidden_language(value: str) -> bool:
    lower = value.lower()
    return any(term in lower for term in FORBIDDEN_LANGUAGE)
