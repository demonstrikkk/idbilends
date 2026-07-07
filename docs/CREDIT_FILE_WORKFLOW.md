# Credit File Workflow

LendSignal 360 organizes scattered MSME borrower inputs into a credit file and maps each record to underwriting evidence.

## Backend Bundle

`GET /credit-file/{msme_id}` returns:

- profile
- deterministic score
- Prospect Assist output
- document and evidence status
- missing evidence
- derived transaction summary
- risk warnings
- suggested credit posture
- recommended human actions
- audit summary
- cited source ids

## Evidence Mapping

`GET /credit-file/{msme_id}/evidence-map` returns rows linking:

Source Data -> Derived Signal -> Score Component -> Lending Question -> Human Action

Rows are derived from document status, score factors, and deterministic score outputs. Missing backend data is shown as unavailable rather than invented.

## Officer Flow

1. Open `/case-inbox`.
2. Select a case lane and open a credit file.
3. Review identity, financial records, documents, derived signals, credit posture, Copilot, and audit sections.
4. Use Data Room for record status and Evidence Map for source-to-action traceability.
5. Ask Credit Copilot predefined or free-text questions.
6. Record the next human review action outside the MVP until workflow persistence is added.

## Safety

Every Copilot response includes decision-support framing, cited internal inputs, provider/model metadata, and trace when requested.
