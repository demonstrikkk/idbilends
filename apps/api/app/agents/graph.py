from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import HTTPException

from app.agents.context_builder import CopilotContextBuilder
from app.agents.nodes import _run_node_safe, credit_analyst_node, data_quality_node, lending_brief_node, prospect_assist_node, risk_investigator_node
from app.agents.providers.base import BaseCopilotProvider, get_provider
from app.agents.safety import sanitize_brief_payload
from app.agents.schemas import CopilotBriefPayload, CopilotConfidence, CopilotStreamEvent, PROMPT_VERSION, TraceStep
from app.agents.state import CopilotState
from app.schemas.common import utc_now
from app.services.audit_service import create_audit_event


class CreditCopilotGraph:
    def __init__(self, provider: BaseCopilotProvider | None = None) -> None:
        self.provider = provider or get_provider()

    async def generate_brief(self, msme_id: str, request_id: str | None = None) -> CopilotBriefPayload:
        try:
            context = CopilotContextBuilder().build(msme_id)
            state: CopilotState = {
                "msme_id": msme_id,
                "context": context,
                "node_outputs": {},
                "trace": [
                    TraceStep(
                        step_id=f"trace_{uuid4().hex[:10]}",
                        step_name="build_sanitized_context",
                        step_type="tool",
                        status="success",
                        input_refs=[f"msme_id:{msme_id}"],
                        output_ref=f"copilot_context:{msme_id}",
                        notes="Loaded profile, score, risk, missing documents, transaction summary, and prospect signals.",
                    )
                ],
                "provider": self.provider.provider_name,
                "errors": [],
            }
            state = await self._run_nodes(state)
            brief = sanitize_brief_payload(state["final_brief"].model_copy(update={"trace": state["trace"]}))
            create_audit_event(
                "copilot_brief_generated",
                msme_id,
                {
                    "brief_id": brief.id,
                    "provider": brief.provider,
                    "model": brief.model,
                    "prompt_version": brief.prompt_version,
                    "trace_length": len(brief.trace),
                    "streaming_enabled": False,
                    "success": True,
                },
                request_id=request_id,
            )
            return brief
        except HTTPException as exc:
            create_audit_event(
                "copilot_brief_failed",
                msme_id,
                {"provider": getattr(self.provider, "provider_name", "unknown"), "success": False, "error": exc.detail},
                request_id=request_id,
            )
            raise
        except Exception as exc:
            create_audit_event(
                "copilot_brief_failed",
                msme_id,
                {"provider": getattr(self.provider, "provider_name", "unknown"), "success": False, "error": "COPILOT_INTERNAL_ERROR"},
                request_id=request_id,
            )
            raise HTTPException(status_code=500, detail={"code": "INTERNAL_ERROR", "message": "Credit Copilot failed safely."}) from exc

    async def stream_brief(self, msme_id: str, request_id: str | None = None) -> AsyncIterator[CopilotStreamEvent]:
        try:
            create_audit_event(
                "copilot_stream_started",
                msme_id,
                {"provider": self.provider.provider_name, "model": self.provider.model_name, "streaming_enabled": True, "success": True},
                request_id=request_id,
            )
            context = CopilotContextBuilder().build(msme_id)
            state: CopilotState = {
                "msme_id": msme_id,
                "context": context,
                "node_outputs": {},
                "trace": [
                    TraceStep(
                        step_id=f"trace_{uuid4().hex[:10]}",
                        step_name="build_sanitized_context",
                        step_type="tool",
                        status="success",
                        input_refs=[f"msme_id:{msme_id}"],
                        output_ref=f"copilot_context:{msme_id}",
                        notes="Loaded sanitized context for streaming.",
                    )
                ],
                "provider": self.provider.provider_name,
                "errors": [],
            }
            yield CopilotStreamEvent(event="status", data={"message": "Loaded deterministic score output"})
            for name, node_fn in [
                ("data_quality_node", data_quality_node),
                ("credit_analyst_node", credit_analyst_node),
                ("prospect_assist_node", prospect_assist_node),
                ("risk_investigator_node", risk_investigator_node),
            ]:
                state = _run_node_safe(state, name, node_fn)
                node_status = "failure" if any(f"{name}:" in e for e in state.get("errors", [])) else "success"
                yield CopilotStreamEvent(event="node_update", data={"node": name, "status": node_status})
            accumulated = ""
            streaming_ok = True
            async for token in self.provider.stream_brief(context):
                accumulated += token
                yield CopilotStreamEvent(event="token", data={"markdown": token})
            _error_hints = ("groq api", "rate limit", "unavailable", "credit copilot streaming is not available")
            if not accumulated or any(hint in accumulated.lower() for hint in _error_hints):
                streaming_ok = False
            if streaming_ok:
                # Assemble brief from deterministic node outputs + streaming markdown.
                # No second GROQ call required — avoids exhausting the rate limit.
                node_outputs = state.get("node_outputs", {})
                dq = node_outputs.get("data_quality_node", {})
                ca = node_outputs.get("credit_analyst_node", {})
                pa = node_outputs.get("prospect_assist_node", {})
                ri = node_outputs.get("risk_investigator_node", {})
                assumptions = list(dict.fromkeys(dq.get("assumptions", []) + ca.get("assumptions", []) + pa.get("assumptions", []) + ri.get("assumptions", [])))
                brief = CopilotBriefPayload(
                    id=f"brief_{uuid4().hex[:10]}",
                    msme_id=msme_id,
                    answer_markdown=accumulated,
                    summary=(ca.get("summary", "") or pa.get("summary", "")),
                    executive_summary=accumulated[:500] if accumulated else "",
                    data_quality_observations=dq.get("summary", ""),
                    credit_analyst_explanation=ca.get("summary", ""),
                    prospect_assist_recommendation=pa.get("summary", ""),
                    risk_investigator_findings=ri.get("summary", ""),
                    final_lending_brief=accumulated,
                    confidence=CopilotConfidence.medium,
                    assumptions=assumptions,
                    follow_up_questions=[],
                    recommended_human_action=ca.get("recommended_human_action", "Review the case with a credit officer."),
                    decision_support_only=True,
                    cited_internal_inputs=context.cited_internal_inputs,
                    trace=state.get("trace", []),
                    provider=self.provider.provider_name,
                    model=self.provider.model_name,
                    prompt_version=PROMPT_VERSION,
                    created_at=utc_now(),
                )
                brief = sanitize_brief_payload(brief)
            else:
                # Streaming failed — try the structured brief as a fallback
                state = await lending_brief_node(state, self.provider)
                if "final_brief" not in state:
                    _errors = state.get("errors", [])
                    _detail = _errors[-1] if _errors else "Unknown error in lending brief node. Check GROQ_MODEL_STRUCTURED — it must be a valid GROQ model (e.g. llama-3.3-70b-versatile)."
                    yield CopilotStreamEvent(event="error", data={"message": _detail, "provider": self.provider.provider_name, "partial_markdown": accumulated})
                    return
                brief = sanitize_brief_payload(state["final_brief"].model_copy(update={"trace": state["trace"]}))
                if not brief.answer_markdown and accumulated:
                    brief = brief.model_copy(update={"answer_markdown": accumulated})
            create_audit_event(
                "copilot_stream_completed",
                msme_id,
                {
                    "brief_id": brief.id,
                    "provider": brief.provider,
                    "model": brief.model,
                    "prompt_version": brief.prompt_version,
                    "trace_length": len(brief.trace),
                    "streaming_enabled": True,
                    "success": True,
                },
                request_id=request_id,
            )
            yield CopilotStreamEvent(event="final", data=brief.model_dump(mode="json"))
        except Exception as exc:
            create_audit_event(
                "copilot_stream_failed",
                msme_id,
                {"provider": getattr(self.provider, "provider_name", "unknown"), "streaming_enabled": True, "success": False},
                request_id=request_id,
            )
            message = "Credit Copilot provider unavailable. Deterministic score remains available."
            if isinstance(exc, HTTPException) and isinstance(exc.detail, dict):
                message = str(exc.detail.get("message", message))
            yield CopilotStreamEvent(event="error", data={"message": message, "provider": self.provider.provider_name})

    async def _run_nodes(self, state: CopilotState) -> CopilotState:
        node_seq = [
            ("data_quality_node", data_quality_node),
            ("credit_analyst_node", credit_analyst_node),
            ("prospect_assist_node", prospect_assist_node),
            ("risk_investigator_node", risk_investigator_node),
        ]
        try:
            from langgraph.graph import END, StateGraph

            async def final_node(inner_state: CopilotState) -> CopilotState:
                return await lending_brief_node(inner_state, self.provider)

            graph = StateGraph(CopilotState)
            graph.add_node("data_quality_node", data_quality_node)
            graph.add_node("credit_analyst_node", credit_analyst_node)
            graph.add_node("prospect_assist_node", prospect_assist_node)
            graph.add_node("risk_investigator_node", risk_investigator_node)
            graph.add_node("lending_brief_node", final_node)
            graph.set_entry_point("data_quality_node")
            graph.add_edge("data_quality_node", "credit_analyst_node")
            graph.add_edge("credit_analyst_node", "prospect_assist_node")
            graph.add_edge("prospect_assist_node", "risk_investigator_node")
            graph.add_edge("risk_investigator_node", "lending_brief_node")
            graph.add_edge("lending_brief_node", END)
            return await graph.compile().ainvoke(state)
        except ImportError:
            pass

        for name, node_fn in node_seq:
            state = _run_node_safe(state, name, node_fn)
        return await lending_brief_node(state, self.provider)
