from uuid import uuid4

from fastapi import HTTPException

from app.db.repository import store
from app.schemas.common import ProspectPriority, RiskTier, utc_now
from app.schemas.prospect import ProspectSignal, ProspectSignalOutputSchema
from app.services.scoring_service import generate_score


def generate_prospect_signals(msme_id: str, persist: bool = True) -> ProspectSignalOutputSchema:
    profile = store.get_profile(msme_id)
    if not profile:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})

    score = store.latest_score(msme_id) or generate_score(msme_id, persist=True)
    f = profile.financials
    prospect_score = 35
    signals: list[ProspectSignal] = []

    if f.revenue_growth_6m > 0.08:
        prospect_score += 18
        signals.append(ProspectSignal(code="rising_revenue", label="Six-month revenue growth", direction="positive", confidence=0.82, evidence=f"Revenue growth over six months is {round(f.revenue_growth_6m * 100)}%."))
    elif f.revenue_growth_6m < -0.15:
        prospect_score -= 12
        signals.append(ProspectSignal(code="declining_revenue", label="Revenue decline", direction="negative", confidence=0.78, evidence="Revenue trend is negative and requires human review."))

    if profile.business_vintage_months >= 36:
        prospect_score += 10
        signals.append(ProspectSignal(code="established_vintage", label="Established business vintage", direction="positive", confidence=0.75, evidence="Business vintage exceeds 36 months."))
    if f.digital_payment_ratio > 0.65:
        prospect_score += 10
        signals.append(ProspectSignal(code="digital_payment_depth", label="Digital payment depth", direction="positive", confidence=0.8, evidence="Digital payment share supports cleaner cashflow assessment."))
    if score.risk_tier in {RiskTier.very_low, RiskTier.moderate_low}:
        prospect_score += 15
        signals.append(ProspectSignal(code="usable_credit_readiness", label="Usable credit-readiness profile", direction="positive", confidence=0.78, evidence=f"Risk tier is {score.risk_tier.value} with {score.data_confidence}% data confidence."))
    elif score.risk_tier in {RiskTier.elevated, RiskTier.high}:
        prospect_score -= 18
        signals.append(ProspectSignal(code="risk_review_needed", label="Risk review needed", direction="negative", confidence=0.82, evidence="Risk tier requires cautious relationship action."))
    if score.data_confidence < 65:
        prospect_score -= 12
        signals.append(ProspectSignal(code="document_gap", label="Document gap", direction="negative", confidence=0.85, evidence="Data confidence is reduced by missing or stale documents."))
    if profile.segment in {"digital_seller", "gem_like_seller"} and (f.gem_order_completion_rate or 0) > 0.88:
        prospect_score += 10
        signals.append(ProspectSignal(code="order_platform_strength", label="Order platform strength", direction="positive", confidence=0.76, evidence="Order completion signal supports working-capital need."))

    prospect_score = max(0, min(100, prospect_score))
    priority = _priority(prospect_score)
    likely_need, product_fit = _need_and_product(profile.segment.value, f.revenue_growth_6m)
    next_action = _next_action(priority, score.data_confidence)
    output = ProspectSignalOutputSchema(
        id=f"prospect_{uuid4().hex[:10]}",
        msme_id=msme_id,
        prospect_score=prospect_score,
        priority=priority,
        likely_credit_need=likely_need,
        best_product_fit=product_fit,
        next_best_action=next_action,
        outreach_timing="within_7_days" if priority in {ProspectPriority.very_high, ProspectPriority.high} else "after_document_review",
        signals=signals,
        created_at=utc_now(),
    )
    if persist:
        store.add_prospect(output)
    return output


def _priority(score: int) -> ProspectPriority:
    if score >= 85:
        return ProspectPriority.very_high
    if score >= 70:
        return ProspectPriority.high
    if score >= 55:
        return ProspectPriority.medium
    if score >= 40:
        return ProspectPriority.low
    return ProspectPriority.not_ready


def _need_and_product(segment: str, growth_6m: float) -> tuple[str, str]:
    if segment in {"digital_seller", "gem_like_seller"}:
        return "working_capital", "invoice_or_purchase_order_finance"
    if growth_6m > 0.1:
        return "growth_working_capital", "msme_working_capital"
    if segment == "small_manufacturer":
        return "machinery_or_inventory_finance", "secured_msme_term_loan"
    return "working_capital", "msme_working_capital"


def _next_action(priority: ProspectPriority, confidence: int) -> str:
    if confidence < 65:
        return "Request missing documents before a credit-limit conversation."
    if priority in {ProspectPriority.very_high, ProspectPriority.high}:
        return "Schedule relationship-manager outreach and prepare a moderated working-capital review."
    if priority == ProspectPriority.medium:
        return "Keep in nurture queue and verify latest financial signals."
    return "Defer outreach until risk and document gaps are reviewed."
