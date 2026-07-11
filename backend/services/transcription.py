import os
import time
import random
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from backend.utils.logger import logger
from backend.config import settings

class BaseTranscriptionEngine(ABC):
    @abstractmethod
    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Transcribes the audio file and performs word-level alignment.
        Returns a dictionary containing:
        - transcript: Full text transcript
        - words: List of dicts, each with {word, start, end, score}
        """
        pass

class WhisperXEngine(BaseTranscriptionEngine):
    def __init__(self):
        self.device = "cuda" if self._has_cuda() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        logger.info(f"Initializing WhisperX Engine on {self.device.upper()} with {self.compute_type} compute type...")
        
        try:
            import whisperx
            import torch
            
            # Load Whisper model
            self.model = whisperx.load_model(
                settings.WHISPER_MODEL, 
                self.device, 
                compute_type=self.compute_type
            )
            logger.info("WhisperX model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load WhisperX models: {e}")
            raise RuntimeError(f"WhisperX model load failure: {e}")

    def _has_cuda(self) -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False

    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        import whisperx
        
        logger.info(f"Starting WhisperX transcription for {audio_path}")
        # 1. Transcribe audio
        audio = whisperx.load_audio(audio_path)
        result = self.model.transcribe(audio, batch_size=16)
        
        language = result.get("language", "en")
        logger.info(f"Transcription complete. Language detected: {language}")

        # 2. Align whisper output
        logger.info("Loading alignment model...")
        model_a, metadata = whisperx.load_align_model(language_code=language, device=self.device)
        
        logger.info("Aligning transcription...")
        aligned_result = whisperx.align(
            result["segments"], 
            model_a, 
            metadata, 
            audio, 
            self.device, 
            return_char_alignments=False
        )

        # 3. Format words list
        words_list = []
        full_transcript = []
        
        for segment in aligned_result["segments"]:
            full_transcript.append(segment["text"])
            for word_info in segment.get("words", []):
                # WhisperX words contain word, start, end, score
                # Note: WhisperX sometimes misses alignment for some words, which won't have start/end.
                # In production, we filter or interpolate missing timestamps.
                if "start" in word_info and "end" in word_info:
                    words_list.append({
                        "word": word_info["word"],
                        "start": float(word_info["start"]),
                        "end": float(word_info["end"]),
                        "score": float(word_info.get("score", 0.8))
                    })
                else:
                    # Fallback for unaligned words (give them dummy values or skip)
                    words_list.append({
                        "word": word_info["word"],
                        "start": None,
                        "end": None,
                        "score": 0.5  # Lower score due to lack of alignment
                    })
        
        transcript_text = " ".join(full_transcript).strip()
        
        # If reference text was provided, we could optionally perform a text-to-text alignment,
        # but WhisperX's automatic alignment is already excellent.
        
        return {
            "transcript": transcript_text if transcript_text else (reference_text or ""),
            "words": words_list
        }

class MockEngine(BaseTranscriptionEngine):
    def __init__(self):
        logger.info("Initializing High-Fidelity Mock Transcription Engine...")
        self.default_text = (
            "In today's fast-paced world, learning to speak English fluently is a valuable asset. "
            "However, mastering pronunciation requires consistent practice and detailed feedback. "
            "This application is designed to help you analyze your pronunciation by identifying "
            "specific word mistakes and offering suggestions for improvement. Keep practicing every day, "
            "and you will see rapid progress in your communication skills."
        )

    def transcribe_and_align(self, audio_path: str, reference_text: Optional[str] = None) -> Dict[str, Any]:
        logger.info(f"[MOCK] Simulating transcription and alignment for {audio_path}")
        
        # Simulate processing time (2.5 seconds)
        time.sleep(2.5)
        
        # Use provided reference text or default
        text = reference_text or self.default_text
        words = text.strip().split()
        
        # Clean words from basic punctuation
        clean_words = []
        original_words = []
        for w in words:
            clean = "".join(c for c in w if c.isalnum() or c in ["'", "-"]).lower()
            if clean:
                clean_words.append(clean)
                original_words.append(w)
        
        # Distribute words over a standard 35-second speech timeline
        # Let's say speaking starts at 1.0s and ends at 34.0s
        duration = 34.0
        start_time = 1.0
        
        # Calculate timing parameters
        num_words = len(clean_words)
        if num_words == 0:
            return {"transcript": "", "words": []}
            
        avg_word_dur = duration / num_words
        
        words_list = []
        current_time = start_time
        
        # Pre-select index of words that will be "mispronounced"
        # We want to flag ~3-5 words as pronunciation mistakes
        # Ensure we always select a couple of interesting words
        mistake_indices = set()
        if num_words > 10:
            # Seed based on words length for semi-deterministic behavior per upload text
            random.seed(num_words)
            mistake_count = random.randint(3, 5)
            while len(mistake_indices) < mistake_count:
                idx = random.randint(2, num_words - 2)
                mistake_indices.add(idx)
        
        for i in range(num_words):
            word_clean = clean_words[i]
            word_orig = original_words[i]
            
            # Simulate silence/pauses
            pause = 0.0
            # Add a pause after punctuation marks
            if word_orig.endswith((".", ",", ";", "?", "!")):
                pause = random.uniform(0.3, 0.7)
            # Occasional breathing pause
            elif i % 8 == 0 and i > 0:
                pause = random.uniform(0.2, 0.5)
                
            word_duration = random.uniform(0.2, 0.45)
            word_start = current_time
            word_end = current_time + word_duration
            
            # Determine alignment score (confidence)
            if i in mistake_indices:
                # Pronunciation mistake: low score
                score = random.uniform(0.35, 0.64)
            else:
                # Correct pronunciation: high score
                score = random.uniform(0.82, 0.98)
                
            words_list.append({
                "word": word_orig,
                "start": round(word_start, 2),
                "end": round(word_end, 2),
                "score": round(score, 2)
            })
            
            current_time = word_end + pause
            
        return {
            "transcript": text,
            "words": words_list
        }

def get_transcription_engine() -> BaseTranscriptionEngine:
    """
    Factory function to retrieve the transcription engine based on environment settings.
    Falls back to MockEngine if WhisperX cannot be imported or loaded.
    """
    if settings.ENGINE_MODE == "whisperx":
        try:
            import whisperx
            return WhisperXEngine()
        except Exception as e:
            logger.warning(
                f"Failed to initialize WhisperX engine. Check dependencies, CUDA, and FFmpeg. "
                f"Falling back to MockEngine. Error: {e}"
            )
            # Modify the config settings in memory so other services know we are in fallback mode
            settings.ENGINE_MODE = "mock"
            return MockEngine()
    else:
        return MockEngine()
