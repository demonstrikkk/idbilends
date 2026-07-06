# LendSignal 360 — Data Model v2

## 1. Modeling principles

The data model must support:

- synthetic MSME profiles
- financial snapshots
- document completeness
- deterministic score outputs
- prospect signals
- early warning triggers
- Credit Copilot briefs
- agent trace
- audit events
- future real integrations

The model must avoid:

- real PII
- real Aadhaar/PAN/account numbers
- unstructured blobs as the only source of truth
- frontend-only score calculation
- non-auditable AI output

## 2. Entity relationship overview

```txt
MSMEProfile
  ├── FinancialSnapshot[]
  ├── DocumentStatus[]
  ├── ScoreOutput[]
  ├── ProspectSignalOutput[]
  ├── CopilotBrief[]
  └── AuditEvent[]
```

## 3. Enumerations

### Segment

```txt
retail_shop
small_manufacturer
services_firm
trader
food_business
digital_seller
gem_like_seller
```

### Scenario label

```txt
healthy_growth
stable_moderate
seasonal_volatility
cashflow_stress
high_buyer_concentration
document_gap
suspicious_spike
debt_overload
```

### Risk tier

```txt
very_low
moderate_low
moderate
elevated
high
```

### Prospect priority

```txt
very_high
high
medium
low
not_ready
```

### Recommendation category

```txt
consider_with_standard_review
consider_with_conditions
review_required
consider_lower_limit
insufficient_data
not_recommended_without_rework
```

Avoid final approval language in enum names.

### Document status

```txt
available
partial
missing
stale
not_applicable
```

### Audit event type

```txt
demo_seed_generated
msme_profile_viewed
score_generated
prospect_signals_generated
copilot_brief_generated
copilot_brief_failed
human_override_recorded
provider_mode_changed
```

## 4. MSMEProfile

Purpose:

Represents a synthetic MSME business profile.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Stable internal id | msme_001 |
| business_name | string | yes | Synthetic business name | Sharma Tools |
| segment | enum | yes | MSME category | small_manufacturer |
| scenario_label | enum | yes | Demo scenario | healthy_growth |
| city | string | yes | Demo geography | Jaipur |
| state | string | yes | Demo geography | Rajasthan |
| business_vintage_months | int | yes | Business age | 48 |
| employee_count | int | no | Business size proxy | 18 |
| requested_credit_amount | int | yes | Requested amount in INR | 2000000 |
| existing_bank_relationship_months | int | no | Relationship strength | 14 |
| synthetic_external_ref | string | no | Fake ref only | SYN-GEM-001 |
| created_at | datetime | yes | Record creation time | 2026-07-06T10:00:00Z |
| updated_at | datetime | yes | Record update time | 2026-07-06T10:00:00Z |

Indexes:

- id primary key
- segment
- scenario_label
- created_at

## 5. FinancialSnapshot

Purpose:

Stores point-in-time financial indicators.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Snapshot id | fs_001 |
| msme_id | FK | yes | Parent MSME | msme_001 |
| snapshot_month | string | yes | Month of data | 2026-06 |
| monthly_revenue_avg | int | yes | Avg monthly revenue in INR | 850000 |
| monthly_expense_avg | int | yes | Avg monthly expense in INR | 610000 |
| average_bank_balance | int | yes | Avg balance in INR | 240000 |
| cash_inflow_volatility | float | yes | 0-1 volatility proxy | 0.18 |
| revenue_growth_3m | float | yes | 3-month growth | 0.08 |
| revenue_growth_6m | float | yes | 6-month growth | 0.14 |
| emi_obligation | int | yes | Monthly EMI burden | 95000 |
| existing_debt | int | yes | Outstanding debt | 800000 |
| bounce_count_3m | int | yes | Recent bounce count | 0 |
| bounce_count_6m | int | yes | 6m bounce count | 1 |
| gst_filing_regularity | float | yes | 0-1 proxy | 0.92 |
| buyer_concentration | float | yes | Revenue share of top buyer | 0.38 |
| digital_payment_ratio | float | yes | Digital receipts share | 0.76 |
| gem_order_completion_rate | float | no | GeM-like completion proxy | 0.94 |
| invoice_delay_avg_days | int | yes | Avg collection delay | 18 |
| cash_deposit_ratio | float | no | Cash-heavy risk proxy | 0.21 |
| revenue_spike_ratio | float | no | Latest month vs baseline | 1.12 |
| created_at | datetime | yes | Created time | 2026-07-06T10:00:00Z |

Indexes:

- msme_id
- snapshot_month
- revenue_growth_6m
- buyer_concentration

## 6. DocumentStatus

Purpose:

Tracks completeness and freshness of input signals.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Document status id | doc_001 |
| msme_id | FK | yes | Parent MSME | msme_001 |
| bank_statement_status | enum | yes | Statement availability | available |
| gst_returns_status | enum | yes | GST-like data status | partial |
| udyam_status | enum | yes | Udyam-like registration | available |
| bureau_report_status | enum | yes | Bureau-like status | available |
| itr_status | enum | no | ITR-like data | missing |
| gem_profile_status | enum | no | GeM-like profile | available |
| latest_data_month | string | yes | Data freshness | 2026-06 |
| missing_documents | json array | yes | Missing list | ["itr"] |
| stale_documents | json array | yes | Stale list | [] |
| created_at | datetime | yes | Created time | 2026-07-06T10:00:00Z |

Indexes:

- msme_id
- bank_statement_status
- gst_returns_status
- bureau_report_status

## 7. ScoreFactor

Purpose:

Structured reason code used by score outputs.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| code | string | yes | Stable reason code | stable_cashflow |
| label | string | yes | UI label | Stable monthly inflows |
| category | string | yes | score component | cashflow_strength |
| direction | enum | yes | positive/negative/neutral | positive |
| impact | int | yes | Points impact | 12 |
| severity | enum | yes | low/medium/high | medium |
| evidence | string | yes | Human explanation | Revenue stable for 5 of 6 months |
| source_fields | string[] | yes | Inputs used | ["monthly_revenue_avg", "cash_inflow_volatility"] |

## 8. ScoreOutput

Purpose:

Stores deterministic score result.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Score id | score_001 |
| msme_id | FK | yes | Parent MSME | msme_001 |
| score | int | yes | 0-100 health score | 78 |
| risk_tier | enum | yes | Risk band | moderate_low |
| data_confidence | int | yes | 0-100 confidence | 91 |
| suggested_credit_min | int | yes | Lower suggested range | 1200000 |
| suggested_credit_max | int | yes | Upper suggested range | 1450000 |
| requested_credit_amount | int | yes | Requested amount | 2000000 |
| recommendation | enum | yes | Human-review action | consider_with_conditions |
| positive_factors | json array | yes | ScoreFactor[] | [] |
| negative_factors | json array | yes | ScoreFactor[] | [] |
| missing_data_warnings | json array | yes | Warnings | [] |
| early_warning_triggers | json array | yes | Triggers | [] |
| calculation_trace | json array | yes | Component trace | [] |
| rule_version | string | yes | Score rules | score_rules_v1 |
| created_at | datetime | yes | Created time | 2026-07-06T10:00:00Z |

Indexes:

- msme_id
- risk_tier
- score
- data_confidence
- created_at

## 9. ProspectSignalOutput

Purpose:

Stores Prospect Assist result.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Output id | prospect_001 |
| msme_id | FK | yes | Parent MSME | msme_001 |
| prospect_score | int | yes | 0-100 readiness score | 84 |
| priority | enum | yes | priority | high |
| likely_credit_need | string | yes | Need class | working_capital |
| best_product_fit | string | yes | Product class | msme_working_capital |
| next_best_action | string | yes | RM action | Request latest GST filing |
| signals | json array | yes | Supporting signals | [] |
| created_at | datetime | yes | Created time | 2026-07-06T10:00:00Z |

Indexes:

- msme_id
- priority
- prospect_score

## 10. CopilotBrief

Purpose:

Stores controlled AI output.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Brief id | brief_001 |
| msme_id | FK | yes | Parent MSME | msme_001 |
| executive_summary | text | yes | Short summary | ... |
| data_quality_observations | text | yes | Node output | ... |
| credit_analyst_explanation | text | yes | Node output | ... |
| prospect_assist_recommendation | text | yes | Node output | ... |
| risk_investigator_findings | text | yes | Node output | ... |
| final_lending_brief | text | yes | Final brief | ... |
| confidence | enum | yes | low/medium/medium_high/high | medium_high |
| assumptions | json array | yes | Assumptions | [] |
| follow_up_questions | json array | yes | Questions | [] |
| recommended_human_action | text | yes | Officer action | Verify latest GST data |
| decision_support_only | bool | yes | Must be true | true |
| cited_internal_inputs | json array | yes | Grounding refs | [] |
| trace | json array | yes | AgentTraceStep[] | [] |
| provider | string | yes | mock/openai_compatible | mock |
| prompt_version | string | yes | Prompt version | credit_copilot_v1 |
| created_at | datetime | yes | Created time | 2026-07-06T10:00:00Z |

Indexes:

- msme_id
- provider
- prompt_version
- created_at

## 11. AgentTraceStep

Purpose:

Records agent graph steps.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| step_id | string | yes | Step id | step_001 |
| step_name | string | yes | Tool/node name | data_quality_node |
| step_type | enum | yes | tool/node/provider | node |
| status | enum | yes | success/failure/skipped | success |
| started_at | datetime | no | Step start | ... |
| ended_at | datetime | no | Step end | ... |
| input_refs | string[] | yes | Internal refs | ["score_001"] |
| output_ref | string | no | Output ref | node_output_001 |
| error_code | string | no | Error if failed | null |
| notes | string | no | Safe summary | Completed |

## 12. AuditEvent

Purpose:

Records important actions.

| Field | Type | Required | Purpose | Example |
|---|---:|---:|---|---|
| id | string/UUID | yes | Audit id | audit_001 |
| msme_id | FK nullable | no | Related MSME | msme_001 |
| event_type | enum | yes | Event type | score_generated |
| actor | string | yes | system/demo_user/bank_officer | system |
| request_id | string | no | Request trace | req_001 |
| metadata | json | yes | Safe metadata | {} |
| created_at | datetime | yes | Created time | 2026-07-06T10:00:00Z |

Indexes:

- msme_id
- event_type
- created_at

## 13. Suggested PostgreSQL model notes

Use JSONB for:

- score factors
- warnings
- traces
- assumptions
- metadata

But keep primary fields relational for filtering:

- score
- risk_tier
- data_confidence
- prospect_score
- priority
- created_at

## 14. Data retention and privacy

MVP data is synthetic only.

Do not store:

- Aadhaar
- PAN
- real GSTIN
- bank account numbers
- customer names
- phone numbers
- emails
- addresses beyond demo city/state

## 15. Seed data minimum

At least 8 profiles:

1. Healthy manufacturer
2. Stable retail shop
3. Growing digital seller
4. GeM-like seller
5. Service firm with document gaps
6. Trader with high buyer concentration
7. Food business with seasonal volatility
8. Stressed business with debt overload
9. Suspicious revenue spike case if practical
