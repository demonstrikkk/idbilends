from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ProspectPriority


class ProspectSignal(BaseModel):
    code: str
    label: str
    direction: str
    confidence: float
    evidence: str


class ProspectSignalOutputSchema(BaseModel):
    id: str
    msme_id: str
    prospect_score: int
    priority: ProspectPriority
    likely_credit_need: str
    best_product_fit: str
    next_best_action: str
    outreach_timing: str
    signals: list[ProspectSignal]
    created_at: datetime
