from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.schemas.monitoring import (
    ManualMonitoringEventRequest,
    MonitoringBoardResponse,
    MonitoringEventsResponse,
    MonitoringEventResult,
    MonitoringStatusResponse,
)
from app.services.monitoring_event_service import create_manual_event, get_monitoring_board, list_events, manager, start_monitoring, status, stop_monitoring
from app.services.synthetic_data_service import ensure_seeded

router = APIRouter(prefix="/monitoring", tags=["monitoring"])
ws_router = APIRouter(tags=["monitoring-ws"])


@router.post("/start", response_model=MonitoringStatusResponse)
async def start() -> MonitoringStatusResponse:
    return await start_monitoring()


@router.post("/stop", response_model=MonitoringStatusResponse)
async def stop() -> MonitoringStatusResponse:
    return await stop_monitoring()


@router.get("/status", response_model=MonitoringStatusResponse)
def monitoring_status() -> MonitoringStatusResponse:
    ensure_seeded()
    return status()


@router.get("/events", response_model=MonitoringEventsResponse)
def monitoring_events(limit: int = Query(default=100, ge=1, le=100)) -> MonitoringEventsResponse:
    ensure_seeded()
    return list_events(limit=limit)


@router.post("/events/manual", response_model=MonitoringEventResult)
async def manual_event(payload: ManualMonitoringEventRequest) -> MonitoringEventResult:
    return await create_manual_event(payload)


@router.get("/live-cases", response_model=MonitoringBoardResponse)
def monitoring_live_cases() -> MonitoringBoardResponse:
    ensure_seeded()
    return get_monitoring_board()


@ws_router.websocket("/ws/monitoring")
async def monitoring_websocket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json({"event": "connected", "data": status().model_dump(mode="json")})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
