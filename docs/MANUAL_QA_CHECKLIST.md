# Manual QA Checklist

Phase: 6 Live Credit Monitoring + Scale Simulation

## Core Workflow

- Open `/case-inbox`; confirm lanes are Ready for Review, Missing Evidence, Risk Attention, High Potential Prospect, and Low Confidence.
- Click a case card; confirm `/msmes/{id}` opens the Credit File workbench.
- In Credit File, switch sections: Identity, Financial Records, Evidence Records, Derived Signals, Credit Posture, Copilot, Audit.
- Confirm right inspector shows score, confidence, current blocker, recommended human action, and decision-support disclaimer.

## Data Room

- Open `/data-room`.
- Select multiple credit files.
- Confirm records show status, why it matters, related score component, and enabled/disabled action.
- Confirm unavailable actions are disabled with a reason.

## Evidence Map

- Open `/evidence-map`.
- Select a credit file.
- Confirm rows map Source Data -> Derived Signal -> Score Component -> Lending Question -> Human Action.
- Confirm missing backend data is labelled unavailable.

## Credit Copilot

- Open `/copilot`.
- Select a case.
- Use predefined prompts and free-text chat.
- Confirm responses include provider/model, cited internal inputs, and trace.
- Generate a decision-support brief and stream a brief from the case detail page.
- Confirm score, risk tier, confidence, and suggested range do not change after Copilot activity.

## Live Monitoring

- Seed 1000 profiles with `POST /demo/seed`.
- Open `/monitoring`.
- Start monitoring and confirm the session status changes.
- Inject a manual adverse event and confirm the live stream receives a backend event.
- Confirm score movements, top deteriorating cases, top improving cases, missingness, and drift indicators update from backend responses.
- Confirm `/score-history/{msme_id}` contains the event-linked score delta.
- Stop monitoring and confirm the session status changes.

## Adaptive Overlay

- Open API docs or use a request client for `/market-overlays/simulate`.
- Confirm `policy_score` remains separate from `market_adjusted_score`.
- Confirm overlay output includes version, reason, and trace.

## Provider Modes

- Mock mode returns validated brief/chat responses without keys.
- Groq without `GROQ_API_KEY` shows provider unavailable; deterministic score remains available.
- Disabled mode returns safe disabled response.

## Responsive Checks

- Verify 1366x768, tablet width, and mobile width.
- Tables scroll horizontally.
- Sidebar scrolls internally.
- Credit File inspector remains readable.
- Chat messages do not overlap controls.

## Safety Scans

- Search for final-decision language in `apps/web` and `apps/api`.
- Search for fake frontend data keywords.
- Search for committed non-example Groq secrets.
