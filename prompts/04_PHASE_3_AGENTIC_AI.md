# 04_PHASE_3_CREDIT_COPILOT_AGENT.md

You are implementing Phase 3: Credit Copilot Agentic AI.

This is the phase that makes LendSignal 360 feel like a serious AI product.

Do not let the LLM become the scoring engine.
Do not create an unsafe loan-approval bot.
Build a controlled, auditable agentic workflow that explains and investigates deterministic scoring outputs.

## First steps

Read:

1. `docs/RESEARCH_BLUEPRINT.md`
2. `docs/AGENTIC_AI_DESIGN.md`
3. `docs/SCORING_DESIGN.md`
4. `docs/API_CONTRACTS.md`
5. `docs/SECURITY_CHECKLIST.md`
6. `docs/DEMO_STRATEGY.md`

Search inside `docs/RESEARCH_BLUEPRINT.md` and `docs/AGENTIC_AI_DESIGN.md` for:

* agentic AI
* LLM
* Credit Copilot
* controlled workflow
* tool allowlist
* explanation
* lending brief
* risk investigation
* missing documents
* governance
* prompt versioning
* audit trail
* hallucination prevention
* human-in-the-loop

Use those findings to keep the AI layer aligned with the research strategy.

## Goal

Build a controlled agentic AI layer called:

```txt
Credit Copilot
```

Positioning:

```txt
AI-assisted MSME lending analyst for human bank officers.
```

Credit Copilot should:

* explain scores
* inspect risk factors
* identify missing data
* ask follow-up questions
* summarize lending posture
* recommend human review actions
* generate a bank-officer-ready lending brief
* show traceability

Credit Copilot should not:

* approve or reject loans as final authority
* invent numbers
* modify scores
* call arbitrary tools
* browse the web
* hide assumptions
* remove uncertainty

## Backend structure

Add:

```txt
apps/api/app/agents/
  graph.py
  state.py
  nodes.py
  tools.py
  prompts/
    data_quality_v1.md
    credit_analyst_v1.md
    prospect_assist_v1.md
    risk_investigator_v1.md
    lending_brief_v1.md
  providers/
    base.py
    mock.py
    openai_compatible.py
  schemas.py
```

Add route:

```txt
apps/api/app/api/routes/copilot.py
```

Register route in `main.py`.

## Required endpoint

```txt
POST /copilot/{msme_id}/brief
```

Request:

```json
{
  "mode": "mock",
  "include_trace": true
}
```

Response:

```json
{
  "msme_id": "msme_001",
  "brief_id": "brief_001",
  "executive_summary": "...",
  "data_quality_observations": "...",
  "credit_analyst_explanation": "...",
  "prospect_assist_recommendation": "...",
  "risk_investigator_findings": "...",
  "final_lending_brief": "...",
  "confidence": "medium_high",
  "assumptions": ["..."],
  "follow_up_questions": ["..."],
  "recommended_human_action": "...",
  "decision_support_only": true,
  "cited_internal_inputs": [
    "msme_profile:msme_001",
    "score_output:latest",
    "prospect_signals:latest"
  ],
  "trace": [
    {
      "step": "get_msme_profile",
      "type": "tool",
      "status": "success"
    },
    {
      "step": "data_quality_node",
      "type": "agent_node",
      "status": "success"
    }
  ],
  "provider": "mock",
  "prompt_version": "credit_copilot_v1"
}
```

## Required tools

Implement tool functions that call existing backend services:

```txt
get_msme_profile(msme_id)
get_financial_health_score(msme_id)
get_risk_factors(msme_id)
get_missing_documents(msme_id)
get_transaction_summary(msme_id)
get_prospect_signals(msme_id)
create_audit_event(msme_id, action, metadata)
```

All tools must be allowlisted.

No arbitrary function/tool execution.

## Required graph nodes

### 1. Data Quality Node

Input:

* MSME profile
* document status
* financial snapshot
* score output

Output:

* data confidence explanation
* missing data
* suspicious inconsistencies
* verification needs

Must explicitly say when confidence is low.

### 2. Credit Analyst Node

Input:

* score
* risk tier
* reason codes
* suggested credit limit
* requested amount

Output:

* human-readable credit interpretation
* why suggested limit differs from requested amount
* strengths
* weaknesses

### 3. Prospect Assist Node

Input:

* prospect signals
* segment
* growth trend
* product fit

Output:

* priority explanation
* likely credit need
* next best outreach/review action

### 4. Risk Investigator Node

Input:

* negative factors
* early warnings
* suspicious signals

Output:

* top concerns
* anomaly explanation
* follow-up questions for bank officer
* recommended checks

### 5. Lending Brief Node

Input:

* outputs of previous nodes

Output:

* final bank-officer-ready lending brief
* concise recommendation for human review
* assumptions
* decision-support disclaimer

## Provider architecture

Create provider abstraction:

```txt
BaseLLMProvider
MockLLMProvider
OpenAICompatibleProvider
```

Default:

```txt
AI_PROVIDER=mock
```

Mock provider must be deterministic and useful for demo.

OpenAI-compatible provider must be optional. The app must run without a paid API key.

Environment variables:

```txt
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

## Prompt requirements

Prompts must be versioned files.

Each prompt must include:

* role
* task
* allowed inputs
* forbidden behavior
* output schema
* safety reminder
* instruction not to invent numbers
* instruction to cite internal inputs

## Audit requirements

Create audit event when:

* copilot brief is generated
* provider is mock or real
* tool sequence completes
* agent fails

Audit metadata should include:

* msme_id
* provider
* prompt version
* trace length
* success/failure

## Frontend integration

Update MSME detail page.

Add Credit Copilot panel with:

* generate brief button
* executive summary
* final lending brief
* assumptions
* follow-up questions
* recommended human action
* confidence badge
* decision-support disclaimer
* trace accordion

Add governance page or section showing:

* provider mode
* prompt version
* tool trace
* audit event

## Safety behavior

If AI provider fails:

* return safe fallback
* show error clearly
* do not break score page
* preserve deterministic score output
* suggest human review

## Tests required

Add tests for:

1. mock provider returns deterministic response
2. agent output includes `decision_support_only = true`
3. agent cannot modify score
4. agent cites internal inputs
5. missing documents appear in data quality output
6. tool allowlist rejects unknown tool
7. copilot endpoint works in mock mode
8. audit event is created for generated brief

## Do not do

* Do not create autonomous multi-agent chaos.
* Do not add CrewAI-style roleplay unless justified.
* Do not browse external web from the agent.
* Do not put API keys in frontend.
* Do not make LLM required for local demo.
* Do not generate final loan approval language.

## Acceptance criteria

Phase 3 is complete only when:

* Credit Copilot endpoint works
* frontend displays AI lending brief
* mock provider works without API key
* trace is visible
* safety language is present
* tests pass or failures are reported
* score remains deterministic source of truth

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

