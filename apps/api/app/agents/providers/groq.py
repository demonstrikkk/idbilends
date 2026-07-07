import json
from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import HTTPException

from app.agents.providers.base import BaseCopilotProvider
from app.agents.providers.mock import MockCopilotProvider
from app.agents.schemas import CopilotBriefPayload, CopilotContext, PROMPT_VERSION
from app.core.config import get_settings
from app.schemas.common import utc_now


class GroqCopilotProvider(BaseCopilotProvider):
    provider_name = "groq"

    def __init__(self) -> None:
        settings = get_settings()
        self.settings = settings
        self.model_name = settings.groq_model_structured
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq provider selected but GROQ_API_KEY is not configured."},
            )

    async def generate_structured_brief(self, context: CopilotContext) -> CopilotBriefPayload:
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage, SystemMessage
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq dependencies are not installed."},
            ) from exc

        llm = ChatGroq(
            api_key=self.settings.groq_api_key,
            model=self.settings.groq_model_structured,
            temperature=self.settings.groq_temperature,
            max_tokens=self.settings.groq_max_tokens,
            timeout=30,
            max_retries=1,
        )
        mock = await MockCopilotProvider().generate_structured_brief(context)
        prompt = (
            "Return only JSON matching the provided schema. Use concise bank-officer language. "
            "Do not calculate or alter score, risk tier, confidence, suggested range, recommended human action, or cited inputs. "
            "Use only this sanitized context and baseline schema. Do not invent facts, metrics, documents, policies, or external data. "
            "Every narrative field must preserve the decision-support-only boundary and must distinguish deterministic score outputs from Copilot explanation. "
            "Avoid final lending authority language.\n\n"
            f"Sanitized context:\n{json.dumps(context.model_dump(mode='json'), indent=2)}\n\n"
            f"Baseline fields:\n{json.dumps(mock.model_dump(mode='json'), indent=2)}"
        )
        response = await llm.ainvoke(
            [
                SystemMessage(content="You are Credit Copilot, a controlled bank decision-support assistant. Produce grounded JSON only."),
                HumanMessage(content=prompt),
            ]
        )
        raw = str(response.content).strip()
        # Strip markdown code fences if Groq wraps in ```json ... ```
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq returned a response that did not match the required grounded JSON schema. No mock fallback was used."},
            ) from exc
        parsed.update(
            {
                "id": parsed.get("id") or f"brief_{uuid4().hex[:10]}",
                "msme_id": context.msme_id,
                "decision_support_only": True,
                "cited_internal_inputs": context.cited_internal_inputs,
                "provider": self.provider_name,
                "model": self.settings.groq_model_structured,
                "prompt_version": PROMPT_VERSION,
                "created_at": parsed.get("created_at") or utc_now(),
            }
        )
        return CopilotBriefPayload.model_validate(parsed)

    async def stream_brief(self, context: CopilotContext) -> AsyncIterator[str]:
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage, SystemMessage
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq dependencies are not installed."},
            ) from exc

        llm = ChatGroq(
            api_key=self.settings.groq_api_key,
            model=self.settings.groq_model_stream,
            temperature=self.settings.groq_temperature,
            max_tokens=min(self.settings.groq_max_tokens, 900),
            timeout=30,
            max_retries=1,
            streaming=True,
        )
        prompt = (
            "Stream a concise lending brief narrative from sanitized context only. "
            "Cite the internal inputs by name where useful. Do not calculate or alter deterministic score outputs. "
            "Do not invent facts, metrics, documents, policies, or external data. "
            "State that this is decision-support for human review and do not use final lending authority language.\n\n"
            f"{json.dumps(context.model_dump(mode='json'), indent=2)}"
        )
        async for chunk in llm.astream(
            [
                SystemMessage(content="You are Credit Copilot, a controlled decision-support assistant."),
                HumanMessage(content=prompt),
            ]
        ):
            content = getattr(chunk, "content", "")
            if content:
                yield str(content)
