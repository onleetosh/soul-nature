from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Soul of Nature API"
    environment: str = "development"
    cors_origins: list[str] = ["http://localhost:3000"]
    database_url: str = "postgresql+psycopg://soul:soul@localhost:5432/soul_nature"

    currency: str = "usd"
    shipping_flat_cents: int = 695
    free_shipping_threshold_cents: int = 7500

    frontend_url: str = "http://localhost:3000"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    admin_token: str = ""

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, url: str) -> str:
        # Hosts such as Render hand out plain postgres:// URLs; we ship the psycopg 3 driver.
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
