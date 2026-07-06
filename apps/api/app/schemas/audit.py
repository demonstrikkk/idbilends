from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import Pagination


class AuditEventSchema(BaseModel):
    id: str
    msme_id: str | None
    event_type: str
    actor: str
    request_id: str | None
    created_at: datetime
    metadata: dict


class AuditListResponse(BaseModel):
    items: list[AuditEventSchema]
    pagination: Pagination
