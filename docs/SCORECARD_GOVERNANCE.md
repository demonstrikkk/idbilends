# Scorecard & Governance — LendSignal 360

## Scorecard Endpoint
`GET /scoring/scorecard/{msme_id}`

Returns a full deterministic score breakdown without persisting:
- score, risk_tier, data_confidence
- calculation_trace: component-level breakdown (max_points, awarded_points, notes)
- positive_factors and negative_factors with evidence and source_fields
- early_warning_triggers
- missing_data_warnings
- suggested_credit_min/max
- recommended_human_action
- decision_support_only: true

Audit event "scorecard_viewed" is created on each access.

## Governance Layer
- decision_support_only: true on every score output (enforced at schema level)
- recommended_human_action is guarded against forbidden approval language
- All AI outputs include: summary, confidence, assumptions, recommended_human_action, cited_internal_inputs
- Audit events tracked for: score_generated, scorecard_viewed, evidence_uploaded, evidence_status_updated, monitoring_event_applied

## Safety Boundaries
- Backend deterministic scoring is the sole source of truth for numerical values
- AI layer (Copilot) summarizes, explains, and recommends — never calculates or mutates scores
- No final approval/rejection/disbursement language in any output
- Synthetic data only — no real customer data

## Rule Versioning
- Current: score_rules_v1
- Each score output includes rule_version for traceability
