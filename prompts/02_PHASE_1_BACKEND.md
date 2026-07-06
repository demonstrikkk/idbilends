# 02_PHASE_1_BACKEND.md

You are implementing Phase 1: Backend Credit Engine.

Do not build the frontend yet.
Do not build the full AI agent yet.
Build the backend foundation that every later layer depends on.

## First steps

Read:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/ARCHITECTURE.md`
4. `docs/API_CONTRACTS.md`
5. `docs/DATA_MODEL.md`
6. `docs/SCORING_DESIGN.md`
7. `docs/SECURITY_CHECKLIST.md`

Before coding, search inside `docs/RESEARCH_BLUEPRINT.md` and `docs/SCORING_DESIGN.md` for:

* financial health score
* MSME signals
* alternative data
* GST-like data
* bank-statement-like data
* GeM-like seller data
* buyer concentration
* cashflow volatility
* repayment stress
* data confidence
* suggested credit limit
* explainability
* reason codes

Use those details to implement the backend domain model.

## Backend stack

Use:

* FastAPI
* Pydantic
* SQLAlchemy or SQLModel
* PostgreSQL-ready configuration
* pytest
* Python typing

If Alembic is too much for the first pass, create DB models cleanly and document migration setup as a follow-up. But prefer adding Alembic if practical.

## Required backend structure

Create:

```txt
apps/api/
  app/
    main.py
    core/
      config.py
      logging.py
      errors.py
      security.py
    db/
      session.py
      models.py
      seed.py
    schemas/
      msme.py
      score.py
      prospect.py
      audit.py
      common.py
    api/
      routes/
        health.py
        msmes.py
        scores.py
        prospects.py
        audit.py
        demo.py
    services/
      synthetic_data_service.py
      scoring_service.py
      prospect_service.py
      risk_service.py
      audit_service.py
    tests/
      test_scoring_service.py
      test_prospect_service.py
      test_synthetic_data.py
      test_api_smoke.py
  requirements.txt
  README.md
```

## Required endpoints

Implement:

```txt
GET /health
GET /msmes
GET /msmes/{id}
POST /scores/{id}/generate
GET /prospects/{id}/signals
GET /audit/{id}
POST /demo/seed
```

## Synthetic data engine

Generate deterministic synthetic data with fixed seed support.

Must include at least 8 MSME profiles:

1. healthy small manufacturer
2. stable retail shop
3. growing digital seller
4. GeM-like seller with purchase-order strength
5. service firm with missing documents
6. trader with high buyer concentration
7. food business with seasonal volatility
8. stressed business with debt overload
9. suspicious spike case, if practical

Each profile must include:

* business name
* segment
* city/state
* vintage
* requested credit amount
* monthly revenue average
* expense average
* average balance
* revenue growth
* volatility
* EMI obligation
* existing debt
* bounce count
* GST-like filing regularity
* buyer concentration
* digital payment ratio
* invoice delay
* order completion rate
* document status

Use clearly fake/synthetic names.

## Scoring engine

Implement deterministic, explainable scoring.

Must output:

```txt
score: 0-100
risk_tier
data_confidence
suggested_credit_limit
requested_credit_amount
recommendation
positive_factors[]
negative_factors[]
missing_data_warnings[]
early_warning_triggers[]
rule_version
calculation_trace[]
```

Scoring must consider at least:

* cashflow strength
* revenue consistency
* revenue growth
* repayment stress
* bounce behavior
* debt burden
* buyer concentration
* GST-like regularity
* document completeness
* order completion
* invoice delay
* suspicious spikes

## Data confidence

Implement separate data-confidence logic.

Data confidence should decrease for:

* missing bank statement
* partial GST-like data
* missing bureau-like data
* missing Udyam-like data
* stale data
* suspicious revenue spike
* inconsistent signals

Low data confidence must affect recommendation language, not simply destroy the score.

## Suggested credit limit logic

Do not randomly assign suggested credit amount.

Use a transparent formula based on:

* monthly revenue
* average balance
* EMI burden
* risk tier
* data confidence
* requested amount

Return a suggested limit or range.

If data confidence is low, recommendation should become:

```txt
review_required
```

or

```txt
insufficient_data
```

## Prospect Assist service

Implement prospect scoring separately from financial health score.

Prospect score should consider:

* revenue growth
* business vintage
* segment
* digital payment ratio
* product fit
* credit need likelihood
* data confidence
* risk tier

Output:

```txt
prospect_score
priority
likely_credit_need
best_product_fit
next_best_action
signals[]
```

This is not just lead generation. It is credit-readiness prioritization.

## Audit service

Add audit events for:

* demo seed generated
* score generated
* prospect signals generated

Audit can be in-memory for first pass only if database persistence is not complete. Prefer DB-backed if practical.

## Error handling

Implement safe errors:

* 404 for missing MSME
* validation errors
* safe internal error response
* no stack traces in API response

## Tests required

Add tests for:

1. score range always 0-100
2. risk tier mapping is correct
3. healthy profile scores higher than stressed profile
4. missing documents reduce data confidence
5. suspicious spike creates warning
6. suggested limit decreases for high risk
7. prospect score ranks growing/healthy business higher
8. API health endpoint works
9. score endpoint returns reason codes
10. demo seed endpoint works

## README commands

Document:

```bash
cd apps/api
python -m venv .venv
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

## Do not do

* Do not add frontend code.
* Do not add real AI calls.
* Do not use real financial data.
* Do not make score a random number.
* Do not bury business logic in route handlers.
* Do not create generic “user” SaaS models unless needed.

## Acceptance criteria

Phase 1 is complete only when:

* backend starts
* API docs open
* demo seed works
* MSME list/detail works
* scoring works
* prospect signals work
* reason codes are meaningful
* tests pass or failures are clearly reported

Final report format:

```txt
Summary
Research Blueprint alignment
Files changed
Commands run
Tests/checks
Known limitations
Next recommended phase
```
