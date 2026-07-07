from pydantic import BaseModel

from app.services.msme_service import get_msme


class TransactionSummary(BaseModel):
    msme_id: str
    snapshot_month: str
    monthly_revenue_avg: int
    monthly_expense_avg: int
    net_monthly_surplus_estimate: int
    average_bank_balance: int
    emi_to_revenue_ratio: float
    cash_inflow_volatility: float
    digital_payment_ratio: float
    bounce_count_3m: int
    invoice_delay_avg_days: int
    notes: list[str]


def get_transaction_summary(msme_id: str) -> TransactionSummary:
    profile = get_msme(msme_id)
    financials = profile.financials
    revenue = max(financials.monthly_revenue_avg, 1)
    notes: list[str] = []
    if financials.cash_inflow_volatility > 0.35:
        notes.append("Cash inflow volatility is above the expected range.")
    if financials.bounce_count_3m:
        notes.append(f"{financials.bounce_count_3m} payment bounce signal(s) observed in the last three months.")
    if financials.invoice_delay_avg_days > 40:
        notes.append("Invoice realization is slower than preferred for working-capital review.")
    if not notes:
        notes.append("Synthetic transaction indicators do not show acute short-term stress.")

    return TransactionSummary(
        msme_id=msme_id,
        snapshot_month=financials.snapshot_month,
        monthly_revenue_avg=financials.monthly_revenue_avg,
        monthly_expense_avg=financials.monthly_expense_avg,
        net_monthly_surplus_estimate=financials.monthly_revenue_avg - financials.monthly_expense_avg - financials.emi_obligation,
        average_bank_balance=financials.average_bank_balance,
        emi_to_revenue_ratio=round(financials.emi_obligation / revenue, 4),
        cash_inflow_volatility=financials.cash_inflow_volatility,
        digital_payment_ratio=financials.digital_payment_ratio,
        bounce_count_3m=financials.bounce_count_3m,
        invoice_delay_avg_days=financials.invoice_delay_avg_days,
        notes=notes,
    )
