import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.assessor import calculate_assessment
from services.transcription import _apply_pronunciation_evidence


def words(*values):
    return [
        {"word": value, "start": index * 0.4, "end": (index + 1) * 0.4, "score": 0.12}
        for index, value in enumerate(values)
    ]


class PronunciationAlignmentTests(unittest.TestCase):
    def test_low_whisper_confidence_is_not_a_pronunciation_error(self):
        result_words = words("Good", "communication", "often")
        _apply_pronunciation_evidence(result_words, "Good communication often")
        assessment = calculate_assessment(result_words)

        self.assertEqual([word["score"] for word in result_words], [0.96, 0.96, 0.96])
        self.assertEqual(assessment["mistakes"], [])

    def test_clear_script_substitution_is_red_with_specific_feedback(self):
        result_words = words("a", "meaningful", "difference")
        _apply_pronunciation_evidence(result_words, "and meaningful difference")
        assessment = calculate_assessment(result_words)

        self.assertEqual(result_words[0]["score"], 0.40)
        self.assertEqual(len(assessment["mistakes"]), 1)
        self.assertIn('heard as "a"', assessment["mistakes"][0]["tip"])
        self.assertIn('target reading is "and"', assessment["mistakes"][0]["tip"])

    def test_near_phonetic_substitution_is_yellow(self):
        result_words = words("sheep")
        _apply_pronunciation_evidence(result_words, "ship")
        assessment = calculate_assessment(result_words)

        self.assertEqual(result_words[0]["score"], 0.70)
        self.assertEqual(assessment["mistakes"][0]["score"], 70)

    def test_without_a_script_recognised_words_are_not_falsely_coloured(self):
        result_words = words("Good", "often")
        _apply_pronunciation_evidence(result_words, None)
        assessment = calculate_assessment(result_words)

        self.assertEqual([word["score"] for word in result_words], [0.96, 0.96])
        self.assertEqual(assessment["mistakes"], [])

    def test_unscripted_timing_anomalies_are_local_and_conservative(self):
        result_words = [
            {"word": "phrase", "start": 0.0, "end": 0.72, "score": 0.9},
            {"word": "we'll", "start": 0.76, "end": 0.88, "score": 0.9},
            {"word": "go", "start": 0.88, "end": 0.96, "score": 0.9},
            {"word": "phrase", "start": 1.0, "end": 1.30, "score": 0.9},
            {"word": "normal", "start": 1.35, "end": 1.65, "score": 0.9},
        ]
        _apply_pronunciation_evidence(result_words, None)
        assessment = calculate_assessment(result_words)

        self.assertEqual([word["score"] for word in result_words[:3]], [0.70, 0.40, 0.40])
        self.assertEqual(result_words[3]["score"], 0.96)
        self.assertEqual([mistake["clean_word"] for mistake in assessment["mistakes"]], ["phrase", "we'll", "go"])

    def test_repeated_word_is_only_yellow_when_stretched_at_a_pause(self):
        result_words = [
            {"word": "rhythm", "start": 0.0, "end": 1.10, "score": 0.9},
            {"word": "continues", "start": 1.55, "end": 1.85, "score": 0.9},
            {"word": "rhythm", "start": 2.0, "end": 2.34, "score": 0.9},
        ]
        _apply_pronunciation_evidence(result_words, None)

        self.assertEqual([word["score"] for word in result_words], [0.70, 0.96, 0.96])

    def test_low_confidence_does_not_cascade_when_timing_evidence_exists(self):
        result_words = [
            {"word": "phrase", "start": 0.0, "end": 0.72, "score": 0.9, "_asr_confidence": 0.95},
            {"word": "we'll", "start": 0.76, "end": 0.88, "score": 0.9, "_asr_confidence": 0.90},
            {"word": "go", "start": 0.88, "end": 0.96, "score": 0.9, "_asr_confidence": 0.90},
            {"word": "normal", "start": 1.1, "end": 1.4, "score": 0.9, "_asr_confidence": 0.40},
        ]
        _apply_pronunciation_evidence(result_words, None)

        self.assertEqual([word["score"] for word in result_words], [0.70, 0.40, 0.40, 0.96])

    def test_unscripted_low_confidence_is_yellow_without_other_evidence(self):
        result_words = words("clear", "uncertain")
        result_words[0]["_asr_confidence"] = 0.93
        result_words[1]["_asr_confidence"] = 0.42
        _apply_pronunciation_evidence(result_words, None)

        self.assertEqual([word["score"] for word in result_words], [0.96, 0.70])

if __name__ == "__main__":
    unittest.main()
