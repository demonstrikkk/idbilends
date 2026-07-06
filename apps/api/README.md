# LendSignal 360 API

Phase 1 FastAPI backend for deterministic MSME credit scoring, Prospect Assist signals, synthetic demo seeding, and audit events.

```bash
cd apps/api
python -m venv .venv
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

The current Phase 1 implementation uses deterministic in-memory local persistence for fast demo startup, while SQLAlchemy models remain DB-ready for the PostgreSQL migration phase.
