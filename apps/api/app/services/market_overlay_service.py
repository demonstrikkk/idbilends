from fastapi import HTTPException

from app.db.repository import store
from app.schemas.common import utc_now
from app.schemas.market_overlay import MarketOverlay, MarketOverlaySimulationResponse, WeightProfile
from app.services.scoring_service import generate_score
from app.services.synthetic_data_service import ensure_seeded

OVERLAY_VERSION = "market_overlay_v1"


def list_weight_profiles() -> list[WeightProfile]:
    now = utc_now()
    return [
        WeightProfile(weight_profile_id="wp_manufacturing_v1", version="weights_v1", segment="small_manufacturer", sector="manufacturing", cashflow_weight=0.25, repayment_weight=0.2, compliance_weight=0.15, concentration_weight=0.15, document_quality_weight=0.15, market_overlay_weight=0.1, active_from=now, reason="Baseline profile for input-cost-sensitive manufacturing MSMEs."),
        WeightProfile(weight_profile_id="wp_trade_v1", version="weights_v1", segment="trader", sector="trading", cashflow_weight=0.24, repayment_weight=0.2, compliance_weight=0.14, concentration_weight=0.2, document_quality_weight=0.12, market_overlay_weight=0.1, active_from=now, reason="Baseline profile emphasizes buyer concentration and collection discipline."),
        WeightProfile(weight_profile_id="wp_digital_v1", version="weights_v1", segment="digital_seller", sector="digital_seller", cashflow_weight=0.22, repayment_weight=0.18, compliance_weight=0.16, concentration_weight=0.14, document_quality_weight=0.12, market_overlay_weight=0.18, active_from=now, reason="Digital sellers may receive transparent order-completion tailwinds."),
    ]


def list_market_overlays() -> list[MarketOverlay]:
    now = utc_now()
    return [
        MarketOverlay(overlay_id="textile_export_stress", version=OVERLAY_VERSION, name="Textile Export Stress", sector="manufacturing", score_adjustment=-5, affected_tags=["manufacturing", "input_cost_sensitive"], active=True, reason="Synthetic sector stress for export and input-cost pressure.", active_from=now),
        MarketOverlay(overlay_id="food_seasonal_demand", version=OVERLAY_VERSION, name="Food Seasonal Demand", sector="food", score_adjustment=3, affected_tags=["food", "seasonal_demand"], active=True, reason="Synthetic seasonal demand support for food businesses.", active_from=now),
        MarketOverlay(overlay_id="manufacturing_input_cost_pressure", version=OVERLAY_VERSION, name="Manufacturing Input Cost Pressure", sector="manufacturing", score_adjustment=-4, affected_tags=["manufacturing", "input_cost_sensitive"], active=True, reason="Synthetic margin pressure overlay; policy score remains unchanged.", active_from=now),
        MarketOverlay(overlay_id="digital_seller_growth_tailwind", version=OVERLAY_VERSION, name="Digital Seller Growth Tailwind", sector="digital_seller", score_adjustment=4, affected_tags=["digital_seller", "platform_sales", "gem_like"], active=True, reason="Synthetic platform-demand tailwind.", active_from=now),
        MarketOverlay(overlay_id="trader_collection_stress", version=OVERLAY_VERSION, name="Trader Collection Stress", sector="trading", score_adjustment=-6, affected_tags=["trading", "buyer_concentration"], active=True, reason="Synthetic receivable collection stress for trading cases.", active_from=now),
    ]


def simulate_market_overlay(msme_id: str, overlay_id: str) -> MarketOverlaySimulationResponse:
    ensure_seeded()
    profile = store.get_profile(msme_id)
    if profile is None:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})
    overlay = next((item for item in list_market_overlays() if item.overlay_id == overlay_id), None)
    if overlay is None:
        raise HTTPException(status_code=404, detail={"code": "OVERLAY_NOT_FOUND", "message": "Market overlay was not found."})
    policy_score = store.latest_score(msme_id) or generate_score(msme_id, persist=True, include_trace=True)
    applies = any(tag in profile.sector_tags for tag in overlay.affected_tags)
    adjustment = overlay.score_adjustment if applies else 0
    adjusted = max(0, min(100, policy_score.score + adjustment))
    profile_weight = _weight_profile_for(profile.segment.value)
    return MarketOverlaySimulationResponse(
        msme_id=msme_id,
        overlay_id=overlay.overlay_id,
        policy_score=policy_score.score,
        market_adjusted_score=adjusted,
        monitoring_delta_score=adjustment,
        policy_score_unchanged=True,
        weight_profile_id=profile_weight.weight_profile_id,
        version=overlay.version,
        reason=overlay.reason if applies else "Overlay simulated but borrower sector tags were not affected.",
        trace=[
            f"policy_score={policy_score.score}",
            f"overlay_adjustment={adjustment}",
            "Policy score is not rewritten by market overlay simulation.",
        ],
    )


def _weight_profile_for(segment: str) -> WeightProfile:
    profiles = list_weight_profiles()
    return next((item for item in profiles if item.segment == segment), profiles[0])
