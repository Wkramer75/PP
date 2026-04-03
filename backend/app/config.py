from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Sales Prospecting Tool"
    debug: bool = False

    # PostgreSQL
    database_url: str = "postgresql://postgres:postgres@localhost:5432/prospecting"

    # Default SMTP (can be overridden per campaign)
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "Sales Prospecting Tool"
    smtp_from_email: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
