# Deployment Guide

LendSignal 360 is currently a synthetic-data demo that runs with an in-memory `DemoStore`. PostgreSQL and Redis are future production dependencies, not required for the default demo.

## Local Development Without Docker

Backend:

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd apps/web
npm install
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- Readiness: `http://localhost:8000/ready`

## Local Development With Docker Compose

From the repository root:

```powershell
docker compose up --build
```

The compose file starts:

- `api` on port `8000`
- `web` on port `3000`

The frontend is built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` by default. Override it before building if the browser should call a different backend URL:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
docker compose up --build
```

## Environment Variables

Copy `.env.example` to `.env` for local shell-based development. Do not commit `.env`.

Core variables:

- `APP_ENV`: `development`, `test`, or `production`.
- `CORS_ORIGINS`: comma-separated frontend origins allowed by FastAPI.
- `NEXT_PUBLIC_API_BASE_URL`: backend URL used by the browser.
- `AI_PROVIDER`: `mock`, `groq`, or `disabled`.
- `GROQ_API_KEY`: backend-only key for Groq mode.
- `GROQ_MODEL_STREAM` and `GROQ_MODEL_STRUCTURED`: provider model names.
- `COPILOT_STREAMING_ENABLED`: enables SSE brief streaming when `true`.

## AI Provider Modes

Mock mode requires no key and is the recommended demo mode:

```powershell
$env:AI_PROVIDER="mock"
```

Groq mode is optional and backend-only:

```powershell
$env:AI_PROVIDER="groq"
$env:GROQ_API_KEY="..."
```

Disabled mode keeps deterministic scoring and returns safe unavailable Copilot responses:

```powershell
$env:AI_PROVIDER="disabled"
```

Verify provider/model state:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/copilot/provider/status"
```

## PowerShell API Calls

For JSON POST requests, use `Invoke-RestMethod`:

```powershell
$body = @{
  mode = "mock"
  include_trace = $true
  regenerate = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/copilot/msme_001/brief" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

If you receive a `422` validation error, confirm that `ContentType` is `application/json` and that the request body is valid JSON.

For streaming, use `curl.exe`, not PowerShell's `curl` alias:

```powershell
curl.exe -N "http://127.0.0.1:8000/copilot/msme_001/brief/stream?mode=mock"
```

## Production Notes

Before any real deployment, configure explicit production CORS origins, secret management, authentication, persistent storage, rate limiting, audit retention, HTTPS, and observability. The app is decision-support only and does not issue final lending decisions.
