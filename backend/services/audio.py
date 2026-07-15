"""Strict FFmpeg-backed upload validation and audio normalization."""
import os
import shutil
import subprocess
import uuid

from fastapi import HTTPException, UploadFile

from config import settings
from utils.logger import logger

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".ogg", ".flac"}


def _remove_if_exists(path: str) -> None:
    if os.path.exists(path):
        os.remove(path)


def _require_ffmpeg() -> tuple[str, str]:
    ffmpeg, ffprobe = shutil.which("ffmpeg"), shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise HTTPException(status_code=500, detail="FFmpeg is not installed.")
    return ffmpeg, ffprobe


def _duration_seconds(ffprobe: str, path: str) -> float:
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True, check=False,
    )
    try:
        return float(result.stdout.strip())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Could not read the uploaded audio file.") from exc


def validate_and_convert_audio(upload_file: UploadFile) -> str:
    """Save an allowed upload and convert it to normalized 16 kHz mono PCM WAV."""
    extension = os.path.splitext(upload_file.filename or "")[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file format. Supported formats: wav, mp3, m4a, ogg, flac")

    # No mock fallback: ffprobe validates input and ffmpeg performs every conversion.
    ffmpeg, ffprobe = _require_ffmpeg()
    file_id = str(uuid.uuid4())
    raw_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_raw{extension}")
    wav_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}.wav")
    try:
        size = 0
        with open(raw_path, "wb") as destination:
            while chunk := upload_file.file.read(1024 * 1024):
                size += len(chunk)
                if size > settings.MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="File size exceeds the 10MB limit.")
                destination.write(chunk)

        duration = _duration_seconds(ffprobe, raw_path)
        if not settings.MIN_AUDIO_DURATION <= duration <= settings.MAX_AUDIO_DURATION:
            raise HTTPException(status_code=400, detail=(
                f"Audio duration must be between {settings.MIN_AUDIO_DURATION:g} and "
                f"{settings.MAX_AUDIO_DURATION:g} seconds. Uploaded file is {duration:.1f} seconds."
            ))

        # aformat gives Faster-Whisper predictable PCM input; loudnorm avoids extreme levels.
        conversion = subprocess.run(
            [ffmpeg, "-y", "-i", raw_path, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", "-af", "loudnorm", wav_path],
            capture_output=True, text=True, check=False,
        )
        if conversion.returncode != 0 or not os.path.exists(wav_path):
            logger.error("FFmpeg conversion failed: %s", conversion.stderr[-2000:])
            raise HTTPException(status_code=400, detail="FFmpeg could not convert the uploaded audio.")
        logger.info("Audio normalized: %s (%.2fs)", wav_path, duration)
        return wav_path
    except HTTPException:
        _remove_if_exists(raw_path)
        _remove_if_exists(wav_path)
        raise
    except OSError as exc:
        _remove_if_exists(raw_path)
        _remove_if_exists(wav_path)
        logger.exception("Unable to process upload")
        raise HTTPException(status_code=500, detail="Audio preprocessing failed.") from exc
    finally:
        _remove_if_exists(raw_path)
