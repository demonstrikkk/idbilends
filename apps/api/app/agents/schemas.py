from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field


PROMPT_VERSION = "credit_copilot_v1"


class CopilotConfidence(StrEnum):
    low = "low"
    medium = "medium"
    medium_high = "medium_high"
    high = "high"


class TraceStep(BaseModel):
    step_id: str
    step_name: str
    step_type: Literal["tool", "agent_node", "provider"]
    status: Literal["success", "failure", "skipped"]
    input_refs: list[str] = Field(default_factory=list)
    output_ref: str | None = None
    error_code: str | None = None
    notes: str | None = None
    duration_ms: int | None = None


class CopilotBriefRequest(BaseModel):
    mode: str | None = None
    include_trace: bool = True
    regenerate: bool = False


class CopilotBriefPayload(BaseModel):
    id: str
    msme_id: str
    answer_markdown: str = ""
    summary: str
    executive_summary: str
    data_quality_observations: str
    credit_analyst_explanation: str
    prospect_assist_recommendation: str
    risk_investigator_findings: str
    final_lending_brief: str
    confidence: CopilotConfidence
    assumptions: list[str]
    follow_up_questions: list[str]
    recommended_human_action: str
    decision_support_only: Literal[True] = True
    cited_internal_inputs: list[str]
    trace: list[TraceStep]
    provider: str
    model: str
    prompt_version: str = PROMPT_VERSION
    created_at: datetime


class CopilotContext(BaseModel):
    msme_id: str
    profile: dict
    score: dict
    risk_factors: dict
    missing_documents: list[str]
    transaction_summary: dict
    prospect_signals: dict
    cited_internal_inputs: list[str]


class NodeOutput(BaseModel):
    summary: str
    confidence: CopilotConfidence
    assumptions: list[str] = Field(default_factory=list)
    recommended_human_action: str
    cited_internal_inputs: list[str] = Field(default_factory=list)


class CopilotStreamEvent(BaseModel):
    event: Literal["status", "node_update", "token", "final", "error"]
    data: dict


class CopilotProviderStatus(BaseModel):
    configured_provider: str
    groq_configured: bool
    user_facing_ai_enabled: bool
    available_user_modes: list[str]
    stream_model: str
    structured_model: str
    active_provider: str
    message: str | None = None
