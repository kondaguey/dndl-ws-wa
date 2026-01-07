import React, { useState } from "react";
import {
  CloudHail,
  Radar,
  X,
  ThermometerSnowflake,
  CloudRain,
  ArrowRightLeft,
} from "lucide-react";

export default function MeteorologicalEffect({
  weatherMode,
  setWeatherMode,
  intensity,
  setIntensity,
  windVector, // Combined Speed + Direction (-5 to 5)
  setWindVector,
  isDark,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const bgClass = isDark
    ? "bg-[#050505]/80 border-white/10 text-white shadow-[0_0_40px_rgba(0,0,0,0.9)]"
    : "bg-white/90 border-slate-300 text-slate-800 shadow-xl";

  const rangeTrackClass = isDark ? "bg-slate-800" : "bg-slate-200";

  const getWindLabel = (val) => {
    if (val === 0) return "CALM";
    const dir = val < 0 ? "WEST" : "EAST";
    return `${dir} [${Math.abs(val).toFixed(1)}]`;
  };

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col items-start gap-4 font-sans">
      {/* EXPANDABLE PANEL */}
      <div
        className={`
          transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) origin-bottom-left overflow-hidden backdrop-blur-md rounded-2xl border
          ${isOpen ? "w-64 p-5 opacity-100 scale-100 translate-y-0" : "w-0 h-0 p-0 opacity-0 scale-90 translate-y-10"}
          ${bgClass}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-current/10">
          <div className="flex items-center gap-2">
            <Radar
              size={16}
              className={
                isDark ? "text-teal-400 animate-spin-slow" : "text-blue-600"
              }
            />
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em]">
                Geo-System
              </div>
            </div>
          </div>

          <div className="flex bg-current/5 rounded-lg p-1 gap-1">
            <button
              onClick={() => setWeatherMode("snow")}
              className={`p-1.5 rounded transition-all ${
                weatherMode === "snow"
                  ? "bg-teal-500/20 text-teal-400 shadow-sm"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <ThermometerSnowflake size={14} />
            </button>
            <button
              onClick={() => setWeatherMode("rain")}
              className={`p-1.5 rounded transition-all ${
                weatherMode === "rain"
                  ? "bg-blue-500/20 text-blue-400 shadow-sm"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <CloudRain size={14} />
            </button>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-6">
          {/* 1. DENSITY */}
          <div className="group">
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider mb-2 opacity-60">
              <span className="flex items-center gap-1.5">
                <CloudHail size={10} /> Density
              </span>
              <span className="font-mono">{Math.round(intensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className={`w-full h-1 rounded-full appearance-none cursor-pointer ${rangeTrackClass} accent-teal-400`}
            />
          </div>

          {/* 2. WIND (Direction + Velocity) */}
          <div className="group">
            <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider mb-2 opacity-60">
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft size={10} /> Wind & Velocity
              </span>
              <span className="font-mono">{getWindLabel(windVector)}</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={windVector}
                onChange={(e) => setWindVector(parseFloat(e.target.value))}
                className={`w-full h-1 rounded-full appearance-none cursor-pointer ${rangeTrackClass} accent-blue-400`}
              />
              {/* Center Tick */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1 bg-current/30 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md border shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen ? "bg-red-500/10 border-red-500 text-red-500 rotate-90" : "bg-black/60 border-white/10 text-teal-400 hover:border-teal-500"}
        `}
      >
        {isOpen ? (
          <X size={20} strokeWidth={3} />
        ) : (
          <Radar size={20} strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
