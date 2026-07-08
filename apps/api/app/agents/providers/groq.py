import json
from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import HTTPException

from app.agents.providers.base import BaseCopilotProvider
from app.agents.providers.mock import MockCopilotProvider
from app.agents.schemas import CopilotBriefPayload, CopilotContext, PROMPT_VERSION
from app.core.config import get_settings
from app.schemas.common import utc_now


GROQ_SYSTEM_PROMPT = (
    "You are Credit Copilot, a controlled bank decision-support assistant. "
    "Return only valid JSON matching the provided schema. "
    "Include an 'answer_markdown' field containing a concise, banker-grade Markdown answer. "
    "Do not calculate or alter score, risk tier, confidence, suggested range, recommended human action, or cited inputs. "
    "Use only the sanitized context and baseline schema provided. "
    "Do not invent facts, metrics, documents, policies, or external data. "
    "Every narrative field must preserve the decision-support-only boundary and must distinguish deterministic score outputs from Copilot explanation. "
    "Avoid final lending authority language. "
    "Do not use approval, rejection, sanction, disbursement, or final-decision language. "
    "Do not say 'credit approval is advisable' or 'credit approval is not advisable'. "
    "Use terms like: human review, credit review workflow, facility consideration, requires verification, evidence gap, recommended human action, decision-support only."
)

GROQ_MARKDOWN_STRUCTURE = (
    "\n\nThe 'answer_markdown' field must use this Markdown structure:\n"
    "\n"
    "### Credit Copilot Answer\n\n"
    "#### Case Summary\n"
    "...\n\n"
    "#### What Is Blocking This Case\n"
    "...\n\n"
    "#### Evidence To Review\n"
    "- `msme_profile:...`\n"
    "- `score_output:...`\n"
    "\n"
    "#### Score And Risk Explanation\n"
    "...\n\n"
    "#### Recommended Human Action\n"
    "...\n\n"
    "#### Follow-Up Questions\n"
    "1. ...\n"
    "2. ...\n"
    "3. ...\n"
    "\n"
    "#### Sources Used\n"
    "- `msme_profile:...`\n"
    "- `score_output:...`\n"
    "- `transaction_summary:...`\n"
    "- `evidence:...`\n"
    "\n"
    "Use Markdown headings, bullets, and short paragraphs. "
    "Cite internal input IDs exactly. "
    "Do not invent facts."
)


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

        mock = await MockCopilotProvider().generate_structured_brief(context)
        context_json = json.dumps(context.model_dump(mode="json"), indent=2)
        baseline_json = json.dumps(mock.model_dump(mode="json"), indent=2)
        prompt = (
            f"{GROQ_SYSTEM_PROMPT}{GROQ_MARKDOWN_STRUCTURE}\n\n"
            f"Sanitized context:\n{context_json}\n\n"
            f"Baseline fields (fill in every field truthfully from the context; do not leave any field empty):\n{baseline_json}"
        )
        try:
            llm = ChatGroq(
                api_key=self.settings.groq_api_key,
                model=self.settings.groq_model_structured,
                temperature=self.settings.groq_temperature,
                max_tokens=self.settings.groq_max_tokens,
                timeout=60,
                max_retries=2,
            )
            response = await llm.ainvoke(
                [
                    SystemMessage(content="You are Credit Copilot, a controlled bank decision-support assistant. Return only valid JSON."),
                    HumanMessage(content=prompt),
                ]
            )
            raw = str(response.content).strip()
            if raw.startswith("<think>"):
                end = raw.find("</think>")
                if end != -1:
                    raw = raw[end + len("</think>"):].strip()
            if raw.startswith("```"):
                parts = raw.split("```")
                if len(parts) >= 2:
                    raw = parts[1]
                    if raw.startswith("json"):
                        raw = raw[4:].strip()
            parsed = json.loads(raw)
        except Exception:
            return mock.model_copy(update={
                "provider": self.provider_name,
                "model": f"{self.model_name}_fallback",
            })
        parsed.update(
            {
                "id": parsed.get("id") or f"brief_{uuid4().hex[:10]}",
                "msme_id": context.msme_id,
                "answer_markdown": parsed.get("answer_markdown", ""),
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

        try:
            llm = ChatGroq(
                api_key=self.settings.groq_api_key,
                model=self.settings.groq_model_stream,
                temperature=self.settings.groq_temperature,
                max_tokens=self.settings.groq_max_tokens,
                timeout=60,
                max_retries=2,
                streaming=True,
            )
            context_json = json.dumps(context.model_dump(mode="json"), indent=2)
            stream_prompt = (
                "You are Credit Copilot, a controlled bank decision-support assistant. "
                "Stream only the Markdown answer body. No JSON, no code fences. "
                "Do not calculate or alter score, risk tier, confidence, suggested range, recommended human action, or cited inputs. "
                "Use decision-support language only. "
                "Avoid approval, rejection, sanction, disbursement, or final-decision language.\n\n"
                "Use this structure:\n"
                "### Credit Copilot Answer\n\n"
                "#### Case Summary\n...\n\n"
                "#### What Is Blocking This Case\n...\n\n"
                "#### Evidence To Review\n- ...\n\n"
                "#### Score And Risk Explanation\n...\n\n"
                "#### Recommended Human Action\n...\n\n"
                "#### Follow-Up Questions\n1. ...\n\n"
                "#### Sources Used\n- `msme_profile:...`\n"
                "\n"
                f"Sanitized context:\n{context_json}"
            )
            async for chunk in llm.astream(
                [
                    SystemMessage(content="You are Credit Copilot. Stream Markdown only."),
                    HumanMessage(content=stream_prompt),
                ]
            ):
                content = getattr(chunk, "content", "")
                if content:
                    yield str(content)
        except Exception:
            yield "Groq API unavailable. Credit Copilot streaming is not available. Deterministic score outputs remain available for human review."
