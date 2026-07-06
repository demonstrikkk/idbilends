from app.schemas.msme import FinancialSnapshotSchema
from app.schemas.score import EarlyWarningTrigger


def get_early_warning_triggers(financials: FinancialSnapshotSchema) -> list[EarlyWarningTrigger]:
    triggers: list[EarlyWarningTrigger] = []
    revenue = max(financials.monthly_revenue_avg, 1)
    emi_ratio = financials.emi_obligation / revenue

    if financials.revenue_growth_3m < -0.15:
        triggers.append(EarlyWarningTrigger(code="revenue_drop_watch", label="Revenue drop watch", severity="medium", condition="Revenue growth over three months is below -15%."))
    if financials.buyer_concentration > 0.5:
        triggers.append(EarlyWarningTrigger(code="buyer_concentration_watch", label="Buyer concentration watch", severity="medium", condition="Top buyer concentration exceeds 50%."))
    if financials.bounce_count_3m >= 2:
        triggers.append(EarlyWarningTrigger(code="bounce_behavior_watch", label="Bounce behavior watch", severity="high", condition="Two or more payment bounces observed in the last three months."))
    if financials.gst_filing_regularity < 0.75:
        triggers.append(EarlyWarningTrigger(code="gst_delay_watch", label="GST-like filing delay watch", severity="medium", condition="GST-like filing regularity is below 75%."))
    if emi_ratio > 0.25:
        triggers.append(EarlyWarningTrigger(code="debt_stress_watch", label="Debt stress watch", severity="high", condition="Monthly EMI burden exceeds 25% of monthly revenue."))
    if (financials.revenue_spike_ratio or 1.0) > 1.8:
        triggers.append(EarlyWarningTrigger(code="suspicious_spike_review", label="Suspicious revenue spike review", severity="high", condition="Latest revenue spike exceeds 1.8x baseline and needs verification."))
    if financials.invoice_delay_avg_days > 45:
        triggers.append(EarlyWarningTrigger(code="invoice_delay_watch", label="Invoice delay watch", severity="medium", condition="Average invoice collection delay exceeds 45 days."))

    return triggers
