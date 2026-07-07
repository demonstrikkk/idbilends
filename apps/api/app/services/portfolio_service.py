from collections import Counter, defaultdict

from app.db.repository import store
from app.schemas.common import RiskTier
from app.schemas.msme import MSMEListItem
from app.schemas.portfolio import (
    AlertItem,
    AlertsResponse,
    ModelMonitorSnapshotResponse,
    PortfolioCase,
    PortfolioCasesResponse,
    PortfolioInsight,
    PortfolioInsightsResponse,
    PortfolioSummaryResponse,
    WatchlistResponse,
)
from app.services.prospect_service import generate_prospect_signals
from app.services.scoring_service import generate_score
from app.services.synthetic_data_service import ensure_seeded


def get_portfolio_cases() -> PortfolioCasesResponse:
    ensure_seeded()
    cases = [_case_for(profile.id) for profile in store.list_profiles()]
    cases.sort(key=lambda item: item.prospect.prospect_score, reverse=True)
    return PortfolioCasesResponse(items=cases)


def get_portfolio_summary() -> PortfolioSummaryResponse:
    cases = get_portfolio_cases().items
    scores = [case.score for case in cases]
    risk_distribution = Counter(score.risk_tier.value for score in scores)
    return PortfolioSummaryResponse(
        total_msmes=len(cases),
        average_health_score=_avg([score.score for score in scores]),
        high_priority_prospects=sum(1 for case in cases if case.prospect.priority.value in {"very_high", "high"}),
        review_required_cases=sum(1 for case in cases if _is_review_required(case)),
        low_confidence_cases=sum(1 for case in cases if case.score.data_confidence < 70),
        requested_exposure=sum(case.item.requested_credit_amount for case in cases),
        suggested_exposure_min=sum(case.score.suggested_credit_min for case in cases),
        suggested_exposure_max=sum(case.score.suggested_credit_max for case in cases),
        risk_distribution={tier.value: risk_distribution.get(tier.value, 0) for tier in RiskTier},
        rule_version=scores[0].rule_version if scores else "score_rules_v1",
    )


def get_watchlist() -> WatchlistResponse:
    watched = [case for case in get_portfolio_cases().items if _is_watched(case)]
    return WatchlistResponse(
        items=watched,
        total_watched_accounts=len(watched),
        escalated_cases=sum(1 for case in watched if case.score.risk_tier.value in {"elevated", "high"}),
        missing_document_signals=sum(len(case.score.missing_data_warnings) for case in watched),
        active_risk_signals=sum(len(case.score.early_warning_triggers) for case in watched),
    )


def get_alerts() -> AlertsResponse:
    cases = get_portfolio_cases().items
    alerts: list[AlertItem] = []
    for case in cases:
        for trigger in case.score.early_warning_triggers:
            severity = _alert_severity(trigger.code, trigger.severity)
            alerts.append(
                AlertItem(
                    id=f"{case.item.id}-{trigger.code}",
                    msme_id=case.item.id,
                    business_name=case.item.business_name,
                    location=f"{case.item.city}, {case.item.state}",
                    alert_type=trigger.code,
                    severity=severity,
                    recommended_human_action=case.score.recommended_human_action,
                    evidence=trigger.condition,
                )
            )
        for index, warning in enumerate(case.score.missing_data_warnings):
            severity = _warning_severity(warning, case.score.data_confidence)
            alerts.append(
                AlertItem(
                    id=f"{case.item.id}-missing-{index}",
                    msme_id=case.item.id,
                    business_name=case.item.business_name,
                    location=f"{case.item.city}, {case.item.state}",
                    alert_type="document_gap",
                    severity=severity,
                    recommended_human_action="Request missing or incomplete documents before relying on the signal.",
                    evidence=warning,
                )
            )
    return AlertsResponse(
        items=alerts,
        critical_or_high=sum(1 for item in alerts if item.severity in {"critical", "high"}),
        medium=sum(1 for item in alerts if item.severity == "medium"),
        low=sum(1 for item in alerts if item.severity == "low"),
        review_required_cases=sum(1 for case in cases if case.score.recommendation.value in {"review_required", "insufficient_data"}),
    )


def get_portfolio_insights() -> PortfolioInsightsResponse:
    cases = get_portfolio_cases().items
    return PortfolioInsightsResponse(
        total_borrowers=len(cases),
        average_health_score=_avg([case.score.score for case in cases]),
        average_prospect_score=_avg([case.prospect.prospect_score for case in cases]),
        average_data_confidence=_avg([case.score.data_confidence for case in cases]),
        requested_exposure=sum(case.item.requested_credit_amount for case in cases),
        warning_incidence_percent=_pct(sum(1 for case in cases if case.score.early_warning_triggers), len(cases)),
        segment_health_scores=_segment_stats(cases, "score"),
        segment_document_confidence=_segment_stats(cases, "confidence"),
        negative_factor_prevalence=_factor_prevalence(cases, negative_only=True),
    )


def get_model_monitor_snapshot() -> ModelMonitorSnapshotResponse:
    cases = get_portfolio_cases().items
    scores = [case.score for case in cases]
    return ModelMonitorSnapshotResponse(
        applications_scored=len(scores),
        average_score=_avg([score.score for score in scores]),
        high_or_elevated_risk_percent=_pct(sum(1 for score in scores if score.risk_tier.value in {"high", "elevated"}), len(scores)),
        average_data_confidence=_avg([score.data_confidence for score in scores]),
        decision_support_count=sum(1 for score in scores if score.decision_support_only),
        rule_version=scores[0].rule_version if scores else "score_rules_v1",
        confidence_distribution=_confidence_distribution(cases),
        reason_code_prevalence=_factor_prevalence(cases, negative_only=False),
    )


def _case_for(msme_id: str) -> PortfolioCase:
    profile = store.get_profile(msme_id)
    if profile is None:
        raise KeyError(msme_id)
    score = store.latest_score(msme_id) or generate_score(msme_id, persist=True, include_trace=True)
    prospect = store.latest_prospect(msme_id) or generate_prospect_signals(msme_id, persist=True)
    item = MSMEListItem(
        id=profile.id,
        business_name=profile.business_name,
        segment=profile.segment,
        scenario_label=profile.scenario_label,
        city=profile.city,
        state=profile.state,
        requested_credit_amount=profile.requested_credit_amount,
        monthly_revenue_avg=profile.financials.monthly_revenue_avg,
        health_score=score.score,
        risk_tier=score.risk_tier.value,
        prospect_score=prospect.prospect_score,
        prospect_priority=prospect.priority.value,
        data_confidence=score.data_confidence,
        recommended_human_action=score.recommended_human_action,
    )
    return PortfolioCase(item=item, score=score, prospect=prospect)


def _is_review_required(case: PortfolioCase) -> bool:
    return case.score.recommendation.value in {"review_required", "insufficient_data"} or case.score.risk_tier.value in {"elevated", "high"}


def _is_watched(case: PortfolioCase) -> bool:
    return (
        bool(case.score.early_warning_triggers)
        or case.score.data_confidence < 70
        or case.score.risk_tier.value in {"elevated", "high"}
        or any(token in warning.lower() for warning in case.score.missing_data_warnings for token in ["bank", "bureau", "itr", "gst"])
        or case.score.recommendation.value in {"review_required", "insufficient_data"}
    )


def _avg(values: list[int]) -> int:
    return round(sum(values) / len(values)) if values else 0


def _pct(count: int, total: int) -> int:
    return round((count / max(total, 1)) * 100)


def _alert_severity(code: str, severity: str) -> str:
    if "suspicious" in code or "debt_stress" in code:
        return "critical"
    if "revenue_drop" in code:
        return "critical" if severity == "high" else "medium"
    return severity if severity in {"low", "medium", "high"} else "low"


def _warning_severity(warning: str, confidence: int) -> str:
    if "bank statement" in warning.lower() or "gst" in warning.lower() or confidence < 60:
        return "medium"
    return "low"


def _segment_stats(cases: list[PortfolioCase], mode: str) -> list[PortfolioInsight]:
    groups: dict[str, list[PortfolioCase]] = defaultdict(list)
    for case in cases:
        groups[case.item.segment.value].append(case)
    insights: list[PortfolioInsight] = []
    for segment, rows in groups.items():
        value = _avg([row.score.score if mode == "score" else row.score.data_confidence for row in rows])
        insights.append(PortfolioInsight(label=segment, value=value, note=f"Derived from {len(rows)} current cases."))
    return sorted(insights, key=lambda item: item.value, reverse=True)


def _factor_prevalence(cases: list[PortfolioCase], negative_only: bool) -> list[PortfolioInsight]:
    counts: Counter[str] = Counter()
    for case in cases:
        factors = case.score.negative_factors if negative_only else [*case.score.positive_factors, *case.score.negative_factors]
        for factor in factors:
            counts[factor.label] += 1
    return [
        PortfolioInsight(label=label, value=_pct(count, len(cases)), note=f"Present in {count} current score outputs.")
        for label, count in counts.most_common(8)
    ]


def _confidence_distribution(cases: list[PortfolioCase]) -> list[PortfolioInsight]:
    buckets = [
        ("Very High (90-100)", 90, 100),
        ("High (75-89)", 75, 89),
        ("Medium (50-74)", 50, 74),
        ("Low (0-49)", 0, 49),
    ]
    return [
        PortfolioInsight(
            label=label,
            value=_pct(sum(1 for case in cases if low <= case.score.data_confidence <= high), len(cases)),
            note="Share of latest deterministic score outputs.",
        )
        for label, low, high in buckets
    ]
