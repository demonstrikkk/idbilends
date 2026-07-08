from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def seed() -> None:
    response = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 9})
    assert response.status_code == 200


def test_provider_status_does_not_expose_secrets():
    response = client.get("/copilot/provider/status")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "configured_provider",
        "groq_configured",
        "user_facing_ai_enabled",
        "available_user_modes",
        "stream_model",
        "structured_model",
        "active_provider",
        "message",
    }
    raw = str(body)
    assert "sk-" not in raw
    assert "gsk_" not in raw


def test_portfolio_cases_endpoint_returns_score_and_prospect_outputs():
    seed()
    response = client.get("/portfolio/cases")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 9
    assert items[0]["score"]["decision_support_only"] is True
    assert items[0]["prospect"]["prospect_score"] >= 0


def test_portfolio_cases_support_pagination_and_filters():
    response = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 1000})
    assert response.status_code == 200
    page = client.get("/portfolio/cases?limit=25&offset=25&sort=score_asc&query=Branch")
    assert page.status_code == 200
    body = page.json()
    assert len(body["items"]) == 25
    assert body["pagination"]["total"] >= 25
    assert body["pagination"]["has_more"] is True


def test_portfolio_summary_endpoint_is_derived_from_cases():
    seed()
    response = client.get("/portfolio/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["total_msmes"] == 9
    assert body["requested_exposure"] > 0
    assert "moderate_low" in body["risk_distribution"]


def test_watchlist_endpoint_returns_derived_monitoring_cases():
    seed()
    response = client.get("/watchlist")
    assert response.status_code == 200
    body = response.json()
    assert body["total_watched_accounts"] == len(body["items"])
    assert body["missing_document_signals"] >= 0


def test_alerts_endpoint_returns_warning_event_stream():
    seed()
    response = client.get("/alerts")
    assert response.status_code == 200
    body = response.json()
    assert body["critical_or_high"] + body["medium"] + body["low"] == len(body["items"])


def test_portfolio_insights_endpoint_returns_current_snapshot_analytics():
    seed()
    response = client.get("/insights/portfolio")
    assert response.status_code == 200
    body = response.json()
    assert body["total_borrowers"] == 9
    assert isinstance(body["segment_health_scores"], list)


def test_model_monitor_snapshot_endpoint_returns_latest_scores_only():
    seed()
    response = client.get("/model-monitor/snapshot")
    assert response.status_code == 200
    body = response.json()
    assert body["applications_scored"] == 9
    assert body["rule_version"] == "score_rules_v1"
