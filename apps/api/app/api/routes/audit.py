from fastapi import APIRouter, Query

from app.schemas.audit import AuditListResponse
from app.schemas.common import Pagination
from app.services.audit_service import list_audit_events
from app.services.msme_service import get_msme

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/{msme_id}", response_model=AuditListResponse)
def get_audit_events(msme_id: str, event_type: str | None = None, limit: int = Query(default=50, ge=1, le=100), offset: int = Query(default=0, ge=0)) -> AuditListResponse:
    get_msme(msme_id)
    items, total = list_audit_events(msme_id, event_type, limit, offset)
    return AuditListResponse(items=items, pagination=Pagination(total=total, limit=limit, offset=offset, has_more=offset + limit < total))
