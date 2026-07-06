from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import DocumentAvailability, Pagination, ScenarioLabel, Segment


class FinancialSnapshotSchema(BaseModel):
    snapshot_month: str
    monthly_revenue_avg: int
    monthly_expense_avg: int
    average_bank_balance: int
    cash_inflow_volatility: float
    revenue_growth_3m: float
    revenue_growth_6m: float
    emi_obligation: int
    existing_debt: int
    bounce_count_3m: int
    bounce_count_6m: int
    gst_filing_regularity: float
    buyer_concentration: float
    digital_payment_ratio: float
    gem_order_completion_rate: float | None = None
    invoice_delay_avg_days: int
    cash_deposit_ratio: float | None = None
    revenue_spike_ratio: float | None = None


class DocumentStatusSchema(BaseModel):
    bank_statement: DocumentAvailability
    gst_returns: DocumentAvailability
    udyam: DocumentAvailability
    bureau_report: DocumentAvailability
    itr: DocumentAvailability
    gem_profile: DocumentAvailability
    missing_documents: list[str]
    stale_documents: list[str]


class MSMEDetail(BaseModel):
    id: str
    business_name: str
    segment: Segment
    scenario_label: ScenarioLabel
    city: str
    state: str
    business_vintage_months: int
    employee_count: int
    requested_credit_amount: int
    financials: FinancialSnapshotSchema
    documents: DocumentStatusSchema
    latest_score_id: str | None = None
    latest_prospect_signal_id: str | None = None


class MSMEListItem(BaseModel):
    id: str
    business_name: str
    segment: Segment
    scenario_label: ScenarioLabel
    city: str
    state: str
    requested_credit_amount: int
    monthly_revenue_avg: int
    health_score: int | None = None
    risk_tier: str | None = None
    prospect_score: int | None = None
    prospect_priority: str | None = None
    data_confidence: int | None = None
    recommended_human_action: str | None = None


class MSMEListResponse(BaseModel):
    items: list[MSMEListItem]
    pagination: Pagination


class SeedRequest(BaseModel):
    reset: bool = True
    seed: int = 42
    profile_count: int = Field(default=9, ge=8, le=50)


class SeedResponse(BaseModel):
    seeded: bool
    profile_count: int
    scenario_counts: dict[str, int]
    audit_event_id: str
    generated_at: datetime
