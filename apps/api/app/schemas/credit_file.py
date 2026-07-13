from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel

from app.agents.schemas import TraceStep
from app.schemas.audit import AuditEventSchema
from app.schemas.msme import MSMEDetail
from app.schemas.portfolio import PortfolioCase
from app.schemas.prospect import ProspectSignalOutputSchema
from app.schemas.score import EarlyWarningTrigger, ScoreOutputSchema
from app.services.transaction_summary_service import TransactionSummary


class EvidenceStatusItem(BaseModel):
    source_type: str
    source_label: str
    status: str
    why_it_matters: str
    related_score_component: str
    action_label: str
    action_enabled: bool
    disabled_reason: str | None = None


class EvidenceExtractedSignal(BaseModel):
    field_name: str
    value: str
    source_mapping: str
    confidence: int


class EvidenceType(StrEnum):
    bank_statement = "bank_statement"
    gst_returns = "gst_returns"
    bureau_report = "bureau_report"
    itr = "itr"
    udyam = "udyam"
    uploaded_document = "uploaded_document"
    gem_profile = "gem_profile"
    identity_proof = "identity_proof"
    address_proof = "address_proof"
    other = "other"


class EvidenceRecord(BaseModel):
    id: str
    msme_id: str
    evidence_type: EvidenceType = EvidenceType.other
    title: str = ""
    source: str = ""
    source_type: str
    document_name: str
    status: Literal["available", "partial", "missing", "stale", "not_applicable"]
    content_type: str
    file_name: str
    file_size: int
    storage_path: str | None = None
    preview_text: str
    extracted_signals: list[EvidenceExtractedSignal]
    extraction_status: str = "pending"
    confidence_impact: str = "medium"
    risk_impact: str = "medium"
    related_score_components: list[str]
    lending_question: str = ""
    source_mapping: list[str]
    uploaded_by: str
    reviewed_at: datetime | None = None
    audit_event_id: str | None = None
    created_at: datetime
    updated_at: datetime


class EvidenceUploadResponse(BaseModel):
    record: EvidenceRecord
    audit_event_id: str


class EvidenceStatusUpdate(BaseModel):
    status: Literal["available", "partial", "missing", "stale", "not_applicable"]


class EvidenceMapRow(BaseModel):
    source_type: str
    source_label: str
    source_status: str
    derived_signal: str
    score_component: str
    lending_question: str
    recommended_action: str
    confidence_impact: str
    risk_impact: str


class RecommendedHumanAction(BaseModel):
    label: str
    detail: str
    source: str


class AuditSummary(BaseModel):
    latest_events: list[AuditEventSchema]
    total_events: int


class CreditFileResponse(BaseModel):
    profile: MSMEDetail
    score: ScoreOutputSchema
    prospect: ProspectSignalOutputSchema
    evidence_status: list[EvidenceStatusItem]
    evidence_records: list[EvidenceRecord] = []
    missing_evidence: list[str]
    transaction_summary: TransactionSummary
    risk_warnings: list[EarlyWarningTrigger]
    suggested_credit_posture: str
    recommended_human_actions: list[RecommendedHumanAction]
    audit_summary: AuditSummary
    cited_source_ids: list[str]
    generated_at: datetime


class EvidenceMapResponse(BaseModel):
    msme_id: str
    rows: list[EvidenceMapRow]
    generated_at: datetime


class CaseInboxLane(BaseModel):
    lane: Literal["ready_for_review", "missing_evidence", "risk_attention", "high_potential", "low_confidence"]
    label: str
    cases: list[PortfolioCase]


class CaseInboxResponse(BaseModel):
    lanes: list[CaseInboxLane]
    generated_at: datetime


class CopilotChatRequest(BaseModel):
    message: str
    mode: str | None = None
    include_trace: bool = True


class CopilotChatResponse(BaseModel):
    answer_markdown: str
    decision_support_only: Literal[True] = True
    cited_internal_inputs: list[str]
    trace: list[TraceStep]
    provider: str
    model: str
    prompt_version: str = ""
    summary: str = ""
    recommended_human_action: str = ""
    assumptions: list[str] = []
    follow_up_questions: list[str] = []
    created_at: datetime
