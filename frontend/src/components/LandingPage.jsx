import React from "react";
import { Mic, ArrowRight, ShieldCheck, Zap, MessageSquareQuote, CheckSquare, Sparkles } from "lucide-react";

export default function LandingPage({ onGetStarted, onViewDemo }) {
  return (
    <div className="w-full space-y-24 py-8 text-left">
      
      {/* HERO SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center max-w-5xl mx-auto px-4">
        
        {/* Left Column Text */}
        <div className="md:col-span-7 space-y-6">
          <h1 className="text-3xl md:text-5xl font-display font-bold leading-tight text-slate-900 dark:text-slate-100">
            Improve Your English Pronunciation with AI
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
            Upload a short recording and receive instant pronunciation analysis, detailed feedback and personalized speaking suggestions.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <button
              onClick={onGetStarted}
              className="px-5 py-3 rounded-lg text-sm font-bold text-white bg-[#458393] hover:bg-[#347483] dark:bg-[#34A99D] dark:hover:bg-[#2c9186] shadow-sm flex items-center space-x-2 transition-colors group"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onViewDemo}
              className="px-5 py-3 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 transition-colors"
            >
              View Demo
            </button>
          </div>
        </div>

        {/* Right Column Illustration */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-72 h-72 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 rounded-lg p-6 flex flex-col items-center justify-center shadow-sm">
            {/* Visual audio wave decoration inside the illustration box */}
            <div className="absolute inset-x-8 top-12 flex justify-between items-center h-10 opacity-30 dark:opacity-20 pointer-events-none">
              <span className="w-1 bg-[#458393] rounded-full h-4"></span>
              <span className="w-1 bg-[#458393] rounded-full h-8"></span>
              <span className="w-1 bg-[#458393] rounded-full h-6"></span>
              <span className="w-1 bg-[#458393] rounded-full h-10"></span>
              <span className="w-1 bg-[#458393] rounded-full h-5"></span>
              <span className="w-1 bg-[#458393] rounded-full h-7"></span>
              <span className="w-1 bg-[#458393] rounded-full h-3"></span>
            </div>

            <div className="h-20 w-20 rounded-full bg-[#458393]/10 dark:bg-[#34A99D]/10 border border-[#458393]/20 dark:border-[#34A99D]/20 flex items-center justify-center mb-6">
              <Mic className="h-10 w-10 text-[#458393] dark:text-[#34A99D]" />
            </div>
            
            <div className="text-center space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">Acoustic Analyzer</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Speech wav alignment engine active</p>
            </div>

            {/* Flat nodes connected mock SVG graphics */}
            <svg className="absolute bottom-6 w-48 h-8 text-slate-200 dark:text-slate-700" fill="none" viewBox="0 0 100 20">
              <path d="M5,10 Q25,0 50,15 T95,10" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="50" cy="15" r="3" fill="#E5CB90" />
            </svg>
          </div>
        </div>

      </section>

      {/* FEATURE CARDS SECTION */}
      <section id="features" className="max-w-5xl mx-auto px-4 scroll-mt-20">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Features Built for Fluency
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Everything you need to correct accent blocks and identify phonetic errors.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-800 shadow-sm space-y-3">
            <div className="bg-[#458393]/10 dark:bg-[#34A99D]/10 text-[#458393] dark:text-[#34A99D] p-2 rounded w-fit">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Fast Analysis</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Retrieve the word alignments and scoring within 3 seconds using our optimized mock-CPU fallback.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-800 shadow-sm space-y-3">
            <div className="bg-[#458393]/10 dark:bg-[#34A99D]/10 text-[#458393] dark:text-[#34A99D] p-2 rounded w-fit">
              <MessageSquareQuote className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Word-Level Feedback</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Click individual word pills to get localized IPA target spelling symbols and audio coach tips.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-800 shadow-sm space-y-3">
            <div className="bg-[#458393]/10 dark:bg-[#34A99D]/10 text-[#458393] dark:text-[#34A99D] p-2 rounded w-fit">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Personal Suggestions</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Receive custom study blocks detailing target drills and phoneme practice guidelines.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-800 shadow-sm space-y-3">
            <div className="bg-[#458393]/10 dark:bg-[#34A99D]/10 text-[#458393] dark:text-[#34A99D] p-2 rounded w-fit">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Privacy First</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Audio uploads are analyzed in real-time, and you maintain complete control over all audio clips.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 scroll-mt-20">
        <div className="p-6 md:p-10 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
              Simple 3-Step Process
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              How Audional structures speech assessment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-3 text-center md:text-left relative">
              <div className="text-3xl font-extrabold text-[#E5CB90]">01</div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Upload audio</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Provide an English recording sample between 30 and 45 seconds (MP3, WAV, or M4A formats supported).
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="space-y-3 text-center md:text-left relative">
              <div className="text-3xl font-extrabold text-[#E5CB90]">02</div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">AI analyzes speech</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Acoustic models force-align speech frames to transcript syllables, rating pacing and silence durations.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="space-y-3 text-center md:text-left relative">
              <div className="text-3xl font-extrabold text-[#E5CB90]">03</div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">View report</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Browse tabbed overview summaries, interactive colored word transcript panels, and mistakes tables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider max-w-5xl mx-auto px-4">
        <span>&copy; 2026 Audional. All Rights Reserved.</span>
      </footer>

    </div>
  );
}
