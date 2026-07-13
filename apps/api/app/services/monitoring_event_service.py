import asyncio
from random import Random
from uuid import uuid4

from fastapi import HTTPException, WebSocket

from app.db.repository import store
from app.schemas.common import DocumentAvailability, utc_now
from app.schemas.monitoring import (
    ManualMonitoringEventRequest,
    MonitoringBoardResponse,
    MonitoringEvent,
    MonitoringEventResult,
    MonitoringEventsResponse,
    MonitoringEventType,
    MonitoringStatusResponse,
)
from app.services.audit_service import create_audit_event
from app.services.scoring_service import generate_score
from app.services.score_history_service import get_score_movements
from app.services.synthetic_data_service import ensure_seeded


class MonitoringConnectionManager:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, event: str, data: dict) -> None:
        disconnected: list[WebSocket] = []
        for websocket in self.connections:
            try:
                await websocket.send_json({"event": event, "data": data})
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            self.disconnect(websocket)


manager = MonitoringConnectionManager()
_running = False
_task: asyncio.Task | None = None
_rng = Random(360)
_session_id: str | None = None
_last_started_at = None


async def start_monitoring() -> MonitoringStatusResponse:
    global _running, _task, _session_id, _last_started_at
    ensure_seeded()
    if not _running:
        _running = True
        _session_id = f"mon_{uuid4().hex[:10]}"
        _last_started_at = utc_now()
        _task = asyncio.create_task(_event_loop())
        await manager.broadcast("monitoring_started", status().model_dump(mode="json"))
    return status()


async def stop_monitoring() -> MonitoringStatusResponse:
    global _running, _task
    _running = False
    if _task:
        _task.cancel()
        _task = None
    current = status()
    await manager.broadcast("monitoring_stopped", current.model_dump(mode="json"))
    return current


def status() -> MonitoringStatusResponse:
    events = [event for event in store.list_monitoring_events() if isinstance(event, MonitoringEvent)]
    last = max((event.created_at for event in events), default=None)
    return MonitoringStatusResponse(
        running=_running,
        is_running=_running,
        session_id=_session_id,
        last_started_at=_last_started_at,
        event_count=len(events),
        last_event_at=last,
        active_connections=len(manager.connections),
    )


def list_events(limit: int = 100) -> MonitoringEventsResponse:
    events = [event for event in store.list_monitoring_events() if isinstance(event, MonitoringEvent)]
    events.sort(key=lambda item: item.created_at, reverse=True)
    return MonitoringEventsResponse(items=events[:limit])


async def create_manual_event(payload: ManualMonitoringEventRequest) -> MonitoringEventResult:
    ensure_seeded()
    msme_id = payload.msme_id or _rng.choice(store.list_profiles()).id
    return await apply_monitoring_event(msme_id, payload.event_type)


async def apply_monitoring_event(msme_id: str, event_type: MonitoringEventType) -> MonitoringEventResult:
    profile = store.get_profile(msme_id)
    if profile is None:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})
    financials = profile.financials.model_copy()
    documents = profile.documents.model_copy()
    changes: dict[str, str | int | float | None] = {}
    severity = "medium"
    if event_type == MonitoringEventType.bank_balance_drop:
        changes["average_bank_balance"] = max(0, int(financials.average_bank_balance * 0.78))
        financials.average_bank_balance = int(changes["average_bank_balance"])
        severity = "high"
    elif event_type == MonitoringEventType.revenue_growth_change:
        changes["revenue_growth_6m"] = round(financials.revenue_growth_6m - 0.09, 2)
        financials.revenue_growth_6m = float(changes["revenue_growth_6m"])
    elif event_type == MonitoringEventType.gst_filing_delayed:
        changes["gst_filing_regularity"] = max(0, round(financials.gst_filing_regularity - 0.16, 2))
        financials.gst_filing_regularity = float(changes["gst_filing_regularity"])
        documents.gst_returns = DocumentAvailability.partial
    elif event_type == MonitoringEventType.bank_statement_received:
        documents.bank_statement = DocumentAvailability.available
        documents.missing_documents = [item for item in documents.missing_documents if item != "bank_statement"]
        changes["bank_statement"] = "available"
        severity = "low"
    elif event_type == MonitoringEventType.itr_received:
        documents.itr = DocumentAvailability.available
        documents.missing_documents = [item for item in documents.missing_documents if item != "itr"]
        changes["itr"] = "available"
        severity = "low"
    elif event_type == MonitoringEventType.bureau_report_received:
        documents.bureau_report = DocumentAvailability.available
        documents.missing_documents = [item for item in documents.missing_documents if item != "bureau_report"]
        changes["bureau_report"] = "available"
        severity = "low"
    elif event_type == MonitoringEventType.invoice_delay_increased:
        financials.invoice_delay_avg_days += 12
        changes["invoice_delay_avg_days"] = financials.invoice_delay_avg_days
    elif event_type == MonitoringEventType.buyer_concentration_increased:
        financials.buyer_concentration = min(0.95, round(financials.buyer_concentration + 0.12, 2))
        changes["buyer_concentration"] = financials.buyer_concentration
    elif event_type == MonitoringEventType.bounce_event_recorded:
        financials.bounce_count_3m += 1
        financials.bounce_count_6m += 1
        changes["bounce_count_6m"] = financials.bounce_count_6m
        severity = "high"
    elif event_type == MonitoringEventType.emi_burden_increased:
        financials.emi_obligation = int(financials.emi_obligation * 1.18)
        changes["emi_obligation"] = financials.emi_obligation
    elif event_type == MonitoringEventType.gem_order_completed:
        financials.gem_order_completion_rate = min(0.99, round((financials.gem_order_completion_rate or 0.82) + 0.05, 2))
        changes["gem_order_completion_rate"] = financials.gem_order_completion_rate
        severity = "low"
    elif event_type == MonitoringEventType.suspicious_revenue_spike:
        financials.revenue_growth_6m = max(financials.revenue_growth_6m, 0.82)
        financials.revenue_spike_ratio = max(financials.revenue_spike_ratio or 1.0, 2.05)
        changes["revenue_spike_ratio"] = financials.revenue_spike_ratio
        severity = "high"
    elif event_type in {MonitoringEventType.sector_stress_changed, MonitoringEventType.market_overlay_changed}:
        profile = profile.model_copy(update={"monitoring_status": "sector_stress"})
        changes["monitoring_status"] = "sector_stress"
    updated = profile.model_copy(update={"financials": financials, "documents": documents, "last_updated": utc_now(), "monitoring_status": "attention" if severity == "high" else profile.monitoring_status})
    store.upsert_profile(updated)
    changes_str = "; ".join(f"{k}: {v}" for k, v in changes.items()) if changes else "no numeric changes"
    event = MonitoringEvent(id=f"evt_{uuid4().hex[:10]}", msme_id=msme_id, event_type=event_type, label=f"{event_type.value.replace('_', ' ').title()} ({changes_str})", severity=severity, feature_changes=changes, created_at=utc_now())
    store.add_monitoring_event(event)
    score = generate_score(msme_id, persist=True, include_trace=True, event_id=event.id)
    history = store.latest_score_history(msme_id)
    create_audit_event("monitoring_event_applied", msme_id, {"event_id": event.id, "event_type": event_type.value, "score_id": score.id, "score_delta": history.delta if history else 0, "success": True})
    await manager.broadcast("feature_event", event.model_dump(mode="json"))
    await manager.broadcast("score_recomputed", {"msme_id": msme_id, "score_id": score.id, "score": score.score, "risk_tier": score.risk_tier.value})
    if history:
        await manager.broadcast("score_delta", history.model_dump(mode="json"))
        if abs(history.delta) >= 5:
            await manager.broadcast("alert_created", {"msme_id": msme_id, "event_id": event.id, "delta": history.delta, "severity": severity})
    return MonitoringEventResult(event=event, score_history=history)


def get_monitoring_board() -> MonitoringBoardResponse:
    movements = get_score_movements(min_delta=0, limit=100).items
    deteriorating = sorted([item for item in movements if item.delta < 0], key=lambda item: item.delta)[:10]
    improving = sorted([item for item in movements if item.delta > 0], key=lambda item: item.delta, reverse=True)[:10]
    profiles = store.list_profiles()
    missingness = {
        "bank_statement": sum(1 for profile in profiles if profile.documents.bank_statement != DocumentAvailability.available),
        "gst_returns": sum(1 for profile in profiles if profile.documents.gst_returns != DocumentAvailability.available),
        "bureau_report": sum(1 for profile in profiles if profile.documents.bureau_report != DocumentAvailability.available),
        "itr": sum(1 for profile in profiles if profile.documents.itr != DocumentAvailability.available),
    }
    drift = {
        "score_distribution_shift": sum(1 for item in movements if abs(item.delta) >= 5),
        "alert_volume_change": sum(1 for item in movements if item.delta <= -5),
        "confidence_distribution_change": sum(1 for profile in profiles if (store.latest_score(profile.id) and store.latest_score(profile.id).data_confidence < 70)),
        "stale_evidence_count": sum(len(profile.documents.stale_documents) for profile in profiles),
    }
    return MonitoringBoardResponse(status=status(), score_movements=movements, top_deteriorating=deteriorating, top_improving=improving, feature_missingness_summary=missingness, drift_indicators=drift)


async def _event_loop() -> None:
    event_types = list(MonitoringEventType)
    while _running:
        await asyncio.sleep(2)
        profiles = store.list_profiles()
        if not profiles:
            continue
        await apply_monitoring_event(_rng.choice(profiles).id, _rng.choice(event_types))
