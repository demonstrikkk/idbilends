from app.db.repository import store
from app.services.scoring_service import generate_score
from app.services.synthetic_data_service import seed_demo_data


def setup_function():
    seed_demo_data(reset=True, seed=42, profile_count=9)


def test_score_range_0_to_100():
    for profile in store.list_profiles():
        score = generate_score(profile.id, persist=False)
        assert 0 <= score.score <= 100


def test_healthy_profile_scores_higher_than_stressed_profile():
    healthy = generate_score("msme_001", persist=False)
    stressed = generate_score("msme_008", persist=False)
    assert healthy.score > stressed.score


def test_missing_documents_reduce_data_confidence():
    healthy = generate_score("msme_001", persist=False)
    doc_gap = generate_score("msme_005", persist=False)
    assert doc_gap.data_confidence < healthy.data_confidence


def test_suspicious_spike_creates_warning():
    score = generate_score("msme_009", persist=False)
    warning_codes = {trigger.code for trigger in score.early_warning_triggers}
    assert "suspicious_spike_review" in warning_codes
    assert any("Revenue spike" in warning for warning in score.missing_data_warnings)


def test_suggested_credit_max_never_exceeds_requested_amount():
    for profile in store.list_profiles():
        score = generate_score(profile.id, persist=False)
        assert score.suggested_credit_max <= profile.requested_credit_amount


def test_high_risk_profile_gets_lower_suggested_credit_than_healthy_profile():
    healthy = generate_score("msme_001", persist=False)
    stressed = generate_score("msme_008", persist=False)
    assert stressed.suggested_credit_max < healthy.suggested_credit_max


def test_reason_codes_include_source_fields():
    score = generate_score("msme_001", persist=False)
    factors = score.positive_factors + score.negative_factors
    assert factors
    assert all(factor.source_fields for factor in factors)


def test_recommendation_never_uses_final_loan_language():
    forbidden = ("app" + "roved", "rej" + "ected", "guaran" + "teed")
    for profile in store.list_profiles():
        score = generate_score(profile.id, persist=False)
        text = f"{score.recommendation.value} {score.recommended_human_action}".lower()
        assert not any(word in text for word in forbidden)


def test_risk_tier_mapping_thresholds_are_represented():
    assert generate_score("msme_001", persist=False).risk_tier.value in {"very_low", "moderate_low"}
    assert generate_score("msme_008", persist=False).risk_tier.value in {"elevated", "high"}
