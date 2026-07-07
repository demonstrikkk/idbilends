from pathlib import Path
from functools import lru_cache
import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    service_name: str = "lendsignal-api"
    service_version: str = "0.1.0"
    database_url: str = Field(default="sqlite+pysqlite:///:memory:", alias="DATABASE_URL")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    ai_provider: str = Field(default="mock", alias="AI_PROVIDER")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model_stream: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL_STREAM")
    groq_model_structured: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL_STRUCTURED")
    groq_temperature: float = Field(default=0.2, alias="GROQ_TEMPERATURE")
    groq_max_tokens: int = Field(default=1800, alias="GROQ_MAX_TOKENS")
    copilot_streaming_enabled: bool = Field(default=True, alias="COPILOT_STREAMING_ENABLED")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent.parent.parent / ".env",
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in {"production", "prod"}

    def validate_production_safety(self) -> None:
        if self.is_production and "*" in self.cors_origin_list:
            raise ValueError("CORS_ORIGINS must not contain '*' when APP_ENV=production.")


@lru_cache
def get_settings() -> Settings:
    if "PYTEST_CURRENT_TEST" in os.environ:
        return Settings(_env_file=None)
    settings = Settings()
    settings.validate_production_safety()
    return settings
