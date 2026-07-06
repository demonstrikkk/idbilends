# LendSignal 360

AI-powered MSME credit intelligence platform for prospect discovery, alternative-data financial health scoring, explainable credit decisioning, and controlled agentic lending assistance.

## What this is

LendSignal 360 is a bank-grade decision-support system for MSME lending. It helps lending teams answer:

- Which MSMEs are promising prospects?
- What is their financial health?
- How much credit may be safe to consider?
- Why did the system produce this score?
- What documents or signals are missing?
- What should a bank officer review next?

## What this is not

This is not an automated final loan approval engine. It is decision-support software. Final credit decisions require human review, bank policy, compliance checks, and verified data.

## Repo structure

```txt
apps/
  web/       Next.js frontend
  api/       FastAPI backend
  worker/    optional async/AI worker
packages/
  shared/    shared schemas/types
  ui/        shared UI package if needed
  config/    shared config
docs/        architecture, API, product, roadmap
prompts/     Codex task prompts
infra/       docker, CI, deployment notes
datasets/    synthetic/demo datasets only
tests/       cross-service tests
```

## Start with Codex

1. Paste the exported deep-research document into `docs/RESEARCH_BLUEPRINT.md`.
2. Give Codex `prompts/00_MASTER_CODEX_PROMPT.md`.
3. Then run the phase prompts in order:
   - `prompts/01_PHASE_0_PLANNING.md`
   - `prompts/02_PHASE_1_BACKEND.md`
   - `prompts/03_PHASE_2_FRONTEND.md`
   - `prompts/04_PHASE_3_AGENTIC_AI.md`
   - `prompts/05_PHASE_4_PRODUCTION_HARDENING.md`

## MVP target

A working local MVP where:

```bash
docker compose up --build
```

runs:
- frontend dashboard
- backend API docs
- seeded synthetic MSME profiles
- financial health scoring endpoint
- one complete MSME profile detail page
- Credit Copilot AI lending brief in mock mode
