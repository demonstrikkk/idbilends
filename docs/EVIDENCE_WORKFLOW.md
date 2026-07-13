# Evidence Workflow — LendSignal 360

## Overview
The evidence module manages bank-grade document tracking for MSME credit assessment. It supports seeding, upload, status tracking, and metadata extraction — all using synthetic data only.

## Evidence Types
- bank_statement
- gst_returns
- bureau_report
- itr
- udyam
- uploaded_document
- gem_profile
- identity_proof
- address_proof
- other

## Evidence Statuses
- available
- partial
- missing
- stale
- not_applicable

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /credit-file/{msme_id}/evidence | List evidence records |
| POST | /credit-file/{msme_id}/evidence/upload | Upload evidence file |
| GET | /credit-file/{msme_id}/evidence/{evidence_id} | Get evidence detail |
| GET | /credit-file/{msme_id}/evidence/{evidence_id}/file | Download/view file |
| PATCH | /credit-file/{msme_id}/evidence/{evidence_id}/status | Update status |
| GET | /credit-file/{msme_id}/evidence-map | Get evidence-to-score mapping |

## Evidence Record Fields
- id, msme_id, evidence_type, title, source, source_type, document_name, status
- content_type, file_name, file_size, storage_path, preview_text
- extracted_signals (demo metadata extraction, not OCR)
- extraction_status, confidence_impact, risk_impact
- related_score_components, lending_question, source_mapping
- uploaded_by, reviewed_at, audit_event_id, created_at, updated_at

## Seeding
- Evidence is lazily seeded on first access via list_evidence_records()
- Each profile gets 5 records: bank_statement, gst_returns, udyam, itr, bureau_report
- Preview text files are written to demo_storage/evidence/ for viewable content
- Extraction signals are labeled as "demo_metadata_only"

## Frontend Integration
- Command center: evidence drawer with type/status filters, upload, status update, metadata panel
- Credit file: DocumentsSection showing status dots, evidence counts, extraction status
- Copilot: SourceChip links to evidence files from cited_internal_inputs

## Safety
- No OCR — extracted fields are labeled as demo metadata
- No real customer data — all synthetic
- Extraction status, confidence_impact, risk_impact are derived from document availability
