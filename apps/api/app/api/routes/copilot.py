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
from app.services.evidence_service import list_evidence_records
from app.services.portfolio_service import get_portfolio_cases
from app.services.score_history_service import get_latest_delta, get_score_movements

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.get("/provider/status", response_model=CopilotProviderStatus)
def get_copilot_provider_status() -> CopilotProviderStatus:
    settings = get_settings()
    configured = (settings.ai_provider or "").lower()
    groq_configured = bool(settings.groq_api_key)
    user_facing_ai_enabled = (configured == "groq" and groq_configured)
    available_user_modes: list[str] = []
    if user_facing_ai_enabled:
        available_user_modes.append("groq")
    if configured == "disabled" or not configured:
        available_user_modes.append("disabled")
    active_provider = configured if configured in {"groq", "disabled"} else ""
    message: str | None = None
    if configured == "groq" and not groq_configured:
        active_provider = "groq_unavailable"
        message = "Groq provider is not configured. Set GROQ_API_KEY to enable Credit Copilot."
    elif not configured:
        active_provider = "not_configured"
        message = "No AI provider is configured. Set AI_PROVIDER=groq and GROQ_API_KEY to enable Credit Copilot."
    return CopilotProviderStatus(
        configured_provider=configured if configured else "not_configured",
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
    question = payload.message.strip().lower()
    cited_inputs = ["portfolio_cases", "score_history", "score_movements", "deterministic_score_outputs"]
    if "dropped" in question or "drop" in question or "deteriorat" in question:
        movements = [item for item in get_score_movements(min_delta=1, limit=25).items if item.delta < 0]
        answer = f"Found {len(movements)} cases with score deterioration in the current monitoring history. Prioritize the largest negative deltas for human review and evidence checks."
        data = [item.model_dump(mode="json") for item in movements[:10]]
    elif "human action" in question or "need" in question or "risk" in question:
        cases = get_portfolio_cases(limit=25, sort="confidence_asc").items
        flagged = [case for case in cases if case.score.risk_tier.value in {"elevated", "high"} or case.score.data_confidence < 70]
        answer = f"Found {len(flagged)} current cases needing officer attention based on risk tier, low confidence, or missing evidence."
        data = [case.model_dump(mode="json") for case in flagged[:10]]
    elif "compare" in question:
        cases = get_portfolio_cases(limit=2, sort="prospect_score_desc").items
        answer = "Comparison uses existing deterministic score, Prospect Assist, confidence, and risk-tier outputs only."
        data = [case.model_dump(mode="json") for case in cases]
    else:
        summary = get_score_movements(min_delta=0, limit=10).items
        answer = "Portfolio Copilot summarized current monitoring movements from backend score history. It does not calculate scores or make final lending decisions."
        data = [item.model_dump(mode="json") for item in summary]
    create_audit_event("copilot_portfolio_chat_generated", None, {"success": True, "cited_inputs": cited_inputs}, request_id=request.state.request_id)
    return {
        "answer": answer,
        "confidence": "medium",
        "assumptions": ["Uses current in-memory synthetic demo records.", "Score values are deterministic backend outputs."],
        "recommended_human_action": "Review cited cases, verify evidence gaps, and route material changes through the bank officer workflow.",
        "cited_internal_inputs": cited_inputs,
        "decision_support_only": True,
        "data": data,
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
    graph = CreditCopilotGraph(provider)
    brief = await graph.generate_brief(msme_id, request_id=request.state.request_id)
    question = payload.message.strip()
    answer = _chat_answer(question, brief, msme_id)
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
        cited_internal_inputs=_chat_citations(msme_id, brief.cited_internal_inputs),
        trace=brief.trace if payload.include_trace else [],
        provider=brief.provider,
        model=brief.model,
        created_at=utc_now(),
    )


@router.post("/{msme_id}/explain-delta")
async def explain_delta(msme_id: str, request: Request) -> dict:
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


def _chat_answer(question: str, brief: CopilotBriefPayload, msme_id: str) -> str:
    lower = question.lower()
    evidence = list_evidence_records(msme_id)
    delta = get_latest_delta(msme_id)
    evidence_blockers = [record for record in evidence if record.status in {"missing", "partial", "stale"}]
    evidence_text = "; ".join(f"{record.id} ({record.document_name}: {record.status})" for record in evidence_blockers[:3]) or "No blocking evidence record is open in the seeded evidence set."
    delta_text = (
        f" Latest score delta {delta.id}: {delta.previous_score} -> {delta.new_score} ({delta.delta}); changed features: {', '.join(delta.changed_features) or 'not available'}."
        if delta
        else " No score delta is recorded yet; start monitoring or inject an event to create one."
    )
    if "rm" in lower or "follow" in lower or "note" in lower:
        focus = (
            "RM follow-up note: Please request the open evidence items, verify recent turnover and collection behavior, "
            "and confirm whether the requested working-capital need matches current order or receivable activity. "
            f"Open evidence: {evidence_text}. Use this context: {brief.prospect_assist_recommendation}"
        )
    elif "change" in lower or "delta" in lower or "score change" in lower:
        focus = f"Score change explanation:{delta_text} Cite the monitoring event and score history before routing the case."
    elif "block" in lower or "missing" in lower or "evidence" in lower or "document" in lower:
        focus = f"Primary blocker and evidence request: {brief.data_quality_observations} Cited evidence records: {evidence_text}."
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


def _chat_citations(msme_id: str, base_inputs: list[str]) -> list[str]:
    citations = list(dict.fromkeys(base_inputs))
    citations.extend(f"evidence:{record.id}" for record in list_evidence_records(msme_id)[:4])
    delta = get_latest_delta(msme_id)
    if delta:
        citations.extend([f"score_history:{delta.id}", f"score_delta_event:{delta.event_id or 'initial'}"])
    return list(dict.fromkeys(citations))
