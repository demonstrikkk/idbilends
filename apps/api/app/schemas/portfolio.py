from pydantic import BaseModel

from app.schemas.common import Pagination
from app.schemas.msme import MSMEListItem
from app.schemas.prospect import ProspectSignalOutputSchema
from app.schemas.score import ScoreOutputSchema


class PortfolioCase(BaseModel):
    item: MSMEListItem
    score: ScoreOutputSchema
    prospect: ProspectSignalOutputSchema


class PortfolioCasesResponse(BaseModel):
    items: list[PortfolioCase]
    pagination: Pagination | None = None


class CommandCenterCase(BaseModel):
    msme_id: str
    business_name: str
    segment: str
    city: str
    state: str
    branch: str | None
    zone: str | None
    relationship_manager: str | None
    requested_credit_amount: int
    policy_score: int
    market_adjusted_score: int
    score_delta: int
    risk_tier: str
    data_confidence: int
    top_blocker: str
    missing_evidence_count: int
    active_alert_count: int
    latest_event: str | None
    latest_event_at: str | None
    recommended_human_action: str
    prospect_priority: str
    suggested_credit_min: int
    suggested_credit_max: int
    last_updated: str
    case_stage: str
    monitoring_status: str


class CommandCenterPageSummary(BaseModel):
    returned: int
    needing_action: int
    score_dropped: int
    missing_evidence: int
    high_potential_low_confidence: int


class CommandCenterCasesResponse(BaseModel):
    items: list[CommandCenterCase]
    total: int
    limit: int
    offset: int
    sort: str
    applied_filters: dict[str, str]
    available_facets: dict[str, list[str]]
    facets: dict[str, list[str]]
    counts_by_saved_view: dict[str, int]
    page_summary: CommandCenterPageSummary


class PortfolioSummaryResponse(BaseModel):
    total_msmes: int
    average_health_score: int
    high_priority_prospects: int
    review_required_cases: int
    low_confidence_cases: int
    requested_exposure: int
    suggested_exposure_min: int
    suggested_exposure_max: int
    risk_distribution: dict[str, int]
    rule_version: str


class WatchlistResponse(BaseModel):
    items: list[PortfolioCase]
    total_watched_accounts: int
    escalated_cases: int
    missing_document_signals: int
    active_risk_signals: int


class AlertItem(BaseModel):
    id: str
    msme_id: str
    business_name: str
    location: str
    alert_type: str
    severity: str
    recommended_human_action: str
    evidence: str


class AlertsResponse(BaseModel):
    items: list[AlertItem]
    critical_or_high: int
    medium: int
    low: int
    review_required_cases: int


class PortfolioInsight(BaseModel):
    label: str
    value: int
    note: str


class PortfolioInsightsResponse(BaseModel):
    total_borrowers: int
    average_health_score: int
    average_prospect_score: int
    average_data_confidence: int
    requested_exposure: int
    warning_incidence_percent: int
    segment_health_scores: list[PortfolioInsight]
    segment_document_confidence: list[PortfolioInsight]
    negative_factor_prevalence: list[PortfolioInsight]


class ModelMonitorSnapshotResponse(BaseModel):
    applications_scored: int
    average_score: int
    high_or_elevated_risk_percent: int
    average_data_confidence: int
    decision_support_count: int
    rule_version: str
    confidence_distribution: list[PortfolioInsight]
    reason_code_prevalence: list[PortfolioInsight]
