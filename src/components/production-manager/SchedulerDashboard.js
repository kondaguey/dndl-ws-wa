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
  AlertTriangle,
  CheckCircle2,
  Plus,
  Briefcase,
  X,
  User,
  Mail,
  BookOpen,
  Mic2,
  Tags,
  FileText,
  Clock,
  Archive,
  Save,
  Ban,
  CalendarDays,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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

export default function SchedulerDashboard() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [addType, setAddType] = useState("project");

  // Form Data
  const [newItemData, setNewItemData] = useState({
    title: "",
    client: "",
    email: "",
    client_type: "Direct",
    is_returning: false,
    style: "Solo",
    genre: "Fiction",
    notes: "",
    duration: 1,
    reason: "Personal",
    startDate: "", // NEW
    endDate: "", // NEW
  });

  // Ghost Settings
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);

  // Alerts
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  const showAlert = (title, message, type = "info", onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };
  const closeModal = () => setModal({ ...modal, isOpen: false });

  // =========================================================================
  // 1. FETCH DATA
  // =========================================================================
  const fetchCalendar = async () => {
    setCalendarLoading(true);
    try {
      const [requests, bookouts] = await Promise.all([
        supabase
          .from("2_booking_requests")
          .select("id, client_name, book_title, start_date, end_date, status")
          .neq("status", "archived")
          .neq("status", "postponed"),
        supabase
          .from("8_bookouts")
          .select("id, reason, type, start_date, end_date"),
      ]);

      const merged = [];

      if (requests.data) {
        requests.data.forEach((r) => {
          merged.push({
            id: r.id,
            title: r.book_title || r.client_name || "Project",
            start: parseLocalDate(r.start_date),
            end: parseLocalDate(r.end_date),
            type: "real",
            status: r.status,
            sourceTable: "2_booking_requests",
            rawStart: r.start_date,
            rawEnd: r.end_date,
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
            sourceTable: "8_bookouts",
            rawStart: b.start_date,
            rawEnd: b.end_date,
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
  // 2. EDIT ACTIONS
  // =========================================================================
  const handleItemClick = (e, item) => {
    e.stopPropagation();
    const sStr = item.rawStart
      ? item.rawStart.split("T")[0]
      : new Date().toISOString().split("T")[0];
    const eStr = item.rawEnd
      ? item.rawEnd.split("T")[0]
      : new Date().toISOString().split("T")[0];

    setEditingItem({
      ...item,
      startStr: sStr,
      endStr: eStr,
    });
    setEditModalOpen(true);
  };

  const handleUpdateDates = async () => {
    setLoading(true);
    const { error } = await supabase
      .from(editingItem.sourceTable)
      .update({
        start_date: editingItem.startStr,
        end_date: editingItem.endStr,
      })
      .eq("id", editingItem.id);

    setLoading(false);
    if (error) {
      showAlert("Error", "Could not update dates.", "error");
    } else {
      setEditModalOpen(false);
      fetchCalendar();
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!editingItem) return;
    if (
      !window.confirm(
        `Are you sure you want to ${
          newStatus === "boot" ? "delete" : newStatus
        } this?`
      )
    )
      return;

    setLoading(true);
    let error = null;

    if (newStatus === "boot") {
      const { error: err } = await supabase
        .from(editingItem.sourceTable)
        .delete()
        .eq("id", editingItem.id);
      error = err;
    } else {
      if (editingItem.type === "real") {
        const { error: err } = await supabase
          .from("2_booking_requests")
          .update({ status: newStatus })
          .eq("id", editingItem.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("8_bookouts")
          .delete()
          .eq("id", editingItem.id);
        error = err;
      }
    }

    setLoading(false);
    if (error) {
      showAlert("Error", "Action failed", "error");
    } else {
      setEditModalOpen(false);
      fetchCalendar();
    }
  };

  // =========================================================================
  // 3. ADD LOGIC
  // =========================================================================
  const openAddModal = (date) => {
    setSelectedDate(date);
    const dateStr = formatDateForInput(date);

    setNewItemData({
      title: "",
      client: "",
      email: "",
      client_type: "Direct",
      is_returning: false,
      style: "Solo",
      genre: "Fiction",
      notes: "",
      duration: 1, // keeping for fallback/compat
      reason: "Personal",
      startDate: dateStr, // Initialize with clicked date
      endDate: dateStr, // Initialize with clicked date
    });
    setAddModalOpen(true);
  };

  const handleQuickAdd = async () => {
    if (!newItemData.startDate || !newItemData.endDate) {
      return alert("Please select start and end dates");
    }

    setLoading(true);

    // Calculate days duration for DB storage
    const start = new Date(newItemData.startDate);
    const end = new Date(newItemData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (addType === "project") {
      if (!newItemData.title) {
        setLoading(false);
        return alert("Title required");
      }
      await supabase.from("2_booking_requests").insert([
        {
          book_title: newItemData.title,
          client_name: newItemData.client || "Internal",
          email: newItemData.email,
          client_type: newItemData.client_type,
          narration_style: newItemData.style,
          genre: newItemData.genre,
          notes: newItemData.notes,
          start_date: newItemData.startDate, // Use form date directly
          end_date: newItemData.endDate, // Use form date directly
          status: "approved",
          days_needed: diffDays,
          word_count: 0,
        },
      ]);
    } else {
      await supabase.from("8_bookouts").insert([
        {
          reason: newItemData.reason,
          type: "personal",
          start_date: newItemData.startDate, // Use form date directly
          end_date: newItemData.endDate, // Use form date directly
        },
      ]);
    }

    setLoading(false);
    setAddModalOpen(false);
    fetchCalendar();
  };

  // =========================================================================
  // 4. GHOST MODE
  // =========================================================================
  const handleGhostMode = async () => {
    setLoading(true);
    const [real, blocks] = await Promise.all([
      supabase
        .from("2_booking_requests")
        .select("start_date, end_date")
        .neq("status", "archived")
        .neq("status", "postponed"),
      supabase.from("8_bookouts").select("start_date, end_date"),
    ]);

    let busyRanges = [];
    if (real.data)
      busyRanges = [
        ...busyRanges,
        ...real.data.map((r) => ({
          start: new Date(r.start_date),
          end: new Date(r.end_date),
        })),
      ];
    if (blocks.data)
      busyRanges = [
        ...busyRanges,
        ...blocks.data.map((r) => ({
          start: new Date(r.start_date),
          end: new Date(r.end_date),
        })),
      ];
    busyRanges.sort((a, b) => a.start - b.start);

    const newGhosts = [];
    const today = new Date();
    const rangeEnd = new Date();
    rangeEnd.setMonth(today.getMonth() + parseInt(ghostMonths));

    let gapTolerance =
      ghostDensity === "high" ? 2 : ghostDensity === "medium" ? 4 : 7;
    let cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor < rangeEnd) {
      const conflict = busyRanges.find(
        (r) => cursor >= r.start && cursor <= r.end
      );
      if (conflict) {
        cursor = new Date(conflict.end);
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      const nextBooking = busyRanges.find((r) => r.start > cursor);
      const nextStart = nextBooking ? nextBooking.start : rangeEnd;
      const daysFree = Math.floor((nextStart - cursor) / (1000 * 60 * 60 * 24));

      if (daysFree >= 3) {
        const maxDuration = Math.min(daysFree, 10);
        const duration = Math.floor(Math.random() * (maxDuration - 3 + 1)) + 3;
        if (Math.random() > (ghostDensity === "low" ? 0.6 : 0.1)) {
          const start = new Date(cursor);
          const end = new Date(start);
          end.setDate(start.getDate() + duration);
          newGhosts.push({
            reason: "Ghost Mode",
            type: "ghost",
            start_date: start.toISOString(),
            end_date: end.toISOString(),
          });
          cursor = new Date(end);
        }
      }
      cursor.setDate(cursor.getDate() + gapTolerance);
    }

    if (newGhosts.length > 0)
      await supabase.from("8_bookouts").insert(newGhosts);
    setLoading(false);
    fetchCalendar();
  };

  // =========================================================================
  // 5. RENDERERS
  // =========================================================================
  const renderCalendarView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const today = new Date();

    const changeMonth = (offset) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + offset);
      setCurrentDate(d);
    };

    return (
      <div className="md:px-20 animate-fade-in relative">
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
            {/* ADDED BACK: Time Off Legend */}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-slate-500">
              <div className="w-2 h-2 rounded-full bg-slate-400" /> Time Off
            </div>
          </div>
          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="w-28 text-center text-xs font-black uppercase text-slate-700">
              {currentDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 select-none">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={i}
              className="text-center text-[10px] font-black text-slate-300 py-2 uppercase"
            >
              {d}
            </div>
          ))}
          {blanks.map((_, i) => (
            <div
              key={`b-${i}`}
              className="h-16 md:h-24 bg-slate-50/30 rounded-lg border border-transparent"
            />
          ))}

          {days.map((day, i) => {
            const date = new Date(year, month, day);
            const dateMid = new Date(date).setHours(0, 0, 0, 0);
            const isToday = date.toDateString() === today.toDateString();

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
                className={`h-16 md:h-24 border rounded-xl p-1 relative overflow-hidden group transition-all cursor-pointer hover:border-blue-300 hover:shadow-md ${
                  isToday
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-white border-slate-100"
                }`}
              >
                <span
                  className={`text-[10px] font-bold absolute top-1 right-2 flex items-center justify-center w-5 h-5 rounded-full ${
                    isToday ? "bg-blue-500 text-white" : "text-slate-300"
                  }`}
                >
                  {day}
                </span>
                <div className="mt-5 space-y-1 overflow-y-auto max-h-[50px] md:max-h-[70px] scrollbar-hide">
                  {dayItems.map((item, idx) => {
                    let color =
                      "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (item.status === "pending")
                      color = "bg-amber-50 text-amber-700 border-amber-100";
                    if (item.status === "postponed")
                      color = "bg-orange-50 text-orange-700 border-orange-100";
                    if (item.type === "ghost")
                      color = "bg-purple-50 text-purple-700 border-purple-100";
                    if (item.type === "personal")
                      color = "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={(e) => handleItemClick(e, item)}
                        className={`w-full text-left text-[8px] md:text-[9px] px-1 py-0.5 rounded-md border ${color} font-bold truncate flex items-center gap-1 hover:opacity-75`}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Plus
                    className="text-slate-300 bg-white rounded-full shadow-sm p-1"
                    size={24}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGhostMode = () => (
    <div className="max-w-xl mx-auto py-8 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2 relative z-10">
          <Ghost className="text-teal-400" /> Smart Ghost Generator
        </h3>
        <p className="text-slate-400 text-sm mb-8 relative z-10">
          Automatically finds gaps and fills them with fake "NDA Projects".
        </p>
        <div className="space-y-6 relative z-10">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
              Density
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl">
              {["low", "medium", "high"].map((d) => (
                <button
                  key={d}
                  onClick={() => setGhostDensity(d)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    ghostDensity === d
                      ? "bg-teal-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 block">
              Lookahead
            </label>
            <div className="flex bg-white/5 p-1 rounded-xl">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setGhostMonths(m)}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    ghostMonths === m
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m} Mo
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGhostMode}
            disabled={loading}
            className="w-full py-4 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-teal-400 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Wand2 size={18} /> Populate Ghosts
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative">
      {/* EDIT MODAL */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setEditModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-scale-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  {editingItem.type === "real" ? "Project" : "Blocked Time"}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {editingItem.title}
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
              <div className="flex items-center gap-2 mb-4 text-slate-400 text-[10px] font-black uppercase">
                <CalendarDays size={14} /> Change Dates
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                    Start
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold"
                    value={editingItem.startStr}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        startStr: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                    End
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white p-2 rounded-xl text-xs font-bold"
                    value={editingItem.endStr}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, endStr: e.target.value })
                    }
                  />
                </div>
              </div>
              <button
                onClick={handleUpdateDates}
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase hover:border-emerald-500 hover:text-emerald-600 flex items-center justify-center gap-2"
              >
                <Save size={14} /> Update Dates
              </button>
            </div>

            {editingItem.type === "real" ? (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleStatusChange("postponed")}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-500 hover:text-white"
                >
                  <Clock size={18} />
                  <span className="text-[9px] font-bold uppercase">
                    Postpone
                  </span>
                </button>
                <button
                  onClick={() => handleStatusChange("archived")}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-500 hover:text-white"
                >
                  <Archive size={18} />
                  <span className="text-[9px] font-bold uppercase">
                    Archive
                  </span>
                </button>
                <button
                  onClick={() => handleStatusChange("boot")}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white"
                >
                  <Ban size={18} />
                  <span className="text-[9px] font-bold uppercase">Boot</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStatusChange("boot")}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white"
              >
                <Trash2 size={16} />{" "}
                <span className="text-xs font-black uppercase">
                  Delete Block
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-900 mb-1">
                  Add to Schedule
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-2 bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  onClick={() => setAddType("project")}
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    addType === "project"
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Project
                </button>
                <button
                  onClick={() => setAddType("block")}
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    addType === "block"
                      ? "bg-white shadow-sm text-slate-900"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Block
                </button>
              </div>

              {/* DATE RANGE SELECTOR (For Both Types) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200"
                    value={newItemData.startDate}
                    onChange={(e) =>
                      setNewItemData({
                        ...newItemData,
                        startDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold border border-slate-200"
                    value={newItemData.endDate}
                    onChange={(e) =>
                      setNewItemData({
                        ...newItemData,
                        endDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {addType === "project" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Title
                      </label>
                      <input
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                        value={newItemData.title}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            title: e.target.value,
                          })
                        }
                        placeholder="Book Title..."
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Client
                      </label>
                      <input
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                        value={newItemData.client}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            client: e.target.value,
                          })
                        }
                        placeholder="Author Name..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      Email
                    </label>
                    <input
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                      value={newItemData.email}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          email: e.target.value,
                        })
                      }
                      placeholder="client@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Type
                      </label>
                      <select
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                        value={newItemData.client_type}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            client_type: e.target.value,
                          })
                        }
                      >
                        <option>Direct</option>
                        <option>Publisher</option>
                        <option>Roster</option>
                        <option>Audition</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Genre
                      </label>
                      <select
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                        value={newItemData.genre}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            genre: e.target.value,
                          })
                        }
                      >
                        <option>Fiction</option>
                        <option>Non-Fic</option>
                        <option>Sci-Fi</option>
                        <option>Romance</option>
                        <option>Thriller</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Style
                      </label>
                      <select
                        className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                        value={newItemData.style}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            style: e.target.value,
                          })
                        }
                      >
                        <option>Solo</option>
                        <option>Dual</option>
                        <option>Duet</option>
                        <option>Multicast</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      Notes
                    </label>
                    <textarea
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-medium resize-none h-20"
                      value={newItemData.notes}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Project details..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      Reason
                    </label>
                    <select
                      className="w-full bg-slate-50 p-3 rounded-xl text-sm font-bold"
                      value={newItemData.reason}
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          reason: e.target.value,
                        })
                      }
                    >
                      <option>Vacation</option>
                      <option>Personal</option>
                      <option>Travel</option>
                      <option>Admin Work</option>
                    </select>
                  </div>
                </>
              )}

              <button
                onClick={handleQuickAdd}
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}{" "}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-slate-900">
            Scheduler Ops
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Manage Availability
          </p>
        </div>
        <button
          onClick={fetchCalendar}
          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100"
        >
          <RefreshCw
            size={20}
            className={calendarLoading ? "animate-spin" : ""}
          />
        </button>
      </div>
      <div className="flex p-1 bg-slate-50 rounded-2xl mb-8 border border-slate-100 overflow-x-auto">
        {[
          { id: "calendar", label: "Calendar", icon: CalendarIcon },
          { id: "ghost", label: "Ghost Gen", icon: Ghost },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-xs font-black uppercase ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "calendar" && renderCalendarView()}
        {activeTab === "ghost" && renderGhostMode()}
      </div>
    </div>
  );
}
