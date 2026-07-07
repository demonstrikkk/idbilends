from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import HTTPException

from app.agents.context_builder import CopilotContextBuilder
from app.agents.nodes import credit_analyst_node, data_quality_node, lending_brief_node, prospect_assist_node, risk_investigator_node
from app.agents.providers.base import BaseCopilotProvider, get_provider
from app.agents.safety import sanitize_brief_payload
from app.agents.schemas import CopilotBriefPayload, CopilotStreamEvent, TraceStep
from app.agents.state import CopilotState
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
            for name, node in [
                ("data_quality_node", data_quality_node),
                ("credit_analyst_node", credit_analyst_node),
                ("prospect_assist_node", prospect_assist_node),
                ("risk_investigator_node", risk_investigator_node),
            ]:
                state = node(state)
                yield CopilotStreamEvent(event="node_update", data={"node": name, "status": "success"})
            async for token in self.provider.stream_brief(context):
                yield CopilotStreamEvent(event="token", data={"text": token})
            state = await lending_brief_node(state, self.provider)
            brief = sanitize_brief_payload(state["final_brief"].model_copy(update={"trace": state["trace"]}))
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
            yield CopilotStreamEvent(event="error", data={"message": message})

    async def _run_nodes(self, state: CopilotState) -> CopilotState:
        try:
            from langgraph.graph import END, StateGraph
        except ImportError:
            state = data_quality_node(state)
            state = credit_analyst_node(state)
            state = prospect_assist_node(state)
            state = risk_investigator_node(state)
            return await lending_brief_node(state, self.provider)

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
