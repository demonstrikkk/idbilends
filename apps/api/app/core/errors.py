from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "req_unknown")


def error_payload(code: str, message: str, request_id: str, details: dict | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or {}, "request_id": request_id}}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        code = detail.get("code", "INTERNAL_ERROR" if exc.status_code >= 500 else "VALIDATION_ERROR")
        message = detail.get("message", str(exc.detail))
        return JSONResponse(status_code=exc.status_code, content=error_payload(code, message, _request_id(request), detail.get("details")))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=error_payload("VALIDATION_ERROR", "Invalid request.", _request_id(request), {"errors": exc.errors()}),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=error_payload("INTERNAL_ERROR", "Unexpected server error.", _request_id(request)),
        )
