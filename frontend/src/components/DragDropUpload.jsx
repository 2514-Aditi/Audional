import React, { useState, useRef } from "react";
import { Paperclip, AlertTriangle, FileAudio } from "lucide-react";

export default function DragDropUpload({ onFileSelect, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [fileDetails, setFileDetails] = useState(null);
  const [referenceText, setReferenceText] = useState("");
  const fileInputRef = useRef(null);

  const validateAudioFile = (file) => {
    setError("");
    setFileDetails(null);

    const ext = file.name.split(".").pop().toLowerCase();
    const allowedExts = ["wav", "mp3", "m4a"];
    const isAudio = file.type.startsWith("audio/") || allowedExts.includes(ext);

    if (!isAudio) {
      setError("Please select a supported file format: MP3, WAV, or M4A.");
      return;
    }

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.addEventListener("loadedmetadata", () => {
      const duration = audio.duration;
      if (duration < 30.0 || duration > 45.0) {
        setError(`Audio duration is ${duration.toFixed(1)}s. Must be between 30 and 45 seconds.`);
        URL.revokeObjectURL(audio.src);
      } else {
        setFileDetails({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          duration: duration.toFixed(1) + "s",
          rawFile: file
        });
        onFileSelect(file, referenceText);
        URL.revokeObjectURL(audio.src);
      }
    });

    audio.addEventListener("error", () => {
      console.warn("Client-side metadata check failed. Proceeding with upload validation.");
      setFileDetails({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        duration: "Unknown",
        rawFile: file
      });
      onFileSelect(file, referenceText);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      validateAudioFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setReferenceText(text);
    if (fileDetails) {
      onFileSelect(fileDetails.rawFile, text);
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Target Prompt Input */}
      <div className="space-y-1.5 text-left">
        <label htmlFor="reference-text" className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
          Practice Text Prompt (Optional)
        </label>
        <textarea
          id="reference-text"
          value={referenceText}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder="Paste reference paragraph to read aloud..."
          className="w-full h-20 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#458393] dark:focus:ring-[#34A99D] focus:border-transparent transition-all disabled:bg-slate-50 dark:disabled:bg-slate-900/50 resize-none"
        />
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`flex flex-col items-center justify-center border border-dashed rounded-lg p-8 text-center cursor-pointer transition-all min-h-[160px] bg-slate-50/20 dark:bg-slate-900/10 ${
          dragActive 
            ? "border-[#458393] dark:border-[#34A99D] bg-[#458393]/5 dark:bg-[#34A99D]/5" 
            : "border-slate-300 dark:border-slate-700 hover:border-slate-450 hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
        } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.m4a"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        <Paperclip className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-2.5" />
        
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Drag and drop audio file here, or click to browse
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 uppercase tracking-wider">
          MP3, WAV, M4A &bull; 30–45 seconds
        </p>

        {error && (
          <div className="mt-4 flex items-center space-x-2 text-red-650 bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-900/40 px-3.5 py-2 rounded-lg text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span className="font-semibold text-left">{error}</span>
          </div>
        )}
      </div>

      {/* Selected File Card */}
      {fileDetails && !error && (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left animate-fadeIn">
          <div className="flex items-center space-x-3 truncate">
            <FileAudio className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                {fileDetails.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {fileDetails.size} &bull; Duration: {fileDetails.duration}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34A99D]/15 text-[#34A99D] border border-[#34A99D]/20 shrink-0 uppercase tracking-wider">
            Ready
          </span>
        </div>
      )}
    </div>
  );
}
