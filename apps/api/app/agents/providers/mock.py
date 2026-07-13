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

    async def chat(self, question: str, context: CopilotContext) -> str:
        q = question.lower()
        score = context.score
        profile = context.profile
        prospect = context.prospect_signals
        risk = context.risk_factors

        if "risk" in q or "anomaly" in q or "concern" in q or "warning" in q:
            lines = []
            for f in risk.get("negative_factors", []):
                lines.append(f"- **{f['label']}**: {f['description']} (severity: {f.get('severity', 'medium')})")
            for t in risk.get("early_warning_triggers", []):
                lines.append(f"- ⚠️ **{t['label']}**: {t['description']}")
            for m in risk.get("missing_data_warnings", []):
                lines.append(f"- ❓ **Missing data**: {m}")
            body = "\n".join(lines) or "No material risk factors detected."
            return (
                f"### Risk Analysis for {profile['business_name']}\n\n"
                f"{body}\n\n"
                f"**Data confidence**: {score['data_confidence']}%  \n"
                f"**Recommended action**: {score['recommended_human_action']}\n\n"
                f"*Decision-support only: this Copilot answer explains internal score and risk inputs for human review. It does not issue a final credit decision.*"
            )

        if "document" in q or "missing" in q or "evidence" in q or "block" in q or "gap" in q:
            missing = context.missing_documents or score.get("missing_data_warnings", [])
            lines = "\n".join(f"- {m}" for m in missing) if missing else "No missing documents detected."
            return (
                f"### Document / Data Gaps for {profile['business_name']}\n\n"
                f"**Detected gaps:**\n{lines}\n\n"
                f"**Data confidence**: {score['data_confidence']}%\n\n"
                "**Follow-up suggestion:** Contact the applicant to verify the identified gaps before proceeding.\n\n"
                "*Decision-support only: this Copilot answer explains document gaps for human review. It does not issue a final credit decision.*"
            )

        if "score" in q or "credit health" in q or "financial" in q or "how healthy" in q:
            positives = [p["label"] for p in score.get("positive_factors", [])]
            negatives = [n["label"] for n in score.get("negative_factors", [])]
            return (
                f"### Financial Health Score for {profile['business_name']}\n\n"
                f"**Score**: {score['score']}/100 — **{score['risk_tier']}**\n\n"
                f"**Supporting factors:**\n" + ("\n".join(f"- ✅ {p}" for p in positives) if positives else "None identified") + "\n\n"
                f"**Caution factors:**\n" + ("\n".join(f"- ⚠️ {n}" for n in negatives) if negatives else "None identified") + "\n\n"
                f"**Confidence**: {score['data_confidence']}% | **Suggested range**: ₹{score['suggested_credit_min']} – ₹{score['suggested_credit_max']}\n\n"
                f"**Recommended action**: {score['recommended_human_action']}\n\n"
                f"*Decision-support only: this Copilot answer explains score factors for human review. It does not issue a final credit decision.*"
            )

        if "prospect" in q or "priority" in q or "next action" in q or "recommend" in q or "product" in q:
            return (
                f"### Prospect Assist Assessment for {profile['business_name']}\n\n"
                f"**Priority**: {prospect['priority']}  \n"
                f"**Likely credit need**: {prospect['likely_credit_need']}  \n"
                f"**Best product fit**: {prospect['best_product_fit']}  \n"
                f"**Next best action**: {prospect['next_best_action']}  \n"
                f"**Recommended human action**: {score['recommended_human_action']}\n\n"
                f"*Decision-support only: this Copilot answer explains prospect signals for human review. It does not issue a final credit decision.*"
            )

        if "summary" in q or "overview" in q or "tell me about" in q or "what do you know" in q:
            rev = profile.get("financial_snapshot", {})
            return (
                f"### MSME Profile Overview — {profile['business_name']}\n\n"
                f"- **Segment**: {profile['segment']} | **City**: {profile['city']}, {profile['state']}\n"
                f"- **Vintage**: {profile['business_vintage_months']} months | **Employees**: {profile['employee_count']}\n"
                f"- **Requested credit**: ₹{profile['requested_credit_amount']:,}\n\n"
                f"**Financial Snapshot:**\n"
                f"- Monthly revenue avg: ₹{rev.get('monthly_revenue_avg', 0):,}\n"
                f"- Monthly expense avg: ₹{rev.get('monthly_expense_avg', 0):,}\n"
                f"- Avg bank balance: ₹{rev.get('average_bank_balance', 0):,}\n"
                f"- Revenue growth (3m): {rev.get('revenue_growth_3m', 0)}%\n"
                f"- Revenue growth (6m): {rev.get('revenue_growth_6m', 0)}%\n"
                f"- Revenue spike ratio: {rev.get('revenue_spike_ratio', 0)}\n"
                f"- Bounces (3m): {rev.get('bounce_count_3m', 0)} | Bounces (6m): {rev.get('bounce_count_6m', 0)}\n"
                f"- Existing debt: ₹{rev.get('existing_debt', 0):,} | EMI obligation: ₹{rev.get('emi_obligation', 0):,}\n"
                f"- Invoice delay avg: {rev.get('invoice_delay_avg_days', 0)} days\n"
                f"- GST filing regularity: {rev.get('gst_filing_regularity', 0)}%\n"
                f"- Digital payment ratio: {rev.get('digital_payment_ratio', 0)}%\n"
                f"- Cash deposit ratio: {rev.get('cash_deposit_ratio', 0)}%\n"
                f"- Buyer concentration: {rev.get('buyer_concentration', 0)}%\n\n"
                f"**Score**: {score['score']}/100 | **Risk tier**: {score['risk_tier']}\n\n"
                f"Use `/copilot/{context.msme_id}/brief` for the full lending brief.\n\n"
                f"*Decision-support only: this Copilot answer explains profile data for human review. It does not issue a final credit decision.*"
            )

        return (
            f"### Answer for: {question}\n\n"
            f"Based on the data for **{profile['business_name']}** (Score: {score['score']}, "
            f"Risk: {score['risk_tier']}, Confidence: {score['data_confidence']}%), "
            f"here is what I can tell you:\n\n"
            f"- **Priority**: {prospect['priority']}\n"
            f"- **Credit need**: {prospect['likely_credit_need']}\n"
            f"- **Product fit**: {prospect['best_product_fit']}\n"
            f"- **Recommended action**: {score['recommended_human_action']}\n\n"
            f"To investigate further, try asking about: `risk`, `documents`, `score`, `recommendations`, or `summary`.\n\n"
            f"*Decision-support only: this Copilot answer explains internal inputs for human review. It does not issue a final credit decision.*"
        )

    async def portfolio_chat(self, question: str, portfolio_data: dict) -> str:
        q = question.lower()
        cases = portfolio_data.get("cases", [])
        movements = portfolio_data.get("movements", [])
        movements_list = movements if isinstance(movements, list) else movements.get("items", []) if isinstance(movements, dict) else []

        if "drop" in q or "deteriorat" in q or "score change" in q or "movement" in q:
            dropped = [m for m in movements_list if m.get("delta", 0) < 0]
            worst = dropped[:5] if dropped else []
            lines = "\n".join(
                f"- {m.get('msme_id', '?')}: {m.get('previous_score', '?')} → {m.get('new_score', '?')} ({m.get('delta', 0)})"
                for m in worst
            ) if worst else "No cases with negative score movement."
            return (
                f"### Score Movements\n\n"
                f"**Total cases tracked**: {len(cases)}\n"
                f"**Cases with deterioration**: {len(dropped)}\n\n"
                f"**Worst declines:**\n{lines}\n\n"
                f"**Recommended action**: Prioritize the largest negative deltas for human review and evidence checks."
            )

        if "risk" in q or "need" in q or "attention" in q or "action" in q or "flag" in q:
            flagged = [
                c for c in cases
                if c.get("score", {}).get("risk_tier") in ("elevated", "high")
                or (c.get("score", {}).get("data_confidence", 100) or 100) < 70
                or any(f.get("severity") == "high" for f in c.get("risk_factors", {}).get("early_warning_triggers", []))
            ]
            lines = "\n".join(
                f"- {c.get('business_name', c.get('msme_id', '?'))}: score {c.get('score', {}).get('score', '?')}, "
                f"tier {c.get('score', {}).get('risk_tier', '?')}, confidence {c.get('score', {}).get('data_confidence', '?')}%"
                for c in flagged[:10]
            ) if flagged else "No cases currently need officer attention."
            return (
                f"### Cases Needing Officer Attention\n\n"
                f"{len(flagged)} case(s) flagged:\n\n{lines}\n\n"
                f"**Recommended action**: Review flagged cases, verify evidence gaps, and route material changes through the bank officer workflow."
            )

        if "summary" in q or "overview" in q or "health" in q or "portfolio" in q:
            avg_score = sum(c.get("score", {}).get("score", 0) for c in cases) / len(cases) if cases else 0
            high_risk = len([c for c in cases if c.get("score", {}).get("risk_tier") == "high"])
            low_conf = len([c for c in cases if (c.get("score", {}).get("data_confidence", 100) or 100) < 70])
            return (
                f"### Portfolio Overview\n\n"
                f"- **Active cases**: {len(cases)}\n"
                f"- **Average score**: {avg_score:.1f}\n"
                f"- **High-risk cases**: {high_risk}\n"
                f"- **Low-confidence cases**: {low_conf}\n"
                f"- **Score movements recorded**: {len(movements_list)}\n"
                f"- **Negative movements**: {len([m for m in movements_list if m.get('delta', 0) < 0])}\n\n"
                f"Use the monitoring dashboard for detailed per-case views. Flagged cases are visible in the Command Center."
            )

        return (
            f"### Portfolio Chat\n\n"
            f"Your portfolio has **{len(cases)}** active cases. "
            f"Ask about `deterioration`, `risk`, `flagged cases`, `summary`, or a specific MSME ID to drill down."
        )


def _confidence(data_confidence: int, warnings_count: int, early_warning_count: int) -> CopilotConfidence:
    if data_confidence >= 85 and warnings_count == 0 and early_warning_count == 0:
        return CopilotConfidence.high
    if data_confidence >= 75:
        return CopilotConfidence.medium_high
    if data_confidence >= 55:
        return CopilotConfidence.medium
    return CopilotConfidence.low
