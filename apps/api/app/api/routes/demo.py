from fastapi import APIRouter, Request

from app.schemas.msme import SeedRequest, SeedResponse
from app.services.synthetic_data_service import seed_demo_data

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/seed", response_model=SeedResponse)
def seed_demo(payload: SeedRequest, request: Request) -> SeedResponse:
    return seed_demo_data(reset=payload.reset, seed=payload.seed, profile_count=payload.profile_count, request_id=request.state.request_id)
