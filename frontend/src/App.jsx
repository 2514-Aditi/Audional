import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import DragDropUpload from "./components/DragDropUpload";
import Loader from "./components/Loader";
import ScoreCard from "./components/ScoreCard";
import TranscriptView from "./components/TranscriptView";
import DetailModal from "./components/DetailModal";
import AudioPlayer from "./components/AudioPlayer";
import { AlertCircle, RefreshCw, BarChart2, FileText, ClipboardX, Lightbulb, FileAudio } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [file, setFile] = useState(null);
  const [referenceText, setReferenceText] = useState("");
  const [error, setError] = useState("");
  
  // Steps: 'landing' | 'upload' | 'processing' | 'results'
  const [step, setStep] = useState("landing");
  // Active Tab inside results: 'overview' | 'transcript' | 'mistakes' | 'suggestions'
  const [activeTab, setActiveTab] = useState("overview");

  const [result, setResult] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(-1);
  const [playerRef, setPlayerRef] = useState(null);

  // Dark Mode state initialization
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Apply dark mode class to html tag
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleFileSelect = (selectedFile, text) => {
    setFile(selectedFile);
    setReferenceText(text);
    setError("");
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setStep("processing");
    setError("");
    setResult(null);
    setSelectedWord(null);
    setSelectedWordIndex(-1);

    const formData = new FormData();
    formData.append("file", file);
    if (referenceText) {
      formData.append("reference_text", referenceText);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/assess`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Pronunciation assessment failed.");
      }

      const data = await response.json();
      setResult(data);
      setStep("results");
      setActiveTab("overview");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to connect to the backend server. Make sure the backend is running.");
      setStep("upload");
    }
  };

  // Simulates View Demo flow with mock data
  const handleViewDemo = () => {
    setStep("processing");
    setError("");
    setResult(null);
    setSelectedWord(null);
    setSelectedWordIndex(-1);

    // Simulate 2 seconds of analysis and then load demo results
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/assess`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          // We can send a request to get mock data directly
          body: new URLSearchParams({
            "reference_text": "In today's fast-paced world, learning to speak English fluently is a valuable asset."
          })
        });

        // If the backend fails or is offline during demo, we fallback to a hardcoded local mock dataset
        // so that the landing page demo ALWAYS works! This is extremely robust.
        if (!response.ok) {
          throw new Error("Local fallback");
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        console.warn("Backend offline during demo. Loading hardcoded local demo dataset.");
        
        // Hardcoded local fallback dataset
        setResult({
          pronunciation_score: 84,
          accuracy_score: 79,
          fluency_score: 89,
          completeness_score: 100,
          transcript: "In today's fast-paced world, learning to speak English fluently is a valuable asset.",
          summary: "The speaker demonstrates good pronunciation accuracy with a score of 84%. Word clarity was rated at 79%, with minor voicing errors. Fluency is 89% with steady breathing pauses. Pacing is understandable.",
          words: [
            { word: "In", start: 1.0, end: 1.2, score: 0.95 },
            { word: "today's", start: 1.25, end: 1.7, score: 0.91 },
            { word: "fast-paced", start: 1.8, end: 2.4, score: 0.88 },
            { word: "world,", start: 2.45, end: 2.9, score: 0.58 }, // mistake
            { word: "learning", start: 3.2, end: 3.7, score: 0.92 },
            { word: "to", start: 3.75, end: 3.9, score: 0.96 },
            { word: "speak", start: 3.95, end: 4.3, score: 0.89 },
            { word: "English", start: 4.35, end: 4.8, score: 0.94 },
            { word: "fluently", start: 4.9, end: 5.5, score: 0.61 }, // mistake
            { word: "is", start: 5.6, end: 5.8, score: 0.95 },
            { word: "a", start: 5.85, end: 5.95, score: 0.97 },
            { word: "valuable", start: 6.0, end: 6.6, score: 0.87 },
            { word: "asset.", start: 6.65, end: 7.2, score: 0.49 }  // mistake
          ],
          mistakes: [
            {
              clean_word: "world",
              word: "world,",
              index: 3,
              score: 58,
              start: 2.45,
              end: 2.9,
              ipa: "/wɜːld/",
              tip: "Do not drop the final 'd' sound. Make sure the vowel sound /ɜː/ is open and rounded."
            },
            {
              clean_word: "fluently",
              word: "fluently",
              index: 8,
              score: 61,
              start: 4.9,
              end: 5.5,
              ipa: "/ˈfluː.ənt.li/",
              tip: "Ensure a smooth transition from /uː/ to the schwa /ə/. Keep the final /li/ clear."
            },
            {
              clean_word: "asset",
              word: "asset.",
              index: 12,
              score: 49,
              start: 6.65,
              end: 7.2,
              ipa: "/ˈæset/",
              tip: "The starting 'a' is a short open vowel /æ/, like in 'cat'. The ending 't' must be released crisply."
            }
          ],
          suggestions: [
            {
              word: "asset",
              ipa: "/ˈæset/",
              tip: "The starting 'a' is a short open vowel /æ/, like in 'cat'. The ending 't' must be released crisply."
            },
            {
              word: "world",
              ipa: "/wɜːld/",
              tip: "Do not drop the final 'd' sound. Make sure the vowel sound /ɜː/ is open and rounded."
            },
            {
              word: "fluently",
              ipa: "/ˈfluː.ənt.li/",
              tip: "Ensure a smooth transition from /uː/ to the schwa /ə/. Keep the final /li/ clear."
            }
          ]
        });
      } finally {
        setStep("results");
        setActiveTab("overview");
      }
    }, 1800);
  };

  const handleWordSelect = (wordInfo, index) => {
    const mistakeDetails = result?.mistakes?.find(m => m.index === index);
    
    if (mistakeDetails) {
      setSelectedWord(mistakeDetails);
    } else {
      setSelectedWord({
        clean_word: wordInfo.word.replace(/[.,;:!?()]/g, ""),
        score: Math.round((wordInfo.score || 0.9) * 100),
        start: wordInfo.start,
        end: wordInfo.end,
        ipa: "Accurate pronunciation",
        tip: "Great pronunciation! Core consonants and vowel properties match standard English phonetics."
      });
    }
    setSelectedWordIndex(index);
  };

  const handlePlayWordSegment = (start, end) => {
    if (playerRef && start !== null && end !== null) {
      playerRef.playSegment(start, end);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReferenceText("");
    setResult(null);
    setSelectedWord(null);
    setSelectedWordIndex(-1);
    setError("");
    setStep("upload");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between transition-colors duration-200">
      
      {/* Sticky Navbar */}
      <Navbar 
        currentStep={step} 
        onNavigate={setStep} 
        darkMode={darkMode} 
        onToggleTheme={() => setDarkMode(!darkMode)} 
      />

      {/* Main Page Area */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Global Error Banner */}
        {error && (
          <div className="flex items-start space-x-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 p-3.5 rounded-lg text-xs text-left animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-650 mt-0.5" />
            <div className="flex-grow">
              <h4 className="font-bold">Process Error</h4>
              <p className="text-[11px] mt-0.5 opacity-90">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-[10px] font-bold underline text-red-600 dark:text-red-400 shrink-0">
              Dismiss
            </button>
          </div>
        )}

        {/* PAGE 1: Landing Page */}
        {step === "landing" && (
          <LandingPage 
            onGetStarted={() => setStep("upload")} 
            onViewDemo={handleViewDemo} 
          />
        )}

        {/* PAGE 2: Upload Page */}
        {step === "upload" && (
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm space-y-5 text-left transition-colors duration-200">
            <div className="border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Upload Speaking Sample
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Record yourself speaking and upload the file below for forced alignment scoring.</p>
            </div>

            <DragDropUpload onFileSelect={handleFileSelect} disabled={false} />
            
            {/* Audio Preview component */}
            {file && (
              <div className="space-y-1 text-left border-t border-slate-100 dark:border-slate-700/60 pt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audio Preview</span>
                <AudioPlayer localFile={file} onPlayerRef={null} />
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-[#458393] hover:bg-[#347483] dark:bg-[#34A99D] dark:hover:bg-[#2c9186] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Speech
            </button>
          </div>
        )}

        {/* PAGE 3: Processing Page */}
        {step === "processing" && (
          <Loader isActive={true} />
        )}

        {/* PAGE 4-7: Results Dashboard & Tabs */}
        {step === "results" && result && (
          <div className="space-y-6 animate-fadeIn text-left">
            
            {/* Navigation Tabs (Overview | Transcript | Mistakes | Suggestions) */}
            <div className="border-b border-slate-200 dark:border-slate-850">
              <nav className="flex space-x-6 -mb-px text-xs font-semibold" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-[#458393] dark:border-[#34A99D] text-[#458393] dark:text-[#34A99D]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-350 dark:hover:text-slate-300"
                  }`}
                >
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === "transcript"
                      ? "border-[#458393] dark:border-[#34A99D] text-[#458393] dark:text-[#34A99D]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-350 dark:hover:text-slate-300"
                  }`}
                >
                  Transcript
                </button>

                <button
                  onClick={() => setActiveTab("mistakes")}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === "mistakes"
                      ? "border-[#458393] dark:border-[#34A99D] text-[#458393] dark:text-[#34A99D]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-350 dark:hover:text-slate-300"
                  }`}
                >
                  Mistakes ({result.mistakes.length})
                </button>

                <button
                  onClick={() => setActiveTab("suggestions")}
                  className={`pb-3 px-1 border-b-2 transition-colors ${
                    activeTab === "suggestions"
                      ? "border-[#458393] dark:border-[#34A99D] text-[#458393] dark:text-[#34A99D]"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-350 dark:hover:text-slate-300"
                  }`}
                >
                  Practice
                </button>
              </nav>
            </div>

            {/* Sticky Audio Player directly visible above active tab views */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider flex items-center">
                <FileAudio className="h-3 w-3 mr-1" />
                Speech Recording Player
              </span>
              <AudioPlayer 
                src={result.audio_url ? `${API_BASE_URL}${result.audio_url}` : null}
                localFile={file}
                onPlayerRef={setPlayerRef}
              />
            </div>

            {/* PAGE 4: Results Dashboard Tab */}
            {activeTab === "overview" && (
              <ScoreCard scores={result} onTabChange={setActiveTab} />
            )}

            {/* PAGE 5: Transcript Tab */}
            {activeTab === "transcript" && (
              <TranscriptView 
                words={result.words}
                onWordSelect={handleWordSelect}
                onPlayWord={handlePlayWordSegment}
                selectedWordIndex={selectedWordIndex}
              />
            )}

            {/* PAGE 6: Pronunciation Mistakes Tab */}
            {activeTab === "mistakes" && (
              <DetailModal 
                view="mistakes"
                mistakes={result.mistakes}
                suggestions={result.suggestions}
                scores={result}
                onPlayWord={handlePlayWordSegment}
              />
            )}

            {/* PAGE 7: Practice Tab */}
            {activeTab === "suggestions" && (
              <DetailModal 
                view="suggestions"
                mistakes={result.mistakes}
                suggestions={result.suggestions}
                scores={result}
                onPlayWord={handlePlayWordSegment}
                onAnalyzeAnother={handleReset}
              />
            )}

            {/* Bottom Actions Footer */}
            {activeTab !== "suggestions" && (
              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Analyze Another Recording</span>
                </button>
              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
