"use client";
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Music,
  Mic2,
  Layers,
  Box,
  Wifi,
  Plus,
} from "lucide-react";
import styles from "./Scheduler.module.css";

// --- CONFIGURATION ---

// 1. Discount Logic Source of Truth
const DISCOUNT_TIERS = [
  { days: 120, label: "8%", color: "bg-purple-500" },
  { days: 90, label: "7%", color: "bg-indigo-500" },
  { days: 60, label: "6%", color: "bg-blue-500" },
  { days: 30, label: "5%", color: "bg-teal-500" },
];

// 2. Math Logic Source of Truth (Moved here from Orchestrator)
const WORDS_PER_DAY = 6975;

const DEMO_TRACKS = [
  {
    title: "Emotionally-driven",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_neverfar.mp3",
  },
  {
    title: "M/F Dialogue",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo_filthy_rich_santas_female_dialogue.mp3",
  },
  {
    title: "Character-driven",
    url: "https://gpjgvdpicjqrerqqzhyx.supabase.co/storage/v1/object/public/audio/demos/demo-rtibw-amos-intro.mp3",
  },
];

export default function CalendarStation({
  initialBookedRanges,
  wordCount,
  setWordCount,
  daysNeeded, // Still receiving the state setter from parent
  setDaysNeeded, // Still receiving the state setter from parent
  onDateSelect,
  showToast,
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [playingDemo, setPlayingDemo] = useState(null);
  const audioRef = useRef(null);

  // Audio Logic
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingDemo !== null) {
      const track = DEMO_TRACKS[playingDemo];
      const newAudio = new Audio(track.url);
      newAudio.addEventListener("ended", () => setPlayingDemo(null));
      newAudio.play().catch((e) => {
        console.error("Playback failed", e);
        setPlayingDemo(null);
      });
      audioRef.current = newAudio;
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [playingDemo]);

  // Word Count Handler
  const handleWordCountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(rawValue)) {
      const formatted =
        rawValue === "" ? "" : Number(rawValue).toLocaleString();
      setWordCount(formatted);
      if (rawValue > 0) {
        // USING LOCAL CONSTANT HERE
        setDaysNeeded(Math.ceil(rawValue / WORDS_PER_DAY));
      } else {
        setDaysNeeded(0);
      }
    }
  };

  const toggleDemo = (index) =>
    setPlayingDemo(playingDemo === index ? null : index);

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getDateStatus = (date) => {
    const time = date.getTime();
    const found = initialBookedRanges.find(
      (r) => time >= r.start && time <= r.end
    );
    return found ? "booked" : "free";
  };

  // Visual discount logic
  const getDiscountForDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return DISCOUNT_TIERS.find((tier) => diffDays >= tier.days) || null;
  };

  // Date Click Logic
  const handleDateClick = (day) => {
    const rawCount = parseInt(wordCount.replace(/,/g, ""));
    if (!rawCount || rawCount <= 0) {
      showToast("Enter Word Count first", "error");
      return;
    }
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    start.setHours(0, 0, 0, 0);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (start < today) return;

    let isBlocked = false;
    for (let i = 0; i < daysNeeded; i++) {
      const checkDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day + i
      );
      if (getDateStatus(checkDay) !== "free") {
        isBlocked = true;
        break;
      }
    }

    if (isBlocked) {
      showToast("Not enough consecutive days.", "error");
      return;
    }
    onDateSelect(start);
  };

  // Render Calendar
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array(firstDay).fill(null);

    return (
      <div className="grid grid-cols-7 gap-1 md:gap-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] md:text-[10px] font-black text-slate-300 py-2"
          >
            {d}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((day) => {
          const date = new Date(year, month, day);
          date.setHours(0, 0, 0, 0);

          const status = getDateStatus(date);
          const isPast = date < today;
          const isToday = date.getTime() === today.getTime();
          const discount = getDiscountForDate(date);

          // BASE
          let base =
            "relative h-12 md:h-20 rounded-lg md:rounded-xl border flex flex-col items-center justify-center transition-all duration-200 group overflow-hidden";

          // DEFAULT (Future + Free)
          let look =
            "bg-white/40 border-white/60 hover:bg-white hover:border-brand-start hover:shadow-lg cursor-pointer";

          let content = (
            <span className="text-sm md:text-xl font-bold text-slate-700 group-hover:text-primary-dark absolute top-1.5 left-1.5 md:relative md:top-auto md:left-auto">
              {day}
            </span>
          );

          // 1. PAST DATES (The Fix: Opacity 50% + Slate Background)
          if (isPast) {
            look =
              "bg-slate-100/60 border-slate-200 opacity-50 cursor-not-allowed"; // More solid background, less transparent
            content = (
              <span className="text-slate-400 text-xs absolute top-1.5 left-1.5 md:relative">
                {day}
              </span>
            );
          }
          // 2. BOOKED DATES
          else if (status === "booked") {
            look = "bg-red-50/80 border-red-100 cursor-not-allowed";
            content = (
              <>
                <span className="text-red-300/50 text-[10px] absolute top-1 left-1.5">
                  {day}
                </span>
                <span className="text-red-400/90 text-[6px] md:text-[10px] font-black uppercase -rotate-12 tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  Booked
                </span>
              </>
            );
          }

          // 3. TODAY HIGHLIGHT (Applies on top of Past/Booked/Free)
          if (isToday) {
            // Add the ring
            look += " ring-2 ring-brand-start ring-offset-2 z-20"; // z-20 brings it forward

            // If it was "invisible" past or ghosted, force it to be fully visible
            if (isPast) {
              look = look.replace("opacity-50", "opacity-100"); // Remove ghost effect for today
            }

            // If it's NOT booked, give it a nice white pop. If booked, keep red bg.
            if (status !== "booked") {
              look += " bg-white shadow-md";
            }
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast || status !== "free"}
              className={`${base} ${look}`}
            >
              {content}
              {/* Discount Dots */}
              {!isPast && status === "free" && discount && (
                <div
                  className={`absolute top-2 right-2 md:top-2 md:right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${discount.color} z-10 shadow-sm`}
                />
              )}
              {/* Hover Plus */}
              {!isPast && status === "free" && (
                <Plus
                  size={12}
                  className="hidden md:block absolute bottom-1 right-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch animate-fade-in relative z-10">
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6 h-full order-2 lg:order-1">
        {/* WORD COUNT CARD */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <label
            className={styles.inputLabel}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <div className="w-1 h-3 bg-brand-start rounded-full" /> Word Count
          </label>
          <input
            type="text"
            value={wordCount}
            onChange={handleWordCountChange}
            placeholder="50,000"
            className={styles.inputField}
            style={{ fontSize: "1.875rem" }}
          />
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="h4-label text-[10px] mb-0">Est. Timeline</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">
                {daysNeeded}
              </span>
              <span className="text-sm font-bold text-slate-400">Days</span>
            </div>
          </div>
        </div>

        {/* DEMOS CARD */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-all">
          <label
            className={styles.inputLabel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <div className="w-1 h-3 bg-brand-mid rounded-full" /> Listen to
            Demos
          </label>
          <div className="space-y-3">
            {DEMO_TRACKS.map((track, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white hover:border-brand-mid transition-colors group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <button
                    onClick={() => toggleDemo(i)}
                    className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-50 text-brand-mid flex items-center justify-center group-hover:bg-brand-mid group-hover:text-white transition-all"
                  >
                    {playingDemo === i ? (
                      <Pause size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate">
                      {track.title}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 truncate">
                      {track.duration}
                    </div>
                  </div>
                </div>
                <Music size={14} className="text-slate-200 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* SPECS CARD */}
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200 flex flex-col justify-center flex-grow">
          <label className="h4-label text-slate-500 mb-6 flex items-center gap-2">
            <div className="w-1 h-3 bg-brand-start rounded-full" /> Studio Specs
          </label>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Mic2 size={16} className="text-brand-start" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  TZ Stellar X2
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Warm vintage sounds
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Layers size={16} className="text-brand-start" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Focusrite Scarlett
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  High-fidelity
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Box size={16} className="text-brand-start" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  SnapStudio® Booth
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  -70dB noise floor
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Wifi size={16} className="text-brand-start" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Source-Connect
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Remote Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 bg-white/50 backdrop-blur-2xl border border-white/50 p-6 md:p-10 rounded-3xl md:rounded-[2.5rem] shadow-sm h-full flex flex-col order-1 lg:order-2">
        <div className="flex items-center justify-between mb-6 px-1 md:px-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 md:p-3 bg-white/80 rounded-full hover:bg-white text-slate-600 shadow-sm border border-white/50"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900">
              {currentDate.toLocaleDateString("en-US", { month: "long" })}
            </h2>
            <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest">
              {currentDate.getFullYear()}
            </p>
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 md:p-3 bg-white/80 rounded-full hover:bg-white text-slate-600 shadow-sm border border-white/50"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="flex-grow">{renderCalendar()}</div>

        {/* 3. LEGEND */}
        <div className="mt-8 grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 md:gap-3 border-t border-slate-200/30 pt-8">
          {DISCOUNT_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center md:justify-start gap-2 bg-white/40 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/40"
            >
              <div
                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${tier.color}`}
              />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wide text-slate-500">
                {tier.label} Off
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
