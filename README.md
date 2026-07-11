# Livo - AI Pronunciation Assessment Web Application

Livo is a production-quality, responsive web application for English pronunciation assessment. It uses **WhisperX** for speech-to-text transcription and forced word-level acoustic alignment to provide precise pronunciation feedback.

The application features a hybrid engine supporting:
1. **GPU/Production Mode (WhisperX)**: Integrates WhisperX and Wav2Vec2 alignment models for real-time phoneme alignment and scoring (requires `ffmpeg` and CUDA).
2. **CPU/Mock Mode (Simulated Alignment)**: Automatically activates if GPU, WhisperX, or FFmpeg is missing, providing high-fidelity, realistic word-level metrics, timestamps, and phonetic feedback based on standard IELTS/TOEFL speaking templates. This allows developers to test the frontend and API instantly on standard CPU laptops without complex ML dependencies.

---

## Technical Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: FastAPI (Python 3.12), Pydantic Settings, PyTorch, Transformers, Uvicorn
- **Speech Engine**: WhisperX (transcription + Wav2Vec2 phoneme forced alignment)

---

## Features

- **Drag and Drop Audio Uploader**: Supports WAV, MP3, M4A, OGG, and FLAC, with client-side metadata check ensuring audio is between **30 and 45 seconds**.
- **Multi-Stage Loader**: Interactive visual steps (`Uploading` &rarr; `Transcribing` &rarr; `Aligning` &rarr; `Assessing`).
- **Circular Progress Scorecard**: Animated gauges for Overall Score, Accuracy, Fluency, and Completeness.
- **Interactive Colored Transcript**: Green (&ge;80%), Yellow (65-80%), and Red (<65%) colored text showing pronunciation quality word-by-word.
- **Timestamped Audio Slicing**: Click any word in the transcript to play *just* that specific audio segment (e.g., from 4.2s to 4.9s) from your voice sample.
- **Voice Coach Suggestions**: Detailed panel displaying phonetic breakdown (IPA spellings) and target pronunciation correction tips.
- **Read Aloud Mode Support**: Optional reference prompt textbox so users can read specific texts for precise comparative scoring.

---

## Directory Structure

```
livo/
├── backend/
│   ├── .env                    # Active env config (created from env.example)
│   ├── .env.example            # Environment variables template
│   ├── main.py                 # FastAPI application and route definitions
│   ├── config.py               # Pydantic Configuration Settings (v1/v2 compatible)
│   ├── requirements.txt        # Python library dependencies
│   ├── services/
│   │   ├── audio.py            # Audio processing (16kHz WAV conversion & wave duration reader)
│   │   ├── assessor.py         # Pronunciation assessor scoring algorithms
│   │   └── transcription.py    # WhisperX forced alignment engine & fallback simulator
│   └── utils/
│       └── logger.py           # Structured logger
├── frontend/
│   ├── package.json            # Node.js dependencies
│   ├── vite.config.js          # Vite config
│   ├── tailwind.config.js      # Tailwind style tokens and custom animations
│   ├── postcss.config.js       # PostCSS config
│   └── src/
│       ├── App.jsx             # Main dashboard shell & API controller
│       ├── index.css           # Global Tailwind directives & glassmorphism utilities
│       ├── main.jsx            # React root mount
│       └── components/
│           ├── DragDropUpload.jsx
│           ├── Loader.jsx
│           ├── ScoreCard.jsx
│           ├── TranscriptView.jsx
│           ├── DetailModal.jsx
│           └── AudioPlayer.jsx
└── README.md                   # Setup and run instructions
```

---

## Installation & Setup

### System Prerequisites
Ensure you have **Python 3.10+** and **Node.js 18+** installed.
To support full GPU alignment, download and install [FFmpeg](https://ffmpeg.org/download.html) and add it to your system PATH.

### 1. Backend Setup

1. Open your terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install standard requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. **(Optional) Install WhisperX for GPU/Production mode**:
   If you have CUDA available and want to run actual WhisperX, run:
   ```bash
   pip install git+https://github.com/m-bain/whisperX.git
   ```
5. Set up environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env   # Windows
   cp .env.example .env     # macOS/Linux
   ```
6. Start the FastAPI development server:
   ```bash
   python main.py
   # Or using uvicorn:
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API will run on `http://127.0.0.1:8000`. The API Swagger documentation is viewable at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run locally, typically at `http://localhost:5173`. Open this URL in your web browser.

---

## Pronunciation Scoring Calculations

Livo evaluates speech across three core pillars:
- **Accuracy (50%)**: Average phonetic alignment confidence score extracted by Wav2Vec2/Whisper models.
- **Fluency (35%)**: Evaluated using words per minute (WPM), optimized for 110-150 WPM, and penalized for frequent silent intervals (pauses > 1.0s).
- **Completeness (15%)**: Evaluated as the ratio of spoken words to prompt words (ideal for Read Aloud mode).
- **Overall Score**: Weighted average rounded to nearest integer:
  $$\text{Overall} = 0.50 \times \text{Accuracy} + 0.35 \times \text{Fluency} + 0.15 \times \text{Completeness}$$
