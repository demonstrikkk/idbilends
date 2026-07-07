# Product Rescue QA

## Command Center

- Seed 1000 profiles with `POST /demo/seed` using `profile_count=1000`.
- Open `/command-center`.
- Confirm saved views show counts for all active files, score dropped today, missing evidence, high potential + low confidence, risk attention, sector overlay affected, RM action needed, and recently updated.
- Search by borrower, branch, zone, segment, or city and confirm the table uses backend pagination rather than loading every row.
- Filter by risk tier, segment, zone, confidence band, and saved view.
- Sort by action priority, score, score delta, confidence, requested amount, and business name.
- Select a row and confirm the right preview updates instantly with score, score delta, risk tier, confidence, top blocker, latest event, and recommended human action.

## Evidence And Documents

- From `/command-center`, click `View Evidence` for a selected case.
- Confirm the evidence drawer lists real evidence IDs and opens file content through `/credit-file/{msme_id}/evidence/{evidence_id}/file`.
- Confirm preview text states demo metadata extraction and does not claim OCR.
- Open `/data-room`, select a file, and confirm evidence cards, document preview, extracted fields, source mapping, and status controls are visible.
- Upload a small text evidence file through the backend endpoint and confirm an audit event is created.
- Patch an evidence status and confirm the response returns the updated status.

## Copilot

- In Copilot mode selector, choose `mock` and ask: "Which evidence blocks this case?"
- Confirm the answer cites `evidence:{id}` chips and source chips open evidence files.
- Ask: "Why did this score change?" before monitoring and confirm it says no delta is recorded.
- Start monitoring, inject one event for the case, ask again, and confirm it cites score history, event ID, changed features, and evidence records.
- Choose `groq` without `GROQ_API_KEY` and confirm the backend returns 503 with a clear provider-unavailable message.
- Confirm Groq mode never silently displays mock output as Groq output.

## Monitoring

- Open `/command-center` or `/monitoring`.
- Call `POST /monitoring/start` twice and confirm the same `session_id` is returned.
- Confirm Start is disabled or harmless while active, Stop is disabled or harmless while inactive, and no duplicate session loop is created.
- Inject one manual event and confirm one affected case score changes.
- Confirm `event_count`, `last_started_at`, `active_connections`, and `is_running` are exposed by `/monitoring/status`.

## Layout

- Check 1366x768, tablet width, and mobile width.
- Confirm the page has no horizontal body overflow.
- Confirm the central table scrolls inside its container, while saved views and preview remain stable.
- Confirm no double vertical scrollbar appears on Command Center or Data Room.

## Safety Scans

- Run `rg "approved|rejected|guaranteed|risk-free|final decision|loan granted|sanction confirmed" apps/web apps/api docs README.md`.
- Run `rg "GROQ_API_KEY=.*[A-Za-z0-9]" . --glob "!*.example"`.
- Run `rg "fake|dummy|hardcoded|mockData|sampleData" apps/web`.
