from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Segment(StrEnum):
    retail_shop = "retail_shop"
    small_manufacturer = "small_manufacturer"
    services_firm = "services_firm"
    trader = "trader"
    food_business = "food_business"
    digital_seller = "digital_seller"
    gem_like_seller = "gem_like_seller"


class ScenarioLabel(StrEnum):
    healthy_growth = "healthy_growth"
    stable_moderate = "stable_moderate"
    seasonal_volatility = "seasonal_volatility"
    cashflow_stress = "cashflow_stress"
    high_buyer_concentration = "high_buyer_concentration"
    document_gap = "document_gap"
    suspicious_spike = "suspicious_spike"
    debt_overload = "debt_overload"


class RiskTier(StrEnum):
    very_low = "very_low"
    moderate_low = "moderate_low"
    moderate = "moderate"
    elevated = "elevated"
    high = "high"


class ProspectPriority(StrEnum):
    very_high = "very_high"
    high = "high"
    medium = "medium"
    low = "low"
    not_ready = "not_ready"


class RecommendationCategory(StrEnum):
    consider_with_standard_review = "consider_with_standard_review"
    consider_with_conditions = "consider_with_conditions"
    review_required = "review_required"
    consider_lower_limit = "consider_lower_limit"
    insufficient_data = "insufficient_data"
    not_recommended_without_rework = "not_recommended_without_rework"


class DocumentAvailability(StrEnum):
    available = "available"
    partial = "partial"
    missing = "missing"
    stale = "stale"
    not_applicable = "not_applicable"


class Pagination(BaseModel):
    total: int
    limit: int = Field(ge=1, le=1000)
    offset: int = Field(ge=0)
    has_more: bool
