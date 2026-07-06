# LendSignal 360 — API Contracts v2

## 1. API principles

The API must be:

- stable for frontend consumption
- strongly typed through Pydantic
- explicit about decision-support status
- safe by default
- explainability-first
- compatible with mock/demo mode
- future-ready for auth and audit

The frontend must not calculate scores. It must consume score outputs from the backend.

## 2. Base URL

Local:

```txt
http://localhost:8000/api/v1
```

If MVP starts unversioned, keep route naming compatible with future `/api/v1`.

## 3. Common response metadata

All major responses should include optional metadata where practical:

```json
{
  "request_id": "req_123",
  "generated_at": "2026-07-06T10:00:00Z"
}
```

## 4. Common error shape

All errors should follow:

```json
{
  "error": {
    "code": "MSME_NOT_FOUND",
    "message": "MSME profile was not found.",
    "details": {},
    "request_id": "req_123"
  }
}
```

Common error codes:

```txt
VALIDATION_ERROR
MSME_NOT_FOUND
SCORE_NOT_FOUND
COPILOT_PROVIDER_UNAVAILABLE
COPILOT_TOOL_DENIED
RATE_LIMITED
INTERNAL_ERROR
```

## 5. Health

### GET /health

Purpose:

Basic service liveness.

Response 200:

```json
{
  "status": "ok",
  "service": "lendsignal-api",
  "version": "0.1.0",
  "environment": "development"
}
```

### GET /ready

Purpose:

Readiness check for dependencies.

Response 200:

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "skipped",
    "ai_provider": "mock"
  }
}
```

## 6. Demo seed

### POST /demo/seed

Purpose:

Create deterministic synthetic data.

Request:

```json
{
  "reset": true,
  "seed": 42,
  "profile_count": 9
}
```

Response:

```json
{
  "seeded": true,
  "profile_count": 9,
  "scenario_counts": {
    "healthy_growth": 2,
    "stable_moderate": 1,
    "seasonal_volatility": 1,
    "cashflow_stress": 1,
    "high_buyer_concentration": 1,
    "document_gap": 1,
    "suspicious_spike": 1,
    "debt_overload": 1
  },
  "audit_event_id": "audit_001"
}
```

## 7. MSMEs

### GET /msmes

Query params:

| Param | Type | Description |
|---|---|---|
| segment | string | Filter by segment |
| scenario_label | string | Filter by synthetic scenario |
| risk_tier | string | Filter by risk tier |
| prospect_priority | string | Filter by prospect priority |
| search | string | Search business/city |
| limit | int | Default 20 |
| offset | int | Default 0 |
| sort | string | prospect_score_desc, risk_desc, score_desc, created_desc |

Response 200:

```json
{
  "items": [
    {
      "id": "msme_001",
      "business_name": "Sharma Tools",
      "segment": "small_manufacturer",
      "scenario_label": "healthy_growth",
      "city": "Jaipur",
      "state": "Rajasthan",
      "requested_credit_amount": 2000000,
      "monthly_revenue_avg": 850000,
      "health_score": 78,
      "risk_tier": "moderate_low",
      "prospect_score": 84,
      "prospect_priority": "high",
      "data_confidence": 91,
      "recommended_human_action": "Consider moderated working-capital limit after document verification."
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### GET /msmes/{msme_id}

Response 200:

```json
{
  "id": "msme_001",
  "business_name": "Sharma Tools",
  "segment": "small_manufacturer",
  "scenario_label": "healthy_growth",
  "city": "Jaipur",
  "state": "Rajasthan",
  "business_vintage_months": 48,
  "employee_count": 18,
  "requested_credit_amount": 2000000,
  "financials": {
    "snapshot_month": "2026-06",
    "monthly_revenue_avg": 850000,
    "monthly_expense_avg": 610000,
    "average_bank_balance": 240000,
    "cash_inflow_volatility": 0.18,
    "revenue_growth_3m": 0.08,
    "revenue_growth_6m": 0.14,
    "emi_obligation": 95000,
    "existing_debt": 800000,
    "bounce_count_3m": 0,
    "bounce_count_6m": 1,
    "gst_filing_regularity": 0.92,
    "buyer_concentration": 0.38,
    "digital_payment_ratio": 0.76,
    "gem_order_completion_rate": 0.94,
    "invoice_delay_avg_days": 18,
    "cash_deposit_ratio": 0.21,
    "revenue_spike_ratio": 1.12
  },
  "documents": {
    "bank_statement": "available",
    "gst_returns": "partial",
    "udyam": "available",
    "bureau_report": "available",
    "itr": "missing",
    "gem_profile": "available",
    "missing_documents": ["itr"],
    "stale_documents": []
  },
  "latest_score_id": "score_001",
  "latest_prospect_signal_id": "prospect_001"
}
```

## 8. Scores

### POST /scores/{msme_id}/generate

Purpose:

Generate a deterministic explainable score.

Request:

```json
{
  "persist": true,
  "include_trace": true
}
```

Response 200:

```json
{
  "id": "score_001",
  "msme_id": "msme_001",
  "score": 78,
  "risk_tier": "moderate_low",
  "data_confidence": 91,
  "suggested_credit_min": 1200000,
  "suggested_credit_max": 1450000,
  "requested_credit_amount": 2000000,
  "recommendation": "consider_with_conditions",
  "recommended_human_action": "Consider a moderated working-capital limit after verifying latest GST-like filing data.",
  "decision_support_only": true,
  "positive_factors": [
    {
      "code": "stable_cashflow",
      "label": "Stable monthly inflows",
      "category": "cashflow_strength",
      "direction": "positive",
      "impact": 12,
      "severity": "medium",
      "evidence": "Revenue remained within expected range for 5 of the last 6 months.",
      "source_fields": ["monthly_revenue_avg", "cash_inflow_volatility"]
    }
  ],
  "negative_factors": [
    {
      "code": "buyer_concentration",
      "label": "Moderate buyer concentration",
      "category": "business_concentration",
      "direction": "negative",
      "impact": -7,
      "severity": "medium",
      "evidence": "Top buyer contributes 38% of observed revenue.",
      "source_fields": ["buyer_concentration"]
    }
  ],
  "missing_data_warnings": [
    "ITR-like document is missing.",
    "GST-like filing data is partial for the last quarter."
  ],
  "early_warning_triggers": [
    {
      "code": "monitor_revenue_dip",
      "label": "Monitor monthly revenue movement",
      "severity": "low",
      "condition": "Trigger review if monthly revenue drops more than 25% for two consecutive months."
    }
  ],
  "calculation_trace": [
    {
      "component": "cashflow_strength",
      "max_points": 25,
      "awarded_points": 20,
      "notes": "Low volatility and healthy average balance."
    }
  ],
  "rule_version": "score_rules_v1",
  "created_at": "2026-07-06T10:00:00Z"
}
```

## 9. Prospect Assist

### GET /prospects/{msme_id}/signals

Purpose:

Return credit-readiness and prospect prioritization signals.

Response 200:

```json
{
  "id": "prospect_001",
  "msme_id": "msme_001",
  "prospect_score": 84,
  "priority": "high",
  "likely_credit_need": "working_capital",
  "best_product_fit": "msme_working_capital",
  "next_best_action": "Request latest GST-like filing and propose a moderated working-capital conversation.",
  "outreach_timing": "within_7_days",
  "signals": [
    {
      "code": "rising_revenue",
      "label": "Six-month revenue growth",
      "direction": "positive",
      "confidence": 0.82,
      "evidence": "Revenue growth over six months is 14%."
    },
    {
      "code": "moderate_risk_good_confidence",
      "label": "Usable credit-readiness profile",
      "direction": "positive",
      "confidence": 0.78,
      "evidence": "Risk tier is moderate-low with 91% data confidence."
    }
  ],
  "created_at": "2026-07-06T10:00:00Z"
}
```

## 10. Credit Copilot

### POST /copilot/{msme_id}/brief

Purpose:

Generate a controlled AI-assisted lending brief.

Request:

```json
{
  "mode": "mock",
  "include_trace": true,
  "regenerate": false
}
```

Response 200:

```json
{
  "id": "brief_001",
  "msme_id": "msme_001",
  "executive_summary": "Sharma Tools appears suitable for a moderated working-capital review, supported by stable cashflows and good digital payment behavior.",
  "data_quality_observations": "Data confidence is high, but ITR-like data is missing and GST-like filings are partial for the last quarter.",
  "credit_analyst_explanation": "The score is supported by stable inflows, low bounce behavior, and healthy order completion. The suggested limit is lower than the requested amount due to buyer concentration and partial document coverage.",
  "prospect_assist_recommendation": "Priority is high. The likely need is working capital. Relationship manager should request updated GST-like filings before a limit discussion.",
  "risk_investigator_findings": "Main concerns are moderate buyer concentration and partial GST-like documentation. No severe bounce stress was detected.",
  "final_lending_brief": "Consider a moderated working-capital facility in the suggested range, subject to document verification and human credit review.",
  "confidence": "medium_high",
  "assumptions": [
    "Synthetic GST-like signals are treated as indicative, not verified regulatory records.",
    "The score is decision-support only and not a final lending decision."
  ],
  "follow_up_questions": [
    "Can the applicant provide the latest GST-like filing data?",
    "Is the largest buyer relationship recurring or one-time?",
    "Are recent invoices already realized or only booked?"
  ],
  "recommended_human_action": "Verify missing documents, review buyer concentration, and consider a moderated limit instead of the full requested amount.",
  "decision_support_only": true,
  "cited_internal_inputs": [
    "msme_profile:msme_001",
    "score_output:score_001",
    "prospect_signal:prospect_001"
  ],
  "trace": [
    {
      "step_id": "trace_001",
      "step_name": "get_msme_profile",
      "step_type": "tool",
      "status": "success"
    },
    {
      "step_id": "trace_002",
      "step_name": "get_financial_health_score",
      "step_type": "tool",
      "status": "success"
    },
    {
      "step_id": "trace_003",
      "step_name": "data_quality_node",
      "step_type": "agent_node",
      "status": "success"
    }
  ],
  "provider": "mock",
  "prompt_version": "credit_copilot_v1",
  "created_at": "2026-07-06T10:00:00Z"
}
```

## 11. Audit

### GET /audit/{msme_id}

Query params:

| Param | Type | Description |
|---|---|---|
| event_type | string | Optional filter |
| limit | int | Default 50 |
| offset | int | Default 0 |

Response 200:

```json
{
  "items": [
    {
      "id": "audit_001",
      "msme_id": "msme_001",
      "event_type": "copilot_brief_generated",
      "actor": "system",
      "request_id": "req_123",
      "created_at": "2026-07-06T10:00:00Z",
      "metadata": {
        "brief_id": "brief_001",
        "provider": "mock",
        "prompt_version": "credit_copilot_v1",
        "trace_length": 5
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

## 12. Security behavior

Every endpoint must:

- validate input
- return safe errors
- avoid stack traces
- use request ID where practical
- create audit event for sensitive generation actions
- never expose secrets
- never return real PII

## 13. Frontend contract notes

Frontend should treat these as canonical:

- `score`
- `risk_tier`
- `data_confidence`
- `suggested_credit_min`
- `suggested_credit_max`
- `positive_factors`
- `negative_factors`
- `missing_data_warnings`
- `early_warning_triggers`
- `decision_support_only`
- `trace`

Do not derive these from raw financials in the frontend.
