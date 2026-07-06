from uuid import uuid4

from app.db.repository import store
from app.schemas.audit import AuditEventSchema
from app.schemas.common import utc_now


def create_audit_event(event_type: str, msme_id: str | None, metadata: dict, request_id: str | None = None, actor: str = "system") -> AuditEventSchema:
    event = AuditEventSchema(
        id=f"audit_{uuid4().hex[:10]}",
        msme_id=msme_id,
        event_type=event_type,
        actor=actor,
        request_id=request_id,
        metadata=metadata,
        created_at=utc_now(),
    )
    store.add_audit_event(event)
    return event


def list_audit_events(msme_id: str, event_type: str | None = None, limit: int = 50, offset: int = 0) -> tuple[list[AuditEventSchema], int]:
    events = sorted(store.list_audit_events(msme_id, event_type), key=lambda item: item.created_at, reverse=True)
    return events[offset : offset + limit], len(events)
