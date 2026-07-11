import os
import wave
import uuid
from fastapi import HTTPException, UploadFile
from backend.utils.logger import logger
from backend.config import settings

def get_audio_duration_wave(file_path: str) -> float:
    """
    Attempts to read audio duration using the standard library wave module.
    Only works for WAV files.
    """
    try:
        with wave.open(file_path, "rb") as wav_file:
            frames = wav_file.getnframes()
            rate = wav_file.getframerate()
            duration = frames / float(rate)
            return duration
    except Exception as e:
        logger.debug(f"Standard wave reader failed for {file_path}: {e}")
        raise ValueError("Could not parse WAV file format")

def validate_and_convert_audio(upload_file: UploadFile) -> str:
    """
    Validates audio file size and duration (must be 30-45 seconds).
    Saves the file to the upload directory.
    If running in production mode, enforces WAV conversion and strict duration.
    If running in mock mode, allows fallback behaviors if ffmpeg is missing.
    """
    # Create unique filename
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(upload_file.filename)[1].lower()
    
    # Allowed extensions
    allowed_exts = [".wav", ".mp3", ".m4a", ".ogg", ".flac"]
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Supported formats: {', '.join(allowed_exts)}"
        )
    
    temp_file_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_raw{file_ext}")
    target_wav_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.wav")

    # Save uploaded file
    try:
        size = 0
        with open(temp_file_path, "wb") as f:
            while content := upload_file.file.read(1024 * 1024):  # Read in chunks of 1MB
                size += len(content)
                if size > settings.MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit.")
                f.write(content)
    except HTTPException:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while saving file.")

    # Determine duration
    duration = None
    
    # If it is a WAV file, try standard wave module first (doesn't require FFmpeg)
    if file_ext == ".wav":
        try:
            duration = get_audio_duration_wave(temp_file_path)
            # Since it's already a WAV file, we can copy it directly
            os.rename(temp_file_path, target_wav_path)
        except ValueError:
            pass  # Fall back to other checks
            
    # If not processed yet, check if we can use pydub (requires FFmpeg)
    if duration is None:
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(temp_file_path)
            duration = len(audio) / 1000.0  # pydub duration is in ms
            # Export as 16kHz mono WAV for Whisper
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(target_wav_path, format="wav")
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except ImportError:
            logger.warning("Pydub is not installed. Cannot perform complex audio conversions.")
        except Exception as e:
            logger.warning(f"Failed to process audio with pydub: {e}")

    # Fallback validation for Mock Mode (if FFmpeg is missing and we couldn't parse duration)
    if duration is None:
        if settings.ENGINE_MODE == "mock":
            # For testing/demo purposes, we allow a fallback duration in mock mode
            logger.warning("Could not determine actual audio duration. Falling back to default (35s) in mock mode.")
            duration = 35.0
            # Just rename the raw file to wav path even if it's not wav, since Mock doesn't process audio bytes
            if os.path.exists(temp_file_path):
                os.rename(temp_file_path, target_wav_path)
        else:
            # In production/whisperx mode, we must fail if we can't parse or convert the file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise HTTPException(
                status_code=400,
                detail="Could not process audio file. Ensure it is a valid WAV file or that FFmpeg is installed."
            )

    # Validate duration bounds (30 to 45 seconds)
    if duration < 30.0 or duration > 45.0:
        # Cleanup
        if os.path.exists(target_wav_path):
            os.remove(target_wav_path)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(
            status_code=400,
            detail=f"Audio duration must be between 30 and 45 seconds. Uploaded file is {duration:.1f} seconds."
        )

    logger.info(f"Audio validation successful. File: {target_wav_path}, Duration: {duration:.2f}s")
    return target_wav_path
