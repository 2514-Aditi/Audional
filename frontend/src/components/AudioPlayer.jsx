import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export default function AudioPlayer({ src, localFile, onPlayerRef }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const segmentIntervalRef = useRef(null);

  useEffect(() => {
    if (onPlayerRef) {
      onPlayerRef({
        playSegment: (start, end) => {
          if (!audioRef.current) return;
          
          if (segmentIntervalRef.current) {
            clearInterval(segmentIntervalRef.current);
          }

          audioRef.current.currentTime = start;
          audioRef.current.play();
          setIsPlaying(true);

          segmentIntervalRef.current = setInterval(() => {
            if (audioRef.current.currentTime >= end) {
              audioRef.current.pause();
              setIsPlaying(false);
              clearInterval(segmentIntervalRef.current);
            }
          }, 35);
        }
      });
    }

    return () => {
      if (segmentIntervalRef.current) {
        clearInterval(segmentIntervalRef.current);
      }
    };
  }, [onPlayerRef]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (src) {
      audioRef.current.src = src;
    } else if (localFile) {
      audioRef.current.src = URL.createObjectURL(localFile);
    } else {
      audioRef.current.src = "";
    }
  }, [src, localFile]);

  const togglePlay = () => {
    if (!audioRef.current || !audioRef.current.src) return;
    
    if (segmentIntervalRef.current) {
      clearInterval(segmentIntervalRef.current);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (segmentIntervalRef.current) {
      clearInterval(segmentIntervalRef.current);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    
    if (segmentIntervalRef.current) {
      clearInterval(segmentIntervalRef.current);
    }

    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const seekTime = pos * duration;
    
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleReset = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (isPlaying) {
      audioRef.current.play();
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm text-left transition-colors duration-200">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      <div className="flex items-center space-x-4">
        {/* Simple rectangular control buttons */}
        <button
          onClick={togglePlay}
          disabled={!src && !localFile}
          className="px-4 py-2 flex items-center justify-center rounded-lg bg-[#458393] dark:bg-[#34A99D] hover:bg-[#347483] dark:hover:bg-[#2c9186] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5 mr-1.5 fill-white text-white" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5 fill-white text-white" />
              <span>Play</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleReset}
          disabled={!src && !localFile}
          className="p-2 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
          title="Reset"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        {/* Flat Progress Slider */}
        <div className="flex-grow flex items-center space-x-3">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-8 text-right font-medium">
            {formatTime(currentTime)}
          </span>
          
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="flex-grow h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full cursor-pointer relative overflow-hidden border border-slate-250/20 dark:border-slate-800"
          >
            <div
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              className="h-full bg-[#458393] dark:bg-[#34A99D] rounded-full transition-all duration-75"
            />
          </div>

          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 w-8 font-medium">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
