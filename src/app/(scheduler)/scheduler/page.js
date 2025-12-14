"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Gem,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  Zap,
  Bird,
  Lock,
} from "lucide-react";

// --- 1. SUPABASE CONNECTION ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- 2. CONFIG ---
const WORDS_PER_DAY = 6975;
const CINESONIC_URL = "https://www.cinesonicaudiobooks.com/contact";

export default function SchedulerPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Data State
  const [wordCount, setWordCount] = useState("");
  const [daysNeeded, setDaysNeeded] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]);

  const [formData, setFormData] = useState({
    clientName: "",
    email: "",
    bookTitle: "",
    clientType: "",
    isReturning: false,
    style: "",
    genre: "",
    notes: "",
  });

  // --- 3. FETCH DATABASE SCHEDULE ---
  useEffect(() => {
    const fetchSchedule = async () => {
      const { data, error } = await supabase.rpc("get_public_schedule");
      if (data) {
        const ranges = data.map((b) => ({
          start: new Date(b.start_date).setHours(0, 0, 0, 0),
          end: new Date(b.end_date).setHours(0, 0, 0, 0),
          status: b.status,
        }));
        setBookedRanges(ranges);
      }
    };
    fetchSchedule();
  }, []);

  // --- 4. INPUT HANDLERS ---
  const handleWordCountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (!isNaN(rawValue)) {
      const formatted =
        rawValue === "" ? "" : Number(rawValue).toLocaleString();
      setWordCount(formatted);
      if (rawValue > 0) setDaysNeeded(Math.ceil(rawValue / WORDS_PER_DAY));
      else setDaysNeeded(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --- 5. DISCOUNT LOGIC ---
  const getDiscountForDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 120)
      return {
        label: "8%",
        color: "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]",
      };
    if (diffDays >= 90)
      return {
        label: "7%",
        color: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]",
      };
    if (diffDays >= 60)
      return {
        label: "6%",
        color: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]",
      };
    if (diffDays >= 30)
      return {
        label: "5%",
        color: "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.6)]",
      };
    return null;
  };

  const calculateDiscount = () => {
    if (!selectedDate) return null;
    const d = getDiscountForDate(selectedDate);
    return d ? d.label : null;
  };

  // --- 6. CALENDAR LOGIC ---
  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getDateStatus = (date) => {
    const time = date.getTime();
    const found = bookedRanges.find((r) => time >= r.start && time <= r.end);
    if (!found) return "free";
    if (found.status === "pending") return "tentative";
    return "booked";
  };

  const handleDateClick = (day) => {
    const rawCount = parseInt(wordCount.replace(/,/g, ""));
    if (!rawCount || rawCount <= 0) {
      showToast("Please enter Word Count first", "error");
      return;
    }

    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    if (start < new Date().setHours(0, 0, 0, 0)) return;

    let isBlocked = false;
    for (let i = 0; i < daysNeeded; i++) {
      const checkDay = new Date(start);
      checkDay.setDate(start.getDate() + i);
      if (getDateStatus(checkDay) !== "free") {
        isBlocked = true;
        break;
      }
    }

    if (isBlocked) {
      showToast("Not enough consecutive days available.", "error");
      return;
    }

    setSelectedDate(start);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (["Dual", "Duet", "Multicast"].includes(formData.style)) {
      window.open(CINESONIC_URL, "_blank");
      setLoading(false);
      return;
    }

    const endDate = new Date(selectedDate);
    endDate.setDate(selectedDate.getDate() + daysNeeded);
    const rawCount = parseInt(wordCount.replace(/,/g, ""));

    const { error } = await supabase.from("bookings").insert([
      {
        client_name: formData.clientName,
        email: formData.email,
        book_title: formData.bookTitle,
        word_count: rawCount,
        days_needed: daysNeeded,
        start_date: selectedDate.toISOString(),
        end_date: endDate.toISOString(),
        narration_style: formData.style,
        genre: formData.genre,
        notes: formData.notes,
        is_returning: formData.isReturning,
        discount_applied: calculateDiscount() || "None",
        client_type: formData.clientType,
        status: "pending",
      },
    ]);

    setLoading(false);
    if (error) {
      console.error(error);
      showToast("Error saving booking", "error");
    } else {
      setStep(3);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- RENDERERS ---
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array(firstDay).fill(null);

    return (
      <div className="grid grid-cols-7 gap-2 lg:gap-3">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] uppercase font-black tracking-widest text-slate-400/60 py-2"
          >
            {d}
          </div>
        ))}
        {blanks.map((_, i) => (
          <div key={`b-${i}`} />
        ))}
        {days.map((day) => {
          const date = new Date(year, month, day);
          const status = getDateStatus(date);
          const isPast = date < today;
          const discount = getDiscountForDate(date);

          // BASE STYLE: increased lg:h-32 so it's not scrunched vertically on desktop
          let base =
            "relative h-12 md:h-20 lg:h-32 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 group overflow-hidden";
          let look =
            "bg-white/40 border-white/60 hover:bg-white/90 hover:border-teal-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer backdrop-blur-md shadow-sm";
          let content = (
            <span className="text-sm md:text-xl font-bold text-slate-700 group-hover:text-teal-900 group-hover:scale-110 transition-transform">
              {day}
            </span>
          );

          if (isPast) {
            look =
              "bg-slate-100/20 border-white/10 opacity-40 cursor-not-allowed";
            content = (
              <span className="text-slate-400 text-xs font-medium">{day}</span>
            );
          } else if (status === "booked") {
            look = "bg-red-50/40 border-red-100/30 cursor-not-allowed";
            content = (
              <>
                <span className="text-slate-300 line-through text-xs font-medium">
                  {day}
                </span>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-50/80 backdrop-blur-sm">
                  <span className="text-[7px] font-black uppercase text-red-400 tracking-widest">
                    Booked
                  </span>
                </div>
              </>
            );
          } else if (status === "tentative") {
            look = "bg-orange-50/40 border-orange-100/30 cursor-not-allowed";
            content = (
              <>
                <span className="text-slate-400 text-xs font-medium">
                  {day}
                </span>
                <div className="absolute inset-0 flex items-center justify-center bg-orange-50/50 backdrop-blur-sm">
                  <span className="text-[7px] font-black uppercase text-orange-400 tracking-widest">
                    Hold
                  </span>
                </div>
              </>
            );
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast || status !== "free"}
              className={`${base} ${look}`}
            >
              {content}
              {!isPast && status === "free" && discount && (
                <div
                  className={`absolute top-2 right-2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${discount.color} animate-pulse z-10`}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    // 1. FIXED PADDING TOP: pt-[140px]
    // 2. FIXED WIDTH: max-w-[1600px] to force width
    <div className="min-h-screen w-full flex flex-col items-center pt-[140px] pb-24 px-4 bg-gradient-to-br from-[#FDFBF7] via-[#E8F3F1] to-[#E0E7FF] selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden">
      {/* --- TOAST --- */}
      {toast && (
        <div
          className={`fixed bottom-10 z-[100] px-8 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-4 animate-fade-in-up backdrop-blur-xl border border-white/40 ${
            toast.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-slate-900/90 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={24} />
          ) : (
            <CheckCircle2 size={24} />
          )}
          <span className="font-black text-xs uppercase tracking-widest">
            {toast.msg}
          </span>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm mb-6 hover:scale-105 transition-transform cursor-default">
          <Sparkles size={12} className="text-teal-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
            2026 Production Calendar
          </span>
        </div>

        <h1 className="text-4xl md:text-7xl font-black uppercase text-slate-900 tracking-normal mb-4 drop-shadow-sm leading-[0.9]">
          Book Your <br />
          <span className="p-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 animate-gradient-x">
            Audiobook
          </span>{" "}
          Production
        </h1>

        <p className="text-slate-500 text-md md:text-2xl font-medium max-w-xl mx-auto leading-relaxed mt-6">
          Enter your word count to calculate the timeline, then select a start
          date.
        </p>
      </div>

      {step === 1 && (
        // KEY LAYOUT FIX: WIDE CONTAINER (max-w-[1600px]) + GRID
        <div className="w-full max-w-[1600px] px-2 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start animate-fade-in relative z-10">
          {/* --- LEFT SIDEBAR --- */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
            {/* Word Count Input */}
            <div className="bg-white/60 backdrop-blur-2xl border border-white/60 p-8 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                <div className="w-1 h-3 bg-teal-400 rounded-full" /> Word Count
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={wordCount}
                  onChange={handleWordCountChange}
                  placeholder="50,000"
                  className="w-full text-4xl font-black text-slate-900 bg-transparent border-b-2 border-slate-200/50 focus:border-teal-500 outline-none py-2 transition-all placeholder:text-slate-200/50"
                />
              </div>
            </div>

            {/* Days Estimate */}
            <div className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-100/30 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-teal-200/40 transition-colors duration-700" />

              <div className="relative z-10">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-400 rounded-full" /> Est.
                  Timeline
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">
                    {daysNeeded > 0 ? daysNeeded : "0"}
                  </span>
                  <span className="text-sm font-bold text-slate-400">Days</span>
                </div>
              </div>

              <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm z-10 group-hover:scale-110 transition-transform duration-500">
                <Clock size={32} />
              </div>
            </div>

            {/* No Payment Assurance */}
            <div className="bg-sky-50/60 backdrop-blur-xl border border-sky-100 p-8 rounded-[2.5rem] flex items-start gap-5 shadow-sm group hover:bg-sky-50/80 transition-colors">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-sky-500 shadow-sm shrink-0 border border-sky-100">
                <Lock size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-900 mb-1">
                  No Payment Required
                </h3>
                <p className="text-slate-600 text-sm font-medium leading-relaxed">
                  Selecting a date strictly{" "}
                  <strong className="text-sky-700">
                    locks it in for 48 hours
                  </strong>
                  . This is a risk-free courtesy hold.
                </p>
              </div>
            </div>
          </div>

          {/* --- RIGHT SIDE (Calendar) --- */}
          <div className="lg:col-span-8 bg-white/50 backdrop-blur-3xl border border-white/50 p-6 md:p-12 rounded-[3rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-8 px-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-4 bg-white/80 rounded-full hover:scale-110 hover:shadow-lg transition-all text-slate-600 shadow-sm border border-white"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="text-center">
                <h2 className="text-3xl md:text-5xl font-black uppercase text-slate-900 tracking-tight mb-1">
                  {currentDate.toLocaleDateString("en-US", { month: "long" })}
                </h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                  {currentDate.getFullYear()}
                </p>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-4 bg-white/80 rounded-full hover:scale-110 hover:shadow-lg transition-all text-slate-600 shadow-sm border border-white"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {renderCalendar()}

            <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-slate-200/30 pt-8">
              {[
                { label: "5% Off", color: "bg-teal-500" },
                { label: "6% Off", color: "bg-blue-500" },
                { label: "7% Off", color: "bg-indigo-500" },
                { label: "8% Off", color: "bg-purple-500" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full border border-white/40 shadow-sm"
                >
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 - Wider Container */}
      {step === 2 && (
        <div className="w-full max-w-[1200px] bg-white/70 backdrop-blur-3xl border border-white/60 p-8 md:p-16 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] animate-slide-up relative overflow-hidden z-20">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-b from-teal-100/40 to-indigo-100/40 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />

          <button
            onClick={() => setStep(1)}
            className="relative z-10 flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform border border-slate-100">
              <ChevronLeft size={18} />
            </div>
            Back to Calendar
          </button>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-slate-900 mb-8 tracking-tighter leading-none">
              Confirm <br />
              Details
            </h2>

            <div className="flex flex-wrap items-center gap-12 mb-12 py-8 border-b border-slate-200/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Start Date
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedDate?.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="w-px h-12 bg-slate-200/50 hidden md:block" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Duration
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {daysNeeded} Days
                  </p>
                </div>
              </div>
            </div>

            {calculateDiscount() && (
              <div className="mb-12 relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white shadow-xl p-0.5">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 opacity-20" />
                <div className="relative bg-slate-900/90 backdrop-blur-xl p-10 rounded-[2.4rem] flex items-center gap-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-200 to-amber-500 rounded-3xl flex items-center justify-center text-slate-900 shadow-lg transform rotate-3">
                    <Bird size={40} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                      Early Bird Discount!
                    </h4>
                    <p className="text-slate-400 text-base font-medium mt-2">
                      <span className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-white font-bold text-xs uppercase tracking-widest border border-white/10">
                        <Zap
                          size={12}
                          className="text-yellow-400"
                          fill="currentColor"
                        />
                        {calculateDiscount()} Discount Applied
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="group">
                  <label className="input-label">Client / Author Name</label>
                  <input
                    required
                    name="clientName"
                    onChange={handleInputChange}
                    className="input-field text-2xl"
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="group">
                  <label className="input-label">Contact Email</label>
                  <input
                    required
                    name="email"
                    type="email"
                    onChange={handleInputChange}
                    className="input-field text-2xl"
                    placeholder="jane@example.com"
                  />
                </div>
              </div>
              <div className="group">
                <label className="input-label">Book Title</label>
                <input
                  required
                  name="bookTitle"
                  onChange={handleInputChange}
                  className="input-field text-2xl"
                  placeholder="The Great Novel"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="group">
                  <label className="input-label">I am a...</label>
                  <select
                    required
                    name="clientType"
                    onChange={handleInputChange}
                    className="input-field text-2xl bg-transparent cursor-pointer"
                  >
                    <option value="">Select...</option>
                    <option value="Indie">Indie Author</option>
                    <option value="Publisher">Publisher</option>
                    <option value="Narrator">Narrator</option>
                  </select>
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center gap-4 cursor-pointer group/check p-4 rounded-2xl hover:bg-white/50 transition-colors">
                    <div className="w-8 h-8 border-2 border-slate-300 rounded-lg flex items-center justify-center transition-colors group-hover/check:border-teal-500 bg-white">
                      <input
                        type="checkbox"
                        name="isReturning"
                        onChange={handleInputChange}
                        className="hidden peer"
                      />
                      <div className="w-4 h-4 bg-teal-500 rounded-[2px] opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover/check:text-slate-900 transition-colors">
                      Returning Client?
                    </span>
                  </label>
                </div>
              </div>

              <div className="group">
                <label className="input-label">Narration Style</label>
                <select
                  required
                  name="style"
                  onChange={handleInputChange}
                  className="input-field text-2xl bg-transparent cursor-pointer"
                >
                  <option value="">Select...</option>
                  <option value="Solo">Solo (Daniel)</option>
                  <option value="Dual">Dual</option>
                  <option value="Duet">Duet</option>
                  <option value="Multicast">Multicast</option>
                </select>
              </div>

              {["Dual", "Duet", "Multicast"].includes(formData.style) ? (
                <div className="p-12 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 text-center backdrop-blur-sm shadow-inner">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500 shadow-sm">
                    <ExternalLink size={32} />
                  </div>
                  <h4 className="text-indigo-900 font-black uppercase tracking-widest text-base mb-4">
                    CineSonic Reroute
                  </h4>
                  <p className="text-indigo-800/70 text-lg mb-10 leading-relaxed font-medium max-w-lg mx-auto">
                    Multi-voice projects are handled by my production company,
                    CineSonic Audiobooks.
                  </p>
                  <a
                    href="https://www.cinesonicaudiobooks.com/projectform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full max-w-lg mx-auto bg-indigo-600 text-white font-black uppercase tracking-widest py-6 rounded-2xl hover:bg-indigo-700 hover:scale-[1.02] transition-all flex justify-center items-center gap-3 shadow-xl hover:shadow-indigo-500/30 text-sm"
                  >
                    Continue to CineSonic
                  </a>
                </div>
              ) : (
                <div className="space-y-10 animate-fade-in">
                  <div className="group">
                    <label className="input-label">Genre</label>
                    <select
                      required
                      name="genre"
                      onChange={handleInputChange}
                      className="input-field text-2xl bg-transparent cursor-pointer"
                    >
                      <option value="">Select...</option>
                      <option value="Romance">Romance</option>
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Thriller">Thriller</option>
                      <option value="Non-Fic">Non-Fic</option>
                    </select>
                  </div>
                  <div className="group">
                    <label className="input-label">Notes</label>
                    <textarea
                      name="notes"
                      onChange={handleInputChange}
                      className="input-field text-xl h-40 resize-none leading-relaxed"
                      placeholder="Tell me about the project vibe..."
                    />
                  </div>

                  <button
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-8 rounded-3xl hover:bg-teal-600 hover:scale-[1.01] transition-all shadow-xl flex justify-center items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed text-base group"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        Confirm Booking{" "}
                        <ArrowRight
                          size={24}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-2xl bg-white/70 backdrop-blur-3xl border border-white/60 p-16 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] text-center animate-fade-in-up z-20">
          <div className="w-28 h-28 bg-green-100/50 rounded-full flex items-center justify-center mx-auto mb-10 text-green-600 shadow-inner">
            <CheckCircle2 size={56} />
          </div>
          <h2 className="text-5xl font-black uppercase text-slate-900 mb-8 tracking-tighter">
            Received
          </h2>
          <p className="text-slate-500 text-xl mb-12 font-medium leading-relaxed">
            I will review the details and email you within{" "}
            <strong className="text-slate-900">24 hours</strong> with the
            production agreement.
          </p>
          <Link
            href="/"
            className="inline-block px-12 py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-full hover:bg-teal-600 hover:scale-105 transition-all shadow-xl text-sm"
          >
            Return Home
          </Link>
        </div>
      )}

      <style jsx>{`
        .input-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #94a3b8;
          margin-bottom: 0.75rem;
          transition: color 0.3s;
        }
        .group:hover .input-label {
          color: #64748b;
        }
        .input-field {
          width: 100%;
          background: transparent;
          border-bottom: 2px solid #e2e8f0;
          padding: 0.75rem 0;
          font-weight: 800;
          color: #0f172a;
          outline: none;
          transition: all 0.3s;
        }
        .input-field:focus {
          border-bottom-color: #14b8a6;
          border-width: 3px;
        }
        .input-field::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }

        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}
