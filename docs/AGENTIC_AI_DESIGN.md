# LendSignal 360 — Agentic AI Design

## 1. Purpose

Credit Copilot is a controlled AI-assisted lending analyst. It helps bank officers understand, investigate, and summarize MSME credit signals.

It does not calculate the Financial Health Score.  
It does not make final credit decisions.  
It does not approve or reject loans.

## 2. Why agentic AI is included

Without an agentic layer, the product may look like a scoring dashboard. Credit Copilot adds:

- guided reasoning
- lending brief generation
- anomaly investigation
- missing document questions
- human-review recommendations
- AI traceability
- premium modern product feel

## 3. Core safety principle

The deterministic scoring service owns:

- score
- risk tier
- data confidence
- suggested credit range
- reason codes

Credit Copilot owns:

- explanation
- synthesis
- follow-up questions
- brief writing
- risk narrative
- officer action language

## 4. Agent graph

```txt
Input: msme_id
  ↓
Tool collection
  ├── get_msme_profile
  ├── get_financial_health_score
  ├── get_prospect_signals
  ├── get_risk_factors
  ├── get_missing_documents
  └── get_transaction_summary
  ↓
Data Quality Node
  ↓
Credit Analyst Node
  ↓
Prospect Assist Node
  ↓
Risk Investigator Node
  ↓
Lending Brief Node
  ↓
create_audit_event
  ↓
CopilotBrief
```

## 5. Allowed tools

Only these tools are allowed:

| Tool | Purpose |
|---|---|
| get_msme_profile | Load business profile and documents |
| get_financial_health_score | Load deterministic score |
| get_risk_factors | Load risk/early warning signals |
| get_missing_documents | Load document gaps |
| get_transaction_summary | Load synthetic transaction summary |
| get_prospect_signals | Load Prospect Assist output |
| create_audit_event | Record Copilot activity |

Unknown tool calls must fail closed.

## 6. Node responsibilities

### 6.1 Data Quality Node

Inputs:

- profile
- documents
- score
- financial snapshot

Outputs:

- confidence explanation
- missing data
- stale data
- suspicious inconsistency notes
- verification needs

Must say when confidence is low.

### 6.2 Credit Analyst Node

Inputs:

- score
- risk tier
- suggested range
- positive factors
- negative factors
- requested amount

Outputs:

- score explanation
- why suggested range differs from requested amount
- top strengths
- top concerns
- human-review posture

### 6.3 Prospect Assist Node

Inputs:

- prospect score
- priority
- growth signals
- product fit
- credit need

Outputs:

- why this prospect matters
- likely credit need
- RM next action
- outreach timing
- conditions for moving forward

### 6.4 Risk Investigator Node

Inputs:

- negative factors
- early warnings
- missing data
- suspicious patterns

Outputs:

- top risks
- anomaly interpretation
- follow-up questions
- checks before human decision

### 6.5 Lending Brief Node

Inputs:

- prior node outputs

Outputs:

- short summary
- final bank-officer-ready brief
- assumptions
- recommended human action
- decision-support disclaimer

## 7. Provider architecture

```txt
BaseLLMProvider
  ├── MockLLMProvider
  └── OpenAICompatibleProvider
```

Default:

```txt
AI_PROVIDER=mock
```

The app must work without paid API keys.

## 8. Prompt files

Store prompts as versioned files:

```txt
apps/api/app/agents/prompts/
  data_quality_v1.md
  credit_analyst_v1.md
  prospect_assist_v1.md
  risk_investigator_v1.md
  lending_brief_v1.md
```

Every prompt must include:

- role
- task
- allowed inputs
- forbidden behavior
- output schema
- instruction not to invent numbers
- instruction to cite internal inputs
- decision-support disclaimer

## 9. Output schema

```json
{
  "summary": "...",
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
  "cited_internal_inputs": ["msme_profile:msme_001", "score_output:score_001"],
  "trace": []
}
```

## 10. Guardrails

Credit Copilot must not:

- approve or reject as final decision
- invent financial values
- change score
- ignore missing data
- claim real bank data verification
- call web search
- use arbitrary tools
- expose secrets
- render unsafe HTML

Credit Copilot must:

- cite internal inputs
- include a short summary field
- show assumptions
- show confidence
- recommend human verification
- include decision-support language
- log trace

## 11. Fallback behavior

If AI provider fails:

- return safe fallback response
- keep deterministic score visible
- create failed audit event
- show frontend error non-destructively
- suggest human review

## 12. Agent trace

Trace step example:

```json
{
  "step_id": "trace_001",
  "step_name": "data_quality_node",
  "step_type": "agent_node",
  "status": "success",
  "input_refs": ["msme_profile:msme_001", "score_output:score_001"],
  "notes": "Generated data-quality observations."
}
```

## 13. Required tests

1. Mock provider deterministic output.
2. Agent output includes `decision_support_only: true`.
3. Agent does not mutate score.
4. Agent cites internal inputs.
5. Missing documents appear in output.
6. Unknown tool is rejected.
7. Copilot endpoint works in mock mode.
8. Audit event created on success.
9. Audit event created on failure.
10. Final text avoids final approval language.
