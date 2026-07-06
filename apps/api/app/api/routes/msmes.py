from fastapi import APIRouter, Query

from app.schemas.msme import MSMEDetail, MSMEListResponse
from app.services.msme_service import get_msme, list_msmes

router = APIRouter(prefix="/msmes", tags=["msmes"])


@router.get("", response_model=MSMEListResponse)
def list_msme_profiles(
    segment: str | None = None,
    scenario_label: str | None = None,
    risk_tier: str | None = None,
    prospect_priority: str | None = None,
    search: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    sort: str = "prospect_score_desc",
) -> MSMEListResponse:
    return list_msmes(segment, scenario_label, risk_tier, prospect_priority, search, limit, offset, sort)


@router.get("/{msme_id}", response_model=MSMEDetail)
def get_msme_profile(msme_id: str) -> MSMEDetail:
    return get_msme(msme_id)
