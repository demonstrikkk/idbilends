from uuid import uuid4

from app.db.repository import store
from app.schemas.score import (
    CalculationTraceItem,
    ScoreChangeReason,
    ScoreDelta,
    ScoreHistoryEntry,
    ScoreMovementItem,
    ScoreMovementsResponse,
    ScoreOutputSchema,
)


def record_score_history(score: ScoreOutputSchema, previous: ScoreOutputSchema | None, event_id: str | None = None) -> ScoreHistoryEntry:
    delta = build_score_delta(score, previous)
    entry = ScoreHistoryEntry(
        id=f"history_{uuid4().hex[:10]}",
        msme_id=score.msme_id,
        score_id=score.id,
        event_id=event_id,
        previous_score=delta.previous_score,
        new_score=delta.new_score,
        delta=delta.delta,
        previous_risk_tier=delta.previous_risk_tier,
        new_risk_tier=delta.new_risk_tier,
        changed_components=delta.changed_components,
        changed_features=delta.changed_features,
        reasons=delta.reasons,
        rule_version=score.rule_version,
        created_at=score.created_at,
    )
    store.add_score_history(entry)
    return entry


def build_score_delta(score: ScoreOutputSchema, previous: ScoreOutputSchema | None) -> ScoreDelta:
    changed_components = _changed_components(score.calculation_trace, previous.calculation_trace if previous else [])
    changed_features = sorted({field for item in score.calculation_trace for field in item.source_fields if item.component in changed_components})
    reasons = _reasons(score, previous, changed_components)
    return ScoreDelta(
        previous_score=previous.score if previous else None,
        new_score=score.score,
        delta=score.score - previous.score if previous else 0,
        previous_risk_tier=previous.risk_tier if previous else None,
        new_risk_tier=score.risk_tier,
        changed_components=changed_components,
        changed_features=changed_features,
        reasons=reasons,
    )


def get_score_history(msme_id: str) -> list[ScoreHistoryEntry]:
    return sorted(store.list_score_history(msme_id), key=lambda item: item.created_at, reverse=True)


def get_latest_delta(msme_id: str) -> ScoreHistoryEntry | None:
    return store.latest_score_history(msme_id)


def get_score_movements(min_delta: int = 5, limit: int = 100) -> ScoreMovementsResponse:
    movements: list[ScoreMovementItem] = []
    for profile in store.list_profiles():
        for entry in store.list_score_history(profile.id):
            if abs(entry.delta) < min_delta:
                continue
            reason = entry.reasons[0].detail if entry.reasons else "Score changed after monitored borrower signals were recomputed."
            movements.append(
                ScoreMovementItem(
                    msme_id=profile.id,
                    business_name=profile.business_name,
                    segment=profile.segment.value,
                    city=profile.city,
                    branch=profile.branch,
                    previous_score=entry.previous_score,
                    new_score=entry.new_score,
                    delta=entry.delta,
                    previous_risk_tier=entry.previous_risk_tier,
                    new_risk_tier=entry.new_risk_tier,
                    reason=reason,
                    event_id=entry.event_id,
                    created_at=entry.created_at,
                )
            )
    movements.sort(key=lambda item: (abs(item.delta), item.created_at), reverse=True)
    return ScoreMovementsResponse(items=movements[:limit])


def _changed_components(current: list[CalculationTraceItem], previous: list[CalculationTraceItem]) -> list[str]:
    previous_points = {item.component: item.awarded_points for item in previous}
    changed = [item.component for item in current if previous_points.get(item.component) != item.awarded_points]
    return changed or [current[0].component] if current else []


def _reasons(score: ScoreOutputSchema, previous: ScoreOutputSchema | None, changed_components: list[str]) -> list[ScoreChangeReason]:
    if previous is None:
        return [
            ScoreChangeReason(
                code="initial_score_snapshot",
                label="Initial score snapshot",
                direction="neutral",
                detail="Initial deterministic score snapshot captured for monitoring baseline.",
                source_fields=["score", "risk_tier"],
            )
        ]
    direction = "improved" if score.score > previous.score else "deteriorated" if score.score < previous.score else "neutral"
    factors = score.positive_factors if direction == "improved" else score.negative_factors
    if factors:
        factor = factors[0]
        return [
            ScoreChangeReason(
                code=factor.code,
                label=factor.label,
                direction=direction,
                detail=factor.evidence,
                source_fields=factor.source_fields,
            )
        ]
    component = changed_components[0] if changed_components else "score"
    return [
        ScoreChangeReason(
            code=f"{component}_changed",
            label=f"{component.replace('_', ' ').title()} changed",
            direction=direction,
            detail="Deterministic component points changed after borrower features were recomputed.",
            source_fields=[component],
        )
    ]
