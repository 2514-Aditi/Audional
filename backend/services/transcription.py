"""Fast, reusable speech-to-text engine for the assessment API."""
import math
import re
import statistics
from abc import ABC, abstractmethod
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
            audio_path,beam_size=1,best_of=1,word_timestamps=True,vad_filter=True,condition_on_previous_text=False,
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
        _apply_pronunciation_evidence(words, reference_text)
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
        asr_confidence = max(0.0, min(1.0, float(item_probability if item_probability is not None else fallback_score)))
        output.append({"word": word, "start": round(float(item_start if item_start is not None else estimated_start), 2),
                       "end": round(float(item_end if item_end is not None else estimated_end), 2),
                       "score": asr_confidence,
                       # Private diagnostic evidence. main.py deliberately removes
                       # it from the public response after assessment.
                       "_asr_confidence": asr_confidence})
    return output


class MockEngine(BaseTranscriptionEngine):
    """Explicit opt-in demo engine; never selected as a production fallback."""
    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        text = reference_text or "Mock mode is enabled."
        return {"transcript": text, "words": []}


def _normalise(value: str) -> str:
    return re.sub(r"[^a-z0-9']+", "", value.lower())


def _phonetic_key(word: str) -> str:
    """A small, dependency-free phonetic key used only to grade ASR substitutions.

    It intentionally groups common spelling variants, but does not claim to be a
    phoneme recogniser.  The acoustic evidence for a pronunciation issue is the
    fact that the recogniser decoded a different word from the supplied reading.
    """
    value = _normalise(word)
    value = re.sub(r"(?:tion|sion)$", "shun", value)
    value = re.sub(r"ph", "f", value)
    value = re.sub(r"(?:ck|cq|q)", "k", value)
    value = re.sub(r"[aeiouy]+", "a", value)
    value = re.sub(r"(.)\1+", r"\1", value)
    return value


def _similarity(left: str, right: str) -> float:
    """Return a conservative spelling/phonetic similarity in the range 0..1."""
    if left == right:
        return 1.0
    if not left or not right:
        return 0.0
    spelling = _levenshtein_ratio(left, right)
    phonetic = _levenshtein_ratio(_phonetic_key(left), _phonetic_key(right))
    return max(spelling, phonetic * 0.9)


def _levenshtein_ratio(left: str, right: str) -> float:
    previous = list(range(len(right) + 1))
    for i, char in enumerate(left, start=1):
        current = [i]
        for j, other in enumerate(right, start=1):
            current.append(min(
                current[-1] + 1,
                previous[j] + 1,
                previous[j - 1] + (char != other),
            ))
        previous = current
    return 1.0 - previous[-1] / max(len(left), len(right))


def _align_reference(expected: List[str], heard: List[str]) -> List[tuple[str, Optional[int], Optional[int], float]]:
    """Globally align a scripted reading with recognised words.

    This avoids SequenceMatcher's broad replacement blocks: each heard word gets
    a stable exact/substitution/insertion decision and a nearby typo is kept as a
    near match rather than causing a cascade of false errors.
    """
    rows, columns = len(expected), len(heard)
    costs = [[0.0] * (columns + 1) for _ in range(rows + 1)]
    back = [[""] * (columns + 1) for _ in range(rows + 1)]
    for i in range(1, rows + 1):
        costs[i][0], back[i][0] = float(i), "delete"
    for j in range(1, columns + 1):
        costs[0][j], back[0][j] = float(j), "insert"

    for i in range(1, rows + 1):
        for j in range(1, columns + 1):
            similarity = _similarity(expected[i - 1], heard[j - 1])
            substitution_cost = 0.0 if similarity == 1.0 else 0.55 + (1.0 - similarity) * 0.55
            choices = [
                (costs[i - 1][j - 1] + substitution_cost, "match" if similarity == 1.0 else "replace", similarity),
                (costs[i - 1][j] + 1.0, "delete", 0.0),
                (costs[i][j - 1] + 1.0, "insert", 0.0),
            ]
            cost, operation, similarity = min(choices, key=lambda value: value[0])
            costs[i][j], back[i][j] = cost, operation

    aligned: List[tuple[str, Optional[int], Optional[int], float]] = []
    i, j = rows, columns
    while i or j:
        operation = back[i][j]
        if operation in {"match", "replace"}:
            aligned.append((operation, i - 1, j - 1, _similarity(expected[i - 1], heard[j - 1])))
            i, j = i - 1, j - 1
        elif operation == "delete":
            aligned.append((operation, i - 1, None, 0.0))
            i -= 1
        else:
            aligned.append((operation, None, j - 1, 0.0))
            j -= 1
    return list(reversed(aligned))


def _apply_pronunciation_evidence(words: List[Dict[str, Any]], reference_text: Optional[str]) -> None:
    """Set display scores from reading evidence, never raw Whisper confidence.

    Whisper probability answers "was this token decoded confidently?" rather
    than "was this word pronounced correctly?".  A reference script makes a
    lexical substitution concrete evidence; without one we deliberately keep
    recognised words green instead of inventing pronunciation errors.
    """
    if not reference_text:
        _apply_unscripted_prosody_checks(words)
        return

    expected = [_normalise(value) for value in reference_text.split() if _normalise(value)]
    heard = [_normalise(word["word"]) for word in words]
    aligned = _align_reference(expected, heard)
    matched, missing = 0, 0

    for operation, expected_index, heard_index, similarity in aligned:
        if operation == "delete":
            missing += 1
            continue
        assert heard_index is not None
        expected_word = expected[expected_index] if expected_index is not None else None
        item = words[heard_index]
        if operation == "match":
            matched += 1
            item["score"] = 0.96
            kind = "exact"
        elif operation == "replace":
            # Similar sounding substitutions are yellow; a different decoded
            # word is red.  These values match the existing frontend cutoffs.
            item["score"] = 0.70 if similarity >= 0.70 else 0.40
            kind = "near_substitution" if similarity >= 0.70 else "substitution"
        else:
            item["score"] = 0.35
            kind = "insertion"
        item["_assessment"] = {
            "kind": kind,
            "expected": expected_word,
            "heard": heard[heard_index],
            "similarity": similarity,
        }

    # Internal metadata is consumed by the assessor and removed before the API
    # response is sent, preserving the public response shape.
    if words:
        words[0]["_reference_total"] = len(expected)
        words[0]["_reference_matched"] = matched
        words[0]["_reference_missing"] = missing


def _duration(word: Dict[str, Any]) -> float:
    start, end = word.get("start"), word.get("end")
    if start is None or end is None:
        return 0.0
    return max(0.0, float(end) - float(start))


def _apply_unscripted_prosody_checks(words: List[Dict[str, Any]]) -> None:
    """Find only strong timing anomalies when there is no target script.

    Unprompted speech cannot support a claim that a particular phoneme is wrong.
    We therefore start every recognised word at green and flag only two clear,
    local delivery problems: a word stretched far beyond another occurrence of
    the same word at a sentence boundary, and a stretched word followed by two
    words compressed into an implausibly short interval.  These conservative
    checks avoid returning to the old false-positive-prone confidence threshold.
    """
    for word in words:
        word["score"] = 0.96
        word["_assessment"] = {"kind": "unscored"}

    occurrences: Dict[str, List[tuple[int, float]]] = {}
    for index, word in enumerate(words):
        token = _normalise(word.get("word", ""))
        duration = _duration(word)
        if token and duration > 0.04:
            occurrences.setdefault(token, []).append((index, duration))

    # An utterance-final word is compared with other occurrences of the exact
    # same word, so natural differences in word length or speaker rate do not
    # create a false positive.
    for token, values in occurrences.items():
        if len(values) < 2:
            continue
        typical_duration = statistics.median(duration for _, duration in values)
        for index, duration in values:
            next_start = words[index + 1].get("start") if index + 1 < len(words) else None
            pause = float(next_start) - float(words[index].get("end")) if next_start is not None else 0.0
            if duration >= 0.55 and duration > typical_duration * 1.45 and pause >= 0.35:
                words[index]["score"] = 0.70
                words[index]["_assessment"] = {"kind": "timing_yellow"}

    # A long lead-in followed by two almost fused words is stronger evidence
    # than a short individual word (word timestamps naturally vary for articles
    # and function words), so only the complete local pattern is marked red.
    for index in range(len(words) - 2):
        lead, first, second = words[index], words[index + 1], words[index + 2]
        lead_duration = _duration(lead)
        pair_duration = _duration(first) + _duration(second)
        first_start, second_end = first.get("start"), second.get("end")
        pair_span = float(second_end) - float(first_start) if first_start is not None and second_end is not None else 0.0
        if lead_duration >= 0.65 and pair_duration <= 0.22 and pair_span <= 0.25:
            if lead["score"] >= 0.80:
                lead["score"] = 0.70
                lead["_assessment"] = {"kind": "timing_yellow"}
            for item in (first, second):
                item["score"] = 0.40
                item["_assessment"] = {"kind": "timing_red"}

    # If timing has already provided a concrete finding, do not cascade broad
    # recognition-uncertainty flags across the rest of the utterance.  For an
    # otherwise steady recording, however, a very low-confidence token is a
    # useful yellow "less clear" prompt rather than an unsupported red error.
    if not any(word["score"] < 0.80 for word in words):
        for word in words:
            confidence = word.get("_asr_confidence")
            if confidence is not None and float(confidence) < 0.60:
                word["score"] = 0.70
                word["_assessment"] = {"kind": "recognition_yellow"}


_engine: Optional[BaseTranscriptionEngine] = None


def get_transcription_engine() -> BaseTranscriptionEngine:
    global _engine
    if _engine is None:
        _engine = MockEngine() if settings.ENGINE_MODE.lower() == "mock" else FasterWhisperEngine()
    return _engine
