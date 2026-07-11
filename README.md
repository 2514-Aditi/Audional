# 🚀Audional - AI Pronunciation Assessment

Audional is an AI-powered web application that analyzes English pronunciation from a 30–45 second audio recording. It provides an overall pronunciation score, word-level feedback, and personalized suggestions to help users improve their spoken English.

## Features

- Upload English audio (30–45 seconds)
- AI-powered pronunciation assessment
- Overall pronunciation score
- Word-level pronunciation feedback
- Interactive transcript with highlighted words
- Personalized pronunciation suggestions
- Responsive UI with Light & Dark mode
- FastAPI backend with React frontend

---

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS

**Backend**
- FastAPI
- Python

**AI**
- WhisperX
- PyTorch
- Transformers
  
---

## Pronunciation Score

The overall pronunciation score is calculated using three key metrics:

- **Accuracy (50%)** – Measures how closely each spoken word matches the expected pronunciation based on the speech recognition and alignment model.
- **Fluency (35%)** – Evaluates the natural flow of speech, including speaking pace, pauses, and continuity.
- **Completeness (15%)** – Checks whether all expected words or phrases were spoken without omissions.

These three metrics are combined to generate an overall pronunciation score (0–100), along with word-level feedback and personalized suggestions to help improve pronunciation.

---

## Future Improvements

- Phoneme-level pronunciation analysis
- Multi-language support
- User authentication
- Progress tracking dashboard
- Practice history and reports
