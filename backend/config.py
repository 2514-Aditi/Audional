import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Pronunciation Assessment API"
    API_V1_STR: str = "/api"
    
    # Engine configuration: 'whisperx' or 'mock'
    ENGINE_MODE: str = "faster_whisper"
    
    # Whisper Model settings (used if engine is whisperx or real whisper)
    # Options: tiny, base, small, medium, large-v2
    WHISPER_MODEL: str = "tiny.en"
    MIN_AUDIO_DURATION: float = 1.0
    MAX_AUDIO_DURATION: float = 45.0
    
    # Hugging Face token (required for some WhisperX alignment models/diarization, though often optional)
    HF_TOKEN: Optional[str] = None
    
    # Maximum audio file size in bytes (10MB)
    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    
    # Temp upload folder
    UPLOAD_DIR: str = "uploads"
    
    # CORS origins
    ALLOWED_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
