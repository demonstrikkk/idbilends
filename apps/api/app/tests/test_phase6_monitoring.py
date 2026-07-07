from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_score_history_and_manual_monitoring_event_flow():
    seed = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 9})
    assert seed.status_code == 200
    manual = client.post("/monitoring/events/manual", json={"msme_id": "msme_001", "event_type": "bounce_event_recorded"})
    assert manual.status_code == 200
    body = manual.json()
    assert body["event"]["event_type"] == "bounce_event_recorded"
    assert body["score_history"]["event_id"] == body["event"]["id"]

    history = client.get("/score-history/msme_001")
    assert history.status_code == 200
    assert history.json()["items"][0]["event_id"] == body["event"]["id"]

    movements = client.get("/monitoring/score-movements?min_delta=0&limit=10")
    assert movements.status_code == 200
    assert any(item["msme_id"] == "msme_001" for item in movements.json()["items"])

    audit = client.get("/audit/msme_001")
    assert "monitoring_event_applied" in [item["event_type"] for item in audit.json()["items"]]


def test_market_overlay_keeps_policy_score_separate():
    seed = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 9})
    assert seed.status_code == 200
    overlay = client.post("/market-overlays/simulate", json={"msme_id": "msme_008", "overlay_id": "manufacturing_input_cost_pressure"})
    assert overlay.status_code == 200
    body = overlay.json()
    assert body["policy_score_unchanged"] is True
    assert body["market_adjusted_score"] == body["policy_score"] + body["monitoring_delta_score"]
    assert body["version"]
    assert "Policy score is not rewritten" in " ".join(body["trace"])


def test_monitoring_status_and_websocket_connect():
    response = client.get("/monitoring/status")
    assert response.status_code == 200
    with client.websocket_connect("/ws/monitoring") as websocket:
        message = websocket.receive_json()
        assert message["event"] == "connected"
