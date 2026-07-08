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
