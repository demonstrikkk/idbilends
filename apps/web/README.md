# LendSignal 360 Web

Phase 2 Next.js credit cockpit for the existing FastAPI backend.

## Commands

```bash
cd apps/web
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

The frontend expects the Phase 1 backend at:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The current backend exposes unversioned routes such as `/msmes`, `/scores/{id}/generate`, `/prospects/{id}/signals`, `/audit/{id}`, `/health`, and `/ready`. The product docs describe `/api/v1` as the preferred future base path, so the frontend keeps the base URL configurable.

## Phase 2 boundaries

- Scores, risk tiers, suggested credit ranges, reason factors, prospect scores, and next best actions are rendered from backend responses only.
- The frontend does not calculate credit or prospect scores.
- Credit Copilot is shown only as a clearly marked placeholder until Phase 3.
- All visible credit language is decision-support oriented and avoids final automated approval claims.
