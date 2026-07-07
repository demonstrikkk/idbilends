from app.agents.schemas import CopilotContext
from app.db.repository import store
from app.services.msme_service import get_msme
from app.services.prospect_service import generate_prospect_signals
from app.services.scoring_service import generate_score
from app.services.transaction_summary_service import get_transaction_summary


class CopilotContextBuilder:
    def build(self, msme_id: str) -> CopilotContext:
        profile = get_msme(msme_id)
        score = store.latest_score(msme_id) or generate_score(msme_id, persist=True, include_trace=True)
        prospect = store.latest_prospect(msme_id) or generate_prospect_signals(msme_id, persist=True)
        transaction_summary = get_transaction_summary(msme_id)

        sanitized_profile = {
            "id": profile.id,
            "business_name": profile.business_name,
            "segment": profile.segment.value,
            "scenario_label": profile.scenario_label.value,
            "city": profile.city,
            "state": profile.state,
            "business_vintage_months": profile.business_vintage_months,
            "employee_count": profile.employee_count,
            "requested_credit_amount": profile.requested_credit_amount,
            "documents": profile.documents.model_dump(mode="json"),
            "financial_snapshot": {
                "snapshot_month": profile.financials.snapshot_month,
                "monthly_revenue_avg": profile.financials.monthly_revenue_avg,
                "monthly_expense_avg": profile.financials.monthly_expense_avg,
                "average_bank_balance": profile.financials.average_bank_balance,
                "cash_inflow_volatility": profile.financials.cash_inflow_volatility,
                "revenue_growth_3m": profile.financials.revenue_growth_3m,
                "revenue_growth_6m": profile.financials.revenue_growth_6m,
                "emi_obligation": profile.financials.emi_obligation,
                "existing_debt": profile.financials.existing_debt,
                "bounce_count_3m": profile.financials.bounce_count_3m,
                "bounce_count_6m": profile.financials.bounce_count_6m,
                "gst_filing_regularity": profile.financials.gst_filing_regularity,
                "buyer_concentration": profile.financials.buyer_concentration,
                "digital_payment_ratio": profile.financials.digital_payment_ratio,
                "gem_order_completion_rate": profile.financials.gem_order_completion_rate,
                "invoice_delay_avg_days": profile.financials.invoice_delay_avg_days,
                "cash_deposit_ratio": profile.financials.cash_deposit_ratio,
                "revenue_spike_ratio": profile.financials.revenue_spike_ratio,
            },
        }
        score_dump = score.model_dump(mode="json")
        prospect_dump = prospect.model_dump(mode="json")
        cited_inputs = [
            f"msme_profile:{profile.id}",
            f"score_output:{score.id}",
            f"prospect_signal:{prospect.id}",
            f"transaction_summary:{profile.id}",
        ]
        return CopilotContext(
            msme_id=msme_id,
            profile=sanitized_profile,
            score=score_dump,
            risk_factors={
                "negative_factors": score_dump["negative_factors"],
                "early_warning_triggers": score_dump["early_warning_triggers"],
                "missing_data_warnings": score_dump["missing_data_warnings"],
            },
            missing_documents=list(profile.documents.missing_documents),
            transaction_summary=transaction_summary.model_dump(mode="json"),
            prospect_signals=prospect_dump,
            cited_internal_inputs=cited_inputs,
        )
