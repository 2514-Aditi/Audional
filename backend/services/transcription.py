"""Fast, reusable speech-to-text engine for the assessment API."""
import math
import re
from abc import ABC, abstractmethod
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional

from config import settings
from utils.logger import logger


class BaseTranscriptionEngine(ABC):
    @abstractmethod
    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        pass


class FasterWhisperEngine(BaseTranscriptionEngine):
    def __init__(self) -> None:
        try:
            import torch
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            self.device = "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        from faster_whisper import WhisperModel
        logger.info("Loading Faster-Whisper %s once on %s", settings.WHISPER_MODEL, self.device)
        self.model = WhisperModel(settings.WHISPER_MODEL, device=self.device, compute_type=self.compute_type)

    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        segments, info = self.model.transcribe(
            audio_path, beam_size=1, word_timestamps=True, vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 350}, condition_on_previous_text=False,
        )
        transcript, words, raw_segments = [], [], []
        for segment in segments:  # Materialize the generator so its real output is inspectable.
            text = (segment.text or "").strip()
            transcript.append(text)
            segment_start, segment_end = float(segment.start), float(segment.end)
            segment_probability = _probability_from_logprob(getattr(segment, "avg_logprob", None))
            segment_words = list(segment.words or [])
            raw_segments.append({"text": text, "start": segment_start, "end": segment_end,
                                 "avg_logprob": getattr(segment, "avg_logprob", None),
                                 "words": [{"word": getattr(w, "word", ""), "start": getattr(w, "start", None),
                                            "end": getattr(w, "end", None), "probability": getattr(w, "probability", None)} for w in segment_words]})
            words.extend(_words_for_segment(text, segment_start, segment_end, segment_words, segment_probability))
        logger.info("Faster-Whisper raw output: language=%s duration=%s segments=%s", getattr(info, "language", None),
                    getattr(info, "duration", None), raw_segments)
        logger.info("Detected transcript: %s", " ".join(transcript))
        logger.info("Detected words: %d", len(words))
        if reference_text:
            _mark_reference_mismatches(words, reference_text)
        return {"transcript": " ".join(transcript), "words": words}


def _probability_from_logprob(value: Any) -> float:
    """Convert Whisper's log probability to a safe 0..1 score."""
    if value is None:
        return 0.5
    return max(0.05, min(1.0, math.exp(max(-8.0, min(0.0, float(value))))))


def _words_for_segment(text: str, start: float, end: float, items: List[Any], fallback_score: float) -> List[Dict[str, Any]]:
    """Use word timings when available; otherwise distribute text evenly over the segment."""
    source = items or text.split()
    count = len(source)
    if not count:
        return []
    duration = max(0.01, end - start)
    output = []
    for index, item in enumerate(source):
        word = (getattr(item, "word", item) or "").strip()
        if not word:
            continue
        estimated_start = start + duration * index / count
        estimated_end = start + duration * (index + 1) / count
        item_start = getattr(item, "start", None)
        item_end = getattr(item, "end", None)
        item_probability = getattr(item, "probability", None)
        output.append({"word": word, "start": round(float(item_start if item_start is not None else estimated_start), 2),
                       "end": round(float(item_end if item_end is not None else estimated_end), 2),
                       "score": max(0.0, min(1.0, float(item_probability if item_probability is not None else fallback_score)))})
    return output


class MockEngine(BaseTranscriptionEngine):
    """Explicit opt-in demo engine; never selected as a production fallback."""
    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        text = reference_text or "Mock mode is enabled."
        return {"transcript": text, "words": []}


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9']+", "", value.lower())


def _mark_reference_mismatches(words: List[Dict[str, Any]], reference_text: str) -> None:
    """Lower only words genuinely substituted/inserted relative to a target reading."""
    expected = [_normalise(w) for w in reference_text.split() if _normalise(w)]
    heard = [_normalise(w["word"]) for w in words]
    for tag, _a1, _a2, b1, b2 in SequenceMatcher(a=expected, b=heard, autojunk=False).get_opcodes():
        if tag in {"replace", "insert"}:
            for index in range(b1, b2):
                words[index]["score"] = min(words[index]["score"], 0.45)
                words[index]["reference_mismatch"] = True


_engine: Optional[BaseTranscriptionEngine] = None


def get_transcription_engine() -> BaseTranscriptionEngine:
    global _engine
    if _engine is None:
        _engine = MockEngine() if settings.ENGINE_MODE.lower() == "mock" else FasterWhisperEngine()
    return _engine
