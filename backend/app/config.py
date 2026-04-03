from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Sales Prospecting Tool"
    debug: bool = False

    # PostgreSQL
    database_url: str = "postgresql://postgres:postgres@localhost:5432/prospecting"

    # Future modules settings can be added here
    # ANTHROPIC_API_KEY: str = ""
    # INSTANTLY_API_KEY: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
