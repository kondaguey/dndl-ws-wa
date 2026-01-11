"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import CalendarStation from "./CalendarStation";
import BookingForm from "./BookingForm";
import SuccessMessage from "@/src/components/SuccessMessage";

export default function SchedulerClient({ initialBookedRanges }) {
  // State from Line 57
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);

  // Shared Data State
  const [wordCount, setWordCount] = useState("");
  const [daysNeeded, setDaysNeeded] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);

  // Toast Helper
  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-12 md:pt-8 pb-16 px-4 bg-gradient-to-br from-[#FDFBF7] via-[#E8F3F1] to-[#E0E7FF] selection:bg-teal-200 selection:text-teal-900 overflow-x-hidden">
      {/* Toast Render */}
      {toast && (
        <div
          className={`fixed bottom-10 z-[100] px-6 py-3 md:px-8 md:py-4 rounded-2xl shadow-xl flex items-center gap-4 animate-fade-in-up backdrop-blur-xl border border-white/20 ${
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

      {/* Header Render */}
      <div className="text-center max-w-4xl mx-auto mb-8 md:mb-12 animate-fade-in relative z-10">
        {/* Label Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/60 shadow-sm mb-6">
          {/* Using Semantic Brand Color */}
          <Sparkles size={12} className="text-brand-start" />
          {/* Using Global H4 Label + Size Override for Pill context */}
          <span className="h4-label text-[10px] mb-0 text-slate-500">
            2026 Production Schedule
          </span>
        </div>

        {/* THE BIG H1 UPDATE */}
        <h1 className="text-4xl md:text-6xl font-black uppercase text-slate-900 tracking-tight mb-4 leading-none">
          Book Your <br />
          {/* THE GUSTAVO SPECIAL 
              Replaced 5 lines of Tailwind with 1 Global Class 
          */}
          <span className="h1-wave">Audiobook</span>
        </h1>

        {/* Body Text Update */}
        <p className="body-text max-w-lg mx-auto">
          Enter word count to calculate timeline, then select a start date.
        </p>
      </div>

      {/* --- THE STATIONS --- */}

      {step === 1 && (
        <CalendarStation
          initialBookedRanges={initialBookedRanges}
          wordCount={wordCount}
          setWordCount={setWordCount}
          daysNeeded={daysNeeded}
          setDaysNeeded={setDaysNeeded}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setStep(2);
          }}
          showToast={showToast}
        />
      )}

      {step === 2 && (
        <BookingForm
          selectedDate={selectedDate}
          daysNeeded={daysNeeded}
          wordCount={wordCount}
          onBack={() => setStep(1)}
          onSuccess={(isCinesonic) => setStep(isCinesonic ? 4 : 3)}
          showToast={showToast}
        />
      )}

      {(step === 3 || step === 4) && (
        <SuccessMessage isCinesonic={step === 4} />
      )}
    </div>
  );
}
