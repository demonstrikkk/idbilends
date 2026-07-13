from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.agents.context_builder import CopilotContextBuilder
from app.agents.graph import CreditCopilotGraph
from app.agents.providers.base import get_provider
from app.agents.schemas import CopilotBriefPayload, CopilotBriefRequest, CopilotProviderStatus, CopilotStreamEvent, PROMPT_VERSION
from app.agents.safety import sanitize_copilot_text
from app.agents.streaming import format_sse
from app.core.config import get_settings
from app.schemas.common import utc_now
from app.schemas.credit_file import CopilotChatRequest, CopilotChatResponse
from app.services.audit_service import create_audit_event
from app.services.evidence_service import list_evidence_records
from app.services.portfolio_service import get_portfolio_cases
from app.services.score_history_service import get_latest_delta, get_score_movements as get_portfolio_score_movements

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/provider/status", response_model=CopilotProviderStatus)
def get_copilot_provider_status() -> CopilotProviderStatus:
    settings = get_settings()
    groq_configured = bool(settings.groq_api_key)
    user_facing_ai_enabled = groq_configured
    available_user_modes: list[str] = []
    if groq_configured:
        available_user_modes.append("groq")
    active_provider = "groq" if groq_configured else "unavailable"
    message: str | None = None
    if not groq_configured:
        message = "Groq API key is not configured. Set GROQ_API_KEY to enable Credit Copilot."
    return CopilotProviderStatus(
        configured_provider="groq" if groq_configured else "unavailable",
        groq_configured=groq_configured,
        user_facing_ai_enabled=user_facing_ai_enabled,
        available_user_modes=available_user_modes,
        stream_model=settings.groq_model_stream,
        structured_model=settings.groq_model_structured,
        active_provider=active_provider,
        message=message,
    )


@router.post("/portfolio/chat")
async def portfolio_chat(payload: CopilotChatRequest, request: Request) -> dict:
    settings = get_settings()
    mode = payload.mode or settings.ai_provider or ""
    if not mode or mode == "":
        raise HTTPException(
            status_code=503,
            detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "No AI provider is configured. Set AI_PROVIDER=groq and GROQ_API_KEY to enable Credit Copilot."},
        )
    provider = get_provider(payload.mode)

    cases_data = [c.model_dump(mode="json") for c in get_portfolio_cases(limit=50, sort="prospect_score_desc").items]
    movements_data = get_portfolio_score_movements(limit=50)
    portfolio_data = {
        "cases": cases_data,
        "movements": movements_data if isinstance(movements_data, list) else [m.model_dump(mode="json") for m in movements_data.items] if hasattr(movements_data, "items") else [],
        "total_cases": len(cases_data),
    }
    cited_inputs = ["portfolio_cases", "score_history", "score_movements"]
    answer = await provider.portfolio_chat(payload.message.strip(), portfolio_data)
    create_audit_event("copilot_portfolio_chat_generated", None, {"success": True, "cited_inputs": cited_inputs}, request_id=request.state.request_id)
    return {
        "answer": answer,
        "confidence": "medium",
        "assumptions": ["Uses current in-memory synthetic demo records.", "Score values are deterministic backend outputs."],
        "recommended_human_action": "Review cited cases, verify evidence gaps, and route material changes through the bank officer workflow.",
        "cited_internal_inputs": cited_inputs,
        "decision_support_only": True,
        "data": {"cases": cases_data[:5], "movements_count": len(portfolio_data["movements"])},
        "created_at": utc_now(),
    }


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
    context = CopilotContextBuilder().build(msme_id)
    answer = await provider.chat(payload.message.strip(), context)
    answer = sanitize_copilot_text(answer)
    cited = _chat_citations(msme_id, context.cited_internal_inputs)
    create_audit_event(
        "copilot_chat_generated",
        msme_id,
        {
            "provider": provider.provider_name,
            "model": provider.model_name,
            "prompt_version": PROMPT_VERSION,
            "success": True,
        },
        request_id=request.state.request_id,
    )
    return CopilotChatResponse(
        answer_markdown=answer,
        decision_support_only=True,
        cited_internal_inputs=cited,
        trace=[],
        provider=provider.provider_name,
        model=provider.model_name,
        created_at=utc_now(),
    )


@router.post("/{msme_id}/explain-delta")
async def explain_delta(msme_id: str, request: Request) -> dict:
    from app.services.score_history_service import get_latest_delta

    entry = get_latest_delta(msme_id)
    if entry is None:
        raise HTTPException(status_code=404, detail={"code": "SCORE_DELTA_NOT_FOUND", "message": "No score history delta is available for this MSME."})
    reason = entry.reasons[0].detail if entry.reasons else "Score changed after deterministic recomputation."
    create_audit_event("copilot_delta_explained", msme_id, {"score_history_id": entry.id, "success": True}, request_id=request.state.request_id)
    return {
        "summary": f"Score moved from {entry.previous_score} to {entry.new_score}, a delta of {entry.delta}.",
        "confidence": "high",
        "assumptions": ["Explanation cites stored score history and deterministic trace fields only."],
        "recommended_human_action": "Review the changed features and request updated evidence where the movement is adverse or low-confidence.",
        "cited_internal_inputs": ["score_history", "score_delta", "changed_components", "changed_features"],
        "reason": reason,
        "entry": entry.model_dump(mode="json"),
        "decision_support_only": True,
    }


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


def _chat_citations(msme_id: str, base_inputs: list[str]) -> list[str]:
    citations = list(dict.fromkeys(base_inputs))
    citations.extend(f"evidence:{record.id}" for record in list_evidence_records(msme_id)[:4])
    delta = get_latest_delta(msme_id)
    if delta:
        citations.extend([f"score_history:{delta.id}", f"score_delta_event:{delta.event_id or 'initial'}"])
    return list(dict.fromkeys(citations))
