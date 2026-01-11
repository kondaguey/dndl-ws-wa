"use client";
import { useState } from "react";
import { ChevronLeft, Loader2, ArrowRight, Zap } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";
import styles from "./Scheduler.module.css";

export default function BookingForm({
  selectedDate,
  daysNeeded,
  wordCount,
  onBack,
  onSuccess,
  showToast,
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
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

  const getDiscountForDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 120) return "8%";
    if (diffDays >= 90) return "7%";
    if (diffDays >= 60) return "6%";
    if (diffDays >= 30) return "5%";
    return null;
  };
  const discount = getDiscountForDate(selectedDate);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endDate = new Date(selectedDate);
      endDate.setDate(selectedDate.getDate() + daysNeeded);
      const rawCount = parseInt(wordCount.replace(/,/g, ""));
      const toISODate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const isCineSonic = ["Dual", "Duet", "Multicast"].includes(
        formData.style
      );
      const statusToSet = isCineSonic ? "cinesonic" : "pending";

      const payload = {
        client_name: formData.clientName,
        email: formData.email,
        book_title: formData.bookTitle,
        word_count: rawCount,
        days_needed: daysNeeded,
        start_date: toISODate(selectedDate),
        end_date: toISODate(endDate),
        narration_style: formData.style,
        genre: formData.genre,
        notes: formData.notes,
        is_returning: formData.isReturning,
        discount_applied: discount || "None",
        client_type: formData.clientType,
        status: statusToSet,
      };

      const { error } = await supabase
        .from("2_booking_requests")
        .insert([payload]);
      if (error) throw error;
      onSuccess(isCineSonic);
    } catch (error) {
      console.error(error);
      showToast("System Error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white/80 backdrop-blur-2xl border border-white/60 p-6 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl animate-slide-up relative overflow-hidden z-20">
      {/* --- BACK BUTTON --- */}
      <button
        onClick={onBack}
        className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary mb-8 transition-colors group"
      >
        <ChevronLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Calendar
      </button>

      {/* --- TITLE --- */}
      <h2 className="h2-core mb-8">Confirm Details</h2>

      {/* --- SUMMARY HEADER --- */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 mb-10 pb-8 border-b border-slate-200/50">
        <div>
          <p className="h4-label text-[10px] mb-0">Start</p>
          <p className="text-lg md:text-xl font-bold text-slate-900">
            {selectedDate?.toLocaleDateString()}
          </p>
        </div>

        <div className="hidden md:block w-px h-10 bg-slate-200" />

        <div>
          <p className="h4-label text-[10px] mb-0">Length</p>
          <p className="text-lg md:text-xl font-bold text-slate-900">
            {daysNeeded} Days
          </p>
        </div>

        {/* DISCOUNT BADGE */}
        {discount && (
          <div className="ml-auto bg-slate-900 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20">
            <Zap size={14} className="text-yellow-400 fill-yellow-400" />{" "}
            {discount} Off
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="group">
            <label className={styles.inputLabel}>Client Name</label>
            <input
              required
              name="clientName"
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder="Jane Doe"
            />
          </div>
          <div className="group">
            <label className={styles.inputLabel}>Email</label>
            <input
              required
              name="email"
              type="email"
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder="jane@example.com"
            />
          </div>
        </div>

        <div className="group">
          <label className={styles.inputLabel}>Book Title</label>
          <input
            required
            name="bookTitle"
            onChange={handleInputChange}
            className={styles.inputField}
            placeholder="The Great Novel"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="group">
            <label className={styles.inputLabel}>Client Type</label>
            <select
              required
              name="clientType"
              onChange={handleInputChange}
              className={styles.inputField}
            >
              <option value="">Select...</option>
              <option value="Indie">Indie Author</option>
              <option value="Publisher">Publisher</option>
              <option value="Narrator">Narrator</option>
            </select>
          </div>
          <div className="flex items-center h-full md:pt-6">
            <label className="flex items-center gap-4 cursor-pointer group/check">
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  name="isReturning"
                  onChange={handleInputChange}
                  className="hidden peer"
                />
                <div className="w-3 h-3 bg-primary rounded-[2px] opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover/check:text-slate-900">
                Returning?
              </span>
            </label>
          </div>
        </div>

        <div className="group">
          <label className={styles.inputLabel}>Narration Style</label>
          <select
            required
            name="style"
            onChange={handleInputChange}
            className={styles.inputField}
          >
            <option value="">Select...</option>
            <option value="Solo">Solo (Daniel)</option>
            <option value="Dual">Dual</option>
            <option value="Duet">Duet</option>
            <option value="Multicast">Multicast</option>
          </select>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="group">
            <label className={styles.inputLabel}>Genre</label>
            <select
              required
              name="genre"
              onChange={handleInputChange}
              className={styles.inputField}
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
            <label className={styles.inputLabel}>Notes</label>
            <textarea
              name="notes"
              onChange={handleInputChange}
              className={`${styles.inputField} h-32 resize-none leading-relaxed`}
              placeholder="Vibe check..."
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black uppercase tracking-widest py-6 rounded-2xl hover:bg-primary transition-all shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 text-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <ArrowRight size={20} /> Submit Booking Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
