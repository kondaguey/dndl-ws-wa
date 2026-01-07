"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  Save,
  X,
  User,
  BookOpen,
  Clock,
  Mic,
  AlertTriangle,
  PauseCircle,
  CheckCircle2,
  Search,
  LayoutDashboard,
  FileText,
  ListTodo,
  StickyNote,
  Activity,
  Check,
  RefreshCw,
  XCircle,
  Trash2,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ArrowLeftCircle,
  Archive,
  Ban,
  Timer,
  CalendarDays,
  Skull,
  ArrowLeft,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- 1. CONFIGURATION ---

const WORDS_PER_FH = 9300;
const BIZ_DAYS_TO_FIX = 2; // Contractual obligation
const DEFAULT_POZOTRON_RATE = 14;
const DEFAULT_PFH_RATE = 250;

const STATUS_MAP = {
  pre_production: {
    label: "Text Prep",
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: FileText,
  },
  recording: {
    label: "Recording",
    color: "bg-red-50 text-red-600 border-red-200 animate-pulse",
    icon: Mic,
  },
  editing: {
    label: "Editing",
    color: "bg-orange-50 text-orange-600 border-orange-200",
    icon: Activity,
  },
  review: {
    label: "CRX Review",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: Clock,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Clock,
  },
  postponed: {
    label: "Postponed",
    color: "bg-pink-50 text-pink-600 border-pink-200",
    icon: Ban,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-slate-100 text-slate-500 border-slate-300",
    icon: PauseCircle,
  },
  done: {
    label: "Complete",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: CheckCircle2,
  },
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "work_log", label: "Work Log", icon: Timer },
  { id: "crx", label: "CRX Matrix", icon: CalendarDays },
  { id: "bible", label: "Bible", icon: BookOpen },
  { id: "tasks", label: "Checklists", icon: ListTodo },
  { id: "notes", label: "Notes", icon: StickyNote },
];

// --- 2. UTILS ---

const addBusinessDays = (startDate, daysToAdd) => {
  if (!startDate) return null;
  let currentDate = new Date(startDate);
  currentDate = new Date(
    currentDate.valueOf() + currentDate.getTimezoneOffset() * 60000
  );
  let added = 0;
  while (added < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return currentDate.toISOString().split("T")[0];
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const fixedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
  return fixedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    val || 0
  );

// --- 3. SUB-COMPONENTS ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform animate-in slide-in-from-bottom-5`}
    >
      <div
        className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${
          type === "error"
            ? "bg-red-50/95 border-red-200 text-red-600"
            : "bg-slate-900/95 border-slate-800 text-white"
        }`}
      >
        {type === "error" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText,
  type = "neutral",
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-black uppercase text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase text-white shadow-lg ${type === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN COMPONENT ---

export default function ProductionBoard() {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modal, setModal] = useState({ isOpen: false });

  // Local state for adding a new log entry
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    duration_hrs: "",
    activity: "Recording",
  });

  const globalTaxRate = 25;

  // --- ACTIONS ---
  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const fetchItems = async () => {
    setLoading(true);

    const { data: prodData, error } = await supabase
      .from("4_production")
      .select(
        `*, request:2_booking_requests!inner (id, book_title, client_name, client_type, cover_image_url, word_count, status, email, ref_number)`
      )
      .neq("request.status", "deleted")
      .neq("request.status", "archived")
      .order("recording_due_date", { ascending: true });

    if (error) {
      console.error(error);
      showToast("Sync Error", "error");
    } else {
      const { data: logData } = await supabase
        .from("10_session_logs")
        .select("*");
      setLogs(logData || []);

      const unique = (prodData || []).map((i) => ({
        ...i,
        crx_batches: Array.isArray(i.crx_batches) ? i.crx_batches : [],
        characters: Array.isArray(i.characters) ? i.characters : [],
        checklist:
          Array.isArray(i.checklist) && i.checklist.length > 0
            ? i.checklist
            : [{ id: 1, label: "Script Pre-read", checked: false }],
        other_expenses: Array.isArray(i.other_expenses) ? i.other_expenses : [],
        pfh_rate: i.pfh_rate || DEFAULT_PFH_RATE,
        pozotron_rate: i.pozotron_rate || DEFAULT_POZOTRON_RATE,
        internal_notes: i.internal_notes || "",
        strikes: i.strikes || 0,
      }));
      setItems(unique);

      // Restore selection logic is handled in render for mobile now
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- SYNC FORM ON SELECTION CHANGE ---
  useEffect(() => {
    if (selectedId) {
      const item = items.find((i) => i.id === selectedId);
      if (item) {
        setEditForm({
          ...item,
          characters: JSON.parse(JSON.stringify(item.characters || [])),
          crx_batches: JSON.parse(JSON.stringify(item.crx_batches || [])),
          checklist: JSON.parse(JSON.stringify(item.checklist || [])),
          other_expenses: JSON.parse(JSON.stringify(item.other_expenses || [])),
          pfh_rate: item.pfh_rate || DEFAULT_PFH_RATE,
          pozotron_rate: item.pozotron_rate || DEFAULT_POZOTRON_RATE,
        });
      }
    }
  }, [selectedId, items]);

  // --- LIVE MATH ENGINE ---
  const financials = useMemo(() => {
    if (!editForm.id) return null;

    const wc = editForm.request?.word_count || 0;
    const estFH = wc / WORDS_PER_FH;
    const pfhRate = parseFloat(editForm.pfh_rate) || 0;
    const pozRate = parseFloat(editForm.pozotron_rate) || 0;

    const gross = estFH * pfhRate;
    const pozotronCost = estFH * pozRate;
    const otherExpensesTotal = (editForm.other_expenses || []).reduce(
      (acc, curr) => acc + (parseFloat(curr.amount) || 0),
      0
    );
    const totalExpenses = pozotronCost + otherExpensesTotal;

    const net = gross - totalExpenses;
    const taxableIncome = net * 0.8;
    const taxBill = taxableIncome * (globalTaxRate / 100);
    const takeHome = net - taxBill;

    const projectLogs = logs.filter(
      (l) => l.project_id === editForm.request?.id
    );
    const totalHoursWorked = projectLogs.reduce(
      (acc, l) => acc + (parseFloat(l.duration_hrs) || 0),
      0
    );

    const actualEPH = totalHoursWorked > 0 ? takeHome / totalHoursWorked : 0;
    const effectiveTaxRate = net > 0 ? (taxBill / net) * 100 : 0;

    return {
      wc,
      estFH,
      gross,
      pozotronCost,
      otherExpensesTotal,
      net,
      taxBill,
      takeHome,
      totalHoursWorked,
      actualEPH,
      effectiveTaxRate,
    };
  }, [editForm, logs, globalTaxRate]);

  // --- HANDLERS ---
  const handleSave = async () => {
    const payload = {
      status: editForm.status,
      recording_due_date: editForm.recording_due_date,
      characters: editForm.characters,
      crx_batches: editForm.crx_batches,
      checklist: editForm.checklist,
      other_expenses: editForm.other_expenses,
      pfh_rate: editForm.pfh_rate,
      pozotron_rate: editForm.pozotron_rate,
      internal_notes: editForm.internal_notes,
      strikes: editForm.strikes,
    };

    const { error } = await supabase
      .from("4_production")
      .update(payload)
      .eq("id", editForm.id);

    if (error) {
      console.error(error);
      showToast("Save Failed: Check Console", "error");
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === editForm.id ? { ...i, ...payload } : i))
      );
      showToast("Project Saved");
    }
  };

  const handleAddLog = async () => {
    if (!newLog.duration_hrs || !editForm.request?.id) return;
    const { data, error } = await supabase
      .from("10_session_logs")
      .insert([
        {
          project_id: editForm.request.id,
          date: newLog.date,
          activity: newLog.activity,
          duration_hrs: parseFloat(newLog.duration_hrs),
        },
      ])
      .select();

    if (!error && data) {
      setLogs((prev) => [...prev, data[0]]);
      setNewLog({ ...newLog, duration_hrs: "" });
      showToast("Time Logged");
    } else {
      showToast("Log Failed", "error");
    }
  };

  const handleDeleteLog = async (logId) => {
    const { error } = await supabase
      .from("10_session_logs")
      .delete()
      .eq("id", logId);
    if (!error) {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    }
  };

  // --- ACTIONS (KICK, ARCHIVE) ---
  const executeProjectAction = async (actionType) => {
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;

    if (actionType === "kick_back") {
      const targetStatus =
        item.request.client_type === "Roster" ? "first_15" : "onboarding";
      await supabase
        .from("2_booking_requests")
        .update({ status: targetStatus })
        .eq("id", item.request.id);
      await supabase.from("4_production").delete().eq("id", item.id);

      showToast(`Sent back to ${targetStatus}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedId(null);
    } else if (actionType === "archive") {
      await supabase.from("6_archive").insert([
        {
          original_data: item,
          archived_at: new Date(),
          reason: "Booted from Prod",
        },
      ]);
      await supabase
        .from("2_booking_requests")
        .update({ status: "archived" })
        .eq("id", item.request.id);
      await supabase.from("4_production").delete().eq("id", item.id);

      showToast("Project Archived", "error");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSelectedId(null);
    }

    setModal({ isOpen: false });
  };

  const confirmAction = (type) => {
    const config = {
      kick_back: {
        title: "Kick Back Project?",
        msg: "This removes it from Production and sends it back to Onboarding/First 15.",
        btn: "Kick Back",
        type: "neutral",
      },
      archive: {
        title: "Boot to Archive?",
        msg: "This removes it from active workspaces. You can't undo this easily.",
        btn: "Boot Project",
        type: "danger",
      },
    };
    const c = config[type];
    setModal({
      isOpen: true,
      title: c.title,
      message: c.msg,
      confirmText: c.btn,
      type: c.type,
      onConfirm: () => executeProjectAction(type),
      onClose: () => setModal({ isOpen: false }),
    });
  };

  const modifyArray = (key, idx, field, val) => {
    const arr = [...(editForm[key] || [])];
    if (field === null) arr.splice(idx, 1);
    else arr[idx][field] = val;
    setEditForm((prev) => ({ ...prev, [key]: arr }));
  };

  const addArrayItem = (key, template) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), template],
    }));
  };

  const updateEditStatus = (newStatus, label) => {
    setEditForm((prev) => ({ ...prev, status: newStatus }));
    showToast(`Status set to ${label}. Click Save.`);
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans text-slate-900">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <Modal {...modal} />

      {/* --- SIDEBAR (List) --- */}
      <div
        className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 bg-white border-r border-slate-200 flex-col flex-shrink-0 z-20 shadow-xl h-full`}
      >
        <div className="p-5 border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 mb-2">
            <span>Workspace</span>
            <ChevronRight size={10} />
            <span>Projects</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Production OS
          </h2>
          <div className="mt-4 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              placeholder="Find project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-50 bg-slate-50/50 hide-scrollbar">
          {["All", "Recording", "Review", "Pending"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-[10px] font-black uppercase whitespace-nowrap transition-colors ${statusFilter === st ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-200"}`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items
            .filter((i) =>
              statusFilter === "All"
                ? true
                : STATUS_MAP[i.status]?.label === statusFilter
            )
            .filter((i) =>
              i.request.book_title
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            )
            .map((item) => {
              const isActive = selectedId === item.id;
              const statusConf =
                STATUS_MAP[item.status] || STATUS_MAP.pre_production;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isActive ? "bg-slate-900 border-slate-900 shadow-lg scale-[1.02]" : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}
                    >
                      {statusConf.label}
                    </span>
                    {item.strikes > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded-full">
                        {item.strikes}
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-sm font-bold truncate leading-tight mb-1 ${isActive ? "text-white" : "text-slate-800"}`}
                  >
                    {item.request.book_title}
                  </h3>
                  <div
                    className={`text-[10px] font-medium truncate ${isActive ? "text-slate-400" : "text-slate-400"}`}
                  >
                    {item.request.client_name}
                  </div>
                </button>
              );
            })}
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <button
            onClick={fetchItems}
            className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw size={12} /> Sync Data
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA (Detail) --- */}
      <div
        className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 flex-col h-full overflow-hidden relative bg-slate-50`}
      >
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <LayoutDashboard size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-bold uppercase tracking-widest">
              Select a project
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-5 flex items-center justify-between sticky top-0 z-30 shrink-0">
              <div className="flex items-center gap-4 md:gap-6">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-2 -ml-2 text-slate-500"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="w-10 h-14 md:w-12 md:h-16 bg-slate-100 rounded-lg shadow-inner overflow-hidden border border-slate-200 shrink-0">
                  {editForm.request?.cover_image_url ? (
                    <img
                      src={editForm.request.cover_image_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300">
                      <BookOpen size={16} />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight leading-none mb-1 line-clamp-1">
                    {editForm.request?.book_title}
                  </h1>
                  <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <User size={12} /> {editForm.request?.client_name}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Due:{" "}
                      {formatDate(editForm.recording_due_date)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSave}
                className="px-4 py-2 md:px-6 md:py-2.5 bg-indigo-600 text-white text-[10px] md:text-xs font-bold uppercase rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Save size={16} />{" "}
                <span className="hidden md:inline">Save Changes</span>{" "}
                <span className="md:hidden">Save</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8">
              <div className="flex gap-1 mb-8 border-b border-slate-200 overflow-x-auto pb-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-t-lg"}`}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="max-w-6xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* === 1. OVERVIEW & FINANCIALS === */}
                {activeTab === "overview" && financials && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 space-y-6">
                      {/* Config Card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
                          <Activity size={14} /> Project Config
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                              Current Phase
                            </label>
                            <div className="relative">
                              <select
                                value={editForm.status}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    status: e.target.value,
                                  })
                                }
                                className="w-full appearance-none p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400"
                              >
                                {Object.entries(STATUS_MAP).map(([k, v]) => (
                                  <option key={k} value={k}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={14} className="rotate-90" />
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                Recording Due
                              </label>
                              <input
                                type="date"
                                value={editForm.recording_due_date || ""}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    recording_due_date: e.target.value,
                                  })
                                }
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-400"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                Strikes
                              </label>
                              <div className="flex gap-2">
                                {[1, 2, 3].map((i) => (
                                  <button
                                    key={i}
                                    onClick={() =>
                                      setEditForm({
                                        ...editForm,
                                        strikes:
                                          editForm.strikes === i ? i - 1 : i,
                                      })
                                    }
                                    className={`flex-1 h-[42px] rounded-xl flex items-center justify-center transition-all ${editForm.strikes >= i ? "bg-red-500 text-white shadow-md shadow-red-200" : "bg-slate-50 border border-slate-100 text-slate-300"}`}
                                  >
                                    <Skull size={14} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Rates Card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
                          <DollarSign size={14} /> Rates & Fees
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                              PFH Rate ($)
                            </label>
                            <input
                              type="number"
                              value={editForm.pfh_rate}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  pfh_rate: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                              Pozotron Fee ($)
                            </label>
                            <input
                              type="number"
                              value={editForm.pozotron_rate}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  pozotron_rate: e.target.value,
                                })
                              }
                              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-orange-400"
                            />
                          </div>
                        </div>
                        {/* Other Expenses Ledger */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                              Other Expenses
                            </h4>
                            <button
                              onClick={() =>
                                addArrayItem("other_expenses", {
                                  desc: "",
                                  amount: "",
                                })
                              }
                              className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-3 py-1 rounded hover:bg-slate-200"
                            >
                              + Add
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(editForm.other_expenses || []).map((exp, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  placeholder="Desc"
                                  value={exp.desc}
                                  onChange={(e) =>
                                    modifyArray(
                                      "other_expenses",
                                      idx,
                                      "desc",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-indigo-300"
                                />
                                <input
                                  type="number"
                                  placeholder="0"
                                  value={exp.amount}
                                  onChange={(e) =>
                                    modifyArray(
                                      "other_expenses",
                                      idx,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  className="w-20 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-indigo-300"
                                />
                                <button
                                  onClick={() =>
                                    modifyArray(
                                      "other_expenses",
                                      idx,
                                      null,
                                      null
                                    )
                                  }
                                  className="text-slate-300 hover:text-red-500"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                            {(editForm.other_expenses || []).length === 0 && (
                              <div className="text-[10px] text-slate-300 text-center italic">
                                No extra expenses
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Danger Zone */}
                      <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                        <h4 className="text-xs font-black uppercase text-red-400 mb-6 flex items-center gap-2">
                          <AlertTriangle size={14} /> Actions
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() =>
                              updateEditStatus("pending", "Pending")
                            }
                            className="py-3 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold uppercase hover:bg-amber-100"
                          >
                            Set Pending
                          </button>
                          <button
                            onClick={() => updateEditStatus("on_hold", "Hold")}
                            className="py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-200"
                          >
                            Hold Project
                          </button>
                          <button
                            onClick={() =>
                              updateEditStatus("postponed", "Postponed")
                            }
                            className="py-3 bg-pink-50 text-pink-600 rounded-xl text-xs font-bold uppercase hover:bg-pink-100"
                          >
                            Postpone
                          </button>
                          <button
                            onClick={() => confirmAction("kick_back")}
                            className="py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-bold uppercase hover:bg-slate-50 flex items-center justify-center gap-2"
                          >
                            <ArrowLeftCircle size={14} /> Kick Back
                          </button>
                          <button
                            onClick={() => confirmAction("archive")}
                            className="col-span-2 py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase hover:bg-red-100 flex items-center justify-center gap-2"
                          >
                            <Archive size={14} /> Boot (Archive)
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-7">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden sticky top-24">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                          <DollarSign size={200} />
                        </div>
                        <h3 className="relative z-10 text-2xl font-black italic uppercase mb-10 flex items-center gap-3">
                          <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] tracking-widest not-italic shadow-lg shadow-emerald-900/50">
                            LIVE P&L
                          </span>{" "}
                          Project Economics
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-10 relative z-10">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                              Gross Revenue
                            </p>
                            <div className="text-4xl font-black tracking-tight">
                              {formatCurrency(financials.gross)}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {financials.estFH.toFixed(1)} FH @{" "}
                              {formatCurrency(editForm.pfh_rate)}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                              Net Profit (Pre-Tax)
                            </p>
                            <div className="text-4xl font-black tracking-tight text-white">
                              {formatCurrency(financials.net)}
                            </div>
                            <div className="text-[10px] text-orange-400 font-medium">
                              - {formatCurrency(financials.pozotronCost)}{" "}
                              Pozotron
                            </div>
                            <div className="text-[10px] text-red-400 font-medium">
                              - {formatCurrency(financials.otherExpensesTotal)}{" "}
                              Expenses
                            </div>
                          </div>
                          <div className="col-span-2 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} /> QBI Adjusted Take Home
                              </p>
                              <div className="text-5xl font-black tracking-tight text-emerald-400">
                                {formatCurrency(financials.takeHome)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">
                                Real Hourly Rate
                              </p>
                              <div className="text-3xl font-black text-blue-400">
                                {formatCurrency(financials.actualEPH)}
                                <span className="text-sm text-blue-500/50">
                                  /hr
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1">
                                {financials.totalHoursWorked.toFixed(1)} hrs
                                logged
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* === 2. WORK LOG (REAL HOURS) === */}
                {activeTab === "work_log" && (
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                        <Timer size={16} /> Session Logs
                      </h4>
                      <span className="text-xs font-bold text-slate-400">
                        Used for "Real Hourly" calc
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                      <div className="space-y-1 flex-1 w-full">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={newLog.date}
                          onChange={(e) =>
                            setNewLog({ ...newLog, date: e.target.value })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1 flex-1 w-full">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                          Activity
                        </label>
                        <select
                          value={newLog.activity}
                          onChange={(e) =>
                            setNewLog({ ...newLog, activity: e.target.value })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                        >
                          <option>Prep</option>
                          <option>Recording</option>
                          <option>Editing</option>
                          <option>Mastering</option>
                          <option>Admin</option>
                        </select>
                      </div>
                      <div className="space-y-1 w-full md:w-32">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          placeholder="0.0"
                          value={newLog.duration_hrs}
                          onChange={(e) =>
                            setNewLog({
                              ...newLog,
                              duration_hrs: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                        />
                      </div>
                      <button
                        onClick={handleAddLog}
                        className="w-full md:w-auto h-[38px] px-6 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-800"
                      >
                        Add Entry
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-white text-[10px] uppercase font-black text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Activity</th>
                            <th className="px-6 py-4">Hours</th>
                            <th className="px-6 py-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {logs
                            .filter(
                              (l) => l.project_id === editForm.request?.id
                            )
                            .map((log) => (
                              <tr
                                key={log.id}
                                className="hover:bg-slate-50 text-xs font-bold text-slate-700"
                              >
                                <td className="px-6 py-4">
                                  {formatDate(log.date)}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="bg-white border border-slate-200 px-2 py-1 rounded">
                                    {log.activity}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {log.duration_hrs} hrs
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="text-slate-300 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {logs.filter(
                            (l) => l.project_id === editForm.request?.id
                          ).length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-8 text-center text-slate-400 text-xs font-medium italic"
                              >
                                No work logged yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* === 3. FILE FLOW (CRX MATRIX) === */}
                {activeTab === "crx" && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-8">
                        <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                          <Activity size={16} /> File Flow Tracker
                        </h4>
                        <button
                          onClick={() =>
                            addArrayItem("crx_batches", {
                              name: `Batch ${(editForm.crx_batches || []).length + 1}`,
                              sent_date: new Date().toISOString().split("T")[0],
                              return_date: "",
                              notes: "",
                            })
                          }
                          className="text-xs font-bold uppercase bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 shadow-lg"
                        >
                          + Log File Send
                        </button>
                      </div>

                      {/* Timeline Visual */}
                      <div className="mb-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 flex gap-4 overflow-x-auto">
                        {(editForm.crx_batches || []).length === 0 ? (
                          <span className="text-xs font-bold text-slate-300 uppercase">
                            No files sent yet
                          </span>
                        ) : (
                          (editForm.crx_batches || []).map((b, i) => {
                            const fixDeadline = b.return_date
                              ? addBusinessDays(b.return_date, BIZ_DAYS_TO_FIX)
                              : null;
                            return (
                              <div
                                key={i}
                                className="min-w-[180px] p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative"
                              >
                                <div className="text-[10px] font-black uppercase text-slate-400 mb-2">
                                  {b.name}
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between font-bold text-slate-700">
                                    <span>Sent:</span>{" "}
                                    <span>{formatDate(b.sent_date)}</span>
                                  </div>
                                  <div
                                    className={`flex justify-between font-bold ${b.return_date ? "text-indigo-600" : "text-slate-300"}`}
                                  >
                                    <span>Rec'd:</span>{" "}
                                    <span>
                                      {b.return_date
                                        ? formatDate(b.return_date)
                                        : "-"}
                                    </span>
                                  </div>
                                  {b.return_date && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between font-black text-red-500">
                                      <span>Fix Due:</span>{" "}
                                      <span>{formatDate(fixDeadline)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Inputs */}
                      <div className="space-y-4">
                        {(editForm.crx_batches || []).map((batch, idx) => {
                          const myDeadline = batch.return_date
                            ? addBusinessDays(
                                batch.return_date,
                                BIZ_DAYS_TO_FIX
                              )
                            : null;
                          return (
                            <div
                              key={idx}
                              className="flex flex-col lg:flex-row gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100"
                            >
                              <div className="flex-1 w-full space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                  File/Batch Name
                                </label>
                                <input
                                  value={batch.name}
                                  onChange={(e) =>
                                    modifyArray(
                                      "crx_batches",
                                      idx,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                                />
                              </div>
                              <div className="w-full lg:w-40 space-y-1">
                                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                                  Date Sent
                                </label>
                                <input
                                  type="date"
                                  value={batch.sent_date}
                                  onChange={(e) =>
                                    modifyArray(
                                      "crx_batches",
                                      idx,
                                      "sent_date",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                                />
                              </div>
                              <div className="w-full lg:w-40 space-y-1">
                                <label className="text-[9px] font-black uppercase text-indigo-400 ml-1">
                                  Notes Rec'd
                                </label>
                                <input
                                  type="date"
                                  value={batch.return_date}
                                  onChange={(e) =>
                                    modifyArray(
                                      "crx_batches",
                                      idx,
                                      "return_date",
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-900 text-xs font-bold focus:border-indigo-400"
                                />
                              </div>
                              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 h-[38px] flex items-center justify-center min-w-[140px]">
                                {myDeadline ? (
                                  <span className="text-[10px] font-black text-red-500">
                                    My Due: {formatDate(myDeadline)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300 uppercase">
                                    Waiting on client
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  modifyArray("crx_batches", idx, null, null)
                                }
                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* === 4. BIBLE === */}
                {activeTab === "bible" && (
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                    <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-100">
                      <h4 className="text-sm font-black uppercase text-slate-500 flex items-center gap-2">
                        <BookOpen size={16} /> Character List
                      </h4>
                      <button
                        onClick={() =>
                          addArrayItem("characters", {
                            name: "",
                            voice: "",
                            page: "",
                            time: "",
                          })
                        }
                        className="text-[10px] font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl hover:border-indigo-300 shadow-sm transition-all"
                      >
                        + Add Character
                      </button>
                    </div>
                    <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
                      {(editForm.characters || []).map((char, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-4 items-center group"
                        >
                          <div className="col-span-3">
                            <input
                              placeholder="Name"
                              value={char.name}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              placeholder="Voice Desc"
                              value={char.voice}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "voice",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              placeholder="Pg 12"
                              value={char.page}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "page",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              placeholder="00:00"
                              value={char.time}
                              onChange={(e) =>
                                modifyArray(
                                  "characters",
                                  idx,
                                  "time",
                                  e.target.value
                                )
                              }
                              className="w-full p-3 bg-slate-50 rounded-xl text-xs border-transparent focus:bg-white focus:border-indigo-200 border outline-none"
                            />
                          </div>
                          <div className="col-span-1 text-right">
                            <button
                              onClick={() =>
                                modifyArray("characters", idx, null, null)
                              }
                              className="text-slate-300 hover:text-red-500 p-2"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === 5. TASKS === */}
                {activeTab === "tasks" && (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
                        <ListTodo size={16} /> Production Steps
                      </h4>
                      <button
                        onClick={() =>
                          addArrayItem("checklist", {
                            label: "New Task",
                            checked: false,
                          })
                        }
                        className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100"
                      >
                        + Add Task
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(editForm.checklist || []).map((task, idx) => (
                        <div
                          key={idx}
                          className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all bg-white shadow-sm"
                        >
                          <button
                            onClick={() =>
                              modifyArray(
                                "checklist",
                                idx,
                                "checked",
                                !task.checked
                              )
                            }
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${task.checked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-200"}`}
                          >
                            {task.checked && (
                              <Check size={16} strokeWidth={4} />
                            )}
                          </button>
                          <input
                            value={task.label}
                            onChange={(e) =>
                              modifyArray(
                                "checklist",
                                idx,
                                "label",
                                e.target.value
                              )
                            }
                            className={`flex-1 bg-transparent text-sm font-bold outline-none ${task.checked ? "text-slate-400 line-through decoration-2 decoration-emerald-200" : "text-slate-700"}`}
                          />
                          <button
                            onClick={() =>
                              modifyArray("checklist", idx, null, null)
                            }
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* === 6. NOTES === */}
                {activeTab === "notes" && (
                  <div className="bg-yellow-50/50 p-8 rounded-[2rem] border border-yellow-100 shadow-sm h-[600px] flex flex-col relative animate-in fade-in">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <StickyNote size={100} className="text-yellow-600" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-yellow-600/50 mb-6 flex items-center gap-2 relative z-10">
                      <StickyNote size={16} /> Internal Notes
                    </h4>
                    <textarea
                      value={editForm.internal_notes}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          internal_notes: e.target.value,
                        })
                      }
                      className="flex-1 w-full resize-none outline-none text-base font-medium text-slate-700 leading-relaxed bg-transparent relative z-10 placeholder-yellow-600/30"
                      placeholder="Type details here..."
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
