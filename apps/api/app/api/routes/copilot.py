from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.agents.graph import CreditCopilotGraph
from app.agents.providers.base import get_provider
from app.agents.schemas import CopilotBriefPayload, CopilotBriefRequest, CopilotProviderStatus, CopilotStreamEvent, PROMPT_VERSION
from app.agents.streaming import format_sse
from app.core.config import get_settings
from app.schemas.common import utc_now
from app.schemas.credit_file import CopilotChatRequest, CopilotChatResponse
from app.services.audit_service import create_audit_event

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/provider/status", response_model=CopilotProviderStatus)
def get_copilot_provider_status() -> CopilotProviderStatus:
    settings = get_settings()
    configured = (settings.ai_provider or "mock").lower()
    groq_configured = bool(settings.groq_api_key)
    active = configured
    message: str | None = None
    if configured == "groq" and not groq_configured:
        active = "groq_unavailable"
        message = "Groq provider unavailable. Deterministic score remains available."
    elif configured not in {"mock", "groq", "disabled"}:
        active = "invalid_provider"
        message = f"Unsupported Credit Copilot provider mode '{configured}'."
    return CopilotProviderStatus(
        configured_provider=configured,
        groq_configured=groq_configured,
        streaming_enabled=settings.copilot_streaming_enabled,
        stream_model=settings.groq_model_stream,
        structured_model=settings.groq_model_structured,
        active_default_provider=active,
        message=message,
    )


@router.post("/{msme_id}/brief", response_model=CopilotBriefPayload)
async def generate_copilot_brief(msme_id: str, payload: CopilotBriefRequest, request: Request) -> CopilotBriefPayload:
    try:
        provider = get_provider(payload.mode)
    except HTTPException as exc:
        create_audit_event(
            "copilot_brief_failed",
            msme_id,
            {"provider": payload.mode or "configured", "prompt_version": PROMPT_VERSION, "success": False, "error": exc.detail},
            request_id=request.state.request_id,
        )
        raise
    graph = CreditCopilotGraph(provider)
    brief = await graph.generate_brief(msme_id, request_id=request.state.request_id)
    if not payload.include_trace:
        return brief.model_copy(update={"trace": []})
    return brief


@router.post("/{msme_id}/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(msme_id: str, payload: CopilotChatRequest, request: Request) -> CopilotChatResponse:
    try:
        provider = get_provider(payload.mode)
    except HTTPException as exc:
        create_audit_event(
            "copilot_chat_failed",
            msme_id,
            {"provider": payload.mode or "configured", "prompt_version": PROMPT_VERSION, "success": False, "error": exc.detail},
            request_id=request.state.request_id,
        )
        raise
    graph = CreditCopilotGraph(provider)
    brief = await graph.generate_brief(msme_id, request_id=request.state.request_id)
    question = payload.message.strip()
    answer = _chat_answer(question, brief)
    create_audit_event(
        "copilot_chat_generated",
        msme_id,
        {
            "provider": brief.provider,
            "model": brief.model,
            "prompt_version": brief.prompt_version,
            "success": True,
        },
        request_id=request.state.request_id,
    )
    return CopilotChatResponse(
        answer=answer,
        decision_support_only=True,
        cited_internal_inputs=brief.cited_internal_inputs,
        trace=brief.trace if payload.include_trace else [],
        provider=brief.provider,
        model=brief.model,
        created_at=utc_now(),
    )


@router.get("/{msme_id}/brief/stream")
async def stream_copilot_brief_get(msme_id: str, request: Request, mode: str | None = None) -> StreamingResponse:
    return _stream_response(msme_id, request, mode)


@router.post("/{msme_id}/brief/stream")
async def stream_copilot_brief_post(msme_id: str, payload: CopilotBriefRequest, request: Request) -> StreamingResponse:
    return _stream_response(msme_id, request, payload.mode)


def _stream_response(msme_id: str, request: Request, mode: str | None) -> StreamingResponse:
    settings = get_settings()

    async def event_generator() -> AsyncIterator[str]:
        if not settings.copilot_streaming_enabled:
            yield format_sse(
                CopilotStreamEvent(
                    event="error",
                    data={"message": "Credit Copilot streaming is disabled. Use the non-streaming brief endpoint."},
                )
            )
            return
        try:
            provider = get_provider(mode)
            graph = CreditCopilotGraph(provider)
            async for event in graph.stream_brief(msme_id, request_id=request.state.request_id):
                yield format_sse(event)
        except HTTPException as exc:
            create_audit_event(
                "copilot_stream_failed",
                msme_id,
                {"provider": mode or "configured", "prompt_version": PROMPT_VERSION, "streaming_enabled": True, "success": False, "error": exc.detail},
                request_id=request.state.request_id,
            )
            message = exc.detail.get("message", "Credit Copilot provider unavailable. Deterministic score remains available.") if isinstance(exc.detail, dict) else "Credit Copilot provider unavailable. Deterministic score remains available."
            yield format_sse(CopilotStreamEvent(event="error", data={"message": message}))

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _chat_answer(question: str, brief: CopilotBriefPayload) -> str:
    lower = question.lower()
    if "rm" in lower or "follow" in lower or "note" in lower:
        focus = (
            "RM follow-up note: Please request the open evidence items, verify recent turnover and collection behavior, "
            "and confirm whether the requested working-capital need matches current order or receivable activity. "
            f"Use this context: {brief.prospect_assist_recommendation}"
        )
    elif "block" in lower or "missing" in lower or "evidence" in lower or "document" in lower:
        focus = f"Primary blocker and evidence request: {brief.data_quality_observations}"
    elif "confidence" in lower or "signal" in lower:
        focus = (
            f"Confidence driver: {brief.data_quality_observations} "
            "The confidence view should be read separately from the deterministic score; Copilot is only explaining the returned inputs."
        )
    elif "risk" in lower or "verify" in lower or "human review" in lower:
        focus = f"Pre-review verification: {brief.risk_investigator_findings}"
    elif "score" in lower or "branch manager" in lower:
        focus = (
            f"Branch-manager explanation: {brief.credit_analyst_explanation} "
            "The score, risk tier, and suggested range are deterministic outputs, not Copilot calculations."
        )
    else:
        focus = brief.summary
    return (
        f"{focus}\n\n"
        f"Assumptions: {'; '.join(brief.assumptions[:2])}\n\n"
        f"Recommended human action: {brief.recommended_human_action}\n\n"
        "Decision-support only: this Copilot answer explains internal score, prospect, risk, and evidence inputs for human review. It does not issue a final credit decision."
    )
