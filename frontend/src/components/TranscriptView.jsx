import React, { useState } from "react";
import { Volume2, X } from "lucide-react";

export default function TranscriptView({ words, onWordSelect, onPlayWord, selectedWordIndex }) {
  const [selectedWord, setSelectedWord] = useState(null);

  const getPillStyleClass = (score, isSelected) => {
    if (isSelected) {
      return "bg-[#458393]/15 dark:bg-[#34A99D]/15 text-[#458393] dark:text-[#34A99D] border-[#458393] dark:border-[#34A99D] font-bold ring-1 ring-[#458393] dark:ring-[#34A99D]";
    }

    if (score === null || score === undefined) {
      return "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60";
    }

    // Correct
    if (score >= 0.80) {
      return "bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/45 hover:border-emerald-300";
    }
    
    // Needs improvement
    if (score >= 0.65) {
      return "bg-amber-50/70 dark:bg-amber-950/20 text-amber-850 dark:text-amber-400 border-amber-250/80 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-950/45 hover:border-amber-300";
    }
    
    // Incorrect
    return "bg-rose-50/70 dark:bg-rose-950/20 text-rose-800 dark:text-rose-450 border-rose-200/80 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/45 hover:border-rose-300 font-medium";
  };

  const handleWordClick = (w, idx) => {
    onWordSelect(w, idx);
    const cleanWord = w.word.replace(/[.,;:!?()]/g, "");
    
    // Setup detailed popup info
    setSelectedWord({
      word: w.word,
      clean_word: cleanWord,
      score: Math.round((w.score || 0.8) * 100),
      start: w.start,
      end: w.end,
      ipa: w.score !== null ? (w.score < 0.65 ? "Requires correction" : w.score < 0.8 ? "Partially accurate" : "Accurate") : "N/A"
    });

    if (w.start !== null && w.end !== null) {
      onPlayWord(w.start, w.end);
    }
  };

  return (
    <div className="w-full space-y-4 text-left">
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-200">
        
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Interactive Transcript
          </h3>
          
          {/* Legend */}
          <div className="flex items-center space-x-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900"></span>
              <span>Correct</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-250 dark:border-amber-900"></span>
              <span>Needs Improvement</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-250 dark:border-rose-900"></span>
              <span>Incorrect</span>
            </span>
          </div>
        </div>

        {/* Word Pills Container */}
        <div className="flex flex-wrap gap-2.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg border border-slate-100 dark:border-slate-800">
          {words.map((w, idx) => {
            const isSelected = selectedWordIndex === idx;
            const pillClass = getPillStyleClass(w.score, isSelected);

            return (
              <div key={idx} className="relative group">
                <button
                  onClick={() => handleWordClick(w, idx)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all duration-150 ${pillClass}`}
                >
                  {w.word}
                </button>

                {/* Hover score tooltip */}
                {w.score !== null && (
                  <span className="absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 rounded bg-slate-950 px-2 py-0.5 text-[9px] font-mono font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm border border-slate-800">
                    Score: {Math.round(w.score * 100)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2.5 italic">
          * Hover over a word pill to view its individual score. Click a pill to hear its audio and open detailed feedback below.
        </p>
      </div>

      {/* Click Popup Details Card */}
      {selectedWord && (
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm animate-fadeIn text-left transition-colors duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Word Analysis Details</span>
            <button 
              onClick={() => setSelectedWord(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline space-x-2.5">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">"{selectedWord.clean_word}"</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                  selectedWord.score >= 80 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200" 
                    : selectedWord.score >= 65 
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-250" 
                    : "bg-rose-50 text-red-700 dark:bg-rose-950/30 dark:text-red-400 border-rose-200"
                }`}>
                  Score: {selectedWord.score}%
                </span>
              </div>
              
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {selectedWord.score >= 80 
                  ? "Correct articulation of vowel length and consonant sounds."
                  : selectedWord.score >= 65
                  ? "Partially correct. Try emphasizing correct syllable boundaries."
                  : "Pronunciation mistake detected. Make sure to articulate all phonemes clearly."
                }
              </p>
            </div>

            {selectedWord.start !== null && selectedWord.end !== null && (
              <button
                onClick={() => onPlayWord(selectedWord.start, selectedWord.end)}
                className="flex items-center space-x-1.5 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-250 transition-colors shadow-sm self-start sm:self-center shrink-0"
              >
                <Volume2 className="h-3.5 w-3.5 text-[#458393] dark:text-[#34A99D]" />
                <span>Replay My Audio ({selectedWord.start.toFixed(1)}s - {selectedWord.end.toFixed(1)}s)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
