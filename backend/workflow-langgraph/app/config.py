from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://lramar@localhost:5432/workflow_db?search_path=public&sslmode=disable"
    OPENAI_API_KEY: str = "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"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 