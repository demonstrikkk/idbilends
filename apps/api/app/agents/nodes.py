import time
from uuid import uuid4

from app.agents.schemas import CopilotConfidence, NodeOutput, TraceStep
from app.agents.state import CopilotState
from app.agents.tools import execute_tool


def _trace(step_name: str, input_refs: list[str], notes: str, duration_ms: int | None = None, status: str = "success") -> TraceStep:
    return TraceStep(
        step_id=f"trace_{uuid4().hex[:10]}",
        step_name=step_name,
        step_type="agent_node",
        status=status,
        input_refs=input_refs,
        output_ref=f"node_output:{step_name}",
        notes=notes,
        duration_ms=duration_ms,
    )


def _confidence(data_confidence: int) -> CopilotConfidence:
    if data_confidence >= 85:
        return CopilotConfidence.high
    if data_confidence >= 75:
        return CopilotConfidence.medium_high
    if data_confidence >= 55:
        return CopilotConfidence.medium
    return CopilotConfidence.low


def _run_node_safe(state: CopilotState, name: str, fn, *args, **kwargs) -> CopilotState:
    t0 = time.perf_counter()
    try:
        result = fn(state, *args, **kwargs)
        elapsed = int((time.perf_counter() - t0) * 1000)
        trace = _trace(name, state["context"].cited_internal_inputs, f"Node '{name}' completed.", duration_ms=elapsed)
        return {
            **result,
            "trace": [*result.get("trace", []), trace],
        }
    except Exception as exc:
        elapsed = int((time.perf_counter() - t0) * 1000)
        error_code = type(exc).__name__
        trace = _trace(name, state["context"].cited_internal_inputs, f"Node '{name}' failed: {exc}", duration_ms=elapsed, status="failure")
        state.setdefault("errors", []).append(f"{name}: {error_code}: {exc}")
        return {
            **state,
            "node_outputs": {
                **state.get("node_outputs", {}),
                name: {
                    "summary": f"Node skipped due to error: {exc}",
                    "confidence": CopilotConfidence.low,
                    "assumptions": ["Node encountered an error and produced partial output."],
                    "recommended_human_action": "Review the error and retry the agent workflow.",
                    "cited_internal_inputs": state.get("context", {}).cited_internal_inputs if hasattr(state.get("context"), "cited_internal_inputs") else [],
                },
            },
            "trace": [*state.get("trace", []), trace],
        }


def data_quality_node(state: CopilotState) -> CopilotState:
    context = state["context"]
    score = context.score
    missing = execute_tool("get_missing_documents", context.msme_id) or score["missing_data_warnings"]
    summary = (
        f"Data confidence is {score['data_confidence']}%. "
        f"Verification items: {', '.join(missing) if missing else 'no major missing document returned'}."
    )
    output = NodeOutput(
        summary=summary,
        confidence=_confidence(score["data_confidence"]),
        assumptions=["Document and financial signals are synthetic/demo indicators."],
        recommended_human_action="Verify missing, partial, or stale documents before relying on this brief.",
        cited_internal_inputs=context.cited_internal_inputs,
    )
    return _with_output(state, "data_quality_node", output, "Called get_missing_documents and evaluated data confidence.")


def credit_analyst_node(state: CopilotState) -> CopilotState:
    context = state["context"]
    score = execute_tool("get_financial_health_score", context.msme_id)
    positives = score["positive_factors"]
    negatives = score["negative_factors"]
    summary = (
        f"Score {score['score']} maps to risk tier {score['risk_tier']}. "
        f"Suggested range {score['suggested_credit_min']} to {score['suggested_credit_max']} is owned by the score service. "
        f"Top strength: {positives[0]['label'] if positives else 'not returned'}. "
        f"Top concern: {negatives[0]['label'] if negatives else 'not returned'}."
    )
    output = NodeOutput(
        summary=summary,
        confidence=_confidence(score["data_confidence"]),
        assumptions=["Score, tier, reason codes, and range were not recalculated by Copilot."],
        recommended_human_action=score["recommended_human_action"],
        cited_internal_inputs=context.cited_internal_inputs,
    )
    return _with_output(state, "credit_analyst_node", output, "Called get_financial_health_score and explained deterministic score output without changing it.")


def prospect_assist_node(state: CopilotState) -> CopilotState:
    context = state["context"]
    prospect = execute_tool("get_prospect_signals", context.msme_id)
    summary = (
        f"Prospect priority is {prospect['priority']} with likely need {prospect['likely_credit_need']} "
        f"and product fit {prospect['best_product_fit']}. Next action: {prospect['next_best_action']}"
    )
    output = NodeOutput(
        summary=summary,
        confidence=CopilotConfidence.medium_high,
        assumptions=["Prospect signals are generated by the backend Prospect Assist service."],
        recommended_human_action=prospect["next_best_action"],
        cited_internal_inputs=context.cited_internal_inputs,
    )
    return _with_output(state, "prospect_assist_node", output, "Called get_prospect_signals and summarized backend Prospect Assist signals.")


def risk_investigator_node(state: CopilotState) -> CopilotState:
    context = state["context"]
    risk = execute_tool("get_risk_factors", context.msme_id)
    negative = risk["negative_factors"]
    early = risk["early_warning_triggers"]
    summary = (
        f"Risk review focuses on {negative[0]['label'] if negative else 'no material negative factor returned'} "
        f"and {early[0]['label'] if early else 'no active early-warning trigger returned'}."
    )
    output = NodeOutput(
        summary=summary,
        confidence=_confidence(context.score["data_confidence"]),
        assumptions=["Risk investigation uses deterministic negative factors and early-warning triggers only."],
        recommended_human_action="Review top negative factors, warning triggers, and document gaps with a credit officer.",
        cited_internal_inputs=context.cited_internal_inputs,
    )
    return _with_output(state, "risk_investigator_node", output, "Called get_risk_factors and investigated deterministic risk and warning signals.")


async def lending_brief_node(state: CopilotState, provider) -> CopilotState:
    t0 = time.perf_counter()
    try:
        brief = await provider.generate_structured_brief(state["context"])
        elapsed = int((time.perf_counter() - t0) * 1000)
        provider_trace = TraceStep(
            step_id=f"trace_{uuid4().hex[:10]}",
            step_name="generate_structured_brief",
            step_type="provider",
            status="success",
            input_refs=state["context"].cited_internal_inputs,
            output_ref=f"copilot_brief:{brief.id}",
            notes=f"Generated final structured brief using {provider.provider_name}.",
            duration_ms=elapsed,
        )
        return {
            **state,
            "final_brief": brief,
            "trace": [*state.get("trace", []), provider_trace],
        }
    except Exception as exc:
        elapsed = int((time.perf_counter() - t0) * 1000)
        provider_trace = TraceStep(
            step_id=f"trace_{uuid4().hex[:10]}",
            step_name="generate_structured_brief",
            step_type="provider",
            status="failure",
            input_refs=state["context"].cited_internal_inputs,
            error_code=type(exc).__name__,
            notes=f"Provider '{provider.provider_name}' failed: {exc}",
            duration_ms=elapsed,
        )
        state.setdefault("errors", []).append(f"lending_brief_node: {type(exc).__name__}: {exc}")
        return {
            **state,
            "trace": [*state.get("trace", []), provider_trace],
        }


def _with_output(state: CopilotState, name: str, output: NodeOutput, notes: str) -> CopilotState:
    context = state["context"]
    return {
        **state,
        "node_outputs": {**state.get("node_outputs", {}), name: output.model_dump(mode="json")},
        "trace": [*state.get("trace", []), _trace(name, context.cited_internal_inputs, notes)],
    }
