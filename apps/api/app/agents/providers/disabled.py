from uuid import uuid4

from app.agents.providers.base import BaseCopilotProvider
from app.agents.schemas import CopilotBriefPayload, CopilotConfidence, CopilotContext, PROMPT_VERSION
from app.schemas.common import utc_now


class DisabledCopilotProvider(BaseCopilotProvider):
    provider_name = "disabled"
    model_name = "none"

    async def generate_structured_brief(self, context: CopilotContext) -> CopilotBriefPayload:
        score = context.score
        return CopilotBriefPayload(
            id=f"brief_{uuid4().hex[:10]}",
            msme_id=context.msme_id,
            answer_markdown="Credit Copilot is disabled. Deterministic score output remains available for human review.",
            summary="Credit Copilot disabled mode is active; deterministic score output remains available for human review.",
            executive_summary="The AI narrative provider is disabled. Use the deterministic score, risk tier, data confidence, reason codes, and suggested range already shown in the credit case.",
            data_quality_observations="Review the deterministic missing-data warnings and document status before any credit action.",
            credit_analyst_explanation=f"Deterministic score is {score['score']} with risk tier {score['risk_tier']}.",
            prospect_assist_recommendation="Use the backend Prospect Assist output already available in the case view.",
            risk_investigator_findings="Review deterministic negative factors and early-warning triggers manually.",
            final_lending_brief="Credit Copilot is disabled. Continue with human review using deterministic decision-support outputs and verified documents.",
            confidence=CopilotConfidence.low,
            assumptions=["No LLM provider was called.", "Deterministic scoring remains visible and authoritative."],
            follow_up_questions=["Which missing documents or risk triggers should the officer verify first?"],
            recommended_human_action=score["recommended_human_action"],
            decision_support_only=True,
            cited_internal_inputs=context.cited_internal_inputs,
            trace=[],
            provider=self.provider_name,
            model=self.model_name,
            prompt_version=PROMPT_VERSION,
            created_at=utc_now(),
        )
