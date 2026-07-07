# Live Monitoring Design

Phase 6 adds a hackathon-safe live credit monitoring simulator.

## Product Loop

Synthetic monitoring events mutate borrower features, the deterministic score service recomputes the score, score history records the delta, audit logs capture the event, and `/ws/monitoring` broadcasts updates to the Monitoring workbench.

## Event Types

Supported events include balance drops, revenue-growth changes, filing delays, evidence received, invoice delay increases, buyer concentration changes, bounce events, EMI burden changes, GeM order completion, suspicious revenue spikes, sector stress, and market overlay changes.

## Boundaries

- No Kafka, Flink, or external stream dependency is required for the demo.
- Events mutate synthetic in-memory profiles only.
- The score engine remains the source of truth.
- Copilot can explain score deltas from stored score history, but it does not calculate or alter scores.
- Outputs remain decision-support only.
