from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # API Keys
    anthropic_api_key: str
    openai_api_key: str
    pinecone_api_key: str
    pinecone_environment: str

    # App Settings
    max_file_size_mb: int = 50
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()