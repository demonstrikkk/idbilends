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


def test_seed_scales_to_1000_profiles_and_preserves_flagships():
    seed_demo_data(reset=True, seed=42, profile_count=9)
    flagship_names = [profile.business_name for profile in store.list_profiles()]
    response = seed_demo_data(reset=True, seed=42, profile_count=1000)
    profiles = store.list_profiles()
    assert response.profile_count == 1000
    assert [profile.business_name for profile in profiles[:9]] == flagship_names
    assert len({profile.id for profile in profiles}) == 1000
    assert all(profile.branch for profile in profiles)
    assert all(profile.sector_tags for profile in profiles)
