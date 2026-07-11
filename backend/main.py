import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from typing import Optional

from backend.config import settings
from backend.utils.logger import logger
from backend.services.audio import validate_and_convert_audio
from backend.services.transcription import get_transcription_engine
from backend.services.assessor import calculate_assessment

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend for pronunciation assessment using WhisperX and phonetic alignment.",
    version="1.0.0"
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
        "cuda_available": settings.ENGINE_MODE == "whisperx"
    }

@app.post("/api/assess")
def assess_pronunciation(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    reference_text: Optional[str] = Form(None)
):
    """
    Primary endpoint for pronunciation assessment.
    - Validates audio file length (30-45s) and format.
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
        logger.error(f"Transcription/alignment failed: {e}")
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)
        raise HTTPException(
            status_code=500, 
            detail="Speech recognition or alignment failed. Please ensure the audio contains clear speech."
        )

    # 3. Calculate Pronunciation Scores and identify mistakes
    try:
        assessment_results = calculate_assessment(alignment_data["words"])
    except Exception as e:
        logger.error(f"Assessment calculation failed: {e}")
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

    # Set up background task to clean up after some time (optional, left as placeholder for production)
    # background_tasks.add_task(cleanup_file, wav_path)

    logger.info("Assessment successfully completed.")
    return JSONResponse(content=response_payload)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
