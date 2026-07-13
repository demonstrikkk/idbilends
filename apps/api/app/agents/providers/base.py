from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from fastapi import HTTPException

from app.agents.schemas import CopilotBriefPayload, CopilotContext
from app.core.config import get_settings


class BaseCopilotProvider(ABC):
    provider_name: str
    model_name: str

    @abstractmethod
    async def generate_structured_brief(self, context: CopilotContext) -> CopilotBriefPayload:
        raise NotImplementedError

    async def stream_brief(self, context: CopilotContext) -> AsyncIterator[str]:
        brief = await self.generate_structured_brief(context)
        for chunk in brief.final_lending_brief.split(" "):
            yield f"{chunk} "

    async def chat(self, question: str, context: CopilotContext) -> str:
        brief = await self.generate_structured_brief(context)
        q = question.lower()
        if "risk" in q or "anomaly" in q:
            return brief.risk_investigator_findings
        if "document" in q or "missing" in q or "evidence" in q or "block" in q:
            return f"{brief.data_quality_observations}\n\n{brief.follow_up_questions[0] if brief.follow_up_questions else ''}"
        if "score" in q or "confidence" in q:
            return brief.credit_analyst_explanation
        if "action" in q or "recommend" in q or "next" in q:
            return brief.recommended_human_action
        return f"{brief.credit_analyst_explanation}\n\nRecommended human action: {brief.recommended_human_action}"

    async def portfolio_chat(self, question: str, portfolio_data: dict) -> str:
        cases = portfolio_data.get("cases", [])
        movements = portfolio_data.get("movements", [])
        q = question.lower()
        if "drop" in q or "deteriorat" in q:
            dropped = [m for m in movements if m.get("delta", 0) < 0] if movements else []
            count = len(dropped) if isinstance(dropped, list) else 0
            return f"Found {count} cases with score deterioration. Prioritize the largest negative deltas for human review."
        if "risk" in q or "need" in q or "attention" in q or "action" in q:
            flagged = [c for c in cases if c.get("score", {}).get("risk_tier") in ("elevated", "high") or (c.get("score", {}).get("data_confidence", 100) or 100) < 70]
            return f"Found {len(flagged)} cases needing officer attention based on risk tier or low confidence."
        return (
            f"Portfolio overview: {len(cases)} cases tracked, {len([m for m in movements if m.get('delta', 0) < 0])} with negative score movement. "
            "Use the monitoring dashboard for detailed views."
        )


def get_provider(mode: str | None = None) -> BaseCopilotProvider:
    import os

    from app.agents.providers.disabled import DisabledCopilotProvider
    from app.agents.providers.groq import GroqCopilotProvider
    from app.agents.providers.mock import MockCopilotProvider

    settings = get_settings()
    selected = (mode or settings.ai_provider or "").lower()
    in_test = "PYTEST_CURRENT_TEST" in os.environ
    if selected == "disabled":
        return DisabledCopilotProvider()
    if selected == "groq":
        return GroqCopilotProvider()
    if selected == "mock":
        if in_test:
            return MockCopilotProvider()
        raise HTTPException(
            status_code=400,
            detail={"code": "COPILOT_PROVIDER_FORBIDDEN", "message": "Mock provider is not available for user-facing requests."},
        )
    if not selected:
        raise HTTPException(
            status_code=503,
            detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "No AI provider is configured. Set AI_PROVIDER=groq and GROQ_API_KEY to enable Credit Copilot."},
        )
    raise HTTPException(
        status_code=400,
        detail={"code": "COPILOT_PROVIDER_INVALID", "message": f"Unsupported Credit Copilot provider mode '{selected}'."},
    )
