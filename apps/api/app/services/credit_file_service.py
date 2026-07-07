from app.db.repository import store
from app.schemas.common import utc_now
from app.schemas.credit_file import (
    AuditSummary,
    CaseInboxLane,
    CaseInboxResponse,
    CreditFileResponse,
    EvidenceMapResponse,
    EvidenceMapRow,
    EvidenceStatusItem,
    RecommendedHumanAction,
)
from app.services.audit_service import list_audit_events
from app.services.msme_service import get_msme
from app.services.portfolio_service import get_portfolio_cases
from app.services.prospect_service import generate_prospect_signals
from app.services.scoring_service import generate_score
from app.services.transaction_summary_service import get_transaction_summary


DOCUMENT_EVIDENCE = {
    "bank_statement": (
        "Bank statement summary",
        "Cash inflow consistency, balance cushion, bounce behavior, and repayment capacity.",
        "cashflow_strength",
        "Verify latest statement",
    ),
    "gst_returns": (
        "GST-like turnover summary",
        "Revenue verification, filing discipline, and data confidence.",
        "compliance_discipline",
        "Request latest filing",
    ),
    "udyam": (
        "Udyam-like identity record",
        "Business identity and MSME registration evidence.",
        "compliance_discipline",
        "View identity record",
    ),
    "bureau_report": (
        "Bureau-like relationship record",
        "Existing obligations, repayment stress, and credit discipline.",
        "repayment_stress",
        "Verify obligations",
    ),
    "itr": (
        "ITR-like document",
        "Income consistency and additional verification depth.",
        "data_quality",
        "Request document",
    ),
    "gem_profile": (
        "GeM-like seller profile",
        "Order completion, buyer concentration, and working-capital signal.",
        "business_concentration",
        "Use in brief",
    ),
}


def get_credit_file(msme_id: str) -> CreditFileResponse:
    profile = get_msme(msme_id)
    score = store.latest_score(msme_id) or generate_score(msme_id, persist=True, include_trace=True)
    prospect = store.latest_prospect(msme_id) or generate_prospect_signals(msme_id, persist=True)
    audit_events, total_events = list_audit_events(msme_id, limit=5)
    evidence = _evidence_status(profile.documents)
    return CreditFileResponse(
        profile=profile,
        score=score,
        prospect=prospect,
        evidence_status=evidence,
        missing_evidence=score.missing_data_warnings,
        transaction_summary=get_transaction_summary(msme_id),
        risk_warnings=score.early_warning_triggers,
        suggested_credit_posture=f"{score.recommendation.value}: {score.recommended_human_action}",
        recommended_human_actions=[
            RecommendedHumanAction(label="Resolve evidence gaps", detail=score.missing_data_warnings[0] if score.missing_data_warnings else "Confirm available records before moving to review.", source="score.missing_data_warnings"),
            RecommendedHumanAction(label="Review credit posture", detail=score.recommended_human_action, source="score.recommended_human_action"),
            RecommendedHumanAction(label="Follow Prospect Assist", detail=prospect.next_best_action, source="prospect.next_best_action"),
        ],
        audit_summary=AuditSummary(latest_events=audit_events, total_events=total_events),
        cited_source_ids=[f"msme_profile:{profile.id}", f"score_output:{score.id}", f"prospect_signal:{prospect.id}", f"transaction_summary:{msme_id}"],
        generated_at=utc_now(),
    )


def get_evidence_map(msme_id: str) -> EvidenceMapResponse:
    credit_file = get_credit_file(msme_id)
    rows = [_document_map_row(item) for item in credit_file.evidence_status]
    for factor in [*credit_file.score.positive_factors, *credit_file.score.negative_factors]:
        rows.append(
            EvidenceMapRow(
                source_type="derived_signal",
                source_label=factor.label,
                source_status="available",
                derived_signal=factor.evidence,
                score_component=factor.category,
                lending_question=_question_for_component(factor.category),
                recommended_action="Use this factor in the officer review brief.",
                confidence_impact="Included in deterministic score explanation.",
                risk_impact=f"{factor.direction} impact of {factor.impact} points.",
            )
        )
    return EvidenceMapResponse(msme_id=msme_id, rows=rows, generated_at=utc_now())


def get_case_inbox() -> CaseInboxResponse:
    cases = get_portfolio_cases().items
    lanes = [
        CaseInboxLane(lane="ready_for_review", label="Ready for Review", cases=[case for case in cases if case.score.data_confidence >= 75 and case.score.risk_tier.value in {"very_low", "moderate_low", "moderate"}]),
        CaseInboxLane(lane="missing_evidence", label="Missing Evidence", cases=[case for case in cases if case.score.missing_data_warnings]),
        CaseInboxLane(lane="risk_attention", label="Risk Attention", cases=[case for case in cases if case.score.early_warning_triggers or case.score.risk_tier.value in {"elevated", "high"}]),
        CaseInboxLane(lane="high_potential", label="High Potential Prospect", cases=[case for case in cases if case.prospect.priority.value in {"very_high", "high"}]),
        CaseInboxLane(lane="low_confidence", label="Low Confidence", cases=[case for case in cases if case.score.data_confidence < 70]),
    ]
    return CaseInboxResponse(lanes=lanes, generated_at=utc_now())


def _evidence_status(documents) -> list[EvidenceStatusItem]:
    items: list[EvidenceStatusItem] = []
    for field, (label, why, component, action) in DOCUMENT_EVIDENCE.items():
        status = getattr(documents, field).value
        enabled = status in {"available", "partial", "stale"}
        items.append(
            EvidenceStatusItem(
                source_type=field,
                source_label=label,
                status=status,
                why_it_matters=why,
                related_score_component=component,
                action_label=action if enabled else "Request evidence",
                action_enabled=enabled,
                disabled_reason=None if enabled else "Source is not available in current backend phase.",
            )
        )
    return items


def _document_map_row(item: EvidenceStatusItem) -> EvidenceMapRow:
    available = item.status in {"available", "partial", "stale"}
    return EvidenceMapRow(
        source_type=item.source_type,
        source_label=item.source_label,
        source_status=item.status,
        derived_signal=item.why_it_matters if available else "Not available in current backend phase.",
        score_component=item.related_score_component,
        lending_question=_question_for_component(item.related_score_component),
        recommended_action=item.action_label,
        confidence_impact="Supports data confidence." if available else "Reduces or limits data confidence.",
        risk_impact="Used as underwriting evidence." if available else "Creates a verification gap for human review.",
    )


def _question_for_component(component: str) -> str:
    questions = {
        "cashflow_strength": "Can the borrower service working-capital exposure from observed inflows?",
        "compliance_discipline": "Is reported revenue and identity sufficiently verified?",
        "repayment_stress": "Are obligations manageable relative to revenue?",
        "business_concentration": "Is sales concentration acceptable for the requested exposure?",
        "suspicious_pattern": "Do anomalies require additional verification before review?",
        "data_quality": "What missing evidence blocks confident human review?",
    }
    return questions.get(component, "What should the officer verify before human review?")
