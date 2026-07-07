from datetime import datetime

from pydantic import BaseModel


class WeightProfile(BaseModel):
    weight_profile_id: str
    version: str
    segment: str
    sector: str
    cashflow_weight: float
    repayment_weight: float
    compliance_weight: float
    concentration_weight: float
    document_quality_weight: float
    market_overlay_weight: float
    active_from: datetime
    reason: str


class MarketOverlay(BaseModel):
    overlay_id: str
    version: str
    name: str
    sector: str
    score_adjustment: int
    affected_tags: list[str]
    active: bool
    reason: str
    active_from: datetime


class MarketOverlaySimulationRequest(BaseModel):
    msme_id: str
    overlay_id: str


class MarketOverlaySimulationResponse(BaseModel):
    msme_id: str
    overlay_id: str
    policy_score: int
    market_adjusted_score: int
    monitoring_delta_score: int
    policy_score_unchanged: bool
    weight_profile_id: str
    version: str
    reason: str
    trace: list[str]
