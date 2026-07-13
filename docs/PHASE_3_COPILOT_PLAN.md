# Phase 3 Credit Copilot Plan — HISTORICAL (completed)

## Objective

Add the controlled agentic AI layer that explains deterministic outputs, asks follow-up questions, and produces a grounded lending brief without becoming the scoring engine.

## Phase boundaries

Do:

- provider abstraction
- mock provider
- tool allowlist
- graph state and nodes
- Copilot endpoint
- frontend Copilot panel
- trace visibility
- audit events for success and failure

Do not do:

- autonomous browsing
- arbitrary tool execution
- score mutation
- final approval or rejection logic
- paid-key dependency for local demo

## Architecture plan

### 1. Internal tools

Implement allowlisted backend tools only:

- `get_msme_profile`
- `get_financial_health_score`
- `get_risk_factors`
- `get_missing_documents`
- `get_transaction_summary`
- `get_prospect_signals`
- `create_audit_event`

Rule:

- unknown tool calls fail closed and are logged

### 2. Graph nodes

Implement in order:

1. `DataQualityNode`
2. `CreditAnalystNode`
3. `ProspectAssistNode`
4. `RiskInvestigatorNode`
5. `LendingBriefNode`

Each node must emit structured intermediate output, not only free text.

### 3. Provider layer

Implement:

- `BaseLLMProvider`
- `MockLLMProvider`
- `OpenAICompatibleProvider`

Default mode:

- `AI_PROVIDER=mock`

Mock provider requirements:

- deterministic
- grounded in passed inputs
- useful enough for demo
- never invents metrics

### 4. Response contract

Copilot response must include:

- `summary`
- `executive_summary`
- `data_quality_observations`
- `credit_analyst_explanation`
- `prospect_assist_recommendation`
- `risk_investigator_findings`
- `final_lending_brief`
- `confidence`
- `assumptions`
- `follow_up_questions`
- `recommended_human_action`
- `decision_support_only`
- `cited_internal_inputs`
- `trace`

## Safety rules

Credit Copilot may:

- explain score factors
- summarize profile quality
- investigate anomalies
- recommend human follow-up
- generate officer-facing brief text

Credit Copilot must not:

- calculate score
- override score or tier
- change suggested credit range
- hide low confidence
- present final approval language
- use external web calls by default

## Backend implementation plan

Primary files:

- `apps/api/app/agents/graph.py`
- `apps/api/app/agents/state.py`
- `apps/api/app/agents/nodes.py`
- `apps/api/app/agents/tools.py`
- `apps/api/app/agents/providers/base.py`
- `apps/api/app/agents/providers/mock.py`
- `apps/api/app/agents/providers/openai_compatible.py`
- `apps/api/app/agents/schemas.py`
- `apps/api/app/agents/prompts/*.md`
- `apps/api/app/api/routes/copilot.py`

Prompt requirements for every node:

- explicit allowed inputs
- explicit forbidden behavior
- decision-support disclaimer
- instruction not to invent numbers
- citation requirement
- output-shape requirement

## Frontend integration plan

Add to MSME detail page:

- generate brief action
- summary and executive summary
- final brief
- follow-up questions
- assumptions
- confidence badge
- recommended human action
- trace accordion
- provider and prompt version display

Failure behavior:

- keep deterministic score visible
- show safe Copilot error state
- suggest human review

## Testing plan

Required tests:

- mock provider deterministic output
- response includes `decision_support_only: true`
- response includes `summary`
- score fields are copied from backend context, not regenerated
- missing documents appear in output
- unknown tools are rejected
- success audit event created
- failure audit event created
- final text avoids final approval language

## Exit criteria

Phase 3 is complete when:

- Copilot works in mock mode without keys
- score remains deterministic source of truth
- trace is visible to user
- tool boundaries are enforced
- Copilot outputs are grounded, cited, and auditable
