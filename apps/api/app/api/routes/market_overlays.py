from fastapi import APIRouter

from app.schemas.market_overlay import MarketOverlay, MarketOverlaySimulationRequest, MarketOverlaySimulationResponse, WeightProfile
from app.services.market_overlay_service import list_market_overlays, list_weight_profiles, simulate_market_overlay

router = APIRouter(tags=["market-overlays"])


@router.get("/scoring/weight-profiles", response_model=list[WeightProfile])
def weight_profiles() -> list[WeightProfile]:
    return list_weight_profiles()


@router.get("/market-overlays", response_model=list[MarketOverlay])
def market_overlays() -> list[MarketOverlay]:
    return list_market_overlays()


@router.post("/market-overlays/simulate", response_model=MarketOverlaySimulationResponse)
def market_overlay_simulation(payload: MarketOverlaySimulationRequest) -> MarketOverlaySimulationResponse:
    return simulate_market_overlay(payload.msme_id, payload.overlay_id)
