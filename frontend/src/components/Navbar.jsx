import React from "react";
import { Sun, Moon, Mic } from "lucide-react";

export default function Navbar({ currentStep, onNavigate, darkMode, onToggleTheme }) {
  
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    onNavigate("landing");
    
    // Defer scrolling slightly to allow state change if navigating from other steps
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo - Roboto Slab display font */}
        <button 
          onClick={() => onNavigate("landing")}
          className="flex items-center space-x-2 text-left hover:opacity-90 group focus:outline-none"
        >
          <div className="bg-[#458393] dark:bg-[#34A99D] text-white p-1.5 rounded-lg transition-colors">
            <Mic className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">
            Audional
          </span>
        </button>

        {/* Navigation Links - Inter body font */}
        <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button 
            onClick={() => onNavigate("landing")} 
            className="hover:text-slate-800 dark:hover:text-slate-250 transition-colors"
          >
            Home
          </button>
          <a 
            href="#features" 
            onClick={(e) => handleNavClick(e, "features")}
            className="hover:text-slate-800 dark:hover:text-slate-250 transition-colors"
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            onClick={(e) => handleNavClick(e, "how-it-works")}
            className="hover:text-slate-800 dark:hover:text-slate-250 transition-colors"
          >
            How it Works
          </a>
          <a 
            href="#about" 
            onClick={(e) => handleNavClick(e, "about")}
            className="hover:text-slate-800 dark:hover:text-slate-250 transition-colors"
          >
            About
          </a>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3.5">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="h-4 w-4 text-[#E5CB90]" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Action Button */}
          {currentStep !== "upload" && currentStep !== "processing" && currentStep !== "results" ? (
            <button
              onClick={() => onNavigate("upload")}
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#458393] hover:bg-[#347483] dark:bg-[#34A99D] dark:hover:bg-[#2c9186] shadow-sm transition-colors"
            >
              Get Started
            </button>
          ) : (
            currentStep !== "upload" && (
              <button
                onClick={() => onNavigate("upload")}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                Upload Page
              </button>
            )
          )}
        </div>
        
      </div>
    </nav>
  );
}
