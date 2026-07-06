from pydantic import BaseModel


class TransactionSummaryPlaceholder(BaseModel):
    msme_id: str
    status: str = "deferred_to_phase_3"
    note: str = "Transaction summary payload will be backed by synthetic bank-statement-like series in the Credit Copilot phase."


def get_transaction_summary_placeholder(msme_id: str) -> TransactionSummaryPlaceholder:
    return TransactionSummaryPlaceholder(msme_id=msme_id)
