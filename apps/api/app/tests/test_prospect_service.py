from app.services.prospect_service import generate_prospect_signals
from app.services.synthetic_data_service import seed_demo_data


def setup_function():
    seed_demo_data(reset=True, seed=42, profile_count=9)


def test_prospect_service_ranks_healthy_growing_profile_higher():
    healthy = generate_prospect_signals("msme_004", persist=False)
    stressed = generate_prospect_signals("msme_008", persist=False)
    assert healthy.prospect_score > stressed.prospect_score
    assert healthy.priority.value in {"very_high", "high"}
