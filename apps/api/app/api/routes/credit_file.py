from fastapi import APIRouter

from app.schemas.credit_file import CaseInboxResponse, CreditFileResponse, EvidenceMapResponse
from app.services.credit_file_service import get_case_inbox, get_credit_file, get_evidence_map
from app.services.transaction_summary_service import TransactionSummary, get_transaction_summary

router = APIRouter(tags=["credit-file"])


@router.get("/credit-file/{msme_id}", response_model=CreditFileResponse)
def credit_file(msme_id: str) -> CreditFileResponse:
    return get_credit_file(msme_id)


@router.get("/credit-file/{msme_id}/evidence-map", response_model=EvidenceMapResponse)
def evidence_map(msme_id: str) -> EvidenceMapResponse:
    return get_evidence_map(msme_id)


@router.get("/credit-file/{msme_id}/transaction-summary", response_model=TransactionSummary)
def transaction_summary(msme_id: str) -> TransactionSummary:
    return get_transaction_summary(msme_id)


@router.get("/case-inbox", response_model=CaseInboxResponse)
def case_inbox() -> CaseInboxResponse:
    return get_case_inbox()
