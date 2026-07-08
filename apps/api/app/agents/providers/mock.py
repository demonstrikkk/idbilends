from collections.abc import AsyncIterator
from uuid import uuid4

from app.agents.providers.base import BaseCopilotProvider
from app.agents.schemas import CopilotBriefPayload, CopilotConfidence, CopilotContext, PROMPT_VERSION
from app.schemas.common import utc_now


class MockCopilotProvider(BaseCopilotProvider):
    provider_name = "mock"
    model_name = "deterministic_mock_v1"

    async def generate_structured_brief(self, context: CopilotContext) -> CopilotBriefPayload:
        score = context.score
        profile = context.profile
        prospect = context.prospect_signals
        missing = context.missing_documents
        warnings = score["missing_data_warnings"]
        negatives = score["negative_factors"]
        positives = score["positive_factors"]
        early = score["early_warning_triggers"]
        confidence = _confidence(score["data_confidence"], len(warnings), len(early))
        missing_text = ", ".join(missing or warnings) if (missing or warnings) else "no major document gaps returned by the deterministic services"
        positive_text = positives[0]["label"] if positives else "available positive score factors"
        negative_text = negatives[0]["label"] if negatives else "no material negative factor returned"
        early_text = early[0]["label"] if early else "no active early-warning trigger returned"

        answer_md = (
            f"### Credit Copilot Answer\n\n"
            f"#### Case Summary\n"
            f"{profile['business_name']} has score {score['score']} and risk tier {score['risk_tier']} with {score['data_confidence']}% data confidence.\n\n"
            f"#### Recommended Human Action\n"
            f"{score['recommended_human_action']}\n\n"
            f"#### Sources Used\n"
            f"- `msme_profile:{context.msme_id}`\n"
            f"- `score_output:{context.score.get('id', 'unknown')}`\n"
        )
        return CopilotBriefPayload(
            id=f"brief_{uuid4().hex[:10]}",
            msme_id=context.msme_id,
            answer_markdown=answer_md,
            summary=f"{profile['business_name']} has score {score['score']} and risk tier {score['risk_tier']} with {score['data_confidence']}% data confidence.",
            executive_summary=(
                f"{profile['business_name']} is a {profile['segment']} case for decision-support review. "
                f"The deterministic engine reports score {score['score']}, risk tier {score['risk_tier']}, and a suggested range of "
                f"{score['suggested_credit_min']} to {score['suggested_credit_max']} against requested amount {score['requested_credit_amount']}."
            ),
            data_quality_observations=(
                f"Data confidence is {score['data_confidence']}%. Missing or verification-sensitive items: {missing_text}. "
                "Use these observations only as synthetic/demo signals until documents are verified."
            ),
            credit_analyst_explanation=(
                f"The score is supported by {positive_text}. The main caution is {negative_text}. "
                f"The suggested credit range is produced by the deterministic score service and is lower than or equal to the requested amount."
            ),
            prospect_assist_recommendation=(
                f"Prospect Assist priority is {prospect['priority']} with likely need {prospect['likely_credit_need']} "
                f"and product fit {prospect['best_product_fit']}. Recommended human action: {prospect['next_best_action']}"
            ),
            risk_investigator_findings=(
                f"Primary risk review item: {negative_text}. Early-warning status: {early_text}. "
                "Bank officer should verify documents and investigate anomalies before relying on the brief."
            ),
            final_lending_brief=(
                f"Consider this case for human credit review with the deterministic suggested range of "
                f"{score['suggested_credit_min']} to {score['suggested_credit_max']}. "
                "The officer should verify document gaps, review risk signals, and apply bank policy before any lending action."
            ),
            confidence=confidence,
            assumptions=[
                "Only sanitized synthetic profile, score, prospect, risk, and derived transaction summary inputs were used.",
                "The deterministic scoring engine remains the source of truth for score, risk tier, and suggested range.",
            ],
            follow_up_questions=[
                "Can the applicant provide the latest missing or partial documents?",
                "Are the largest buyer and recent invoice realizations recurring and verifiable?",
                "Do recent cashflow indicators match the requested working-capital need?",
            ],
            recommended_human_action=score["recommended_human_action"],
            decision_support_only=True,
            cited_internal_inputs=context.cited_internal_inputs,
            trace=[],
            provider=self.provider_name,
            model=self.model_name,
            prompt_version=PROMPT_VERSION,
            created_at=utc_now(),
        )

    async def stream_brief(self, context: CopilotContext) -> AsyncIterator[str]:
        brief = await self.generate_structured_brief(context)
        for sentence in brief.final_lending_brief.split(". "):
            yield sentence.strip() + ". "


def _confidence(data_confidence: int, warnings_count: int, early_warning_count: int) -> CopilotConfidence:
    if data_confidence >= 85 and warnings_count == 0 and early_warning_count == 0:
        return CopilotConfidence.high
    if data_confidence >= 75:
        return CopilotConfidence.medium_high
    if data_confidence >= 55:
        return CopilotConfidence.medium
    return CopilotConfidence.low
