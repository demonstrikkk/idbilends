import asyncio
import json
from collections.abc import AsyncIterator
from uuid import uuid4

from fastapi import HTTPException

from app.agents.providers.base import BaseCopilotProvider
from app.agents.rate_limiter import TpmRpmLimiter
from app.agents.schemas import CopilotBriefPayload, CopilotContext, PROMPT_VERSION
from app.core.config import get_settings
from app.schemas.common import utc_now


_LIMITER: TpmRpmLimiter | None = None


def _get_limiter() -> TpmRpmLimiter | None:
    global _LIMITER
    if _LIMITER is not None:
        return _LIMITER
    settings = get_settings()
    if settings.groq_rate_limit_enabled:
        _LIMITER = TpmRpmLimiter(tpm_limit=settings.groq_tpm_limit, rpm_limit=settings.groq_rpm_limit)
    return _LIMITER


def _is_rate_limit_error(exc: Exception) -> bool:
    try:
        from groq import RateLimitError
        if isinstance(exc, RateLimitError):
            return True
    except ImportError:
        pass
    try:
        import langchain_groq
        if hasattr(langchain_groq, "RateLimitError") and isinstance(exc, langchain_groq.RateLimitError):
            return True
    except ImportError:
        pass
    msg = str(exc).lower()
    return "rate_limit" in msg or "429" in msg or "too many requests" in msg or "rate limit" in msg


RATE_LIMIT_MESSAGE = (
    "GROQ API rate limit exceeded. The free tier allows ~6000 tokens/min and 30 requests/min. "
    "Wait 30-60 seconds and try again, or set GROQ_MODEL_STREAM / GROQ_MODEL_STRUCTURED to a less "
    "contended model. You can also disable rate limiting via GROQ_RATE_LIMIT_ENABLED=false."
)


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

        limiter = _get_limiter()
        context_json = json.dumps(context.model_dump(mode="json"), indent=2)
        prompt = (
            f"{GROQ_SYSTEM_PROMPT}{GROQ_MARKDOWN_STRUCTURE}\n\n"
            f"Sanitized context:\n{context_json}"
        )
        for attempt in range(3):
            try:
                if limiter:
                    if not await limiter.wait_and_check(estimated_tokens=self.settings.groq_max_tokens, max_wait=10.0):
                        raise HTTPException(
                            status_code=429,
                            detail={"code": "RATE_LIMIT_EXCEEDED", "message": RATE_LIMIT_MESSAGE},
                        )
                llm = ChatGroq(
                    api_key=self.settings.groq_api_key,
                    model=self.settings.groq_model_structured,
                    temperature=self.settings.groq_temperature,
                    max_tokens=self.settings.groq_max_tokens,
                    timeout=60,
                    max_retries=0,
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
                break
            except HTTPException:
                raise
            except Exception as exc:
                if _is_rate_limit_error(exc):
                    if attempt < 2:
                        wait = 2 ** attempt * 5
                        await asyncio.sleep(wait)
                        continue
                    raise HTTPException(
                        status_code=429,
                        detail={"code": "RATE_LIMIT_EXCEEDED", "message": RATE_LIMIT_MESSAGE},
                    ) from exc
                if attempt == 2:
                    raise HTTPException(
                        status_code=503,
                        detail={"code": "COPILOT_PROVIDER_ERROR", "message": "Groq returned an unparseable response after 3 attempts. Credit Copilot is unavailable. Deterministic score remains available."},
                    )
                continue
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

    async def chat(self, question: str, context: CopilotContext) -> str:
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage, SystemMessage
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq dependencies are not installed."},
            ) from exc

        limiter = _get_limiter()
        context_json = json.dumps(context.model_dump(mode="json"), indent=2)
        chat_prompt = (
            "You are Credit Copilot, a controlled bank decision-support assistant. "
            "Answer the user's question about an MSME case using ONLY the provided context data. "
            "Return a concise, banker-grade Markdown answer. "
            "Do not calculate or alter score, risk tier, confidence, or any deterministic output. "
            "Do not invent facts, metrics, documents, policies, or external data. "
            "If the question cannot be answered from the available context, say so clearly and suggest what data would be needed. "
            "Use decision-support language only. "
            "Avoid approval, rejection, sanction, disbursement, or final-decision language.\n"
            "\n"
            "Use this Markdown structure in your answer:\n"
            "### Credit Copilot Answer\n\n"
            "#### Case Summary\n"
            "- Score, risk tier, confidence, and key financial metrics.\n\n"
            "#### What Is Blocking This Case\n"
            "- Any evidence gaps, document issues, or risk factors requiring action.\n\n"
            "#### Evidence To Review\n"
            "- Cite specific evidence IDs where available.\n\n"
            "#### Score And Risk Explanation\n"
            "- Explain the score factors relevant to the question.\n\n"
            "#### Recommended Human Action\n"
            "- Clear officer action.\n\n"
            "#### Follow-Up Questions\n"
            "1. ...\n"
            "2. ...\n"
            "3. ...\n"
            "\n"
            "#### Sources Used\n"
            "- `msme_profile:...`\n"
            "- `score_output:...`\n"
            "- `evidence:...`\n"
            "\n"
            "Use Markdown headings, bullets, and short paragraphs. "
            "Mention exact score, risk tier, confidence, and suggested range when available. "
            "Mention exact evidence IDs. "
            "Cite internal source IDs exactly. "
            "Distinguish deterministic score from Copilot explanation.\n\n"
            f"Sanitized context:\n{context_json}\n\n"
            f"User question:\n{question}"
        )
        for attempt in range(3):
            try:
                if limiter:
                    if not await limiter.wait_and_check(estimated_tokens=self.settings.groq_max_tokens, max_wait=10.0):
                        raise HTTPException(
                            status_code=429,
                            detail={"code": "RATE_LIMIT_EXCEEDED", "message": RATE_LIMIT_MESSAGE},
                        )
                llm = ChatGroq(
                    api_key=self.settings.groq_api_key,
                    model=self.settings.groq_model_structured,
                    temperature=self.settings.groq_temperature,
                    max_tokens=self.settings.groq_max_tokens,
                    timeout=60,
                    max_retries=0,
                )
                response = await llm.ainvoke(
                    [
                        SystemMessage(content="You are Credit Copilot, a controlled bank decision-support assistant."),
                        HumanMessage(content=chat_prompt),
                    ]
                )
                raw = str(response.content).strip()
                if raw.startswith("<think>"):
                    end = raw.find("</think>")
                    if end != -1:
                        raw = raw[end + len("</think>"):].strip()
                return raw
            except HTTPException:
                raise
            except Exception as exc:
                if _is_rate_limit_error(exc):
                    if attempt < 2:
                        wait = 2 ** attempt * 5
                        await asyncio.sleep(wait)
                        continue
                    raise HTTPException(
                        status_code=429,
                        detail={"code": "RATE_LIMIT_EXCEEDED", "message": RATE_LIMIT_MESSAGE},
                    ) from exc
                raise HTTPException(
                    status_code=503,
                    detail={"code": "COPILOT_PROVIDER_ERROR", "message": "Groq provider returned an error. Credit Copilot chat is unavailable. Deterministic score remains available."},
                )

    async def portfolio_chat(self, question: str, portfolio_data: dict) -> str:
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage, SystemMessage
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq dependencies are not installed."},
            ) from exc

        limiter = _get_limiter()
        import json as json_mod
        data_json = json_mod.dumps(portfolio_data, indent=2)
        chat_prompt = (
            "You are Credit Copilot, a controlled bank decision-support assistant. "
            "Answer the user's question about a portfolio of MSME cases using ONLY the provided portfolio data. "
            "Return a concise, banker-grade Markdown answer. "
            "Do not invent facts, metrics, or data not present in the portfolio data. "
            "If the question cannot be answered from the available data, say so clearly. "
            "Use decision-support language only. "
            "Avoid approval, rejection, sanction, disbursement, or final-decision language.\n\n"
            f"Portfolio data:\n{data_json}\n\n"
            f"User question:\n{question}"
        )
        for attempt in range(3):
            try:
                if limiter:
                    if not await limiter.wait_and_check(estimated_tokens=self.settings.groq_max_tokens, max_wait=10.0):
                        raise HTTPException(
                            status_code=429,
                            detail={"code": "RATE_LIMIT_EXCEEDED", "message": RATE_LIMIT_MESSAGE},
                        )
                llm = ChatGroq(
                    api_key=self.settings.groq_api_key,
                    model=self.settings.groq_model_structured,
                    temperature=self.settings.groq_temperature,
                    max_tokens=self.settings.groq_max_tokens,
                    timeout=60,
                    max_retries=0,
                )
                response = await llm.ainvoke(
                    [
                        SystemMessage(content="You are Credit Copilot, a controlled bank decision-support assistant."),
                        HumanMessage(content=chat_prompt),
                    ]
                )
                raw = str(response.content).strip()
                if raw.startswith("<think>"):
                    end = raw.find("</think>")
                    if end != -1:
                        raw = raw[end + len("</think>"):].strip()
                return raw
            except HTTPException:
                raise
            except Exception as exc:
                if _is_rate_limit_error(exc):
                    if attempt < 2:
                        wait = 2 ** attempt * 5
                        await asyncio.sleep(wait)
                        continue
                    raise HTTPException(
                        status_code=429,
                        detail={"code": "RATE_LIMIT_EXCEEDED", "message": RATE_LIMIT_MESSAGE},
                    ) from exc
                raise HTTPException(
                    status_code=503,
                    detail={"code": "COPILOT_PROVIDER_ERROR", "message": "Groq provider returned an error. Credit Copilot portfolio chat is unavailable. Deterministic score remains available."},
                )

    async def stream_brief(self, context: CopilotContext) -> AsyncIterator[str]:
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import HumanMessage, SystemMessage
        except ImportError as exc:
            raise HTTPException(
                status_code=503,
                detail={"code": "COPILOT_PROVIDER_UNAVAILABLE", "message": "Groq dependencies are not installed."},
            ) from exc

        limiter = _get_limiter()
        if limiter:
            if not await limiter.wait_and_check(estimated_tokens=self.settings.groq_max_tokens, max_wait=15.0):
                yield (
                    "**GROQ API rate limit exceeded.** The free tier allows ~6000 tokens/min "
                    "and 30 requests/min. Wait 30-60 seconds and try again. Deterministic score "
                    "outputs remain available for human review."
                )
                return

        for attempt in range(3):
            try:
                llm = ChatGroq(
                    api_key=self.settings.groq_api_key,
                    model=self.settings.groq_model_stream,
                    temperature=self.settings.groq_temperature,
                    max_tokens=self.settings.groq_max_tokens,
                    timeout=60,
                    max_retries=0,
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
                return
            except Exception as exc:
                if _is_rate_limit_error(exc):
                    if attempt < 2:
                        yield f"\n\n> _Rate limit hit. Retrying in {2 ** attempt * 5}s..._\n\n"
                        await asyncio.sleep(2 ** attempt * 5)
                        continue
                    yield (
                        "\n\n---\n**GROQ API rate limit exceeded.** The free tier allows ~6000 "
                        "tokens/min and 30 requests/min. Wait 30-60 seconds and try again. "
                        "Deterministic score outputs remain available for human review."
                    )
                    return
                yield (
                    "Groq API unavailable. Credit Copilot streaming is not available. "
                    "Deterministic score outputs remain available for human review."
                )
                return
