from fastapi import APIRouter, Request

from app.schemas.prospect import ProspectSignalOutputSchema
from app.services.audit_service import create_audit_event
from app.services.prospect_service import generate_prospect_signals

router = APIRouter(prefix="/prospects", tags=["prospects"])


@router.get("/{msme_id}/signals", response_model=ProspectSignalOutputSchema)
def get_prospect_signals(msme_id: str, request: Request) -> ProspectSignalOutputSchema:
    prospect = generate_prospect_signals(msme_id, persist=True)
    create_audit_event("prospect_signals_generated", msme_id, {"prospect_signal_id": prospect.id, "success": True}, request_id=request.state.request_id)
    return prospect
