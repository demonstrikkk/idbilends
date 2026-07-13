from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse, PlainTextResponse

from app.db.repository import store
from app.schemas.common import DocumentAvailability, utc_now
from app.schemas.credit_file import EvidenceExtractedSignal, EvidenceRecord, EvidenceStatusUpdate, EvidenceType, EvidenceUploadResponse
from app.services.audit_service import create_audit_event
from app.services.synthetic_data_service import ensure_seeded

STORAGE_DIR = Path(__file__).resolve().parents[2] / "demo_storage" / "evidence"


def list_evidence_records(msme_id: str) -> list[EvidenceRecord]:
    ensure_seeded()
    if store.get_profile(msme_id) is None:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})
    _seed_evidence_for_case(msme_id)
    return [EvidenceRecord.model_validate(item) for item in store.list_evidence_records(msme_id)]


def get_evidence_record(msme_id: str, evidence_id: str) -> EvidenceRecord:
    for record in list_evidence_records(msme_id):
        if record.id == evidence_id:
            return record
    raise HTTPException(status_code=404, detail={"code": "EVIDENCE_NOT_FOUND", "message": "Evidence record was not found for this credit file."})


async def upload_evidence(msme_id: str, file: UploadFile, source_type: str = "uploaded_document", status: str = "partial", request_id: str | None = None) -> EvidenceUploadResponse:
    ensure_seeded()
    if store.get_profile(msme_id) is None:
        raise HTTPException(status_code=404, detail={"code": "MSME_NOT_FOUND", "message": "MSME profile was not found."})
    content = await file.read()
    if len(content) > 2_500_000:
        raise HTTPException(status_code=413, detail={"code": "EVIDENCE_FILE_TOO_LARGE", "message": "Demo evidence upload limit is 2.5 MB."})
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = Path(file.filename or "uploaded-evidence.txt").name.replace(" ", "_")
    evidence_id = f"ev_{uuid4().hex[:10]}"
    storage_path = STORAGE_DIR / f"{msme_id}_{evidence_id}_{safe_name}"
    storage_path.write_bytes(content)
    preview_text = _preview_from_bytes(content, file.content_type or "application/octet-stream", safe_name)
    record = EvidenceRecord(
        id=evidence_id,
        msme_id=msme_id,
        evidence_type=_evidence_type_for_source(source_type),
        title=safe_name,
        source=f"uploaded_by_demo_credit_officer",
        source_type=source_type,
        document_name=safe_name,
        status=status if status in DocumentAvailability._value2member_map_ else "partial",
        content_type=file.content_type or "application/octet-stream",
        file_name=safe_name,
        file_size=len(content),
        storage_path=str(storage_path),
        preview_text=preview_text,
        extracted_signals=_demo_signals(source_type, status, safe_name),
        extraction_status="extracted",
        confidence_impact=_impact_for_source(source_type, status),
        risk_impact=_risk_impact_for_status(status),
        related_score_components=_components_for_source(source_type),
        lending_question=_lending_question_for_source(source_type),
        source_mapping=[f"uploaded_file:{safe_name}", f"credit_file:{msme_id}", f"evidence:{evidence_id}"],
        uploaded_by="demo_credit_officer",
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    store.upsert_evidence_record(msme_id, record)
    audit = create_audit_event("evidence_uploaded", msme_id, {"evidence_id": record.id, "source_type": source_type, "status": record.status, "success": True}, request_id=request_id)
    record.audit_event_id = audit.id
    store.upsert_evidence_record(msme_id, record)
    return EvidenceUploadResponse(record=record, audit_event_id=audit.id)


def update_evidence_status(msme_id: str, evidence_id: str, payload: EvidenceStatusUpdate, request_id: str | None = None) -> EvidenceRecord:
    record = get_evidence_record(msme_id, evidence_id)
    updated = record.model_copy(update={"status": payload.status, "updated_at": utc_now()})
    store.upsert_evidence_record(msme_id, updated)
    create_audit_event("evidence_status_updated", msme_id, {"evidence_id": evidence_id, "status": payload.status, "success": True}, request_id=request_id)
    return updated


def evidence_file_response(msme_id: str, evidence_id: str):
    record = get_evidence_record(msme_id, evidence_id)
    if record.storage_path and Path(record.storage_path).exists():
        return FileResponse(record.storage_path, media_type=record.content_type, filename=record.file_name)
    return PlainTextResponse(record.preview_text, media_type="text/plain")


def _seed_evidence_for_case(msme_id: str) -> None:
    if store.list_evidence_records(msme_id):
        return
    profile = store.get_profile(msme_id)
    if profile is None:
        return
    documents = profile.documents
    source_types = ["bank_statement", "gst_returns", "udyam", "itr"]
    if documents.bureau_report:
        source_types.append("bureau_report")
    for source_type in source_types:
        status = getattr(documents, source_type if source_type != "udyam" else "udyam").value
        if source_type == "udyam" and status == "not_applicable":
            status = "available"
        record = _seed_record(msme_id, source_type, status, profile.business_name)
        store.upsert_evidence_record(msme_id, record)
    _write_evidence_preview_files(msme_id, source_types, profile.business_name)


def _seed_record(msme_id: str, source_type: str, status: str, business_name: str) -> EvidenceRecord:
    evidence_id = f"ev_{msme_id}_{source_type}"
    name = {
        "bank_statement": "Bank statement summary",
        "gst_returns": "GST-like turnover summary",
        "udyam": "Udyam certificate mock record",
        "itr": "ITR evidence request note",
    }.get(source_type, "Evidence document")
    preview = (
        f"{name}\n"
        f"Borrower: {business_name}\n"
        f"Evidence ID: {evidence_id}\n"
        f"Status: {status}\n\n"
        "Demo document content generated from synthetic profile metadata. No OCR, external registry lookup, or real customer data is used.\n"
        f"Source mapping: credit_file:{msme_id} -> evidence:{evidence_id} -> score_component:{', '.join(_components_for_source(source_type))}\n"
    )
    return EvidenceRecord(
        id=evidence_id,
        msme_id=msme_id,
        evidence_type=_evidence_type_for_source(source_type),
        title=name,
        source="system_seed_demo_data",
        source_type=source_type,
        document_name=name,
        status=status,
        content_type="text/plain",
        file_name=f"{evidence_id}.txt",
        file_size=len(preview.encode("utf-8")),
        storage_path=None,
        preview_text=preview,
        extracted_signals=_demo_signals(source_type, status, f"{evidence_id}.txt"),
        extraction_status="extracted",
        confidence_impact=_impact_for_source(source_type, status),
        risk_impact=_risk_impact_for_status(status),
        related_score_components=_components_for_source(source_type),
        lending_question=_lending_question_for_source(source_type),
        source_mapping=[f"credit_file:{msme_id}", f"evidence:{evidence_id}", f"source_type:{source_type}"],
        uploaded_by="system_seed",
        created_at=utc_now(),
        updated_at=utc_now(),
    )


def _components_for_source(source_type: str) -> list[str]:
    return {
        "bank_statement": ["cashflow_strength", "data_quality"],
        "gst_returns": ["compliance_discipline", "revenue_quality"],
        "udyam": ["identity_verification", "compliance_discipline"],
        "bureau_report": ["repayment_stress"],
        "itr": ["income_verification", "data_quality"],
        "gem_profile": ["business_concentration", "prospect_readiness"],
    }.get(source_type, ["data_quality"])


def _demo_signals(source_type: str, status: str, file_name: str) -> list[EvidenceExtractedSignal]:
    return [
        EvidenceExtractedSignal(field_name=f"{source_type}_status", value=status, source_mapping=f"metadata.file_name={file_name}", confidence=92),
        EvidenceExtractedSignal(field_name="parser_mode", value="demo_metadata_only", source_mapping="no OCR/parser invoked", confidence=100),
    ]


def _write_evidence_preview_files(msme_id: str, source_types: list[str], business_name: str) -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    for rec in store.list_evidence_records(msme_id):
        src = rec.source_type if hasattr(rec, "source_type") else None
        if src not in source_types:
            continue
        file_name = f"{msme_id}_{src}_preview.txt"
        file_path = STORAGE_DIR / file_name
        if file_path.exists():
            continue
        content = (
            f"LendSignal 360 — Evidence Preview\n"
            f"================================\n"
            f"Borrower: {business_name}\n"
            f"MSME ID: {msme_id}\n"
            f"Evidence ID: {rec.id if hasattr(rec, 'id') else 'unknown'}\n"
            f"Source: {src}\n"
            f"Status: {rec.status if hasattr(rec, 'status') else 'unknown'}\n\n"
            f"--- Demo Content ---\n"
            f"{rec.preview_text if hasattr(rec, 'preview_text') else 'No preview available.'}\n\n"
            f"This document was generated from synthetic profile metadata.\n"
            f"No OCR, external registry lookup, or real customer data is used.\n"
            f"Generated at: {utc_now().isoformat()}\n"
        )
        file_path.write_text(content, encoding="utf-8")
        updated = rec.model_copy(update={"storage_path": str(file_path), "file_name": file_name, "file_size": len(content.encode("utf-8"))}) if hasattr(rec, "model_copy") else rec
        if hasattr(rec, "model_copy"):
            store.upsert_evidence_record(msme_id, updated)


def _evidence_type_for_source(source_type: str) -> EvidenceType:
    mapping = {
        "bank_statement": EvidenceType.bank_statement,
        "gst_returns": EvidenceType.gst_returns,
        "bureau_report": EvidenceType.bureau_report,
        "itr": EvidenceType.itr,
        "udyam": EvidenceType.udyam,
        "uploaded_document": EvidenceType.uploaded_document,
        "gem_profile": EvidenceType.gem_profile,
        "identity_proof": EvidenceType.identity_proof,
        "address_proof": EvidenceType.address_proof,
    }
    return mapping.get(source_type, EvidenceType.other)


def _lending_question_for_source(source_type: str) -> str:
    questions = {
        "bank_statement": "Does the average bank balance and cash flow pattern support the requested credit limit?",
        "gst_returns": "Is the declared GST turnover consistent with the bank statement deposits?",
        "bureau_report": "Are there any prior defaults or overdue facilities that affect repayment capacity?",
        "itr": "Is the declared income sufficient to service the proposed credit facility?",
        "udyam": "Is the MSME registration valid and does the business classification match the loan product?",
        "gem_profile": "Does the GeM order book provide visibility into future revenue stability?",
        "uploaded_document": "What underwriting question does this uploaded document answer?",
    }
    return questions.get(source_type, "How does this evidence affect the credit decision?")


def _impact_for_source(source_type: str, status: str) -> str:
    if status in ("missing", "stale"):
        return "high"
    if status == "partial":
        return "medium"
    return "low"


def _risk_impact_for_status(status: str) -> str:
    return {"missing": "high", "stale": "high", "partial": "medium", "available": "low", "not_applicable": "none"}.get(status, "medium")


def _preview_from_bytes(content: bytes, content_type: str, file_name: str) -> str:
    if content_type.startswith("text/") or file_name.lower().endswith((".txt", ".csv", ".json", ".html")):
        return content.decode("utf-8", errors="replace")[:4000]
    return f"Uploaded {file_name} ({content_type}). Binary preview is not parsed in this demo; use the file viewer endpoint to open the source file."
