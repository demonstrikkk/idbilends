from uuid import uuid4

from fastapi import HTTPException

from app.db.repository import store
from app.schemas.common import DocumentAvailability, RecommendationCategory, RiskTier, utc_now
from app.schemas.msme import DocumentStatusSchema, MSMEDetail
from app.schemas.score import CalculationTraceItem, ScoreFactor, ScoreOutputSchema
from app.services.risk_service import get_early_warning_triggers
from app.services.score_history_service import record_score_history

RULE_VERSION = "score_rules_v1"
FORBIDDEN_FINAL_WORDS = ("app" + "roved", "rej" + "ected", "guaran" + "teed")


def _risk_tier(score: int) -> RiskTier:
    if score >= 85:
        return RiskTier.very_low
    if score >= 70:
        return RiskTier.moderate_low
    if score >= 55:
        return RiskTier.moderate
    if score >= 40:
        return RiskTier.elevated
    return RiskTier.high


def _round_50000(value: float) -> int:
    return max(0, int(round(value / 50000) * 50000))


def _factor(code: str, label: str, category: str, direction: str, impact: int, severity: str, evidence: str, fields: list[str]) -> ScoreFactor:
    return ScoreFactor(code=code, label=label, category=category, direction=direction, impact=impact, severity=severity, evidence=evidence, source_fields=fields)


def _document_confidence(documents: DocumentStatusSchema, suspicious_spike: bool) -> tuple[int, list[str]]:
    confidence = 100
    warnings: list[str] = []
    penalties = {
        "bank_statement": (documents.bank_statement, 25, 12, "Bank-statement-like data is missing or incomplete."),
        "gst_returns": (documents.gst_returns, 18, 8, "GST-like filing data is missing or partial."),
        "bureau_report": (documents.bureau_report, 10, 0, "Bureau-like report is missing."),
        "udyam": (documents.udyam, 6, 0, "Udyam-like registration signal is missing."),
        "itr": (documents.itr, 5, 0, "ITR-like document is missing."),
    }
    for _name, (status, missing_penalty, partial_penalty, warning) in penalties.items():
        if status == DocumentAvailability.missing:
            confidence -= missing_penalty
            warnings.append(warning)
        elif status in {DocumentAvailability.partial, DocumentAvailability.stale}:
            confidence -= partial_penalty or 8
            warnings.append(warning)
    if documents.stale_documents:
        confidence -= 12
        warnings.append("One or more key document signals are stale.")
    if suspicious_spike:
        confidence -= 10
        warnings.append("Revenue spike needs verification against order and payment evidence.")
    return max(0, min(100, confidence)), warnings


def generate_score(msme_id: str, persist: bool = True, include_trace: bool = True, event_id: str | None = None) -> ScoreOutputSchema:
    profile = store.get_profile(msme_id)
    if not profile:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})

    f = profile.financials
    d = profile.documents
    positives: list[ScoreFactor] = []
    negatives: list[ScoreFactor] = []
    trace: list[CalculationTraceItem] = []
    total = 0
    revenue = max(f.monthly_revenue_avg, 1)
    expense_ratio = f.monthly_expense_avg / revenue
    emi_ratio = f.emi_obligation / revenue
    debt_ratio = f.existing_debt / revenue
    suspicious_spike = (f.revenue_spike_ratio or 1.0) > 1.8 and (f.gem_order_completion_rate or 0.0) < 0.85

    cashflow = 0
    if expense_ratio < 0.75:
        cashflow += 8
        positives.append(_factor("healthy_expense_ratio", "Healthy expense ratio", "cashflow_strength", "positive", 8, "medium", "Average expenses remain below 75% of monthly revenue.", ["monthly_expense_avg", "monthly_revenue_avg"]))
    elif expense_ratio > 0.9:
        negatives.append(_factor("thin_operating_margin", "Thin operating margin", "cashflow_strength", "negative", -6, "high", "Average expenses exceed 90% of monthly revenue.", ["monthly_expense_avg", "monthly_revenue_avg"]))
    if f.average_bank_balance >= 0.2 * revenue:
        cashflow += 6
    if f.cash_inflow_volatility < 0.2:
        cashflow += 6
        positives.append(_factor("stable_cashflow", "Stable monthly inflows", "cashflow_strength", "positive", 6, "medium", "Cash inflow volatility is below 20%.", ["cash_inflow_volatility"]))
    elif f.cash_inflow_volatility <= 0.35:
        cashflow += 3
    else:
        negatives.append(_factor("volatile_cashflow", "Volatile cashflow", "cashflow_strength", "negative", -6, "medium", "Cash inflow volatility is above the expected range.", ["cash_inflow_volatility"]))
    if revenue > 5 * max(f.emi_obligation, 1):
        cashflow += 5
    total += min(cashflow, 25)
    trace.append(CalculationTraceItem(component="cashflow_strength", max_points=25, awarded_points=min(cashflow, 25), source_fields=["monthly_revenue_avg", "monthly_expense_avg", "average_bank_balance", "cash_inflow_volatility"], notes="Evaluated revenue quality, balance cushion, volatility, and EMI coverage."))

    growth = 0
    if 0.05 <= f.revenue_growth_6m <= 0.25:
        growth += 6
        positives.append(_factor("measured_revenue_growth", "Measured six-month revenue growth", "growth_resilience", "positive", 6, "medium", "Six-month revenue growth is positive without being extreme.", ["revenue_growth_6m"]))
    elif f.revenue_growth_6m < -0.2:
        negatives.append(_factor("declining_revenue", "Declining revenue", "growth_resilience", "negative", -7, "high", "Six-month revenue trend is materially negative.", ["revenue_growth_6m"]))
    elif f.revenue_growth_6m > 0.7:
        negatives.append(_factor("extreme_growth_needs_review", "Extreme growth needs review", "suspicious_pattern", "negative", -8, "high", "Growth is unusually high and should be matched to order/payment evidence.", ["revenue_growth_6m", "revenue_spike_ratio"]))
    if 0 < f.revenue_growth_3m <= 0.3:
        growth += 4
    if profile.business_vintage_months > 36:
        growth += 3
    if profile.scenario_label in {"healthy_growth", "stable_moderate"}:
        growth += 2
    total += min(growth, 15)
    trace.append(CalculationTraceItem(component="growth_resilience", max_points=15, awarded_points=min(growth, 15), source_fields=["revenue_growth_3m", "revenue_growth_6m", "business_vintage_months"], notes="Evaluated measured growth, vintage, and scenario stability."))

    repayment = 0
    if emi_ratio < 0.12:
        repayment += 8
    elif emi_ratio <= 0.22:
        repayment += 4
    else:
        negatives.append(_factor("emi_burden", "Elevated EMI burden", "repayment_stress", "negative", -8, "high", "EMI obligation consumes a high share of monthly revenue.", ["emi_obligation", "monthly_revenue_avg"]))
    if f.bounce_count_6m == 0:
        repayment += 6
        positives.append(_factor("clean_bounce_behavior", "Clean recent bounce behavior", "repayment_stress", "positive", 6, "medium", "No payment bounces observed in the last six months.", ["bounce_count_6m"]))
    elif f.bounce_count_6m <= 2:
        repayment += 3
    else:
        negatives.append(_factor("bounce_stress", "Payment bounce stress", "repayment_stress", "negative", -8, "high", "Multiple payment bounces observed in six months.", ["bounce_count_6m"]))
    if debt_ratio < 1.5:
        repayment += 6
    else:
        negatives.append(_factor("debt_overload", "Debt overload", "repayment_stress", "negative", -8, "high", "Existing debt is high relative to monthly revenue.", ["existing_debt", "monthly_revenue_avg"]))
    total += min(repayment, 20)
    trace.append(CalculationTraceItem(component="repayment_stress", max_points=20, awarded_points=min(repayment, 20), source_fields=["emi_obligation", "existing_debt", "bounce_count_6m"], notes="Evaluated EMI burden, debt load, and bounce behavior."))

    concentration = 0
    if f.buyer_concentration < 0.3:
        concentration += 5
    elif f.buyer_concentration <= 0.5:
        concentration += 2
    else:
        negatives.append(_factor("buyer_concentration", "High buyer concentration", "business_concentration", "negative", -7, "medium", "Top buyer concentration exceeds prudent monitoring threshold.", ["buyer_concentration"]))
    if f.invoice_delay_avg_days < 20:
        concentration += 4
    elif f.invoice_delay_avg_days <= 40:
        concentration += 2
    else:
        negatives.append(_factor("invoice_delay", "Delayed invoice collections", "business_concentration", "negative", -5, "medium", "Average invoice realization is delayed.", ["invoice_delay_avg_days"]))
    order_completion = f.gem_order_completion_rate or 0.8
    if order_completion > 0.9:
        concentration += 6
        positives.append(_factor("strong_order_completion", "Strong order completion", "business_concentration", "positive", 6, "medium", "Order completion rate is above 90%.", ["gem_order_completion_rate"]))
    elif order_completion >= 0.75:
        concentration += 3
    total += min(concentration, 15)
    trace.append(CalculationTraceItem(component="business_concentration", max_points=15, awarded_points=min(concentration, 15), source_fields=["buyer_concentration", "invoice_delay_avg_days", "gem_order_completion_rate"], notes="Evaluated concentration, collections, and order completion."))

    compliance = 0
    if f.gst_filing_regularity > 0.9:
        compliance += 5
    elif f.gst_filing_regularity >= 0.75:
        compliance += 3
    else:
        negatives.append(_factor("gst_irregularity", "GST-like filing irregularity", "compliance_discipline", "negative", -5, "medium", "GST-like filing regularity is below 75%.", ["gst_filing_regularity"]))
    if d.bank_statement == DocumentAvailability.available:
        compliance += 4
    if d.bureau_report == DocumentAvailability.available:
        compliance += 2
    if d.udyam == DocumentAvailability.available:
        compliance += 2
    if f.digital_payment_ratio > 0.65:
        compliance += 2
        positives.append(_factor("digital_payment_depth", "Strong digital payment share", "compliance_discipline", "positive", 2, "low", "Digital receipts form a healthy share of observed payments.", ["digital_payment_ratio"]))
    total += min(compliance, 15)
    trace.append(CalculationTraceItem(component="compliance_discipline", max_points=15, awarded_points=min(compliance, 15), source_fields=["gst_filing_regularity", "digital_payment_ratio"], notes="Evaluated filing discipline, documents, and digital payment depth."))

    fraud = 0
    if not suspicious_spike:
        fraud += 4
    else:
        negatives.append(_factor("suspicious_revenue_spike", "Suspicious revenue spike", "suspicious_pattern", "negative", -10, "high", "Revenue spike exceeds expected range without matching order support.", ["revenue_spike_ratio", "gem_order_completion_rate"]))
    if (f.cash_deposit_ratio or 0.0) < 0.35:
        fraud += 3
    if f.revenue_growth_6m <= 0.7 or f.digital_payment_ratio > 0.65 or order_completion > 0.9:
        fraud += 3
    total += min(fraud, 10)
    trace.append(CalculationTraceItem(component="suspicious_pattern", max_points=10, awarded_points=min(fraud, 10), source_fields=["revenue_spike_ratio", "cash_deposit_ratio", "digital_payment_ratio"], notes="Evaluated spike, cash-heavy pattern, and support signals."))

    data_confidence, warnings = _document_confidence(d, suspicious_spike)
    score = max(0, min(100, total))
    tier = _risk_tier(score)
    confidence_multiplier = 1.0 if data_confidence >= 85 else 0.85 if data_confidence >= 70 else 0.6 if data_confidence >= 50 else 0.3
    risk_multiplier = {RiskTier.very_low: 1.0, RiskTier.moderate_low: 0.85, RiskTier.moderate: 0.65, RiskTier.elevated: 0.4, RiskTier.high: 0.2}[tier]
    base_capacity = min(revenue * 2.0, f.average_bank_balance * 6.0, revenue * max(0.5, 1.5 - emi_ratio))
    suggested_max = min(profile.requested_credit_amount, _round_50000(base_capacity * risk_multiplier * confidence_multiplier))
    suggested_min = _round_50000(suggested_max * 0.75)

    recommendation = _recommendation(score, data_confidence, suspicious_spike)
    action = _human_action(recommendation, tier, warnings, score, data_confidence)
    assert not any(word in action.lower() for word in FORBIDDEN_FINAL_WORDS)

    output = ScoreOutputSchema(
        id=f"score_{uuid4().hex[:10]}",
        msme_id=msme_id,
        score=score,
        risk_tier=tier,
        data_confidence=data_confidence,
        suggested_credit_min=suggested_min,
        suggested_credit_max=suggested_max,
        requested_credit_amount=profile.requested_credit_amount,
        recommendation=recommendation,
        recommended_human_action=action,
        decision_support_only=True,
        positive_factors=positives[:4],
        negative_factors=negatives[:4],
        missing_data_warnings=warnings,
        early_warning_triggers=get_early_warning_triggers(f),
        calculation_trace=trace if include_trace else [],
        rule_version=RULE_VERSION,
        created_at=utc_now(),
    )
    if persist:
        previous = store.latest_score(msme_id)
        store.add_score(output)
        record_score_history(output, previous, event_id=event_id)
    return output


def _recommendation(score: int, confidence: int, suspicious_spike: bool) -> RecommendationCategory:
    if confidence < 50:
        return RecommendationCategory.insufficient_data
    if suspicious_spike and confidence < 70:
        return RecommendationCategory.review_required
    if score >= 70 and confidence >= 75:
        return RecommendationCategory.consider_with_conditions
    if score >= 55 and confidence >= 65:
        return RecommendationCategory.review_required
    if score >= 40:
        return RecommendationCategory.consider_lower_limit
    return RecommendationCategory.not_recommended_without_rework


def _human_action(recommendation: RecommendationCategory, tier: RiskTier, warnings: list[str], score: int = 0, confidence: int = 0) -> str:
    if recommendation == RecommendationCategory.insufficient_data:
        return f"Score {score} with data confidence {confidence}% is too low for any credit action. Request missing or stale evidence (bank statement, GST returns, bureau report, ITR) to enable deterministic scoring."
    if recommendation == RecommendationCategory.not_recommended_without_rework:
        return f"Score {score} (risk tier {tier.value}) with confidence {confidence}%. Require senior human review of repayment stress (bounce count, EMI-to-revenue ratio) and evidence gaps before any credit discussion."
    if recommendation == RecommendationCategory.consider_lower_limit:
        return f"Score {score} (risk tier {tier.value}) with confidence {confidence}%. Consider a lower working-capital limit after verifying risk triggers: bounce count, buyer concentration, and invoice delay."
    if warnings:
        return f"Score {score} (risk tier {tier.value}) with confidence {confidence}%. Resolve evidence items ({'; '.join(warnings[:2])}) and verify signal consistency before offering a moderated working-capital limit."
    if tier in {RiskTier.very_low, RiskTier.moderate_low}:
        return f"Score {score} (risk tier {tier.value}) with confidence {confidence}%. Conduct standard document verification (bank statement, GST) and policy checks before proceeding with a working-capital review."
    return f"Score {score} (risk tier {tier.value}) with confidence {confidence}%. Route for detailed human credit review with focus on repayment stress (EMI-to-revenue, bounce behavior) and data quality (missing or partial evidence)."
