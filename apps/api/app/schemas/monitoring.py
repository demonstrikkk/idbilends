from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel

from app.schemas.score import ScoreHistoryEntry, ScoreMovementItem


class MonitoringEventType(StrEnum):
    bank_balance_drop = "bank_balance_drop"
    revenue_growth_change = "revenue_growth_change"
    gst_filing_delayed = "gst_filing_delayed"
    bank_statement_received = "bank_statement_received"
    itr_received = "itr_received"
    bureau_report_received = "bureau_report_received"
    invoice_delay_increased = "invoice_delay_increased"
    buyer_concentration_increased = "buyer_concentration_increased"
    bounce_event_recorded = "bounce_event_recorded"
    emi_burden_increased = "emi_burden_increased"
    gem_order_completed = "gem_order_completed"
    suspicious_revenue_spike = "suspicious_revenue_spike"
    sector_stress_changed = "sector_stress_changed"
    market_overlay_changed = "market_overlay_changed"


class MonitoringEvent(BaseModel):
    id: str
    msme_id: str
    event_type: MonitoringEventType
    label: str
    severity: str
    feature_changes: dict[str, str | int | float | None]
    created_at: datetime


class MonitoringStatusResponse(BaseModel):
    running: bool
    event_count: int
    last_event_at: datetime | None = None
    session_id: str | None = None
    is_running: bool
    last_started_at: datetime | None = None
    active_connections: int = 0


class MonitoringEventsResponse(BaseModel):
    items: list[MonitoringEvent]


class ManualMonitoringEventRequest(BaseModel):
    msme_id: str | None = None
    event_type: MonitoringEventType


class MonitoringEventResult(BaseModel):
    event: MonitoringEvent
    score_history: ScoreHistoryEntry


class MonitoringBoardResponse(BaseModel):
    status: MonitoringStatusResponse
    score_movements: list[ScoreMovementItem]
    top_deteriorating: list[ScoreMovementItem]
    top_improving: list[ScoreMovementItem]
    feature_missingness_summary: dict[str, int]
    drift_indicators: dict[str, int]
