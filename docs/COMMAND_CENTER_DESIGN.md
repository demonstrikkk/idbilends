# Command Center Design — LendSignal 360

## Purpose
The Command Center is the main operating surface for credit officers. It provides a centralized view of 1000 synthetic MSME cases with search, filter, pagination, and case intelligence.

## Layout
- Left sidebar: saved views (All active files, Score dropped today, Missing evidence, etc.)
- Center: paginated table with columns (Borrower, Score, Delta, Risk, Confidence, Blocker, RM)
- Right: CasePreview panel with key metrics, risk/confidence pills, recommended action, evidence/copilot/inject actions
- Right drawer: opens for Evidence View or Credit Copilot

## Global Monitoring Controls
- Status indicator (green dot when active, gray when inactive)
- Start/Stop buttons
- Located in the filter header bar

## Features
- Full-text search across borrower, branch, zone, segment
- Sort by action priority, score, delta, confidence
- Faceted filters: risk tier, segment, zone, confidence band
- Pagination with 25 cases per page
- Saved views with URL query parameter support
- Right drawer system (evidence records, copilot chat)
- Monitoring event injection per-case

## API
- GET /portfolio/command-center — paginated case list with filters
- POST /monitoring/start — start monitoring engine
- POST /monitoring/stop — stop monitoring engine
- GET /monitoring/status — monitoring status
- POST /monitoring/events/manual — inject manual monitoring event
