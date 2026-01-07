"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Calendar as CalendarIcon,
  Ghost,
  Wand2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  Image as ImageIcon,
  UploadCloud,
  Clock,
  Archive,
  ListFilter,
  CheckSquare,
  Square,
  AlertTriangle,
  Link as LinkIcon,
  Calculator,
  UserCheck,
  Mail,
  FileText,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const WORDS_PER_PFH = 9300;
const WORDS_PER_DAY = 7000; // Daily recording capacity

// --- HELPER: Fixes "Day Behind" Error ---
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const str = String(dateString);
    const [year, month, day] = str.split("T")[0].split("-").map(Number);
    if (!year || !month || !day) return new Date(dateString);
    return new Date(year, month - 1, day);
  } catch (e) {
    console.error("Date error:", e);
    return new Date();
  }
};

// --- HELPER: Format Date to YYYY-MM-DD for Inputs ---
const formatDateForInput = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- HELPER: Format Numbers with Commas ---
const formatNumberWithCommas = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// --- HELPER: Clean Number String ---
const cleanNumber = (value) => {
  if (!value) return 0;
  return parseInt(String(value).replace(/,/g, ""), 10);
};

export default function SchedulerDashboard() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);

  // Modals
  const [modalMode, setModalMode] = useState(null); // 'add' or 'edit'
  const [modalOpen, setModalOpen] = useState(false);

  // Selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Multi-Select State
  const [selectedGhosts, setSelectedGhosts] = useState([]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  // Local Form Data
  const [formData, setFormData] = useState({
    type: "project",
    // Core Info
    title: "",
    client: "",
    client_type: "Direct",
    email: "",
    email_thread_link: "",
    is_returning: false,
    ref_number: "",
    // Production Stats
    word_count: 0,
    word_count_display: "",
    est_pfh: "0.0",
    est_days: 0,
    style: "Solo",
    genre: "Fiction",
    // Dates & Meta
    startDate: "",
    endDate: "",
    notes: "",
    reason: "Personal", // For blocks
    cover_image_url: "",
  });

  // Upload State
  const [uploading, setUploading] = useState(false);

  // Ghost Settings
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);

  // --- CUSTOM ALERT HANDLERS ---
  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  useEffect(() => {
    document.body.style.overflow =
      modalOpen || alertConfig.isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [modalOpen, alertConfig.isOpen]);

  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const [requests, bookouts] = await Promise.all([
        supabase
          .from("2_booking_requests")
          .select("*")
          .neq("status", "archived")
          .neq("status", "deleted")
          .neq("status", "postponed")
          .neq("status", "cinesonic"), // <--- THIS LINE EXCLUDES THEM FROM CALENDAR

        supabase
          .from("7_bookouts")
          .select("id, reason, type, start_date, end_date"),
      ]);

      const merged = [];

      if (requests.data) {
        requests.data.forEach((r) => {
          merged.push({
            ...r,
            id: r.id,
            title: r.book_title || r.client_name || "Project",
            start: parseLocalDate(r.start_date),
            end: parseLocalDate(r.end_date),
            type: "real",
            status: r.status,
            sourceTable: "2_booking_requests",
            startStr: r.start_date ? r.start_date.split("T")[0] : "",
            endStr: r.end_date ? r.end_date.split("T")[0] : "",
          });
        });
      }

      if (bookouts.data) {
        bookouts.data.forEach((b) => {
          merged.push({
            id: b.id,
            title: b.reason || "Block",
            start: parseLocalDate(b.start_date),
            end: parseLocalDate(b.end_date),
            type: b.type === "ghost" ? "ghost" : "personal",
            status: "blocked",
            sourceTable: "7_bookouts",
            startStr: b.start_date ? b.start_date.split("T")[0] : "",
            endStr: b.end_date ? b.end_date.split("T")[0] : "",
          });
        });
      }
      setItems(merged);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // =========================================================================
  // 2. FORM & MATH LOGIC
  // =========================================================================

  const handleWordCountChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    const numVal = parseInt(rawVal, 10) || 0;

    // Auto-Calculate Math
    const pfh = (numVal / WORDS_PER_PFH).toFixed(1);
    const days = Math.ceil(numVal / WORDS_PER_DAY);

    setFormData((prev) => ({
      ...prev,
      word_count_display: formatNumberWithCommas(rawVal),
      word_count: numVal,
      est_pfh: pfh,
      est_days: days,
    }));
  };

  const openAddModal = (date) => {
    setModalMode("add");
    setSelectedDate(date);
    const dateStr = formatDateForInput(date);

    setFormData({
      type: "project",
      title: "",
      client: "",
      client_type: "Direct",
      email: "",
      email_thread_link: "",
      is_returning: false,
      ref_number: "",
      word_count: 0,
      word_count_display: "",
      est_pfh: "0.0",
      est_days: 0,
      style: "Solo",
      genre: "Fiction",
      notes: "",
      reason: "Personal",
      startDate: dateStr,
      endDate: dateStr,
      cover_image_url: "",
    });
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleItemClick = (e, item) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingItem(item);

    if (item.type === "real") {
      const wc = item.word_count || 0;
      setFormData({
        type: "project",
        title: item.book_title || "",
        client: item.client_name || "",
        client_type: item.client_type || "Direct",
        email: item.email || "",
        email_thread_link: item.email_thread_link || "",
        is_returning: item.is_returning || false,
        ref_number: item.ref_number || "",

        // Math Re-Calc on Load
        word_count: wc,
        word_count_display: formatNumberWithCommas(wc),
        est_pfh: (wc / WORDS_PER_PFH).toFixed(1),
        est_days: Math.ceil(wc / WORDS_PER_DAY),

        style: item.narration_style || "Solo",
        genre: item.genre || "Fiction",
        notes: item.notes || "",
        reason: "Personal",
        startDate: item.startStr,
        endDate: item.endStr,
        cover_image_url: item.cover_image_url || "",
      });
    } else {
      setFormData({
        type: item.type === "ghost" ? "ghost" : "block",
        title: "",
        client: "",
        email: "",
        reason: item.title || "Personal",
        startDate: item.startStr,
        endDate: item.endStr,
        cover_image_url: "",
        // Defaults
        word_count: 0,
        word_count_display: "",
        est_pfh: "0.0",
        est_days: 0,
      });
    }
    setModalOpen(true);
  };

  // =========================================================================
  // 3. SAVE & UPLOAD LOGIC
  // =========================================================================

  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate) {
      return showAlert("Missing Dates", "Please select start and end dates.");
    }

    setLoading(true);
    let error = null;

    // Common Project Payload
    const projectPayload = {
      book_title: formData.title,
      client_name: formData.client || "Internal",
      email: formData.email,
      client_type: formData.client_type,
      narration_style: formData.style,
      genre: formData.genre,
      notes: formData.notes,
      start_date: formData.startDate,
      end_date: formData.endDate,
      word_count: formData.word_count,
      ref_number: formData.ref_number,
      email_thread_link: formData.email_thread_link,
      is_returning: formData.is_returning,
      cover_image_url: formData.cover_image_url,
      // If Estimating days, use the calculation, otherwise fallback to date diff
      days_needed: formData.est_days || 1,
    };

    if (modalMode === "add") {
      if (formData.type === "project") {
        if (!formData.title) {
          setLoading(false);
          return showAlert("Missing Title", "Project title is required.");
        }
        const { error: err } = await supabase
          .from("2_booking_requests")
          .insert([{ ...projectPayload, status: "approved" }]);
        error = err;
      } else {
        const { error: err } = await supabase.from("7_bookouts").insert([
          {
            reason: formData.reason,
            type: formData.type === "ghost" ? "ghost" : "personal",
            start_date: formData.startDate,
            end_date: formData.endDate,
          },
        ]);
        error = err;
      }
    } else {
      // EDIT MODE
      if (formData.type === "project" && editingItem.type === "real") {
        const { error: err } = await supabase
          .from("2_booking_requests")
          .update(projectPayload)
          .eq("id", editingItem.id);
        error = err;
      } else if (editingItem.type !== "real") {
        const { error: err } = await supabase
          .from("7_bookouts")
          .update({
            reason: formData.reason,
            start_date: formData.startDate,
            end_date: formData.endDate,
          })
          .eq("id", editingItem.id);
        error = err;
      }
    }

    setLoading(false);

    if (error) {
      console.error("Save error:", error);
      showAlert("Error", "Could not save changes.", "error");
    } else {
      setModalOpen(false);
      fetchCalendar();
    }
  };

  const handleImageUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      // Upload to 'admin' bucket
      const { error: uploadError } = await supabase.storage
        .from("admin")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("admin").getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, cover_image_url: data.publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      showAlert("Upload Failed", "Could not upload cover image.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!editingItem) return;
    const actionLabel =
      newStatus === "deleted" ? "permanently delete" : newStatus;

    showAlert(
      "Confirm Action",
      `Are you sure you want to ${actionLabel} this? This cannot be undone.`,
      "danger",
      async () => {
        setLoading(true);
        let error = null;

        if (editingItem.type === "real") {
          const { error: err } = await supabase
            .from("2_booking_requests")
            .delete()
            .eq("id", editingItem.id);
          error = err;
        } else {
          const { error: err } = await supabase
            .from("7_bookouts")
            .delete()
            .eq("id", editingItem.id);
          error = err;
        }

        setLoading(false);
        if (error) {
          showAlert("Error", "Action failed", "error");
        } else {
          setModalOpen(false);
          closeAlert();
          fetchCalendar();
        }
      }
    );
  };

  // --- GHOST LOGIC (UNCHANGED) ---
  const handleGhostMode = async () => {
    /* ... Keep existing ghost logic ... */
  };
  const toggleSelectGhost = (id) => {
    setSelectedGhosts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const toggleSelectAllGhosts = () => {
    /* ... Keep existing ... */
  };
  const handleDeleteSelectedGhosts = async () => {
    /* ... Keep existing ... */
  };

  // --- RENDER CALENDAR (UNCHANGED) ---
  const renderCalendarView = () => {
    /* ... Keep existing calendar logic ... */
  };

  return (
    <div className="bg-white p-4 md:px-12 md:py-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      {/* CUSTOM ALERT MODAL */}
      {alertConfig.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-up text-center border border-slate-100">
            <h3 className="text-xl font-black uppercase text-slate-900 mb-2">
              {alertConfig.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-8">
              {alertConfig.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeAlert}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold uppercase"
              >
                Cancel
              </button>
              {alertConfig.onConfirm && (
                <button
                  onClick={alertConfig.onConfirm}
                  className={`flex-1 py-3 rounded-xl font-bold uppercase text-white ${alertConfig.type === "danger" ? "bg-red-500" : "bg-blue-500"}`}
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- THE ULTIMATE MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white rounded-[2rem] p-6 md:p-8 max-w-3xl w-full shadow-2xl animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-1">
                  {modalMode === "add" ? "Manual Entry" : "Edit Project"}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {selectedDate?.toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Type Selector */}
            {modalMode === "add" && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  onClick={() => setFormData({ ...formData, type: "project" })}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type === "project" ? "bg-white shadow text-slate-900" : "text-slate-400"}`}
                >
                  Project
                </button>
                <button
                  onClick={() => setFormData({ ...formData, type: "block" })}
                  className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type === "block" ? "bg-white shadow text-slate-900" : "text-slate-400"}`}
                >
                  Block
                </button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* LEFT COL: Cover Image */}
              {formData.type === "project" && (
                <div className="w-full md:w-48 shrink-0">
                  <div className="aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200 group mx-auto md:mx-0">
                    {formData.cover_image_url ? (
                      <img
                        src={formData.cover_image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      {uploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <UploadCloud size={24} />
                      )}
                      <span className="text-[9px] font-bold uppercase mt-2">
                        {uploading ? "Uploading" : "Change"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* RIGHT COL: The Form */}
              <div className="flex-grow space-y-5">
                {/* 1. CORE INFO */}
                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                    Core Info
                  </h4>
                  {formData.type === "project" ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200"
                          placeholder="Book Title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                        <input
                          className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200"
                          placeholder="Author / Client"
                          value={formData.client}
                          onChange={(e) =>
                            setFormData({ ...formData, client: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                          value={formData.client_type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              client_type: e.target.value,
                            })
                          }
                        >
                          <option value="Direct">Direct Client</option>
                          <option value="Publisher">Publisher</option>
                          <option value="Roster">Roster</option>
                        </select>
                        <input
                          className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                          placeholder="Invoice Ref #"
                          value={formData.ref_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ref_number: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="relative">
                        <Mail
                          size={14}
                          className="absolute left-3 top-3.5 text-slate-400"
                        />
                        <input
                          className="w-full pl-9 bg-white p-3 rounded-xl text-xs font-medium border border-slate-200"
                          placeholder="Client Email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="relative">
                        <LinkIcon
                          size={14}
                          className="absolute left-3 top-3.5 text-slate-400"
                        />
                        <input
                          className="w-full pl-9 bg-white p-3 rounded-xl text-xs font-medium border border-slate-200 text-blue-600"
                          placeholder="Email Thread URL"
                          value={formData.email_thread_link}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email_thread_link: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* ADDED: Notes Field */}
                      <div className="relative">
                        <FileText
                          size={14}
                          className="absolute left-3 top-3.5 text-slate-400"
                        />
                        <textarea
                          className="w-full pl-9 bg-white p-3 rounded-xl text-xs font-medium border border-slate-200 resize-none h-20"
                          placeholder="Project notes, specs, or details..."
                          value={formData.notes}
                          onChange={(e) =>
                            setFormData({ ...formData, notes: e.target.value })
                          }
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={formData.is_returning}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_returning: e.target.checked,
                            })
                          }
                          className="accent-teal-500 w-4 h-4"
                        />
                        <span className="text-xs font-bold text-slate-500">
                          Returning Client?
                        </span>
                      </div>
                    </>
                  ) : (
                    <input
                      className="w-full bg-white p-3 rounded-xl text-sm font-bold border border-slate-200"
                      placeholder="Block Reason..."
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                    />
                  )}
                </div>

                {/* 2. PRODUCTION MATH (Only for Projects) */}
                {formData.type === "project" && (
                  <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      Production Math
                    </h4>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Word Count
                        </label>
                        <input
                          className="w-full bg-white p-3 rounded-xl text-sm font-black border border-slate-200"
                          placeholder="0"
                          value={formData.word_count_display}
                          onChange={handleWordCountChange}
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Est. PFH
                        </label>
                        <div className="text-sm font-black text-slate-700 flex items-center gap-1">
                          <Clock size={14} /> {formData.est_pfh}
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                          Est. Days
                        </label>
                        <div className="text-sm font-black text-slate-700 flex items-center gap-1">
                          <CalendarIcon size={14} /> {formData.est_days}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                        value={formData.style}
                        onChange={(e) =>
                          setFormData({ ...formData, style: e.target.value })
                        }
                      >
                        <option value="Solo">Solo</option>
                        <option value="Duet">Duet</option>
                        <option value="Dual">Dual</option>
                        <option value="Multicast">Multicast</option>
                      </select>
                      <input
                        className="w-full bg-white p-3 rounded-xl text-xs font-bold border border-slate-200"
                        placeholder="Genre"
                        value={formData.genre}
                        onChange={(e) =>
                          setFormData({ ...formData, genre: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* 3. DATES & SAVE */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="bg-slate-100 p-3 rounded-xl text-xs font-bold border-transparent"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="bg-slate-100 p-3 rounded-xl text-xs font-bold border-transparent"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-grow py-4 bg-slate-900 text-white rounded-xl font-black uppercase hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}{" "}
                    Save Project
                  </button>
                  {modalMode === "edit" && (
                    <button
                      onClick={() => handleStatusChange("deleted")}
                      className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN DASHBOARD (Calendar & Ghost) --- */}
      {/* ... (Kept the same as previous) ... */}
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900">
            Scheduler Ops
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Manage Availability
          </p>
        </div>
        <button
          onClick={fetchCalendar}
          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all self-start md:self-auto"
        >
          <RefreshCw
            size={20}
            className={calendarLoading ? "animate-spin" : ""}
          />
        </button>
      </div>

      <div className="flex p-1 bg-slate-50 rounded-2xl mb-8 border border-slate-100 overflow-x-auto w-full md:w-fit">
        {[
          { id: "calendar", label: "Calendar", icon: CalendarIcon },
          { id: "ghost", label: "Ghost Gen", icon: Ghost },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px] overflow-x-auto">
        {activeTab === "calendar" && (
          <div className="animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 text-emerald-700">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Booked
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 text-amber-700">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 text-purple-700">
                  <div className="w-2 h-2 rounded-full bg-purple-500" /> Ghost
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-400" /> Time Off
                </div>
              </div>
              <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                <button
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() - 1);
                    setCurrentDate(d);
                  }}
                  className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="w-32 text-center text-xs font-black uppercase text-slate-700">
                  {currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() + 1);
                    setCurrentDate(d);
                  }}
                  className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 select-none">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-black text-slate-400 py-2 uppercase tracking-wider"
                >
                  {d}
                </div>
              ))}

              {/* BLANKS & DAYS LOGIC HERE (Simulated for brevity, logic remains same as previous component) */}
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const firstDay = new Date(year, month, 1).getDay();
                const blanks = Array(firstDay).fill(null);
                const days = Array.from(
                  { length: daysInMonth },
                  (_, i) => i + 1
                );
                const today = new Date();

                return (
                  <>
                    {blanks.map((_, i) => (
                      <div
                        key={`b-${i}`}
                        className="h-20 md:h-32 bg-slate-50/30 rounded-xl border border-transparent"
                      />
                    ))}
                    {days.map((day, i) => {
                      const date = new Date(year, month, day);
                      const dateMid = new Date(date).setHours(0, 0, 0, 0);
                      const isToday =
                        date.toDateString() === today.toDateString();

                      const dayItems = items.filter((item) => {
                        if (!item.start || !item.end) return false;
                        const s = new Date(item.start).setHours(0, 0, 0, 0);
                        const e = new Date(item.end).setHours(0, 0, 0, 0);
                        return dateMid >= s && dateMid <= e;
                      });

                      return (
                        <div
                          key={i}
                          onClick={() => openAddModal(date)}
                          className={`h-24 md:h-32 border rounded-xl p-1 relative overflow-hidden group transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${isToday ? "bg-blue-50/50 border-blue-200" : "bg-white border-slate-100"}`}
                        >
                          <span
                            className={`text-[9px] md:text-[10px] font-bold absolute top-1 right-1 flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full ${isToday ? "bg-blue-500 text-white" : "text-slate-400"}`}
                          >
                            {day}
                          </span>
                          <div className="mt-5 md:mt-6 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] scrollbar-hide">
                            {dayItems.map((item, idx) => {
                              let color =
                                "bg-emerald-100 text-emerald-800 border-emerald-200";
                              if (item.status === "pending")
                                color =
                                  "bg-amber-100 text-amber-800 border-amber-200";
                              if (item.status === "postponed")
                                color =
                                  "bg-orange-100 text-orange-800 border-orange-200";
                              if (item.type === "ghost")
                                color =
                                  "bg-purple-100 text-purple-800 border-purple-200";
                              if (item.type === "personal")
                                color =
                                  "bg-slate-100 text-slate-700 border-slate-200";
                              return (
                                <button
                                  key={`${item.id}-${idx}`}
                                  onClick={(e) => handleItemClick(e, item)}
                                  className={`w-full text-left text-[8px] md:text-[9px] px-1 md:px-1.5 py-0.5 rounded-md border ${color} font-bold truncate flex items-center gap-1 hover:brightness-95`}
                                  title={item.title}
                                >
                                  {item.title}
                                </button>
                              );
                            })}
                          </div>
                          <div className="absolute top-1 left-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus
                              className="text-blue-500 bg-white rounded-full shadow-md p-0.5"
                              size={16}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "ghost" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 h-fit">
              <Ghost className="text-slate-300 mb-4" size={32} />
              <h3 className="text-slate-900 font-black uppercase text-lg mb-1">
                Generator Settings
              </h3>
              <p className="text-slate-400 text-xs mb-6 max-w-sm">
                Automatically fill gaps to appear busier. Ghost bookings are
                strictly visual.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">
                    Density
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {["low", "medium", "high"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setGhostDensity(d)}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${ghostDensity === d ? "bg-white shadow-sm text-purple-600" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-wider">
                    Lookahead
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setGhostMonths(m)}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase rounded-lg transition-all ${ghostMonths === m ? "bg-white shadow-sm text-purple-600" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/50">
                  <button
                    onClick={handleGhostMode}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl text-xs font-black uppercase hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    <Wand2 size={16} /> Generate Ghosts
                  </button>
                </div>
              </div>
            </div>

            {/* Ghost List (Kept same logic) */}
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[500px]">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <ListFilter size={18} />
                  </div>
                  <h3 className="text-slate-900 font-black uppercase text-lg">
                    Active Ghosts
                  </h3>
                </div>
                <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                  {items.filter((i) => i.type === "ghost").length}
                </span>
              </div>
              {renderGhostList()}
              {selectedGhosts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between animate-fade-in-up">
                  <span className="text-xs font-bold text-slate-400">
                    {selectedGhosts.length} items selected
                  </span>
                  <button
                    onClick={handleDeleteSelectedGhosts}
                    className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs font-black uppercase hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
