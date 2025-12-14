"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../../utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Filter,
  X,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  Ghost,
  Wand2,
  FileSpreadsheet,
  Copy,
  Check,
} from "lucide-react";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// CONFIG
const TIME_OFF_REASONS = [
  "Vacation",
  "Personal",
  "Travel",
  "Sick Day",
  "Admin Work",
  "Holidays",
];
const CLIENT_TYPES = ["Direct", "Roster", "Audition"];
const WORDS_PER_DAY = 6975;

export default function SchedulerAdmin() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // --- MODALS STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false); // Add Event Modal
  const [isGhostOpen, setIsGhostOpen] = useState(false); // Ghost Mode Modal
  const [isExcelOpen, setIsExcelOpen] = useState(false); // Excel Export Modal

  // Excel Data State
  const [excelData, setExcelData] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Add Event Inputs
  const [modalMode, setModalMode] = useState("time_off");
  const [selectedDate, setSelectedDate] = useState(null);

  // Ghost Mode Config
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);
  const [isGhosting, setIsGhosting] = useState(false);

  // Shared Inputs
  const [blockDays, setBlockDays] = useState(1);
  const [manualEndDate, setManualEndDate] = useState("");
  const [timeOffReason, setTimeOffReason] = useState("Vacation");

  // Manual Project Inputs
  const [manualForm, setManualForm] = useState({
    clientName: "",
    bookTitle: "",
    wordCount: "",
    email: "",
    clientType: "Direct",
  });

  // --- 1. FETCH DATA ---
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (data && !data.error) setBookings(data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // --- EXCEL EXPORT LOGIC ---
  const handleExcelExport = (b) => {
    // 1. Calculate Dates
    const start = new Date(b.start_date);
    const clientDue = new Date(b.end_date);

    // Inside Due Date = 3 Days before Client Due
    const insideDue = new Date(clientDue);
    insideDue.setDate(clientDue.getDate() - 3);

    // 2. Format Created At Timestamp
    const timestamp = new Date(b.created_at).toLocaleString("en-US");

    // 3. Clean Notes (Remove newlines so it doesn't break Excel rows)
    const cleanNotes = (b.notes || "").replace(/(\r\n|\n|\r)/gm, " ");

    // 4. Construct the TAB Separated String (Excel format)
    // Order: Timestamp | Client Name | Type | Returning | Email | Title | Genre | Words | Start | Inside Due | Client Due | Notes | Initial Email? | Discount
    const row = [
      timestamp,
      b.client_name,
      b.client_type || "Direct",
      b.is_returning ? "Yes" : "No",
      b.email,
      b.book_title,
      b.genre || "N/A",
      b.word_count,
      start.toLocaleDateString(),
      insideDue.toLocaleDateString(), // Inside Due
      clientDue.toLocaleDateString(), // Client Due
      cleanNotes,
      "No", // Initial Email Drafted? (Placeholder)
      b.discount_applied || "None",
    ].join("\t");

    setExcelData(row);
    setIsExcelOpen(true);
    setIsCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(excelData);
    setIsCopied(true);
    setTimeout(() => setIsExcelOpen(false), 1500); // Close after copy
  };

  // --- GHOST MODE LOGIC ---
  const generateGhostBookings = async () => {
    setIsGhosting(true);
    const newBookings = [];
    const today = new Date();
    const rangeEnd = new Date();
    rangeEnd.setMonth(today.getMonth() + parseInt(ghostMonths));

    let probability = 0.2;
    if (ghostDensity === "medium") probability = 0.4;
    if (ghostDensity === "high") probability = 0.6;

    let cursor = new Date(today);
    cursor.setDate(cursor.getDate() + ((1 + 7 - cursor.getDay()) % 7));

    while (cursor < rangeEnd) {
      if (Math.random() < probability) {
        const duration = Math.floor(Math.random() * 5) + 3;
        const start = new Date(cursor);
        const end = new Date(start);
        end.setDate(start.getDate() + duration);

        const isBlocked = bookings.some((b) => {
          const bStart = new Date(b.start_date);
          const bEnd = new Date(b.end_date);
          return start <= bEnd && end >= bStart;
        });

        if (!isBlocked) {
          newBookings.push({
            client_name: "Private Booking",
            email: "ghost@mock.com",
            book_title: "NDA Project",
            word_count: duration * WORDS_PER_DAY,
            days_needed: duration,
            start_date: start.toISOString(),
            end_date: end.toISOString(),
            status: "approved",
            narration_style: "Solo",
            client_type: "Publisher",
            discount_applied: "Ghost Mode",
          });
        }
      }
      cursor.setDate(cursor.getDate() + (7 + Math.floor(Math.random() * 7)));
    }

    if (newBookings.length > 0) {
      await supabase.from("bookings").insert(newBookings);
      await fetchBookings();
      setIsGhostOpen(false);
    }
    setIsGhosting(false);
  };

  // --- SYNC LOGIC ---
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split("T")[0];
  };

  const getDiffDays = (start, endStr) => {
    const s = new Date(start);
    const e = new Date(endStr);
    const diffTime = Math.abs(e - s);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    if (selectedDate) {
      const d = parseInt(blockDays) || 1;
      setManualEndDate(addDays(selectedDate, d));
    }
  }, [selectedDate]);

  const handleDaysChange = (val) => {
    const d = parseInt(val) || 1;
    setBlockDays(d);
    if (selectedDate) setManualEndDate(addDays(selectedDate, d));
  };

  const handleEndDateChange = (val) => {
    setManualEndDate(val);
    if (selectedDate && val) {
      const days = getDiffDays(selectedDate, val);
      setBlockDays(days || 1);
    }
  };

  const handleWordCountChange = (val) => {
    setManualForm({ ...manualForm, wordCount: val });
    const days = Math.ceil((parseInt(val) || 0) / WORDS_PER_DAY) || 1;
    setBlockDays(days);
    if (selectedDate) setManualEndDate(addDays(selectedDate, days));
  };

  // --- ACTIONS ---
  const updateStatus = async (id, newStatus) => {
    try {
      await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      fetchBookings();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteBooking = async (id) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/bookings?id=${id}`, { method: "DELETE" });
      fetchBookings();
    } catch (error) {
      console.error(error);
    }
  };

  // --- SUBMIT NEW ENTRY ---
  const handleSubmitNew = async () => {
    if (!selectedDate || !manualEndDate) return;

    const startDate = new Date(selectedDate);
    const endDate = new Date(manualEndDate);

    let payload = {};

    if (modalMode === "time_off") {
      payload = {
        client_name: "TIME OFF",
        email: "internal@danielnotdaylewis.com",
        book_title: timeOffReason,
        word_count: 0,
        days_needed: parseInt(blockDays),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "time_off",
        narration_style: "N/A",
      };
    } else {
      const status =
        manualForm.clientType === "Audition" ? "pending" : "approved";
      payload = {
        client_name: manualForm.clientName,
        email: manualForm.email || "manual@entry.com",
        book_title: manualForm.bookTitle,
        word_count: parseInt(manualForm.wordCount) || 0,
        days_needed: parseInt(blockDays),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: status,
        narration_style: "Solo",
        client_type: manualForm.clientType,
        discount_applied: "Manual",
      };
    }

    const { error } = await supabase.from("bookings").insert([payload]);

    if (!error) {
      fetchBookings();
      setIsModalOpen(false);
      resetModal();
    }
  };

  const resetModal = () => {
    setSelectedDate(null);
    setBlockDays(1);
    setManualEndDate("");
    setManualForm({
      clientName: "",
      bookTitle: "",
      wordCount: "",
      email: "",
      clientType: "Direct",
    });
  };

  // --- HELPERS ---
  const getDateStatus = (date) => {
    const time = date.getTime();
    const found = bookings.find((b) => {
      const start = new Date(b.start_date).setHours(0, 0, 0, 0);
      const end = new Date(b.end_date).setHours(0, 0, 0, 0);
      return time >= start && time <= end;
    });

    if (!found) return "free";
    if (found.status === "pending") return "pending";
    return "booked";
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "pending") return b.status === "pending";
    if (filter === "approved")
      return b.status === "approved" || b.status === "time_off";
    return true;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase text-slate-900 tracking-tighter mb-2">
              Mission Control
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your production timeline.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleLogout}
              className="p-4 rounded-full bg-slate-200 text-slate-500 hover:bg-red-500 hover:text-white transition-all font-bold text-xs uppercase"
              title="Sign Out"
            >
              Log Out
            </button>
            <button
              onClick={() => setIsGhostOpen(true)}
              className="flex items-center gap-3 bg-white text-slate-500 border border-slate-200 px-6 py-4 rounded-full font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-900 transition-all shadow-sm"
              title="Ghost Mode"
            >
              <Ghost size={20} />
            </button>
            <button
              onClick={() => {
                setModalMode("time_off");
                setIsModalOpen(true);
              }}
              className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-teal-600 hover:scale-105 transition-all shadow-xl"
            >
              <Plus size={20} /> Add Event
            </button>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {["all", "pending", "approved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-full font-bold uppercase text-xs tracking-widest border transition-all ${
                filter === f
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                  : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* --- BOOKING LIST --- */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-24 text-slate-400 animate-pulse flex flex-col items-center gap-4">
              <Clock size={40} className="animate-spin text-teal-500" />
              <span className="uppercase tracking-widest font-bold text-sm">
                Syncing...
              </span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <p className="text-slate-400 font-bold uppercase tracking-widest">
                No bookings found
              </p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div
                key={b.id}
                className="group bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center relative overflow-hidden"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-2 ${
                    b.status === "approved"
                      ? "bg-teal-500"
                      : b.status === "time_off"
                      ? "bg-slate-300"
                      : "bg-orange-400"
                  }`}
                />
                <div className="flex-shrink-0 w-full md:w-32 text-center md:text-left pl-4">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                    Start
                  </div>
                  <div className="text-2xl font-black text-slate-900 leading-none mb-1">
                    {new Date(b.start_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-xs font-bold text-slate-500 bg-slate-100 inline-block px-2 py-1 rounded-md">
                    {b.days_needed} Days
                  </div>
                </div>
                <div className="flex-grow space-y-1 pl-2 border-l border-slate-100 md:border-none md:pl-0">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-3">
                    {b.client_name === "TIME OFF" ? (
                      <span className="text-slate-400 italic flex items-center gap-2">
                        <Clock size={18} /> {b.book_title.toUpperCase()}
                      </span>
                    ) : (
                      b.book_title
                    )}
                    {b.status === "pending" && (
                      <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        Pending Review
                      </span>
                    )}
                    {b.discount_applied === "Ghost Mode" && (
                      <span className="bg-slate-100 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                        <Ghost size={10} /> Ghost
                      </span>
                    )}
                    {b.client_type && b.client_name !== "TIME OFF" && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          b.client_type === "Audition"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {b.client_type}
                      </span>
                    )}
                  </h3>
                  {b.client_name !== "TIME OFF" && (
                    <div className="text-sm text-slate-500 font-medium flex flex-wrap gap-2 items-center">
                      <span>{b.client_name}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-teal-600 font-bold">
                        {b.narration_style}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>{b.word_count?.toLocaleString()} words</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
                  {/* EXCEL EXPORT BUTTON */}
                  {b.client_name !== "TIME OFF" && (
                    <button
                      onClick={() => handleExcelExport(b)}
                      className="p-4 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                      title="Copy to Excel"
                    >
                      <FileSpreadsheet size={22} />
                    </button>
                  )}

                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, "approved")}
                        className="p-4 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white transition-all"
                      >
                        <CheckCircle size={22} />
                      </button>
                      <button
                        onClick={() => deleteBooking(b.id)}
                        className="p-4 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <XCircle size={22} />
                      </button>
                    </>
                  )}
                  {(b.status === "approved" || b.status === "time_off") && (
                    <button
                      onClick={() => deleteBooking(b.id)}
                      className="p-4 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- ADD EVENT MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="relative bg-white w-full max-w-7xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-scale-in">
              <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white z-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tight">
                    Add Event
                  </h2>
                  <p className="text-slate-500 text-sm">
                    Select dates and details below.
                  </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-full">
                  <button
                    onClick={() => setModalMode("time_off")}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                      modalMode === "time_off"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Time Off
                  </button>
                  <button
                    onClick={() => setModalMode("project")}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                      modalMode === "project"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Manual Project
                  </button>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="hidden md:block p-4 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthDate = new Date();
                    monthDate.setMonth(new Date().getMonth() + i);
                    monthDate.setDate(1);
                    const year = monthDate.getFullYear();
                    const month = monthDate.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const firstDay = new Date(year, month, 1).getDay();
                    const blanks = Array(firstDay).fill(null);
                    const days = Array.from(
                      { length: daysInMonth },
                      (_, d) => d + 1
                    );

                    return (
                      <div
                        key={i}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"
                      >
                        <h3 className="text-lg font-black uppercase text-slate-900 mb-4 text-center">
                          {monthDate.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                            <div
                              key={idx}
                              className="text-[10px] font-bold text-slate-300 mb-2"
                            >
                              {d}
                            </div>
                          ))}
                          {blanks.map((_, b) => (
                            <div key={`b-${b}`} />
                          ))}
                          {days.map((day) => {
                            const date = new Date(year, month, day);
                            const status = getDateStatus(date);
                            const isPast =
                              date < new Date().setHours(0, 0, 0, 0);
                            let bg = "hover:bg-slate-100 cursor-pointer";
                            let text = "text-slate-700 font-bold";
                            if (isPast) {
                              bg = "bg-transparent cursor-not-allowed";
                              text = "text-slate-200";
                            } else if (status === "booked") {
                              bg = "bg-red-50 cursor-not-allowed";
                              text = "text-red-300 line-through";
                            } else if (status === "pending") {
                              bg = "bg-orange-50 cursor-not-allowed";
                              text = "text-orange-300";
                            } else if (
                              selectedDate &&
                              date.getTime() === selectedDate.getTime()
                            ) {
                              bg = "bg-slate-900 shadow-lg scale-110 z-10";
                              text = "text-white";
                            }
                            return (
                              <div
                                key={day}
                                onClick={() => {
                                  if (!isPast && status === "free")
                                    setSelectedDate(date);
                                }}
                                className={`h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm transition-all ${bg} ${text}`}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-200 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                {selectedDate ? (
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-end animate-fade-in-up">
                    <div className="flex items-center gap-4 min-w-[150px]">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <CalendarIcon size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Start Date
                        </p>
                        <p className="text-xl font-black text-slate-900">
                          {selectedDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {modalMode === "time_off" ? (
                      <div className="flex flex-wrap gap-6 items-end w-full">
                        <div className="flex-grow">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Reason
                          </label>
                          <select
                            value={timeOffReason}
                            onChange={(e) => setTimeOffReason(e.target.value)}
                            className="w-full bg-slate-50 border-b-2 border-slate-200 p-2 font-bold text-lg outline-none focus:border-slate-900 transition-colors"
                          >
                            {TIME_OFF_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Days
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={blockDays}
                            onChange={(e) => handleDaysChange(e.target.value)}
                            className="w-24 bg-slate-50 border-b-2 border-slate-200 p-2 font-black text-xl text-center outline-none focus:border-slate-900"
                          />
                        </div>
                        <div className="flex items-end pb-2 text-slate-300">
                          <ArrowRight />
                        </div>
                        <div>
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={manualEndDate}
                            onChange={(e) =>
                              handleEndDateChange(e.target.value)
                            }
                            className="bg-slate-50 border-b-2 border-slate-200 p-2 font-bold text-lg outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-4 items-end w-full">
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Client Name
                          </label>
                          <input
                            placeholder="Name"
                            value={manualForm.clientName}
                            onChange={(e) =>
                              setManualForm({
                                ...manualForm,
                                clientName: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border-b-2 border-slate-200 p-2 font-bold outline-none focus:border-slate-900"
                          />
                        </div>
                        <div className="w-[140px]">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Type
                          </label>
                          <select
                            value={manualForm.clientType}
                            onChange={(e) =>
                              setManualForm({
                                ...manualForm,
                                clientType: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border-b-2 border-slate-200 p-2 font-bold outline-none focus:border-slate-900 cursor-pointer"
                          >
                            {CLIENT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-[100px]">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Words
                          </label>
                          <input
                            type="number"
                            placeholder="50k"
                            value={manualForm.wordCount}
                            onChange={(e) =>
                              handleWordCountChange(e.target.value)
                            }
                            className="w-full bg-slate-50 border-b-2 border-slate-200 p-2 font-bold outline-none focus:border-slate-900"
                          />
                        </div>
                        <div className="w-[80px]">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            Days
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={blockDays}
                            onChange={(e) => handleDaysChange(e.target.value)}
                            className="w-full bg-slate-50 border-b-2 border-slate-200 p-2 font-black text-center outline-none focus:border-slate-900"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={manualEndDate}
                            onChange={(e) =>
                              handleEndDateChange(e.target.value)
                            }
                            className="w-full bg-slate-50 border-b-2 border-slate-200 p-2 font-bold outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleSubmitNew}
                      className="bg-slate-900 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-teal-600 hover:scale-105 transition-all shadow-xl shrink-0"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 font-bold uppercase tracking-widest py-4">
                    Select a Start Date from the calendar above
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- GHOST MODE MODAL --- */}
        {isGhostOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
              onClick={() => setIsGhostOpen(false)}
            />
            <div className="relative bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl animate-scale-in text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                <Ghost size={40} />
              </div>
              <h2 className="text-3xl font-black uppercase text-slate-900 mb-2">
                Ghost Mode
              </h2>
              <p className="text-slate-500 mb-8">
                Generate mock "NDA Projects" to fill your schedule.
              </p>
              <div className="space-y-6 text-left">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
                    Density
                  </label>
                  <div className="flex gap-2">
                    {["low", "medium", "high"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setGhostDensity(d)}
                        className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs tracking-widest border-2 transition-all ${
                          ghostDensity === d
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-2">
                    Duration (Months Out)
                  </label>
                  <div className="flex gap-2">
                    {[3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setGhostMonths(m)}
                        className={`flex-1 py-3 rounded-xl font-bold uppercase text-xs tracking-widest border-2 transition-all ${
                          ghostMonths === m
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {m} Mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={generateGhostBookings}
                disabled={isGhosting}
                className="w-full mt-8 bg-teal-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-teal-400 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {isGhosting ? (
                  "Generating..."
                ) : (
                  <>
                    <Wand2 size={18} /> Populate Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- EXCEL EXPORT MODAL --- */}
        {isExcelOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
              onClick={() => setIsExcelOpen(false)}
            />
            <div className="relative bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl animate-scale-in text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                <FileSpreadsheet size={40} />
              </div>
              <h2 className="text-3xl font-black uppercase text-slate-900 mb-2">
                Export Data
              </h2>
              <p className="text-slate-500 mb-6">
                Ready to paste into your Excel tracking sheet.
              </p>

              <div className="bg-slate-100 p-4 rounded-xl text-left text-xs text-slate-500 font-mono mb-6 overflow-x-auto whitespace-pre">
                {excelData}
              </div>

              <button
                onClick={copyToClipboard}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 ${
                  isCopied
                    ? "bg-emerald-500 text-white scale-95"
                    : "bg-slate-900 text-white hover:bg-emerald-600"
                }`}
              >
                {isCopied ? (
                  <>
                    <Check size={20} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={20} /> Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
