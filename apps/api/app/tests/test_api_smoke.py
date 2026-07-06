from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_and_ready_endpoints_work():
    assert client.get("/health").status_code == 200
    ready = client.get("/ready")
    assert ready.status_code == 200
    assert ready.json()["checks"]["ai_provider"] == "mock"


def test_seed_and_main_api_flow():
    seed = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 9})
    assert seed.status_code == 200
    assert seed.json()["profile_count"] == 9

    msmes = client.get("/msmes")
    assert msmes.status_code == 200
    assert len(msmes.json()["items"]) >= 8

    detail = client.get("/msmes/msme_001")
    assert detail.status_code == 200
    assert detail.json()["financials"]["monthly_revenue_avg"] > 0

    score = client.post("/scores/msme_001/generate", json={"persist": True, "include_trace": True})
    assert score.status_code == 200
    body = score.json()
    assert body["decision_support_only"] is True
    assert body["positive_factors"][0]["source_fields"]

    prospect = client.get("/prospects/msme_001/signals")
    assert prospect.status_code == 200
    assert prospect.json()["prospect_score"] >= 0

    audit = client.get("/audit/msme_001")
    assert audit.status_code == 200
    events = [item["event_type"] for item in audit.json()["items"]]
    assert "score_generated" in events
    assert "prospect_signals_generated" in events
