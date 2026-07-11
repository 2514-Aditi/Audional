import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Loader({ isActive }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [remainingTime, setRemainingTime] = useState(8); // Start at 8 seconds

  const steps = [
    { title: "Uploading", desc: "Transmitting your voice sample safely to PronounceAI..." },
    { title: "Transcribing", desc: "Using whisper speech recognition to transcribe..." },
    { title: "Analyzing", desc: "Forcing word-level phonetic alignments..." },
    { title: "Generating report", desc: "Finalizing scoring and coach suggestions..." }
  ];

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setRemainingTime(8);
      return;
    }

    // Step increments
    const timer1 = setTimeout(() => setCurrentStep(1), 1500);
    const timer2 = setTimeout(() => setCurrentStep(2), 3000);
    const timer3 = setTimeout(() => setCurrentStep(3), 5000);

    // Countdown remaining time
    const interval = setInterval(() => {
      setRemainingTime((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(interval);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm max-w-md mx-auto my-6 animate-fadeIn transition-colors duration-200 text-left">
      
      {/* Spinner Header */}
      <div className="flex items-center justify-between w-full border-b border-slate-100 dark:border-slate-700/60 pb-3.5 mb-5">
        <div className="flex items-center space-x-2.5">
          <Loader2 className="h-4.5 w-4.5 text-[#458393] dark:text-[#34A99D] animate-spin" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Analysis Progress</span>
        </div>
        
        {/* Estimated remaining time display */}
        <span className="text-[10px] bg-[#E5CB90]/20 text-amber-700 dark:text-[#E5CB90] px-2 py-0.5 rounded-full font-bold border border-[#E5CB90]/40">
          Est. Time: {remainingTime}s
        </span>
      </div>

      {/* Progress Steps List */}
      <div className="w-full space-y-3.5">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isPending = idx > currentStep;

          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 text-xs transition-opacity duration-300 ${
                isCurrent
                  ? "opacity-100 font-semibold text-slate-900 dark:text-slate-100"
                  : isCompleted
                  ? "opacity-60 text-slate-500 dark:text-slate-400"
                  : "opacity-25 text-slate-400 dark:text-slate-600"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <span className="text-[#34A99D] font-bold">&#10003;</span>
                ) : isCurrent ? (
                  <span className="text-[#458393] dark:text-[#34A99D] font-bold">&bull;</span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                )}
              </div>
              
              <div className="text-left">
                <h4 className={isCurrent ? "text-[#458393] dark:text-[#34A99D] font-bold" : "text-slate-700 dark:text-slate-350"}>
                  {step.title}
                </h4>
                <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-0.5 leading-tight">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
