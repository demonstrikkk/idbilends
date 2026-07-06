from fastapi import HTTPException

from app.db.repository import store
from app.schemas.common import Pagination
from app.schemas.msme import MSMEDetail, MSMEListItem, MSMEListResponse
from app.services.synthetic_data_service import ensure_seeded


def get_msme(msme_id: str) -> MSMEDetail:
    ensure_seeded()
    profile = store.get_profile(msme_id)
    if not profile:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})
    return profile


def list_msmes(
    segment: str | None = None,
    scenario_label: str | None = None,
    risk_tier: str | None = None,
    prospect_priority: str | None = None,
    search: str | None = None,
    limit: int = 20,
    offset: int = 0,
    sort: str = "prospect_score_desc",
) -> MSMEListResponse:
    ensure_seeded()
    profiles = store.list_profiles()
    items: list[MSMEListItem] = []
    for profile in profiles:
        score = store.latest_score(profile.id)
        prospect = store.latest_prospect(profile.id)
        if segment and profile.segment.value != segment:
            continue
        if scenario_label and profile.scenario_label.value != scenario_label:
            continue
        if risk_tier and (not score or score.risk_tier.value != risk_tier):
            continue
        if prospect_priority and (not prospect or prospect.priority.value != prospect_priority):
            continue
        if search:
            haystack = f"{profile.business_name} {profile.city} {profile.state}".lower()
            if search.lower() not in haystack:
                continue
        items.append(
            MSMEListItem(
                id=profile.id,
                business_name=profile.business_name,
                segment=profile.segment,
                scenario_label=profile.scenario_label,
                city=profile.city,
                state=profile.state,
                requested_credit_amount=profile.requested_credit_amount,
                monthly_revenue_avg=profile.financials.monthly_revenue_avg,
                health_score=score.score if score else None,
                risk_tier=score.risk_tier.value if score else None,
                prospect_score=prospect.prospect_score if prospect else None,
                prospect_priority=prospect.priority.value if prospect else None,
                data_confidence=score.data_confidence if score else None,
                recommended_human_action=score.recommended_human_action if score else None,
            )
        )
    if sort == "score_desc":
        items.sort(key=lambda item: item.health_score or -1, reverse=True)
    elif sort == "risk_desc":
        order = {"high": 5, "elevated": 4, "moderate": 3, "moderate_low": 2, "very_low": 1}
        items.sort(key=lambda item: order.get(item.risk_tier or "", 0), reverse=True)
    elif sort == "created_desc":
        items.sort(key=lambda item: item.id, reverse=True)
    else:
        items.sort(key=lambda item: item.prospect_score or -1, reverse=True)
    total = len(items)
    page = items[offset : offset + limit]
    return MSMEListResponse(items=page, pagination=Pagination(total=total, limit=limit, offset=offset, has_more=offset + limit < total))
