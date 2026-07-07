from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def seed() -> None:
    response = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 9})
    assert response.status_code == 200


def test_case_inbox_groups_current_cases_without_fake_rows():
    seed()
    response = client.get("/case-inbox")
    assert response.status_code == 200
    body = response.json()
    assert {lane["lane"] for lane in body["lanes"]} == {
        "ready_for_review",
        "missing_evidence",
        "risk_attention",
        "high_potential",
        "low_confidence",
    }
    assert sum(len(lane["cases"]) for lane in body["lanes"]) >= 9
    first_case = body["lanes"][0]["cases"][0]
    assert first_case["score"]["decision_support_only"] is True


def test_credit_file_endpoint_returns_grounded_workflow_bundle():
    seed()
    response = client.get("/credit-file/msme_001")
    assert response.status_code == 200
    body = response.json()
    assert body["profile"]["id"] == "msme_001"
    assert body["score"]["decision_support_only"] is True
    assert body["prospect"]["msme_id"] == "msme_001"
    assert body["transaction_summary"]["msme_id"] == "msme_001"
    assert body["evidence_status"]
    assert body["recommended_human_actions"]
    assert "msme_profile:msme_001" in body["cited_source_ids"]


def test_evidence_map_endpoint_maps_sources_to_underwriting_questions():
    seed()
    response = client.get("/credit-file/msme_001/evidence-map")
    assert response.status_code == 200
    rows = response.json()["rows"]
    assert rows
    assert {"source_type", "derived_signal", "score_component", "lending_question", "recommended_action"} <= set(rows[0])
    assert any(row["source_type"] == "bank_statement" for row in rows)


def test_copilot_chat_endpoint_returns_decision_support_answer_with_citations():
    seed()
    response = client.post("/copilot/msme_001/chat", json={"message": "Why is this case blocked?", "mode": "mock", "include_trace": True})
    assert response.status_code == 200
    body = response.json()
    assert body["decision_support_only"] is True
    assert body["cited_internal_inputs"]
    assert body["provider"] == "mock"
    assert "Decision-support only" in body["answer"]
