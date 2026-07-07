# UI Backend Integrity Audit

Phase: 3.7 Product Realignment + Banker Workbench Rebuild

## Primary Page Mapping

| Page | Job | Backend source | No-fake handling |
|---|---|---|---|
| `/case-inbox` | Group cases needing officer action | `GET /case-inbox` | Lanes contain only backend-derived cases. Empty lanes show empty state. |
| `/msmes` | Credit file register | `GET /portfolio/cases` | Rows use backend profile, score, and prospect outputs. |
| `/msmes/{id}` | Flagship Credit File workbench | `GET /credit-file/{id}` | Score, posture, evidence, transaction summary, risk, and audit come from backend bundle. |
| `/data-room` | Organized record status | `GET /portfolio/cases`, `GET /credit-file/{id}` | Unsupported record actions are disabled with backend-phase explanation. |
| `/evidence-map` | Source-to-underwriting evidence trace | `GET /credit-file/{id}/evidence-map` | Missing source data is labelled unavailable, not fabricated. |
| `/copilot` | Case-aware Copilot chat and brief generation | `GET /portfolio/cases`, `POST /copilot/{id}/chat`, existing brief/stream endpoints | Chat answers are backend-generated from sanitized context. |
| `/portfolio` | Portfolio-level signals | `GET /portfolio/cases`, `GET /portfolio/summary`, related aggregation endpoints | Current snapshot only; no fake history. |
| `/monitoring` | Live synthetic credit monitoring | `GET /monitoring/live-cases`, `POST /monitoring/start`, `POST /monitoring/stop`, `POST /monitoring/events/manual`, `WS /ws/monitoring` | Events, deltas, drift indicators, and missingness counts are backend-generated. |
| `/governance` | Bank-safe operating controls | `GET /health`, `GET /ready`, `GET /copilot/provider/status`, `GET /audit/{id}` | Shows current provider and audit state only. |

## Allowed Frontend Static Data

- Navigation labels.
- Enum display labels.
- Banker prompt suggestions.
- Empty-state and disabled-state copy.
- Documentation references.

## Prohibited Frontend Data

- Hardcoded MSME rows.
- Hardcoded scores, warnings, alerts, or Copilot answers.
- Fake report history, model history, policy approvals, or owner queues.
- Frontend-only score history, monitoring events, score deltas, or market overlay impacts.

## 21st.dev

21st.dev Magic tools were discoverable, but `21st_magic_component_inspiration` failed with an MCP response validation error. No external component snippet was installed. Equivalent workflow components were implemented manually with the existing Next.js, TypeScript, Tailwind, lucide, TanStack Query, and Zod stack.
