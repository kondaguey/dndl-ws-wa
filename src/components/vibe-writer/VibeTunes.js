"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  X,
  Volume2,
  VolumeX,
  Activity,
  Music,
  Radio,
  Minimize2,
  Maximize2,
} from "lucide-react";

export default function VibeTunes({ url, onClose, isDark }) {
  const audioRef = useRef(null);

  // --- STATE ---
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // --- DETECT TYPE ---
  const isSoundCloud = url?.toLowerCase().includes("soundcloud");
  const isSpotify = url?.toLowerCase().includes("spotify");
  const isDirectFile = !isSoundCloud && !isSpotify;

  // --- AUDIO LOGIC (Only for HTML5 Direct Files) ---
  useEffect(() => {
    if (isDirectFile && audioRef.current) {
      setIsReady(false);
      setError(false);
      setPlaying(true);

      audioRef.current.src = url;
      audioRef.current.load();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsReady(true))
          .catch((e) => {
            console.warn("Auto-play blocked:", e);
            setPlaying(false);
            setIsReady(true);
          });
      }
    }
  }, [url, isDirectFile]);

  const togglePlay = () => {
    if (!isDirectFile) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (isDirectFile && audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const bgClass = isDark
    ? "bg-black/90 border-teal-500/30 text-teal-400 shadow-[0_0_40px_rgba(20,184,166,0.2)]"
    : "bg-white/95 border-slate-200 text-slate-800 shadow-2xl";

  if (!url) return null;

  // ---------------------------------------------------------
  // 1. SPOTIFY EMBED
  // ---------------------------------------------------------
  if (isSpotify) {
    // Robust embed URL converter
    let embedUrl = url;
    if (!url.includes("/embed")) {
      embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/");
    }

    return (
      <div
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[250] transition-all duration-500 ease-in-out border backdrop-blur-xl overflow-hidden ${bgClass} ${
          minimized ? "w-16 h-16 rounded-full" : "w-80 rounded-2xl h-52"
        }`}
      >
        {!minimized && (
          <div className="flex items-center justify-between p-2 border-b border-white/5 bg-[#1DB954]/10 h-10">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-[#1DB954] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                Spotify Signal
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(true)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <Minimize2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {minimized && (
          <button
            onClick={() => setMinimized(false)}
            className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform group"
          >
            <Radio size={24} className="text-[#1DB954] animate-pulse" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Maximize2 size={16} className="text-white" />
            </div>
          </button>
        )}

        <div
          className={`w-full h-full bg-black ${minimized ? "opacity-0 pointer-events-none absolute inset-0 -z-10" : ""}`}
        >
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowtransparency="true"
            allow="encrypted-media"
            title="Spotify Player"
            className="bg-black"
          ></iframe>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 2. SOUNDCLOUD EMBED
  // ---------------------------------------------------------
  if (isSoundCloud) {
    const scUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%232dd4bf&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;

    return (
      <div
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[250] transition-all duration-500 ease-in-out border backdrop-blur-xl overflow-hidden ${bgClass} ${
          minimized ? "w-16 h-16 rounded-full" : "w-80 rounded-2xl"
        }`}
      >
        {!minimized && (
          <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5 h-12">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-[#ff5500] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                SoundCloud Signal
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(true)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <Minimize2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {minimized && (
          <button
            onClick={() => setMinimized(false)}
            className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform group"
          >
            <Radio size={24} className="text-[#ff5500] animate-pulse" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Maximize2 size={16} className="text-white" />
            </div>
          </button>
        )}

        <div
          className={`h-40 w-full bg-black ${minimized ? "opacity-0 pointer-events-none absolute inset-0 -z-10" : ""}`}
        >
          <iframe
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={scUrl}
            title="SoundCloud Player"
          ></iframe>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. HTML5 DIRECT AUDIO (CUSTOM UI)
  // ---------------------------------------------------------
  return (
    <div
      className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[250] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] border backdrop-blur-xl overflow-hidden ${bgClass} ${
        minimized ? "w-48 rounded-xl" : "w-80 rounded-2xl"
      }`}
    >
      {/* FULL HEADER */}
      {!minimized && (
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <Activity
              size={14}
              className={playing ? "text-teal-400 animate-pulse" : "opacity-50"}
            />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
              Vibe_Receiver
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <Minimize2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* MINI HEADER */}
      {minimized && (
        <div className="flex items-center justify-between p-2 pr-3 bg-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${playing ? "bg-teal-500 text-black" : "bg-white/10 text-white"}`}
            >
              {playing ? (
                <Pause size={12} fill="currentColor" />
              ) : (
                <Play size={12} fill="currentColor" className="ml-0.5" />
              )}
            </button>
            <div className="flex gap-0.5 items-end h-4 w-12 opacity-50">
              {playing &&
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-current animate-pulse"
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  />
                ))}
            </div>
          </div>
          <button
            onClick={() => setMinimized(false)}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      )}

      {/* FULL CONTROLS */}
      {!minimized && (
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : isReady ? "bg-emerald-500 shadow-[0_0_8px_currentColor]" : "bg-yellow-500 animate-pulse"}`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 mb-0.5">
                {error ? "LOAD FAILED" : playing ? "BROADCASTING" : "PAUSED"}
              </div>
              <div className="text-xs font-mono truncate block flex items-center gap-1 opacity-75">
                <Music size={10} />
                <span className="truncate">{url.split("/").pop()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={togglePlay}
            className={`h-16 w-full rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${playing ? "bg-teal-500/10 border border-teal-500/50 text-teal-400 shadow-[inset_0_0_20px_rgba(20,184,166,0.2)]" : "bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-lg"}`}
          >
            {playing ? (
              <>
                <Pause size={24} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Pause Stream
                </span>
              </>
            ) : (
              <>
                <Play size={24} fill="currentColor" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Resume Stream
                </span>
              </>
            )}
          </button>

          <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg">
            <button
              onClick={() => {
                const newMute = !muted;
                setMuted(newMute);
                if (audioRef.current) audioRef.current.muted = newMute;
              }}
              className="opacity-60 hover:opacity-100"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
          </div>
        </div>
      )}

      {/* HIDDEN HTML5 PLAYER */}
      <audio
        ref={audioRef}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onError={() => setError(true)}
        onCanPlay={() => setIsReady(true)}
      />
    </div>
  );
}
