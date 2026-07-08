import asyncio
import os

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.agents.context_builder import CopilotContextBuilder
from app.agents.providers.base import get_provider
from app.agents.providers.disabled import DisabledCopilotProvider
from app.agents.providers.groq import GroqCopilotProvider
from app.agents.providers.mock import MockCopilotProvider
from app.agents.safety import contains_forbidden_language, sanitize_copilot_text
from app.agents.tools import execute_tool
from app.core.config import get_settings
from app.main import app

client = TestClient(app)


def seed() -> None:
    response = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 9})
    assert response.status_code == 200


def test_mock_provider_returns_deterministic_output():
    seed()
    context = CopilotContextBuilder().build("msme_001")
    provider = MockCopilotProvider()
    first = asyncio.run(provider.generate_structured_brief(context))
    second = asyncio.run(provider.generate_structured_brief(context))
    assert first.model_dump(exclude={"id", "created_at"}) == second.model_dump(exclude={"id", "created_at"})
    assert first.decision_support_only is True
    assert first.cited_internal_inputs


def test_disabled_provider_returns_safe_unavailable_response():
    seed()
    context = CopilotContextBuilder().build("msme_001")
    brief = asyncio.run(DisabledCopilotProvider().generate_structured_brief(context))
    assert brief.provider == "disabled"
    assert brief.decision_support_only is True
    assert "disabled" in brief.summary.lower()


def test_groq_provider_does_not_initialize_without_key(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    get_settings.cache_clear()
    with pytest.raises(HTTPException):
        GroqCopilotProvider()
    get_settings.cache_clear()


def test_copilot_endpoint_works_in_mock_mode_and_cites_inputs():
    seed()
    response = client.post("/copilot/msme_001/brief", json={"mode": "mock", "include_trace": True})
    assert response.status_code == 200
    body = response.json()
    assert body["decision_support_only"] is True
    assert body["provider"] == "mock"
    assert body["trace"]
    assert any(item.startswith("score_output:") for item in body["cited_internal_inputs"])


def test_mock_brief_includes_answer_markdown():
    seed()
    response = client.post("/copilot/msme_001/brief", json={"mode": "mock", "include_trace": True})
    assert response.status_code == 200
    body = response.json()
    assert "answer_markdown" in body
    assert body["answer_markdown"]


def test_copilot_streaming_endpoint_works_in_mock_mode():
    seed()
    with client.stream("GET", "/copilot/msme_001/brief/stream?mode=mock") as response:
        assert response.status_code == 200
        text = "".join(response.iter_text())
    assert "event: status" in text
    assert "event: node_update" in text
    assert "event: token" in text
    assert "event: final" in text


def test_streamed_final_event_contains_answer_markdown():
    seed()
    with client.stream("GET", "/copilot/msme_001/brief/stream?mode=mock") as response:
        assert response.status_code == 200
        text = "".join(response.iter_text())
    assert "answer_markdown" in text


def test_missing_documents_appear_in_data_quality_output():
    seed()
    response = client.post("/copilot/msme_005/brief", json={"mode": "mock", "include_trace": True})
    assert response.status_code == 200
    body = response.json()
    assert "missing" in body["data_quality_observations"].lower() or "verification" in body["data_quality_observations"].lower()


def test_unknown_tool_is_denied():
    with pytest.raises(HTTPException) as exc:
        execute_tool("browse_web", "msme_001")
    assert exc.value.status_code == 403


def test_agent_does_not_mutate_score_fields():
    seed()
    before = client.post("/scores/msme_001/generate", json={"persist": True, "include_trace": True}).json()
    brief = client.post("/copilot/msme_001/brief", json={"mode": "mock", "include_trace": True})
    assert brief.status_code == 200
    after = client.post("/scores/msme_001/generate", json={"persist": True, "include_trace": True}).json()
    for key in ["score", "risk_tier", "data_confidence", "suggested_credit_min", "suggested_credit_max"]:
        assert before[key] == after[key]


def test_audit_event_created_on_success_and_failure():
    seed()
    success = client.post("/copilot/msme_001/brief", json={"mode": "mock", "include_trace": True})
    assert success.status_code == 200
    failure = client.post("/copilot/msme_001/brief", json={"mode": "groq", "include_trace": True})
    assert failure.status_code == 503
    audit = client.get("/audit/msme_001").json()["items"]
    event_types = [event["event_type"] for event in audit]
    assert "copilot_brief_generated" in event_types
    assert "copilot_brief_failed" in event_types


def test_forbidden_final_decision_language_is_sanitized():
    unsafe = "Loan " + "granted and app" + "roved with guaran" + "teed risk" + "-free terms."
    safe = sanitize_copilot_text(unsafe)
    assert not contains_forbidden_language(safe)


def test_groq_mode_never_returns_mock_provider(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_API_KEY", "test-key-placeholder")
    get_settings.cache_clear()
    try:
        provider = get_provider("groq")
        assert provider.provider_name == "groq"
        assert provider.provider_name != "mock"
    except HTTPException:
        pass
    get_settings.cache_clear()


def test_groq_missing_key_returns_provider_error():
    seed()
    response = client.post("/copilot/msme_001/brief", json={"mode": "groq", "include_trace": True})
    assert response.status_code in {503, 500}
    body = response.json()
    code = ""
    detail = body.get("detail", None) or body.get("error", {})
    if isinstance(detail, dict):
        code = str(detail.get("code", ""))
    assert "UNAVAILABLE" in code or "INTERNAL_ERROR" in code or "FAILED" in code


def test_provider_status_does_not_expose_mock_as_user_facing():
    response = client.get("/copilot/provider/status")
    assert response.status_code == 200
    body = response.json()
    assert "mock" not in body.get("available_user_modes", [])


def test_disabled_mode_returns_disabled_brief():
    seed()
    response = client.post("/copilot/msme_001/brief", json={"mode": "disabled", "include_trace": True})
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "disabled"
    assert body["decision_support_only"] is True
