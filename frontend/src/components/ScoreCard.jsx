import React from "react";
import { MessageSquare, AlertCircle, Sparkles } from "lucide-react";

export default function ScoreCard({ scores, onTabChange }) {
  const { pronunciation_score, accuracy_score, fluency_score, completeness_score, summary } = scores;

  return (
    <div className="space-y-5 text-left font-sans">
      
      {/* Overall Score & Summary Card */}
      <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors duration-200">
        
        {/* Large Score display */}
        <div className="shrink-0 flex flex-col justify-center">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Overall Score
          </h3>
          <div className="flex items-baseline mt-1">
            <span className="text-5xl font-display font-extrabold text-[#458393] dark:text-[#34A99D]">
              {pronunciation_score}
            </span>
            <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1.5 font-sans">
              / 100
            </span>
          </div>
        </div>
        
        {/* Quick AI Summary */}
        <div className="flex-grow max-w-lg border-t md:border-t-0 md:border-l border-slate-150 dark:border-slate-700/60 pt-4 md:pt-0 md:pl-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 mb-1">
            AI Speech Summary
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
            {summary || "Your pronunciation assessment results are ready. Click tabs below to review details."}
          </p>
        </div>

      </div>

      {/* Three Small Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Fluency */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-200">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fluency</span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{fluency_score}%</span>
          </div>
          <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden border border-slate-200/20 dark:border-slate-800">
            <div 
              style={{ width: `${fluency_score}%` }} 
              className="h-full bg-[#458393] dark:bg-[#34A99D] rounded-full" 
            />
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-2">Speech rate consistency and breathing pauses.</p>
        </div>

        {/* Clarity */}
        <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-200">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clarity</span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{accuracy_score}%</span>
          </div>
          <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden border border-slate-200/20 dark:border-slate-800">
            <div 
              style={{ width: `${accuracy_score}%` }} 
              className="h-full bg-[#458393] dark:bg-[#34A99D] rounded-full" 
            />
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-2">Phonetic accuracy of consonant and vowel targets.</p>
        </div>

        {/* Confidence */}
        <div className="p-4 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-200">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confidence</span>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{completeness_score}%</span>
          </div>
          <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden border border-slate-200/20 dark:border-slate-800">
            <div 
              style={{ width: `${completeness_score}%` }} 
              className="h-full bg-[#458393] dark:bg-[#34A99D] rounded-full" 
            />
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-2">Syllables correctly spoken without drops.</p>
        </div>

      </div>

      {/* Dashboard Shortcut buttons */}
      <div className="grid grid-cols-3 gap-3.5 pt-3">
        <button
          onClick={() => onTabChange("transcript")}
          className="py-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5 text-[#458393] dark:text-[#34A99D]" />
          <span>View Transcript</span>
        </button>

        <button
          onClick={() => onTabChange("mistakes")}
          className="py-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
        >
          <AlertCircle className="h-3.5 w-3.5 text-[#E5CB90]" />
          <span>View Mistakes</span>
        </button>

        <button
          onClick={() => onTabChange("suggestions")}
          className="py-2.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold shadow-sm transition-all flex items-center justify-center space-x-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#34A99D]" />
          <span>Practice</span>
        </button>
      </div>

    </div>
  );
}
