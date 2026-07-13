from fastapi import APIRouter, Request

from app.schemas.scoring import ScorecardResponse
from app.services.audit_service import create_audit_event
from app.services.scoring_service import generate_score

router = APIRouter(prefix="/scoring", tags=["scoring"])


@router.get("/scorecard/{msme_id}", response_model=ScorecardResponse)
def get_scorecard(msme_id: str, request: Request) -> ScorecardResponse:
    score = generate_score(msme_id, persist=False, include_trace=True)
    create_audit_event("scorecard_viewed", msme_id, {"score_id": score.id, "rule_version": score.rule_version, "success": True}, request_id=request.state.request_id)
    return ScorecardResponse(
        msme_id=score.msme_id,
        score=score.score,
        risk_tier=score.risk_tier,
        data_confidence=score.data_confidence,
        calculation_trace=score.calculation_trace,
        positive_factors=score.positive_factors,
        negative_factors=score.negative_factors,
        early_warning_triggers=score.early_warning_triggers,
        missing_data_warnings=score.missing_data_warnings,
        suggested_credit_min=score.suggested_credit_min,
        suggested_credit_max=score.suggested_credit_max,
        recommended_human_action=score.recommended_human_action,
        recommendation=score.recommendation,
        decision_support_only=score.decision_support_only,
        rule_version=score.rule_version,
        created_at=score.created_at,
    )
