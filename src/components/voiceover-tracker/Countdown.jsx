"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Zap, Flame, Calendar } from "lucide-react";

export default function ProjectCountdown({ date }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(date).getTime();
      return target - now;
    };

    // Initial set
    setTimeLeft(calculateTime());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  // Don't render until client-side hydration is complete to avoid mismatch errors
  if (!isMounted || !date) return null;

  // --- LOGIC: Color & Icon based on time remaining ---
  let styleClass = "";
  let Icon = Clock;
  let statusLabel = "";

  // Convert milliseconds to hours for easy threshold checking
  const hours = timeLeft / (1000 * 60 * 60);

  if (timeLeft < 0) {
    // 🚨 OVERDUE
    styleClass =
      "bg-red-500 text-white border-red-600 shadow-lg shadow-red-900/50";
    Icon = AlertTriangle;
    statusLabel = "OVERDUE";
  } else if (hours < 1) {
    // ⚡ CRITICAL (< 1 hr) - Solid Red + Pulsing
    styleClass =
      "bg-red-600 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.6)]";
    Icon = Zap;
  } else if (hours < 3) {
    // 🔥 URGENT (< 3 hrs) - Red Text/Background
    styleClass =
      "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    Icon = Flame;
  } else if (hours < 12) {
    // 🟠 WARNING (< 12 hrs) - Orange
    styleClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
    Icon = Flame;
  } else if (hours < 24) {
    // 🟡 CAUTION (< 24 hrs) - Blue/Yellow mix (or just Blue/Cyan)
    styleClass = "bg-blue-500/20 text-blue-400 border-blue-500/30";
    Icon = Clock;
  } else {
    // 📅 SAFE (> 24 hrs) - Slate
    styleClass = "bg-slate-800 text-slate-400 border-slate-700";
    Icon = Calendar;
  }

  // --- LOGIC: Formatting the numbers ---
  const formatTime = (ms) => {
    if (ms < 0)
      return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

    // If more than 24 hours, show Days + Hours (e.g., "2d 5h")
    if (ms > 86400000) {
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `${days}d ${h}h`;
    }

    // If less than 24 hours, show digital clock HH:MM:SS
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);

    // Pad with zeros (e.g., 05:01:09)
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider transition-all duration-500 ${styleClass}`}
    >
      <Icon
        size={12}
        className={timeLeft < 3600000 && timeLeft > 0 ? "animate-bounce" : ""}
      />
      <span className="font-mono tabular-nums leading-none pt-[1px]">
        {statusLabel || formatTime(timeLeft)}
      </span>
    </div>
  );
}
