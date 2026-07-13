from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import RecommendationCategory, RiskTier
from app.schemas.score import CalculationTraceItem, EarlyWarningTrigger, ScoreFactor


class ScorecardResponse(BaseModel):
    msme_id: str
    score: int
    risk_tier: RiskTier
    data_confidence: int
    calculation_trace: list[CalculationTraceItem]
    positive_factors: list[ScoreFactor]
    negative_factors: list[ScoreFactor]
    early_warning_triggers: list[EarlyWarningTrigger]
    missing_data_warnings: list[str]
    suggested_credit_min: int
    suggested_credit_max: int
    recommended_human_action: str
    recommendation: RecommendationCategory
    decision_support_only: bool
    rule_version: str
    created_at: datetime
