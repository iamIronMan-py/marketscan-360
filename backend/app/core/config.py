from pathlib import Path
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / "backend" / ".env"), str(ROOT_DIR / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MarketScan 360 API"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:5173"
    frontend_origins_raw: str = Field(default="", alias="FRONTEND_ORIGINS")
    frontend_origin_regex: str = Field(
        default=r"^https://[a-z0-9-]+\.ngrok-free\.app$",
        alias="FRONTEND_ORIGIN_REGEX",
    )
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:5688353@localhost:5432/marketscan360",
        alias="DATABASE_URL",
    )
    export_root: Path = Field(default=Path("backend/storage/exports"), alias="EXPORT_ROOT")
    report_root: Path = Field(default=Path("backend/storage/reports"), alias="REPORT_ROOT")
    gmail_sender_email: str = Field(default="", alias="GMAIL_SENDER_EMAIL")
    gmail_app_password: str = Field(default="", alias="GMAIL_APP_PASSWORD")
    otp_expiry_minutes: int = Field(default=10, alias="OTP_EXPIRY_MINUTES")
    auth_debug_return_otp: bool = Field(default=True, alias="AUTH_DEBUG_RETURN_OTP")
    jwt_secret_key: str = Field(default="change-this-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=10080, alias="JWT_EXPIRE_MINUTES")

    @property
    def cors_origins(self) -> list[str]:
        values: list[str] = []
        if self.frontend_origin:
            values.append(self.frontend_origin.strip())
        if self.frontend_origins_raw:
            values.extend(
                origin.strip()
                for origin in self.frontend_origins_raw.split(",")
                if origin.strip()
            )
        values.extend(["http://127.0.0.1:5173", "http://localhost:5173"])

        deduped: list[str] = []
        seen: set[str] = set()
        for value in values:
            if value in seen:
                continue
            seen.add(value)
            deduped.append(value)
        return deduped


settings = Settings()
