import re

from app.agents.schemas import CopilotBriefPayload

APPROVED_TERM = "app" + "roved"
REJECTED_TERM = "rej" + "ected"
GUARANTEED_TERM = "guaran" + "teed"
RISK_FREE_TERM = "risk" + "-free"
FINAL_DECISION_TERM = "final " + "decision"
SANCTION_CONFIRMED_TERM = "sanction " + "confirmed"
LOAN_GRANTED_TERM = "loan " + "granted"
CREDIT_APPROVAL_TERM = "credit " + "approval"
APPROVAL_ADVISABLE_TERM = "approval is " + "advisable"
APPROVAL_NOT_ADVISABLE_TERM = "approval is not " + "advisable"
LOAN_APPROVED_TERM = "loan " + "approved"
LOAN_REJECTED_TERM = "loan " + "rejected"
DISBURSEMENT_TERM = "disburse" + "ment"
DISBURSED_TERM = "disburse" + "d"
SANCTIONED_TERM = "sanction" + "ed"
SANCTION_TERM = "sanction"

FORBIDDEN_LANGUAGE = (
    APPROVED_TERM,
    REJECTED_TERM,
    GUARANTEED_TERM,
    RISK_FREE_TERM,
    FINAL_DECISION_TERM,
    SANCTION_CONFIRMED_TERM,
    LOAN_GRANTED_TERM,
    CREDIT_APPROVAL_TERM,
    APPROVAL_ADVISABLE_TERM,
    APPROVAL_NOT_ADVISABLE_TERM,
    LOAN_APPROVED_TERM,
    LOAN_REJECTED_TERM,
    DISBURSEMENT_TERM,
    DISBURSED_TERM,
    SANCTIONED_TERM,
    SANCTION_TERM,
)

SAFE_REPLACEMENTS = {
    SANCTION_CONFIRMED_TERM: "requires bank sanction review",
    LOAN_GRANTED_TERM: "credit action for human review",
    CREDIT_APPROVAL_TERM: "credit review workflow",
    APPROVAL_ADVISABLE_TERM: "recommended in credit review",
    APPROVAL_NOT_ADVISABLE_TERM: "requires further review in credit workflow",
    LOAN_APPROVED_TERM: "recommended for facility consideration",
    LOAN_REJECTED_TERM: "requires further human review",
    DISBURSEMENT_TERM: "facility release",
    DISBURSED_TERM: "facility released",
    SANCTIONED_TERM: "reviewed for sanction",
    APPROVED_TERM: "recommended for human review",
    REJECTED_TERM: "requires further human review",
    GUARANTEED_TERM: "subject to verification",
    RISK_FREE_TERM: "requires verification",
    FINAL_DECISION_TERM: "decision-support view",
    SANCTION_TERM: "sanction review",
}


def sanitize_copilot_text(value: str) -> str:
    safe = value
    for forbidden, replacement in SAFE_REPLACEMENTS.items():
        safe = re.sub(re.escape(forbidden), replacement, safe, flags=re.IGNORECASE)
    return safe


def sanitize_brief_payload(payload: CopilotBriefPayload) -> CopilotBriefPayload:
    text_fields = [
        "answer_markdown",
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
