from fastapi import APIRouter, File, Form, Request, UploadFile

from app.schemas.credit_file import CaseInboxResponse, CreditFileResponse, EvidenceMapResponse, EvidenceRecord, EvidenceStatusUpdate, EvidenceUploadResponse
from app.services.credit_file_service import get_case_inbox, get_credit_file, get_evidence_map
from app.services.evidence_service import evidence_file_response, get_evidence_record, list_evidence_records, update_evidence_status, upload_evidence
from app.services.transaction_summary_service import TransactionSummary, get_transaction_summary

router = APIRouter(tags=["credit-file"])


@router.get("/credit-file/{msme_id}", response_model=CreditFileResponse)
def credit_file(msme_id: str) -> CreditFileResponse:
    return get_credit_file(msme_id)


@router.get("/credit-file/{msme_id}/evidence-map", response_model=EvidenceMapResponse)
def evidence_map(msme_id: str) -> EvidenceMapResponse:
    return get_evidence_map(msme_id)


@router.get("/credit-file/{msme_id}/evidence", response_model=list[EvidenceRecord])
def evidence_records(msme_id: str) -> list[EvidenceRecord]:
    return list_evidence_records(msme_id)


@router.post("/credit-file/{msme_id}/evidence/upload", response_model=EvidenceUploadResponse)
async def upload_evidence_record(
    msme_id: str,
    request: Request,
    file: UploadFile = File(...),
    source_type: str = Form(default="uploaded_document"),
    status: str = Form(default="partial"),
) -> EvidenceUploadResponse:
    return await upload_evidence(msme_id, file, source_type=source_type, status=status, request_id=request.state.request_id)


@router.get("/credit-file/{msme_id}/evidence/{evidence_id}", response_model=EvidenceRecord)
def evidence_record(msme_id: str, evidence_id: str) -> EvidenceRecord:
    return get_evidence_record(msme_id, evidence_id)


@router.get("/credit-file/{msme_id}/evidence/{evidence_id}/file")
def evidence_file(msme_id: str, evidence_id: str):
    return evidence_file_response(msme_id, evidence_id)


@router.patch("/credit-file/{msme_id}/evidence/{evidence_id}/status", response_model=EvidenceRecord)
def patch_evidence_status(msme_id: str, evidence_id: str, payload: EvidenceStatusUpdate, request: Request) -> EvidenceRecord:
    return update_evidence_status(msme_id, evidence_id, payload, request_id=request.state.request_id)


@router.get("/credit-file/{msme_id}/transaction-summary", response_model=TransactionSummary)
def transaction_summary(msme_id: str) -> TransactionSummary:
    return get_transaction_summary(msme_id)


@router.get("/case-inbox", response_model=CaseInboxResponse)
def case_inbox() -> CaseInboxResponse:
    return get_case_inbox()
