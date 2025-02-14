from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres@127.0.0.1:5432/workflow_db?search_path=public&sslmode=disable"
    OPENAI_API_KEY: str = "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"
    ANTHROPIC_API_KEY: str = "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"
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 