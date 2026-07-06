from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MSMEProfile(Base):
    __tablename__ = "msme_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    business_name: Mapped[str] = mapped_column(String(160), nullable=False)
    segment: Mapped[str] = mapped_column(String(60), index=True, nullable=False)
    scenario_label: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    state: Mapped[str] = mapped_column(String(80), nullable=False)
    business_vintage_months: Mapped[int] = mapped_column(Integer, nullable=False)
    employee_count: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_credit_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    existing_bank_relationship_months: Mapped[int | None] = mapped_column(Integer)
    synthetic_external_ref: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    financial_snapshots: Mapped[list["FinancialSnapshot"]] = relationship(back_populates="msme")
    document_statuses: Mapped[list["DocumentStatus"]] = relationship(back_populates="msme")


class FinancialSnapshot(Base):
    __tablename__ = "financial_snapshots"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    msme_id: Mapped[str] = mapped_column(ForeignKey("msme_profiles.id"), index=True, nullable=False)
    snapshot_month: Mapped[str] = mapped_column(String(7), nullable=False)
    monthly_revenue_avg: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_expense_avg: Mapped[int] = mapped_column(Integer, nullable=False)
    average_bank_balance: Mapped[int] = mapped_column(Integer, nullable=False)
    cash_inflow_volatility: Mapped[float] = mapped_column(Float, nullable=False)
    revenue_growth_3m: Mapped[float] = mapped_column(Float, nullable=False)
    revenue_growth_6m: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    emi_obligation: Mapped[int] = mapped_column(Integer, nullable=False)
    existing_debt: Mapped[int] = mapped_column(Integer, nullable=False)
    bounce_count_3m: Mapped[int] = mapped_column(Integer, nullable=False)
    bounce_count_6m: Mapped[int] = mapped_column(Integer, nullable=False)
    gst_filing_regularity: Mapped[float] = mapped_column(Float, nullable=False)
    buyer_concentration: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    digital_payment_ratio: Mapped[float] = mapped_column(Float, nullable=False)
    gem_order_completion_rate: Mapped[float | None] = mapped_column(Float)
    invoice_delay_avg_days: Mapped[int] = mapped_column(Integer, nullable=False)
    cash_deposit_ratio: Mapped[float | None] = mapped_column(Float)
    revenue_spike_ratio: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    msme: Mapped[MSMEProfile] = relationship(back_populates="financial_snapshots")


class DocumentStatus(Base):
    __tablename__ = "document_statuses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    msme_id: Mapped[str] = mapped_column(ForeignKey("msme_profiles.id"), index=True, nullable=False)
    bank_statement_status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    gst_returns_status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    udyam_status: Mapped[str] = mapped_column(String(40), nullable=False)
    bureau_report_status: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    itr_status: Mapped[str] = mapped_column(String(40), nullable=False)
    gem_profile_status: Mapped[str] = mapped_column(String(40), nullable=False)
    latest_data_month: Mapped[str] = mapped_column(String(7), nullable=False)
    missing_documents: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    stale_documents: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    msme: Mapped[MSMEProfile] = relationship(back_populates="document_statuses")


class ScoreOutput(Base):
    __tablename__ = "score_outputs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    msme_id: Mapped[str] = mapped_column(ForeignKey("msme_profiles.id"), index=True, nullable=False)
    score: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    risk_tier: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    data_confidence: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    suggested_credit_min: Mapped[int] = mapped_column(Integer, nullable=False)
    suggested_credit_max: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_credit_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    recommendation: Mapped[str] = mapped_column(String(80), nullable=False)
    recommended_human_action: Mapped[str] = mapped_column(Text, nullable=False)
    decision_support_only: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    positive_factors: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    negative_factors: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    missing_data_warnings: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    early_warning_triggers: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    calculation_trace: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    rule_version: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)


class ProspectSignalOutput(Base):
    __tablename__ = "prospect_signal_outputs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    msme_id: Mapped[str] = mapped_column(ForeignKey("msme_profiles.id"), index=True, nullable=False)
    prospect_score: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    priority: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    likely_credit_need: Mapped[str] = mapped_column(String(80), nullable=False)
    best_product_fit: Mapped[str] = mapped_column(String(80), nullable=False)
    next_best_action: Mapped[str] = mapped_column(Text, nullable=False)
    outreach_timing: Mapped[str] = mapped_column(String(80), nullable=False)
    signals: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    msme_id: Mapped[str | None] = mapped_column(String, index=True)
    event_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    actor: Mapped[str] = mapped_column(String(80), nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(80))
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
