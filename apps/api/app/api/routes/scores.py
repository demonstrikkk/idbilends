from fastapi import APIRouter, Request

from app.schemas.score import ScoreGenerationRequest, ScoreOutputSchema
from app.services.audit_service import create_audit_event
from app.services.scoring_service import generate_score

router = APIRouter(prefix="/scores", tags=["scores"])


@router.post("/{msme_id}/generate", response_model=ScoreOutputSchema)
def generate_msme_score(msme_id: str, payload: ScoreGenerationRequest, request: Request) -> ScoreOutputSchema:
    score = generate_score(msme_id, persist=payload.persist, include_trace=payload.include_trace)
    if payload.persist:
        create_audit_event("score_generated", msme_id, {"score_id": score.id, "rule_version": score.rule_version, "success": True}, request_id=request.state.request_id)
    return score
