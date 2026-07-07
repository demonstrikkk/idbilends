from fastapi import APIRouter, Query

from app.schemas.score import ScoreDelta, ScoreDeltaResponse, ScoreHistoryResponse, ScoreMovementsResponse
from app.services.score_history_service import get_latest_delta, get_score_history, get_score_movements
from app.services.synthetic_data_service import ensure_seeded

router = APIRouter(tags=["score-history"])


@router.get("/score-history/{msme_id}", response_model=ScoreHistoryResponse)
def score_history(msme_id: str) -> ScoreHistoryResponse:
    ensure_seeded()
    return ScoreHistoryResponse(items=get_score_history(msme_id))


@router.get("/score-history/{msme_id}/latest-delta", response_model=ScoreDeltaResponse)
def latest_score_delta(msme_id: str) -> ScoreDeltaResponse:
    ensure_seeded()
    entry = get_latest_delta(msme_id)
    if entry is None:
        return ScoreDeltaResponse(delta=None, entry=None)
    return ScoreDeltaResponse(
        entry=entry,
        delta=ScoreDelta(
            previous_score=entry.previous_score,
            new_score=entry.new_score,
            delta=entry.delta,
            previous_risk_tier=entry.previous_risk_tier,
            new_risk_tier=entry.new_risk_tier,
            changed_components=entry.changed_components,
            changed_features=entry.changed_features,
            reasons=entry.reasons,
        ),
    )


@router.get("/monitoring/score-movements", response_model=ScoreMovementsResponse)
def score_movements(min_delta: int = Query(default=5, ge=0), limit: int = Query(default=100, ge=1, le=100)) -> ScoreMovementsResponse:
    ensure_seeded()
    return get_score_movements(min_delta=min_delta, limit=limit)
