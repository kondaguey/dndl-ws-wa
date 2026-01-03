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
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  Zap,
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
      const [requests, bookouts] = await Promise.all([
        // CRITICAL UPDATE: Filter out archived/rejected items.
        // Only Pending and Approved should show up.
        supabase
          .from("2_booking_requests")
          .select("start_date, end_date, status")
          .neq("status", "archived"),

        supabase.from("9_bookouts").select("start_date, end_date"),
      ]);

      let allRanges = [];

      // Process Real Bookings
      if (requests.data) {
        const realRanges = requests.data.map((b) => ({
          start: new Date(b.start_date).setHours(0, 0, 0, 0),
          end: new Date(b.end_date).setHours(0, 0, 0, 0),
          status: b.status, // 'pending' = yellow, 'approved' = red
        }));
        allRanges = [...allRanges, ...realRanges];
      }

      // Process Blockouts (Always Red)
      if (bookouts.data) {
        const blockedRanges = bookouts.data.map((b) => ({
          start: new Date(b.start_date).setHours(0, 0, 0, 0),
          end: new Date(b.end_date).setHours(0, 0, 0, 0),
          status: "blocked", // Force Red
        }));
        allRanges = [...allRanges, ...blockedRanges];
      }

      setBookedRanges(allRanges);
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

    if (diffDays >= 120) return { label: "8%", color: "bg-purple-500" };
    if (diffDays >= 90) return { label: "7%", color: "bg-indigo-500" };
    if (diffDays >= 60) return { label: "6%", color: "bg-blue-500" };
    if (diffDays >= 30) return { label: "5%", color: "bg-teal-500" };
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

    // LOGIC CHECK:
    // Pending = Tentative (Yellow)
    // Approved, Blocked, Ghost = Booked (Red)
    if (found.status === "pending") return "tentative";
    return "booked";
  };

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
      showToast("Not enough consecutive days.", "error");
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

    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(selectedDate.getDate() + daysNeeded);
      const rawCount = parseInt(wordCount.replace(/,/g, ""));

      const payload = {
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
      };

      const { error } = await supabase
        .from("2_booking_requests")
        .insert([payload]);

      if (error) throw error;
      setStep(3);
    } catch (error) {
      console.error("Booking Error:", JSON.stringify(error, null, 2));
      showToast("System Error. Please try again.", "error");
    } finally {
      setLoading(false);
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
            className="text-center text-[10px] font-black text-slate-300 py-2"
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

          let base =
            "relative h-14 md:h-20 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 group overflow-hidden";
          let look =
            "bg-white/40 border-white/60 hover:bg-white hover:border-teal-400 hover:shadow-lg cursor-pointer";
          let content = (
            <span className="text-base md:text-xl font-bold text-slate-700 group-hover:text-teal-900">
              {day}
            </span>
          );

          if (isPast) {
            look =
              "bg-slate-50/50 border-white/10 opacity-40 cursor-not-allowed";
            content = <span className="text-slate-300 text-xs">{day}</span>;
          } else if (status === "booked") {
            look = "bg-red-50/50 border-red-100/50 cursor-not-allowed";
            content = (
              <span className="text-slate-300 line-through text-xs">{day}</span>
            );
          } else if (status === "tentative") {
            look = "bg-orange-50/50 border-orange-100/50 cursor-not-allowed";
            content = <span className="text-slate-300 text-xs">{day}</span>;
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
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${discount.color} z-10`}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-32 pb-16 px-4 bg-gradient-to-br from-[#FDFBF7] via-[#E8F3F1] to-[#E0E7FF] selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden">
      {/* Toast, Header, Steps 1-3 ... (Keep all existing render code exactly as is) */}

      {toast && (
        <div
          className={`fixed bottom-10 z-[100] px-8 py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-fade-in-up backdrop-blur-xl border border-white/20 ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-slate-900 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span className="font-bold text-xs uppercase tracking-widest">
            {toast.msg}
          </span>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/60 shadow-sm mb-6">
          <Sparkles size={12} className="text-teal-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            2026 Production
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black uppercase text-slate-900 tracking-tight mb-4 leading-none">
          Book Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500">
            Audiobook
          </span>
        </h1>
        <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto">
          Enter word count to calculate timeline, then select a start date.
        </p>
      </div>

      {step === 1 && (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-fade-in relative z-10">
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-8">
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                <div className="w-1 h-3 bg-teal-400 rounded-full" /> Word Count
              </label>
              <input
                type="text"
                value={wordCount}
                onChange={handleWordCountChange}
                placeholder="50,000"
                className="w-full text-3xl font-black text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-teal-500 outline-none py-2 placeholder:text-slate-300"
              />
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-white/60 p-8 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-400 rounded-full" />{" "}
                  Timeline
                </label>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900">
                    {daysNeeded}
                  </span>
                  <span className="text-sm font-bold text-slate-400">Days</span>
                </div>
              </div>
              <Clock size={32} className="text-indigo-400/50" />
            </div>
          </div>

          {/* RIGHT SIDE (CALENDAR) */}
          <div className="lg:col-span-8 bg-white/50 backdrop-blur-2xl border border-white/50 p-8 md:p-10 rounded-[2.5rem] shadow-sm">
            <div className="flex items-center justify-between mb-6 px-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-3 bg-white/80 rounded-full hover:bg-white text-slate-600 shadow-sm border border-white/50"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-black uppercase text-slate-900">
                  {currentDate.toLocaleDateString("en-US", { month: "long" })}
                </h2>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                  {currentDate.getFullYear()}
                </p>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="p-3 bg-white/80 rounded-full hover:bg-white text-slate-600 shadow-sm border border-white/50"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {renderCalendar()}

            <div className="mt-8 flex flex-wrap justify-center gap-3 border-t border-slate-200/30 pt-8">
              {[
                { label: "5%", color: "bg-teal-500" },
                { label: "6%", color: "bg-blue-500" },
                { label: "7%", color: "bg-indigo-500" },
                { label: "8%", color: "bg-purple-500" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white/40 px-4 py-1.5 rounded-full border border-white/40"
                >
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                    {item.label} Off
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-2xl border border-white/60 p-12 rounded-[3rem] shadow-2xl animate-slide-up relative overflow-hidden z-20">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mb-8 transition-colors"
          >
            <ChevronLeft size={16} /> Back to Calendar
          </button>

          <h2 className="text-4xl font-black uppercase text-slate-900 mb-8 tracking-tight">
            Confirm Details
          </h2>

          <div className="flex items-center gap-8 mb-10 pb-8 border-b border-slate-200/50">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Start
              </p>
              <p className="text-xl font-bold text-slate-900">
                {selectedDate?.toLocaleDateString()}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Length
              </p>
              <p className="text-xl font-bold text-slate-900">
                {daysNeeded} Days
              </p>
            </div>
            {calculateDiscount() && (
              <div className="ml-auto bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" />{" "}
                {calculateDiscount()} Off
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <label className="input-label">Client Name</label>
                <input
                  required
                  name="clientName"
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="group">
                <label className="input-label">Email</label>
                <input
                  required
                  name="email"
                  type="email"
                  onChange={handleInputChange}
                  className="input-field"
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
                className="input-field"
                placeholder="The Great Novel"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="group">
                <label className="input-label">Client Type</label>
                <select
                  required
                  name="clientType"
                  onChange={handleInputChange}
                  className="input-field bg-transparent"
                >
                  <option value="">Select...</option>
                  <option value="Indie">Indie Author</option>
                  <option value="Publisher">Publisher</option>
                  <option value="Narrator">Narrator</option>
                </select>
              </div>
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-4 cursor-pointer group/check">
                  <div className="w-6 h-6 border-2 border-slate-300 rounded-lg flex items-center justify-center transition-colors group-hover/check:border-teal-500 bg-white">
                    <input
                      type="checkbox"
                      name="isReturning"
                      onChange={handleInputChange}
                      className="hidden peer"
                    />
                    <div className="w-3 h-3 bg-teal-500 rounded-[2px] opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover/check:text-slate-900">
                    Returning?
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
                className="input-field bg-transparent"
              >
                <option value="">Select...</option>
                <option value="Solo">Solo (Daniel)</option>
                <option value="Dual">Dual</option>
                <option value="Duet">Duet</option>
                <option value="Multicast">Multicast</option>
              </select>
            </div>

            {["Dual", "Duet", "Multicast"].includes(formData.style) ? (
              <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100 text-center">
                <p className="text-indigo-900 font-bold text-base mb-6">
                  Multi-voice projects handled via CineSonic.
                </p>
                <a
                  href={CINESONIC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30"
                >
                  Go to CineSonic <ExternalLink size={14} />
                </a>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="group">
                  <label className="input-label">Genre</label>
                  <select
                    required
                    name="genre"
                    onChange={handleInputChange}
                    className="input-field bg-transparent"
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
                    className="input-field h-32 resize-none leading-relaxed"
                    placeholder="Vibe check..."
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-6 rounded-2xl hover:bg-teal-600 transition-all shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 text-sm"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Confirm Booking <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-lg bg-white/70 backdrop-blur-2xl border border-white/60 p-12 rounded-[3rem] text-center animate-fade-in-up z-20">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-4xl font-black uppercase text-slate-900 mb-6 tracking-tight">
            Received
          </h2>
          <p className="text-slate-500 text-lg mb-10 font-medium">
            I'll review the details and email you within{" "}
            <strong className="text-slate-900">24 hours</strong>.
          </p>
          <Link
            href="/"
            className="inline-block px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-full hover:bg-teal-600 text-xs shadow-xl"
          >
            Return Home
          </Link>
        </div>
      )}

      <style jsx>{`
        .input-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #94a3b8;
          margin-bottom: 0.5rem;
        }
        .input-field {
          width: 100%;
          background: transparent;
          border-bottom: 2px solid #cbd5e1;
          padding: 0.75rem 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          outline: none;
          transition: all 0.3s;
        }
        .input-field:focus {
          border-bottom-color: #14b8a6;
          border-bottom-width: 3px;
        }
        .input-field::placeholder {
          color: #cbd5e1;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
