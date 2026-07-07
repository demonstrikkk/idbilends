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
    assert body["evidence_records"]
    assert body["evidence_records"][0]["preview_text"]
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
    assert any(item.startswith("evidence:") for item in body["cited_internal_inputs"])


def test_command_center_cases_support_pagination_filters_and_facets():
    response = client.post("/demo/seed", json={"reset": True, "seed": 42, "profile_count": 1000})
    assert response.status_code == 200
    page = client.get("/command-center/cases?limit=25&offset=0&saved_view=missing_evidence&sort=confidence_asc")
    assert page.status_code == 200
    body = page.json()
    assert body["total"] >= len(body["items"])
    assert body["limit"] == 25
    assert body["counts_by_saved_view"]["all_active_files"] == 1000
    assert body["available_facets"]["risk_tier"]
    assert all(item["missing_evidence_count"] > 0 for item in body["items"])
    first = body["items"][0]
    assert {"msme_id", "policy_score", "score_delta", "top_blocker", "recommended_human_action"} <= set(first)


def test_evidence_list_detail_file_upload_and_status_update():
    seed()
    listing = client.get("/credit-file/msme_001/evidence")
    assert listing.status_code == 200
    evidence = listing.json()[0]
    detail = client.get(f"/credit-file/msme_001/evidence/{evidence['id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == evidence["id"]

    file_response = client.get(f"/credit-file/msme_001/evidence/{evidence['id']}/file")
    assert file_response.status_code == 200
    assert "Evidence ID" in file_response.text

    upload = client.post(
        "/credit-file/msme_001/evidence/upload",
        files={"file": ("uploaded-note.txt", b"Uploaded statement note for test.", "text/plain")},
        data={"source_type": "bank_statement", "status": "partial"},
    )
    assert upload.status_code == 200
    uploaded = upload.json()["record"]
    assert uploaded["preview_text"] == "Uploaded statement note for test."
    assert upload.json()["audit_event_id"]

    patch = client.patch(f"/credit-file/msme_001/evidence/{uploaded['id']}/status", json={"status": "available"})
    assert patch.status_code == 200
    assert patch.json()["status"] == "available"
