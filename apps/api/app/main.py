from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import audit, demo, health, msmes, prospects, scores
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.security import RequestIdMiddleware


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="LendSignal 360 API", version=settings.service_version)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_error_handlers(app)
    for router in [health.router, demo.router, msmes.router, scores.router, prospects.router, audit.router]:
        app.include_router(router)
    return app


app = create_app()
