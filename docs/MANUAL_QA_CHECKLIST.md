# Manual QA Checklist

Phase: 3.7 Product Realignment + Banker Workbench Rebuild

## Core Workflow

- Open `/case-inbox`; confirm lanes are Ready for Review, Missing Evidence, Risk Attention, High Potential Prospect, and Low Confidence.
- Click a case card; confirm `/msmes/{id}` opens the Credit File workbench.
- In Credit File, switch sections: Identity, Financial Records, Documents, Derived Signals, Credit Posture, Copilot, Audit.
- Confirm right inspector shows score, confidence, current blocker, next best action, and decision-support disclaimer.

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
- Generate brief and stream brief from the case detail page.
- Confirm score, risk tier, confidence, and suggested range do not change after Copilot activity.

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
