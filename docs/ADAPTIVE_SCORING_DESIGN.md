# Adaptive Scoring Design

Phase 6 introduces an explainable market overlay without replacing the deterministic policy score.

## Score Outputs

- `policy_score`: the existing deterministic Financial Health Score.
- `market_adjusted_score`: a separate simulated overlay view for sector context.
- `monitoring_delta_score`: the overlay adjustment shown separately from policy score.

## Overlay Rules

Market overlays are versioned and explainable. Examples include manufacturing input-cost pressure, food seasonal demand, digital seller tailwinds, trader collection stress, and textile export stress.

The overlay simulation endpoint returns trace text and `policy_score_unchanged=true`. It never silently rewrites the score output stored by the score service.

## Governance

Copilot may explain an overlay from cited backend inputs. It may not create hidden weight changes, calculate a score, or issue a final lending decision.
