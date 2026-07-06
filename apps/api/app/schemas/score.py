from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import RecommendationCategory, RiskTier


class ScoreGenerationRequest(BaseModel):
    persist: bool = True
    include_trace: bool = True


class ScoreFactor(BaseModel):
    code: str
    label: str
    category: str
    direction: str
    impact: int
    severity: str
    evidence: str
    source_fields: list[str]


class EarlyWarningTrigger(BaseModel):
    code: str
    label: str
    severity: str
    condition: str


class CalculationTraceItem(BaseModel):
    component: str
    max_points: int
    awarded_points: int
    source_fields: list[str]
    notes: str


class ScoreOutputSchema(BaseModel):
    id: str
    msme_id: str
    score: int
    risk_tier: RiskTier
    data_confidence: int
    suggested_credit_min: int
    suggested_credit_max: int
    requested_credit_amount: int
    recommendation: RecommendationCategory
    recommended_human_action: str
    decision_support_only: bool
    positive_factors: list[ScoreFactor]
    negative_factors: list[ScoreFactor]
    missing_data_warnings: list[str]
    early_warning_triggers: list[EarlyWarningTrigger]
    calculation_trace: list[CalculationTraceItem]
    rule_version: str
    created_at: datetime
