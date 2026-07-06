from app.db.repository import store
from app.services.synthetic_data_service import seed_demo_data


def test_seed_generates_required_scenarios_deterministically():
    first = seed_demo_data(reset=True, seed=42, profile_count=9)
    names = [profile.business_name for profile in store.list_profiles()]
    second = seed_demo_data(reset=True, seed=42, profile_count=9)
    names_again = [profile.business_name for profile in store.list_profiles()]
    assert first.profile_count == 9
    assert second.profile_count == 9
    assert names == names_again
    assert "suspicious_spike" in first.scenario_counts
    assert "debt_overload" in first.scenario_counts
