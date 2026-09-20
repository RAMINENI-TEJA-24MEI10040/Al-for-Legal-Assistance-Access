import os
import secrets
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "LegalEase AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Gemini API & Embedding Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_FAST_MODEL: str = "gemini-2.5-flash"
    GEMINI_REASONING_MODEL: str = "gemini-2.5-pro"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_PROVIDER: str = "google-genai"
    EMBEDDING_DIMENSION: int = 768
    EMBEDDING_VERSION: str = "v1.0"
    
    # Database
    DATABASE_PATH: str = "legalease.db"
    
    # Security Configuration (Dynamic 32-byte key generation if omitted in environment)
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_hex(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # Document Security Limits
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_DOCUMENT_PAGES: int = 500
    MAX_DECOMPRESSION_RATIO: int = 10
    
    # Mandatory Legal Disclaimer
    LEGAL_DISCLAIMER: str = (
        "LegalEase AI provides document analysis and information extraction assistance and does NOT provide "
        "legal advice. AI-generated results may contain errors or omissions. Always consult a qualified legal "
        "professional for advice regarding specific legal circumstances or decisions."
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
