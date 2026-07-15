import os
import json
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import Optional
from contextlib import asynccontextmanager

from config import settings
from utils.logger import logger
from services.audio import validate_and_convert_audio
from services.transcription import get_transcription_engine
from services.assessor import calculate_assessment

@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_transcription_engine()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend for pronunciation assessment using Faster-Whisper.",
    version="1.1.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the uploads directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Mount the uploads folder as static files so the frontend can stream audio
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

def cleanup_file(filepath: str):
    """
    Cleans up temporary audio files. In production, you might set a timer to delete
    files after a few minutes, or use a cron job.
    """
    try:
        if os.path.exists(filepath):
            # In this production app, we keep the processed WAV so the frontend can stream it,
            # but we delete original raw uploads.
            # We can write a background worker to clean up WAV files older than 1 hour.
            pass
    except Exception as e:
        logger.error(f"Error cleaning up file {filepath}: {e}")

@app.get("/api/health")
def health_check():
    """
    Health check endpoint to verify backend status and current engine mode.
    """
    return {
        "status": "healthy",
        "engine_mode": settings.ENGINE_MODE,
        "whisper_model": settings.WHISPER_MODEL,
        "cuda_available": settings.ENGINE_MODE != "mock"
    }

@app.post("/api/assess")
def assess_pronunciation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    reference_text: Optional[str] = Form(None)
):
    """
    Primary endpoint for pronunciation assessment.
    - Validates audio format and duration.
    - Transcribes and aligns the spoken text.
    - Evaluates accuracy, fluency, and completeness.
    - Returns overall score, word-level metrics, and suggestions.
    """
    logger.info(f"Received assessment request for file: {file.filename}")
    
    # 1. Validate file and convert to 16kHz PCM WAV
    wav_path = None
    try:
        wav_path = validate_and_convert_audio(file)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error during audio validation: {e}")
        raise HTTPException(status_code=500, detail="Error processing audio file.")

    # 2. Transcribe and Align
    try:
        engine = get_transcription_engine()
        alignment_data = engine.transcribe_and_align(wav_path, reference_text=reference_text)
    except Exception as e:
        logger.exception("Transcription/alignment failed")
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)
        raise HTTPException(
            status_code=500, 
            detail="Speech recognition or alignment failed. Please ensure the audio contains clear speech."
        )

    logger.info("Detected transcript: %s", alignment_data.get("transcript", ""))
    logger.info("Detected words: %d", len(alignment_data.get("words", [])))
    if not alignment_data.get("words"):
        raise HTTPException(status_code=400, detail="No speech detected in uploaded audio.")

    # 3. Calculate Pronunciation Scores and identify mistakes
    try:
        assessment_results = calculate_assessment(alignment_data["words"])
    except Exception as e:
        # logger.exception writes the complete traceback to Render/local logs.
        logger.exception("Assessment calculation failed")
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)
        raise HTTPException(status_code=500, detail="Failed to calculate pronunciation metrics.")

    # 4. Construct response payload
    # Generate relative streaming URL for the frontend
    filename = os.path.basename(wav_path)
    audio_url = f"/api/uploads/{filename}"

    response_payload = {
        "audio_url": audio_url,
        "transcript": alignment_data["transcript"],
        "words": alignment_data["words"],
        **assessment_results
    }
    # Emit the exact response for operational verification (including timestamps).
    logger.info("POST /api/assess response: %s", json.dumps(response_payload, ensure_ascii=False))

    # Set up background task to clean up after some time (optional, left as placeholder for production)
    # background_tasks.add_task(cleanup_file, wav_path)

    logger.info("Assessment successfully completed.")
    return JSONResponse(content=response_payload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
