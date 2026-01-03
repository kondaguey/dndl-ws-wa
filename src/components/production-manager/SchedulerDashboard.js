"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Calendar,
  Ghost,
  ShieldBan,
  Wand2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  AlertTriangle,
  MousePointer2,
  CheckCircle2,
  X,
  BookOpen,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SchedulerDashboard() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Calendar Data
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState([]);

  // Range Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  // Forms
  const [timeOffStart, setTimeOffStart] = useState("");
  const [timeOffEnd, setTimeOffEnd] = useState("");
  const [reason, setReason] = useState("Vacation");
  const [ghostDensity, setGhostDensity] = useState("low");
  const [ghostMonths, setGhostMonths] = useState(3);

  // Custom Modal State
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

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // =========================================================================
  // 1. DATA FETCHING (UPDATED TO PULL BOOK TITLES)
  // =========================================================================
  const fetchCalendar = async () => {
    setCalendarLoading(true);

    // 1. Fetch Real Requests (Added book_title)
    const { data: real } = await supabase
      .from("2_booking_requests")
      .select("id, client_name, book_title, start_date, end_date, status"); // <--- Added book_title

    // 2. Fetch Blocks
    const { data: blocks } = await supabase
      .from("9_bookouts")
      .select("id, reason, type, start_date, end_date");

    const merged = [];

    // Map Real Projects
    if (real) {
      real.forEach((r) => {
        if (r.status === "archived") return;

        merged.push({
          id: r.id,
          // SHOW BOOK TITLE (Fallback to Client Name)
          title: r.book_title || r.client_name || "Project",
          start: new Date(r.start_date),
          end: new Date(r.end_date),
          type: "real",
          status: r.status,
          sourceTable: "2_booking_requests",
        });
      });
    }

    // Map Blocks
    if (blocks) {
      blocks.forEach((b) => {
        merged.push({
          id: b.id,
          title: b.reason || "Block",
          start: new Date(b.start_date),
          end: new Date(b.end_date),
          type: b.type === "ghost" ? "ghost" : "personal",
          status: "blocked",
          sourceTable: "9_bookouts",
        });
      });
    }

    setItems(merged);
    setCalendarLoading(false);
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // =========================================================================
  // 2. ACTIONS (TIME OFF)
  // =========================================================================
  const handleTimeOff = async () => {
    if (!timeOffStart || !timeOffEnd)
      return showAlert(
        "Missing Dates",
        "Please select a start and end date.",
        "error"
      );

    setLoading(true);

    const start = new Date(timeOffStart);
    const end = new Date(timeOffEnd);

    const overlaps = items.filter((i) => {
      const iStart = new Date(i.start);
      const iEnd = new Date(i.end);
      return start <= iEnd && end >= iStart;
    });

    if (overlaps.length > 0) {
      setLoading(false);
      showAlert(
        "Conflict Detected",
        `You have ${overlaps.length} existing items in this range. Overwrite them?`,
        "confirm",
        async () => {
          for (const item of overlaps) {
            await supabase.from(item.sourceTable).delete().eq("id", item.id);
          }
          await executeTimeOffInsert();
        }
      );
      return;
    }

    await executeTimeOffInsert();
  };

  const executeTimeOffInsert = async () => {
    setLoading(true);
    const { error } = await supabase.from("9_bookouts").insert([
      {
        reason,
        type: "personal",
        start_date: new Date(timeOffStart).toISOString(),
        end_date: new Date(timeOffEnd).toISOString(),
      },
    ]);

    setLoading(false);
    if (error) showAlert("Error", "Failed to save time off.", "error");
    else {
      showAlert("Success", "Time off blocked successfully.");
      setTimeOffStart("");
      setTimeOffEnd("");
      fetchCalendar();
      setActiveTab("calendar");
      closeModal();
    }
  };

  // =========================================================================
  // 3. GHOST MODE (SMART)
  // =========================================================================
  const handleGhostMode = async () => {
    setLoading(true);

    const { data: real } = await supabase
      .from("2_booking_requests")
      .select("start_date, end_date")
      .neq("status", "archived");
    const { data: blocks } = await supabase
      .from("9_bookouts")
      .select("start_date, end_date");

    let busyRanges = [];
    if (real)
      busyRanges = [
        ...busyRanges,
        ...real.map((r) => ({
          start: new Date(r.start_date),
          end: new Date(r.end_date),
        })),
      ];
    if (blocks)
      busyRanges = [
        ...busyRanges,
        ...blocks.map((r) => ({
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
        const skipChance =
          ghostDensity === "low" ? 0.6 : ghostDensity === "medium" ? 0.3 : 0.1;

        if (Math.random() > skipChance) {
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
      cursor.setDate(
        cursor.getDate() + gapTolerance + Math.floor(Math.random() * 3)
      );
    }

    if (newGhosts.length > 0) {
      const { error } = await supabase.from("9_bookouts").insert(newGhosts);
      setLoading(false);
      if (!error) {
        showAlert(
          "Ghost Mode Active",
          `Generated ${newGhosts.length} ghost blocks.`
        );
        fetchCalendar();
        setActiveTab("calendar");
      } else {
        showAlert("Error", "Database error.", "error");
      }
    } else {
      setLoading(false);
      showAlert("Schedule Full", "No suitable gaps found for new ghosts.");
    }
  };

  // =========================================================================
  // 4. RANGE SELECTION & DELETION
  // =========================================================================
  const handleDayClick = (date) => {
    if (!isSelectionMode) return;
    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(date);
      setSelectionEnd(null);
    } else {
      if (date < selectionStart) {
        setSelectionEnd(selectionStart);
        setSelectionStart(date);
      } else {
        setSelectionEnd(date);
      }
    }
  };

  const handleBulkDelete = () => {
    if (!selectionStart || !selectionEnd) return;
    const toDelete = items.filter((i) => {
      const iStart = new Date(i.start).setHours(0, 0, 0, 0);
      const iEnd = new Date(i.end).setHours(0, 0, 0, 0);
      const rStart = selectionStart.setHours(0, 0, 0, 0);
      const rEnd = selectionEnd.setHours(0, 0, 0, 0);
      return iStart <= rEnd && iEnd >= rStart;
    });

    if (toDelete.length === 0)
      return showAlert("Empty Range", "No items found in selected range.");

    showAlert(
      "Bulk Delete",
      `Found ${toDelete.length} items. Delete them all?`,
      "confirm",
      async () => {
        let count = 0;
        for (const item of toDelete) {
          await supabase.from(item.sourceTable).delete().eq("id", item.id);
          count++;
        }
        fetchCalendar();
        closeModal();
        resetSelection();
        setTimeout(() => showAlert("Deleted", `Deleted ${count} blocks.`), 300);
      }
    );
  };

  const resetSelection = () => {
    setIsSelectionMode(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const deleteSingleItem = (id, table, title) => {
    showAlert(
      "Delete Item",
      `Delete "${title}"? This will open up the dates.`,
      "confirm",
      async () => {
        await supabase.from(table).delete().eq("id", id);
        fetchCalendar();
        closeModal();
      }
    );
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

    const changeMonth = (offset) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + offset);
      setCurrentDate(d);
    };

    return (
      <div className="animate-fade-in relative">
        {/* Bulk Delete Toolbar */}
        {isSelectionMode && (
          <div className="absolute top-16 left-0 right-0 z-20 bg-white border border-slate-200 p-4 rounded-xl shadow-2xl flex items-center justify-between animate-slide-up">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-900">
              {selectionStart
                ? selectionEnd
                  ? "Range Selected"
                  : "Select End Date"
                : "Select Start Date"}
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetSelection}
                className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200"
              >
                Cancel
              </button>
              {selectionStart && selectionEnd && (
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-600 shadow-sm"
                >
                  <Trash2 size={12} /> Delete Range
                </button>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`p-2 rounded-lg border transition-all ${
                isSelectionMode
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
              title="Range Select Mode"
            >
              <MousePointer2 size={18} />
            </button>

            <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-all"
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
                className="p-2 hover:bg-white rounded-lg text-slate-500 shadow-sm transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
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
            date.setHours(0, 0, 0, 0);

            let isSelected = false;
            if (isSelectionMode && selectionStart) {
              const s = selectionStart.getTime();
              const e = selectionEnd ? selectionEnd.getTime() : s;
              const d = date.getTime();
              if (d >= Math.min(s, e) && d <= Math.max(s, e)) isSelected = true;
            }

            const dayItems = items.filter((i) => {
              const s = new Date(i.start).setHours(0, 0, 0, 0);
              const e = new Date(i.end).setHours(0, 0, 0, 0);
              return date >= s && date <= e;
            });

            return (
              <div
                key={i}
                onClick={() => handleDayClick(date)}
                className={`h-16 md:h-24 border rounded-xl p-1 relative overflow-hidden group transition-all cursor-pointer
                    ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                        : "bg-white border-slate-100 hover:border-blue-200"
                    }
                `}
              >
                <span
                  className={`text-[10px] font-bold absolute top-1 right-2 ${
                    isSelected ? "text-indigo-500" : "text-slate-300"
                  }`}
                >
                  {day}
                </span>

                <div className="mt-4 space-y-1 overflow-y-auto max-h-[60px] md:max-h-[80px] scrollbar-hide">
                  {dayItems.map((item, idx) => {
                    let color =
                      "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (item.status === "pending")
                      color = "bg-amber-50 text-amber-700 border-amber-100";
                    if (item.type === "ghost")
                      color = "bg-purple-50 text-purple-700 border-purple-100";
                    if (item.type === "personal")
                      color = "bg-slate-100 text-slate-600 border-slate-200";

                    return (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSingleItem(
                            item.id,
                            item.sourceTable,
                            item.title
                          );
                        }}
                        className={`w-full text-left text-[8px] md:text-[9px] px-1 py-0.5 rounded-md border ${color} font-bold truncate flex items-center gap-1 hover:opacity-75`}
                        title={item.title}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- RENDER FORMS ---
  const renderTimeOff = () => (
    <div className="max-w-xl mx-auto py-8 animate-fade-in">
      <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
        <h3 className="text-xl font-black uppercase text-slate-900 mb-6 flex items-center gap-2">
          <ShieldBan className="text-slate-400" /> Block Dates
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Reason
            </label>
            <select
              className="w-full bg-white p-4 rounded-xl font-bold text-slate-700 outline-none border border-slate-200"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option>Vacation</option>
              <option>Personal</option>
              <option>Travel</option>
              <option>Sick Day</option>
              <option>Admin Work</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Start
              </label>
              <input
                type="date"
                className="w-full bg-white p-4 rounded-xl font-bold text-slate-700 border border-slate-200"
                value={timeOffStart}
                onChange={(e) => setTimeOffStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                End
              </label>
              <input
                type="date"
                className="w-full bg-white p-4 rounded-xl font-bold text-slate-700 border border-slate-200"
                value={timeOffEnd}
                onChange={(e) => setTimeOffEnd(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleTimeOff}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Block Dates"}
          </button>
        </div>
      </div>
    </div>
  );

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
      {/* --- CLEAN MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-white/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-up border border-slate-100 ring-1 ring-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  modal.type === "error"
                    ? "bg-red-50 text-red-500"
                    : modal.type === "confirm"
                    ? "bg-indigo-50 text-indigo-500"
                    : "bg-teal-50 text-teal-500"
                }`}
              >
                {modal.type === "error" ? (
                  <AlertTriangle />
                ) : modal.type === "confirm" ? (
                  <ShieldBan />
                ) : (
                  <CheckCircle2 />
                )}
              </div>
              <h3 className="text-lg font-black uppercase text-slate-900">
                {modal.title}
              </h3>
            </div>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {modal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-slate-50 rounded-xl text-slate-500 font-bold uppercase text-xs hover:bg-slate-100 transition-colors"
              >
                {modal.type === "confirm" ? "Cancel" : "Close"}
              </button>
              {modal.type === "confirm" && (
                <button
                  onClick={modal.onConfirm}
                  className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs hover:bg-indigo-600 transition-colors"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
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
          className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors w-fit"
        >
          <RefreshCw
            size={20}
            className={calendarLoading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-slate-50 rounded-2xl mb-8 border border-slate-100 overflow-x-auto">
        {[
          { id: "calendar", label: "Calendar", icon: Calendar },
          { id: "timeoff", label: "Block Dates", icon: ShieldBan },
          { id: "ghost", label: "Ghost Gen", icon: Ghost },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === "calendar" && renderCalendarView()}
        {activeTab === "timeoff" && renderTimeOff()}
        {activeTab === "ghost" && renderGhostMode()}
      </div>
    </div>
  );
}
