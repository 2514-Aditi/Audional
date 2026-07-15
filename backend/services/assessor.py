import re
import math
from typing import Dict, Any, List, Optional
from utils.logger import logger

# A local dictionary of IPA transcriptions and suggestions for common words.
# This ensures that even without external G2P packages, we render premium, accurate content.
IPA_DICTIONARY = {
    "learning": ("/ˈlɜː.nɪŋ/", "Keep the central vowel /ɜː/ long and neutral. Avoid rolling the 'r' too strongly if aiming for RP/neutral English."),
    "fluently": ("/ˈfluː.ənt.li/", "Transition smoothly from the high back /uː/ to the schwa /ə/. Do not drop the final /i/ sound."),
    "pronunciation": ("/prəˌnʌn.siˈeɪ.ʃən/", "Avoid saying 'pro-noun-ciation'. The second syllable must sound like 'nun' (/nʌn/) with a short vowel."),
    "requires": ("/rɪˈkwaɪəz/", "Pay attention to the diphthong /aɪ/ and ensure the ending 's' is voiced as a /z/ sound."),
    "consistent": ("/kənˈsɪs.tənt/", "The first syllable is an unstressed schwa /kən/. Stress the second syllable 'sis' (/sɪs/)."),
    "practice": ("/ˈpræk.tɪs/", "Use a wide open short /æ/ vowel, like in 'cat'. The ending 'ce' is a soft /s/ sound, not a /z/."),
    "valuable": ("/ˈvæl.jʊə.bəl/", "Pronounce it in three or four syllables: /ˈvæl.jʊ.ə.bəl/. The 'a' in the first syllable is stressed."),
    "asset": ("/ˈæset/", "Ensure the 'a' is a short front vowel /æ/ and the 't' is released crisply."),
    "mastering": ("/ˈmɑːstərɪŋ/", "Ensure the 'a' is a broad back vowel /ɑː/ (British) or /æ/ (American). Pronounce the 'ing' ending cleanly."),
    "detailed": ("/ˈdiː.teɪld/", "Place the primary stress on the first syllable 'de' (/diː/). The ending 'ed' is pronounced as a voiced /d/."),
    "feedback": ("/ˈfiːd.bæk/", "Make the vowel in 'feed' (/iː/) long, and keep the vowel in 'back' (/æ/) short and crisp."),
    "application": ("/ˌæp.lɪˈkeɪ.ʃən/", "Stress the third syllable 'ca' (/keɪ/). The first vowel 'a' is short /æ/."),
    "designed": ("/dɪˈzaɪnd/", "The 's' is pronounced as a voiced /z/. Make sure the ending 'd' is voiced and audible."),
    "analyze": ("/ˈæn.əl.aɪz/", "Stress the first syllable. The ending 'yze' is a diphthong /aɪ/ followed by a voiced /z/."),
    "identifying": ("/aɪˈden.tɪ.faɪ.ɪŋ/", "Stress the second syllable 'den'. Ensure all four syllables are articulated clearly."),
    "specific": ("/spəˈsɪf.ɪk/", "The first syllable is a very short schwa /spə/. Stress the second syllable 'cif' (/sɪf/)."),
    "mistakes": ("/mɪsˈteɪks/", "Ensure the diphthong in 'takes' (/eɪ/) is fully elongated. Keep the ending 's' unvoiced (/s/)."),
    "offering": ("/ˈɒf.ər.ɪŋ/", "The 'o' is a short open vowel /ɒ/. The stress is on the first syllable."),
    "suggestions": ("/səˈdʒes.tʃənz/", "The 'g' letters make a soft 'j' sound /dʒ/. Avoid pronouncing it as a hard 'g' (/g/)."),
    "improvement": ("/ɪmˈpruːv.mənt/", "The 'o' is a long /uː/ sound. Ensure the 'v' is fully voiced and distinct from /f/."),
    "practicing": ("/ˈpræk.tɪ.sɪŋ/", "Keep the rhythm steady. The second syllable 'ti' is short and unstressed."),
    "rapid": ("/ˈræp.ɪd/", "The first vowel is a short /æ/. Make sure the second syllable ends with a clear /d/."),
    "progress": ("/ˈprəʊ.ɡres/", "Use a diphthong /əʊ/ in the first syllable (British) or short /ɒ/ (American). Stress the first syllable."),
    "communication": ("/kəˌmjuː.nɪˈkeɪ.ʃən/", "Stress the fourth syllable 'ca' (/keɪ/). The first syllable is a reduced schwa /kə/."),
    "skills": ("/skɪlz/", "The vowel is a short /ɪ/. Ensure the 'l' is a 'dark l' and the ending 's' is voiced as /z/.")
}

GENERAL_IPA_RULES = [
    (r"tion\b", "ʃən"),
    (r"sion\b", "ʒən"),
    (r"ph", "f"),
    (r"ch", "tʃ"),
    (r"sh", "ʃ"),
    (r"ee", "iː"),
    (r"oo", "uː"),
    (r"ea", "iː"),
    (r"ing\b", "ɪŋ"),
    (r"th", "θ"),
    (r"ck", "k"),
]

def generate_fallback_ipa(word: str) -> str:
    """
    Heuristic rule-based IPA generator for English words not in our dictionary.
    """
    clean_word = word.lower().strip(".,;:!?()\"'")
    if not clean_word:
        return ""
    
    ipa = clean_word
    for pattern, replacement in GENERAL_IPA_RULES:
        ipa = re.sub(pattern, replacement, ipa)
        
    # Replace vowels with generic phonetic approximations
    ipa = ipa.replace("a", "æ").replace("e", "e").replace("i", "ɪ").replace("o", "ɒ").replace("u", "ʌ")
    # Wrap in slashes
    return f"/{ipa}/"

def get_word_ipa_and_suggestion(word: str) -> tuple[str, str]:
    """
    Retrieves the phonetic transcription (IPA) and tailored pronunciation suggestion.
    """
    clean_word = word.lower().strip(".,;:!?()\"'")
    
    if clean_word in IPA_DICTIONARY:
        return IPA_DICTIONARY[clean_word]
    
    # Fallback suggestion based on word length and common phonics rules
    ipa = generate_fallback_ipa(clean_word)
    
    # Heuristic suggestion
    if len(clean_word) > 8:
        suggestion = f"Pay attention to the syllable stress in this long word. Break it down slowly and check the vowel sounds."
    elif "th" in clean_word:
        suggestion = "Focus on the dental 'th' sound (/θ/ or /ð/). Place your tongue lightly between your teeth."
    elif "r" in clean_word:
        suggestion = "Keep the 'r' sound soft and vocalic. Do not roll it like in Spanish or Italian."
    elif "v" in clean_word:
        suggestion = "Ensure the 'v' is voiced by vibrating your vocal cords while placing upper teeth on lower lip."
    else:
        suggestion = "Listen to the vowel length and practice repeating the word in isolation."
        
    return ipa, suggestion

def calculate_assessment(words_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates detailed pronunciation metrics: Accuracy, Fluency, Completeness, and Overall.
    Identifies pronunciation mistakes and generates suggestions.
    """
    if not words_list:
        return {
            "pronunciation_score": 0, "accuracy_score": 0, "fluency_score": 0, "completeness_score": 0,
            "overall_score": 0, "clarity": 0, "fluency": 0, "confidence": 0,
            "mistakes": [], "suggestions": [], "summary": "No speech detected.", "message": "No speech detected"
        }

    # 1. ACCURACY SCORE
    # Average of word confidence scores
    total_words = len(words_list)
    valid_scores = [w["score"] for w in words_list if w["score"] is not None]
    
    accuracy_score = (sum(valid_scores) / len(valid_scores)) * 100 if valid_scores else 0.0
    accuracy_score = min(max(accuracy_score, 0.0), 100.0)

    # 2. FLUENCY SCORE
    # Based on speech rate (WPM) and pause behavior.
    # Total speaking time
    timed_words = [w for w in words_list if w["start"] is not None and w["end"] is not None]
    
    if len(timed_words) >= 2:
        start_time = timed_words[0]["start"]
        end_time = timed_words[-1]["end"]
        duration_sec = end_time - start_time
    else:
        duration_sec = 35.0  # Fallback duration if missing timestamps
        
    duration_min = duration_sec / 60.0
    
    # Word speaking rate (optimal is 110 - 150 WPM)
    wpm = total_words / duration_min if duration_min > 0 else 0
    
    # Rate score (Gaussian decay around center 130 WPM)
    if wpm <= 0:
        rate_score = 0.0
    else:
        # Standard deviation parameter sets the steepness of the curve
        rate_score = 100.0 * math.exp(-0.5 * ((wpm - 130) / 40.0) ** 2)
        
    # Pause score (analyzing gap standard deviations)
    gaps = []
    for i in range(1, len(timed_words)):
        prev_end = timed_words[i-1]["end"]
        curr_start = timed_words[i]["start"]
        gap = curr_start - prev_end
        if gap > 0.05:  # ignore sub-50ms gaps which are phonetic transitions
            gaps.append(gap)
            
    # Calculate pause penalty
    long_pauses = sum(1 for g in gaps if g > 1.0)
    pause_penalty = min(long_pauses * 10, 40)  # Max 40% penalty for too many pauses
    
    fluency_score = max(rate_score - pause_penalty, 20.0)
    fluency_score = min(fluency_score, 100.0)

    # 3. COMPLETENESS SCORE
    # Fraction of words that were successfully aligned and spoke.
    # If a word has score <= 0.2 or start is None, it might have been skipped.
    aligned_count = sum(1 for w in words_list if w["score"] is not None and w["score"] > 0.25)
    completeness_score = (aligned_count / total_words) * 100 if total_words > 0 else 0.0
    completeness_score = min(max(completeness_score, 0.0), 100.0)

    # 4. OVERALL PRONUNCIATION SCORE
    # Weighted calculation
    overall_score = (0.50 * accuracy_score) + (0.35 * fluency_score) + (0.15 * completeness_score)
    overall_score = round(min(max(overall_score, 0.0), 100.0))
    
    accuracy_score = round(accuracy_score)
    fluency_score = round(fluency_score)
    completeness_score = round(completeness_score)

    # 5. FIND MISTAKES & SUGGESTIONS
    mistakes = []
    suggestions_summary = []
    
    # Pronunciation error threshold is 0.70 confidence
    error_threshold = 0.70
    
    for idx, w in enumerate(words_list):
        word_text = w["word"]
        score = w["score"]
        
        # Strip punctuation for cleaner display of word
        clean_word = word_text.strip(".,;:!?()\"'")
        if not clean_word:
            continue
            
        if score is not None and score < error_threshold:
            ipa, tip = get_word_ipa_and_suggestion(clean_word)
            
            mistake_item = {
                "word": word_text,
                "clean_word": clean_word,
                "index": idx,
                "score": int(score * 100),
                "start": w["start"],
                "end": w["end"],
                "ipa": ipa,
                "tip": tip
            }
            mistakes.append(mistake_item)
            
            # Limit the suggestions shown in the summary section to top 4 key tips
            if len(suggestions_summary) < 4:
                suggestions_summary.append({
                    "word": clean_word,
                    "ipa": ipa,
                    "tip": tip
                })

    # If the user spoke perfectly, provide some general positive feedback and accent-neutrality tips
    if not suggestions_summary:
        suggestions_summary.append({
            "word": "General Speaking",
            "ipa": "N/A",
            "tip": "Your word pronunciation accuracy is excellent. To further polish your speech, practice sentence-level intonation, linking words together, and utilizing correct syllable stress in longer sentences."
        })
        suggestions_summary.append({
            "word": "Rhythm and Flow",
            "ipa": "N/A",
            "tip": "Maintain a steady pace. Keep breathing naturally between punctuation marks to sustain high fluency scores."
        })

    # 6. GENERATE SHORT AI-LIKE SUMMARY
    if overall_score >= 85:
        summary = (
            f"The speaker demonstrates excellent English pronunciation with an overall score of {overall_score}%. "
            f"Clarity was rated at {accuracy_score}%, matching expected native models with high precision. "
            f"Fluency ({fluency_score}%) is stable with natural breathing pauses. The pacing is natural and optimal."
        )
    elif overall_score >= 70:
        summary = (
            f"The speaker has good overall pronunciation with a score of {overall_score}%. "
            f"Word clarity is high ({accuracy_score}%), though minor articulation gaps were detected in {len(mistakes)} words. "
            f"Fluency is {fluency_score}%, showing brief pauses. Pacing is steady and understandable."
        )
    else:
        summary = (
            f"Pronunciation needs practice, with an overall score of {overall_score}%. "
            f"Clarity is lower ({accuracy_score}%) due to {len(mistakes)} mispronounced words. "
            f"Fluency is {fluency_score}% with occasional stuttering or longer pauses. Focus on vowel articulation."
        )

    # Keep the legacy names consumed by the existing React components, and expose
    # the presentation aliases used by API consumers. They always contain the same values.
    return {
        "pronunciation_score": overall_score,
        "accuracy_score": accuracy_score,
        "fluency_score": fluency_score,
        "completeness_score": completeness_score,
        "overall_score": overall_score,
        "clarity": accuracy_score,
        "fluency": fluency_score,
        "confidence": completeness_score,
        "mistakes": mistakes,
        "suggestions": suggestions_summary,
        "summary": summary
    }
