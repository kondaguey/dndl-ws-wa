"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  Save,
  X,
  User,
  BookOpen,
  Calendar,
  MoreVertical,
  Layers,
  Mic,
  AlertTriangle,
  Archive,
  Ban,
  PauseCircle,
  Briefcase,
  Clock,
  Skull,
  CheckCircle2,
  ChevronUp,
  Search,
  LayoutDashboard,
  FileText,
  ListTodo,
  StickyNote,
  Activity,
  Check,
  ArrowRight,
  RefreshCw,
  XCircle,
  PlayCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- 1. CONFIGURATION ---

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
  mastering: {
    label: "Mastering",
    color: "bg-purple-50 text-purple-600 border-purple-200",
    icon: Layers,
  },
  review: {
    label: "CRX Review",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    icon: Clock,
  },
  producer_delay: {
    label: "Producer Delay",
    color: "bg-amber-50 text-amber-600 border-amber-200",
    icon: AlertTriangle,
  },
  internal_delay: {
    label: "Internal Delay",
    color: "bg-pink-50 text-pink-600 border-pink-200",
    icon: AlertTriangle,
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
  { id: "crx", label: "CRX Matrix", icon: Clock },
  { id: "bible", label: "Bible", icon: User },
  { id: "tasks", label: "Checklists", icon: ListTodo },
  { id: "notes", label: "Notes", icon: StickyNote },
];

const DEFAULT_CHECKLIST = [
  { id: 1, label: "Script Pre-read Complete", checked: false },
  { id: 2, label: "Pronunciation Guide Sent", checked: false },
  { id: 3, label: "Studio Setup / Mic Check", checked: false },
  { id: 4, label: "First 15 Approved", checked: false },
  { id: 5, label: "Files Mastered & Normalized", checked: false },
];

// --- 2. UTILS ---

const addBusinessDays = (startDate, daysToAdd) => {
  if (!startDate) return new Date();
  let currentDate = new Date(startDate);
  currentDate = new Date(
    currentDate.valueOf() + currentDate.getTimezoneOffset() * 60000
  ); // Timezone fix
  let added = 0;
  while (added < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return currentDate;
};

const calculateBatchDeadline = (sentDateStr, fh) => {
  if (!sentDateStr || !fh || parseFloat(fh) === 0) return null;
  const daysNeeded = Math.ceil(parseFloat(fh) / 2);
  const deadline = addBusinessDays(sentDateStr, daysNeeded);
  return deadline.toISOString().split("T")[0];
};

const getDaysRemaining = (targetDateStr) => {
  if (!targetDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  const targetFixed = new Date(
    target.valueOf() + target.getTimezoneOffset() * 60000
  );
  const diffTime = targetFixed - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

// --- 3. SUB-COMPONENTS ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-[250] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 border ${type === "error" ? "bg-red-50 border-red-100 text-red-600" : "bg-slate-900 border-slate-800 text-white"}`}
    >
      {type === "error" ? (
        <XCircle size={20} />
      ) : (
        <CheckCircle2 size={20} className="text-emerald-400" />
      )}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const ActionModal = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  const styles = {
    boot: {
      icon: Skull,
      color: "text-red-500",
      btn: "bg-red-600 hover:bg-red-700",
    },
    delete: {
      icon: Ban,
      color: "text-red-600",
      btn: "bg-red-600 hover:bg-red-700",
    },
    move: {
      icon: Briefcase,
      color: "text-blue-500",
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    hold: {
      icon: PauseCircle,
      color: "text-amber-500",
      btn: "bg-amber-500 hover:bg-amber-600",
    },
    default: {
      icon: AlertTriangle,
      color: "text-amber-500",
      btn: "bg-slate-900 hover:bg-slate-800",
    },
  };
  const style = styles[type] || styles.default;
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 transition-all">
        <div className="p-8 text-center">
          <div
            className={`mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6 ${style.color}`}
          >
            <Icon size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 py-5 text-xs font-bold uppercase text-slate-400 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-5 text-xs font-bold uppercase text-white ${style.btn}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subtext, icon: Icon, alert }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between min-w-[200px] hover:shadow-md transition-shadow">
    <div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
        {label}
      </p>
      <h3
        className={`text-2xl font-black ${alert ? "text-red-600" : "text-slate-900"}`}
      >
        {value}
      </h3>
      {subtext && (
        <p className="text-[10px] font-bold text-slate-400 mt-1">{subtext}</p>
      )}
    </div>
    <div
      className={`p-2 rounded-xl ${alert ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400"}`}
    >
      <Icon size={18} />
    </div>
  </div>
);

// --- 4. MAIN COMPONENT ---

export default function ProductionBoard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editForm, setEditForm] = useState({});
  const [modal, setModal] = useState({ isOpen: false });
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setExpandedId(null);
        setModal({ isOpen: false });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && expandedId) {
        e.preventDefault();
        handleSave(expandedId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedId, editForm]);

  // --- ACTIONS (Hoisted) ---
  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  const executeMove = async (item, targetStatus) => {
    // 1. BOOT TO ARCHIVE
    if (targetStatus === "archive") {
      await supabase
        .from("6_archive")
        .insert([
          {
            original_data: item,
            archived_at: new Date(),
            reason: "Booted from Prod",
          },
        ]);
      await supabase
        .from("2_booking_requests")
        .delete()
        .eq("id", item.request.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setModal({ isOpen: false });
      showToast("Project Archived");
      return;
    }

    // 2. RETURN TO ONBOARDING (Send back to Intake)
    if (targetStatus === "onboarding_check") {
      const dbStatus =
        item.request.client_type === "Roster" ? "first_15" : "onboarding";

      // Update Request status so it appears on Intake Board
      await supabase
        .from("2_booking_requests")
        .update({ status: dbStatus })
        .eq("id", item.request.id);
      // Remove from Production Board
      await supabase.from("4_production").delete().eq("id", item.id);

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setModal({ isOpen: false });
      showToast(
        `Sent back to ${dbStatus === "first_15" ? "First 15" : "Onboarding"}`
      );
      return;
    }

    // 3. PLACE ON HOLD (Keep on board, change status)
    if (targetStatus === "on_hold") {
      await supabase
        .from("4_production")
        .update({ status: "on_hold" })
        .eq("id", item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "on_hold" } : i))
      );
      setModal({ isOpen: false });
      showToast("Project placed On Hold");
      return;
    }
  };

  const executeDelete = async (item) => {
    await supabase
      .from("2_booking_requests")
      .delete()
      .eq("id", item.request.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setModal({ isOpen: false });
    showToast("Project Deleted", "error");
  };

  const triggerModal = (type, item, extra) => {
    const actions = {
      boot: {
        title: "Boot to Archives",
        msg: "Remove from board?",
        fn: () => executeMove(item, "archive"),
      },
      delete: {
        title: "Delete Forever",
        msg: "Cannot be undone.",
        fn: () => executeDelete(item),
      },
      move: {
        title: `Move to ${extra?.label}`,
        msg: `Transfer to ${extra?.label}?`,
        fn: () => executeMove(item, extra?.status),
      },
      hold: {
        title: "Place on Hold",
        msg: "Pause this project? It will stay on the board.",
        fn: () => executeMove(item, "on_hold"),
      },
    };
    const act = actions[type];
    setModal({
      isOpen: true,
      type,
      title: act.title,
      message: act.msg,
      action: act.fn,
    });
  };

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("4_production")
      .select(
        `
        *,
        request:2_booking_requests!inner (
          id, book_title, client_name, client_type, cover_image_url, word_count, status, email
        )
      `
      )
      .neq("request.status", "deleted")
      .neq("request.status", "archived")
      .order("recording_due_date", { ascending: true });

    if (error) {
      console.error(error);
      showToast("Sync Error", "error");
    } else {
      const unique = [];
      const seen = new Set();
      (data || []).forEach((i) => {
        if (!seen.has(i.id)) {
          seen.add(i.id);
          i.crx_batches = Array.isArray(i.crx_batches) ? i.crx_batches : [];
          i.characters = Array.isArray(i.characters) ? i.characters : [];
          i.checklist =
            Array.isArray(i.checklist) && i.checklist.length > 0
              ? i.checklist
              : DEFAULT_CHECKLIST;
          i.internal_notes = i.internal_notes || "";
          i.strikes = i.strikes || 0;
          unique.push(i);
        }
      });
      setItems(unique);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- STATS & FILTERS ---
  const stats = useMemo(() => {
    const totalProjects = items.length;
    const activeStrikes = items.reduce((acc, i) => acc + (i.strikes || 0), 0);
    const totalFH = items.reduce(
      (acc, i) =>
        acc + (i.request.word_count ? i.request.word_count / 9300 : 0),
      0
    );
    const urgentCount = items.filter((i) => {
      const days = getDaysRemaining(i.recording_due_date);
      return days !== null && days <= 3 && i.status !== "done";
    }).length;
    return { totalProjects, activeStrikes, totalFH, urgentCount };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        (item.request.book_title || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.request.client_name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const dbStatus = item.status || "pre_production";
      const uiStatusLabel = STATUS_MAP[dbStatus]?.label || "Text Prep";

      // Filter Logic
      if (statusFilter === "All") return matchesSearch;
      if (statusFilter === "On Hold")
        return matchesSearch && dbStatus === "on_hold";
      return matchesSearch && uiStatusLabel === statusFilter;
    });
  }, [items, searchQuery, statusFilter]);

  // --- FORM HANDLERS ---
  const handleExpand = (item) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setActiveTab("overview");
    setEditForm({
      status: item.status || "pre_production",
      files_sent_date: item.files_sent_date,
      recording_start_date: item.recording_start_date,
      recording_due_date: item.recording_due_date,
      crx_due_date: item.crx_due_date,
      crx_status: item.crx_status,
      characters: JSON.parse(JSON.stringify(item.characters || [])),
      crx_batches: JSON.parse(JSON.stringify(item.crx_batches || [])),
      checklist: JSON.parse(
        JSON.stringify(item.checklist || DEFAULT_CHECKLIST)
      ),
      internal_notes: item.internal_notes || "",
      strikes: item.strikes || 0,
    });
  };

  const handleSave = async (id) => {
    const batches = editForm.crx_batches || [];
    let calculatedCRXDate = null;
    let calculatedCRXStatus = "none";

    if (batches.length > 0) {
      const dates = batches
        .map((b) => calculateBatchDeadline(b.submitted_date, b.fh))
        .filter(Boolean);
      if (dates.length > 0) dates.sort().reverse();
      if (dates[0]) calculatedCRXDate = dates[0];
      if (batches.some((b) => b.status === "Changes"))
        calculatedCRXStatus = "changes_req";
      else if (batches.some((b) => b.status === "Review"))
        calculatedCRXStatus = "in_review";
      else if (batches.every((b) => b.status === "Approved"))
        calculatedCRXStatus = "approved";
    }

    const payload = {
      status: editForm.status,
      recording_start_date: editForm.recording_start_date,
      recording_due_date: editForm.recording_due_date,
      files_sent_date: editForm.files_sent_date,
      crx_due_date: calculatedCRXDate,
      crx_status: calculatedCRXStatus,
      characters: editForm.characters,
      crx_batches: editForm.crx_batches,
      checklist: editForm.checklist,
      internal_notes: editForm.internal_notes,
      strikes: editForm.strikes,
    };

    const { error } = await supabase
      .from("4_production")
      .update(payload)
      .eq("id", id);
    if (!error) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...payload } : i))
      );
      setExpandedId(null);
      showToast("Project Saved");
    } else {
      showToast("Save Failed", "error");
    }
  };

  const updateForm = (field, val) =>
    setEditForm((prev) => ({ ...prev, [field]: val }));
  const modifyArray = (arrayName, index, field, val) => {
    const copy = [...(editForm[arrayName] || [])];
    if (field === null) copy.splice(index, 1);
    else copy[index][field] = val;
    setEditForm((prev) => ({ ...prev, [arrayName]: copy }));
  };
  const addBatch = () => {
    const nextNum = (editForm.crx_batches || []).length + 1;
    const template = {
      name: `Batch ${nextNum}`,
      fh: "0",
      status: "Review",
      submitted_date: new Date().toISOString().split("T")[0],
    };
    setEditForm((prev) => ({
      ...prev,
      crx_batches: [...(prev.crx_batches || []), template],
    }));
  };

  // --- RENDER ---
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          Loading Dashboard...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ActionModal
        {...modal}
        onCancel={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.action}
      />

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 mb-1">
                <span>Workspace</span>
                <ArrowRight size={10} />
                <span>Production</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Production Control{" "}
                <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold">
                  v4.0
                </span>
              </h1>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
              <StatCard
                label="Active Projects"
                value={stats.totalProjects}
                icon={LayoutDashboard}
              />
              <StatCard
                label="Pipeline Volume"
                value={`${stats.totalFH.toFixed(1)} FH`}
                icon={Layers}
              />
              <StatCard
                label="Critical Due"
                value={stats.urgentCount}
                subtext="Next 3 Days"
                icon={AlertTriangle}
                alert={stats.urgentCount > 0}
              />
              <StatCard
                label="Risk Level"
                value={stats.activeStrikes}
                subtext="Total Strikes"
                icon={Skull}
                alert={stats.activeStrikes > 2}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-4 justify-between items-center border-t border-slate-100 pt-4">
            <div className="relative w-full md:w-96 group">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search title or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                {[
                  "All",
                  "Text Prep",
                  "Recording",
                  "CRX Review",
                  "On Hold",
                  "Complete",
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${statusFilter === status ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                onClick={fetchItems}
                className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-200 active:rotate-180 transition-all"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-[1800px] mx-auto p-4 md:p-8 space-y-6">
        {filteredItems.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <Search size={32} />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">
              No projects found
            </h3>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="mt-4 text-xs font-bold uppercase text-indigo-600 hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}

        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id;
          const statusConf =
            STATUS_MAP[item.status] || STATUS_MAP["pre_production"];
          const StatusIcon = statusConf.icon;
          const pfh = item.request.word_count
            ? (item.request.word_count / 9300).toFixed(1)
            : "0.0";
          const batches = isExpanded ? editForm.crx_batches : item.crx_batches;
          const totalFH = (batches || []).reduce(
            (acc, b) => acc + (parseFloat(b.fh) || 0),
            0
          );
          const progress = pfh > 0 ? Math.min(100, (totalFH / pfh) * 100) : 0;
          const daysLeft = getDaysRemaining(item.recording_due_date);
          const isHold = item.status === "on_hold";

          return (
            <div
              key={item.id}
              className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden relative ${isExpanded ? "ring-4 ring-slate-100 border-slate-300 shadow-2xl z-10 my-8" : "border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200"} ${isHold ? "opacity-75 grayscale-[0.5]" : ""}`}
            >
              <div className="flex flex-col xl:flex-row gap-6 p-6 xl:items-center relative">
                {!isExpanded && !isHold && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-50">
                    <div
                      className="h-full bg-indigo-500/20"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
                {/* IDENTITY */}
                <div className="flex gap-5 min-w-[300px]">
                  <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex-shrink-0 relative border border-slate-200">
                    {item.request.cover_image_url ? (
                      <img
                        src={item.request.cover_image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen size={20} />
                      </div>
                    )}
                    {item.strikes > 0 && (
                      <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-bl-lg text-[10px] font-black">
                        {item.strikes}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded text-slate-500 bg-slate-100 border border-slate-200">
                        {item.request.client_type}
                      </span>
                      <div
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${statusConf.color}`}
                      >
                        <StatusIcon size={10} />
                        {statusConf.label}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-1 truncate max-w-[300px]">
                      {item.request.book_title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                      <User size={12} /> {item.request.client_name}
                    </div>
                  </div>
                </div>

                {/* TIMELINE VISUAL */}
                <div className="flex-1 xl:border-l xl:border-slate-100 xl:pl-8 py-2 overflow-hidden">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      CRX Timeline
                    </span>
                    <div className="text-[10px] font-bold text-slate-500">
                      <span
                        className={
                          progress >= 100
                            ? "text-emerald-500"
                            : "text-slate-900"
                        }
                      >
                        {progress.toFixed(0)}%
                      </span>{" "}
                      of {pfh} FH
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar pb-2">
                    {(batches || []).length === 0 ? (
                      <div className="w-full h-10 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] text-slate-300 uppercase font-bold bg-slate-50/50">
                        No Timeline Events
                      </div>
                    ) : (
                      (batches || []).map((batch, idx) => {
                        const isDone = batch.status === "Approved";
                        const deadline = calculateBatchDeadline(
                          batch.submitted_date,
                          batch.fh
                        );
                        const bDays = getDaysRemaining(deadline);
                        return (
                          <div
                            key={idx}
                            className="flex-shrink-0 flex flex-col gap-1 w-24"
                          >
                            <div
                              className={`h-1.5 rounded-full w-full ${isDone ? "bg-emerald-400" : batch.status === "Changes" ? "bg-amber-400" : "bg-indigo-400"}`}
                            ></div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                              <span className="truncate max-w-[50px]">
                                {batch.name}
                              </span>
                              <span className={bDays < 0 ? "text-red-500" : ""}>
                                {bDays}d
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ACTION */}
                <div className="flex items-center justify-between xl:justify-end gap-6 xl:w-64">
                  <div className="text-right">
                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">
                      Due Date
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={`text-sm font-black ${daysLeft < 0 ? "text-red-500" : daysLeft <= 3 ? "text-amber-500" : "text-slate-700"}`}
                      >
                        {item.recording_due_date
                          ? formatDate(item.recording_due_date)
                          : "Not Set"}
                      </span>
                      {daysLeft !== null && daysLeft <= 3 && (
                        <AlertTriangle size={14} className="text-amber-500" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleExpand(item)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border shadow-sm ${isExpanded ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200"}`}
                  >
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <MoreVertical size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* === EXPANDED PANEL === */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 min-h-[500px] animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-white border-b border-slate-200 px-6 pt-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex gap-1 overflow-x-auto hide-scrollbar">
                      {TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "border-indigo-500 text-indigo-600 bg-indigo-50/50 rounded-t-lg" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-lg"}`}
                        >
                          <tab.icon size={14} /> {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pl-4 pb-2">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 mr-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 px-2">
                          Strikes
                        </span>
                        {[1, 2, 3].map((i) => (
                          <button
                            key={i}
                            onClick={() =>
                              updateForm(
                                "strikes",
                                editForm.strikes === i ? i - 1 : i
                              )
                            }
                            className={`w-6 h-6 rounded flex items-center justify-center ${editForm.strikes >= i ? "bg-red-500 text-white" : "bg-white text-slate-300 shadow-sm"}`}
                          >
                            <Skull size={10} />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleSave(item.id)}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-300/50"
                      >
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === "overview" && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                        <div className="space-y-6">
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h4 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
                              <Activity size={14} /> Project Health
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <label className="text-[9px] font-black uppercase text-slate-400">
                                  Current Status
                                </label>
                                <select
                                  value={editForm.status}
                                  onChange={(e) =>
                                    updateForm("status", e.target.value)
                                  }
                                  className="w-full mt-1 bg-transparent text-sm font-bold text-slate-900 outline-none"
                                >
                                  {Object.entries(STATUS_MAP).map(
                                    ([key, val]) => (
                                      <option key={key} value={key}>
                                        {val.label}
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-xl">
                                <label className="text-[9px] font-black uppercase text-slate-400">
                                  Word Count
                                </label>
                                <div className="text-sm font-bold text-slate-900 mt-1">
                                  {item.request.word_count?.toLocaleString() ||
                                    "0"}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                            <h4 className="text-xs font-black uppercase text-red-400 mb-4 flex items-center gap-2">
                              <AlertTriangle size={14} /> Danger Zone
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => triggerModal("hold", item)}
                                className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase hover:bg-amber-100 flex items-center gap-2"
                              >
                                <PauseCircle size={14} /> Place on Hold
                              </button>
                              <button
                                onClick={() =>
                                  triggerModal("move", item, {
                                    label: "Onboarding",
                                    status: "onboarding_check",
                                  })
                                }
                                className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Briefcase size={14} /> Return to Onboarding
                              </button>
                              <button
                                onClick={() => triggerModal("boot", item)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase hover:bg-red-100 flex items-center gap-2"
                              >
                                <Archive size={14} /> Boot to Archive
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                          <h4 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
                            <Calendar size={14} /> Key Dates
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                                Recording Start
                              </label>
                              <input
                                type="date"
                                value={editForm.recording_start_date || ""}
                                onChange={(e) =>
                                  updateForm(
                                    "recording_start_date",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                                Recording Deadline
                              </label>
                              <input
                                type="date"
                                value={editForm.recording_due_date || ""}
                                onChange={(e) =>
                                  updateForm(
                                    "recording_due_date",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">
                                Files Sent (Full)
                              </label>
                              <input
                                type="date"
                                value={editForm.files_sent_date || ""}
                                onChange={(e) =>
                                  updateForm("files_sent_date", e.target.value)
                                }
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* CRX TAB */}
                    {activeTab === "crx" && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs font-bold text-slate-500">
                            Contract Logic:{" "}
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              1 Biz Day per 2 FH
                            </span>
                          </div>
                          <button
                            onClick={addBatch}
                            className="text-xs font-bold uppercase text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200"
                          >
                            + Add Batch
                          </button>
                        </div>
                        {(editForm.crx_batches || []).map((batch, idx) => {
                          const deadline = calculateBatchDeadline(
                            batch.submitted_date,
                            batch.fh
                          );
                          return (
                            <div
                              key={idx}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end lg:items-center"
                            >
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                    Batch Name
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
                                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                    FH (Hours)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={batch.fh}
                                    onChange={(e) =>
                                      modifyArray(
                                        "crx_batches",
                                        idx,
                                        "fh",
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                    Sent Date
                                  </label>
                                  <input
                                    type="date"
                                    value={batch.submitted_date}
                                    onChange={(e) =>
                                      modifyArray(
                                        "crx_batches",
                                        idx,
                                        "submitted_date",
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                    Status
                                  </label>
                                  <select
                                    value={batch.status}
                                    onChange={(e) =>
                                      modifyArray(
                                        "crx_batches",
                                        idx,
                                        "status",
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 bg-white"
                                  >
                                    <option value="Review">In Review</option>
                                    <option value="Changes">Changes Req</option>
                                    <option value="Approved">Approved</option>
                                  </select>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 w-full lg:w-auto">
                                <div className="flex-1 lg:w-40 bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                                  <div className="text-[9px] font-black uppercase text-slate-400 mb-0.5">
                                    Calculated Due
                                  </div>
                                  <div className="text-sm font-black text-slate-800 flex items-center justify-center gap-1">
                                    {deadline ? formatDate(deadline) : "-"}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    modifyArray("crx_batches", idx, null, null)
                                  }
                                  className="p-2 text-slate-300 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {(editForm.crx_batches || []).length === 0 && (
                          <div className="text-center py-12 text-slate-300 font-bold uppercase text-xs border-2 border-dashed border-slate-200 rounded-xl">
                            No Batches in Pipeline
                          </div>
                        )}
                      </div>
                    )}
                    {/* BIBLE TAB */}
                    {activeTab === "bible" && (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase text-slate-500">
                            Character List
                          </h4>
                          <button
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                characters: [
                                  ...(prev.characters || []),
                                  { name: "", voice: "" },
                                ],
                              }))
                            }
                            className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 shadow-sm"
                          >
                            + Add Character
                          </button>
                        </div>
                        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                          {(editForm.characters || []).map((char, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-slate-300 font-mono text-xs w-6">
                                {idx + 1}.
                              </span>
                              <input
                                placeholder="Character Name"
                                value={char.name}
                                onChange={(e) =>
                                  modifyArray(
                                    "characters",
                                    idx,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:bg-white focus:border-indigo-400"
                              />
                              <input
                                placeholder="Voice Reference / Notes"
                                value={char.voice}
                                onChange={(e) =>
                                  modifyArray(
                                    "characters",
                                    idx,
                                    "voice",
                                    e.target.value
                                  )
                                }
                                className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:bg-white focus:border-indigo-400"
                              />
                              <button
                                onClick={() =>
                                  modifyArray("characters", idx, null, null)
                                }
                                className="text-slate-300 hover:text-red-500 p-2"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                          {(editForm.characters || []).length === 0 && (
                            <div className="text-center py-8 text-slate-300 italic text-sm">
                              List empty.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* TASKS TAB */}
                    {activeTab === "tasks" && (
                      <div className="animate-in fade-in duration-300 space-y-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-black uppercase text-slate-400 mb-6 flex items-center gap-2">
                            <ListTodo size={14} /> Production Steps
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {(editForm.checklist || DEFAULT_CHECKLIST).map(
                              (task, idx) => (
                                <div
                                  key={task.id || idx}
                                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${task.checked ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100 hover:border-slate-200"}`}
                                  onClick={() => {
                                    const copy = [
                                      ...(editForm.checklist ||
                                        DEFAULT_CHECKLIST),
                                    ];
                                    copy[idx].checked = !copy[idx].checked;
                                    setEditForm((prev) => ({
                                      ...prev,
                                      checklist: copy,
                                    }));
                                  }}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${task.checked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300"}`}
                                  >
                                    {task.checked && (
                                      <Check size={16} strokeWidth={4} />
                                    )}
                                  </div>
                                  <span
                                    className={`text-sm font-bold ${task.checked ? "text-emerald-700 line-through decoration-emerald-300" : "text-slate-700"}`}
                                  >
                                    {task.label}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {/* NOTES TAB */}
                    {activeTab === "notes" && (
                      <div className="animate-in fade-in duration-300 h-full">
                        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
                          <div className="p-3 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                              <StickyNote size={14} /> Internal Notes
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Autosaves on Save
                            </span>
                          </div>
                          <textarea
                            value={editForm.internal_notes}
                            onChange={(e) =>
                              updateForm("internal_notes", e.target.value)
                            }
                            className="flex-1 w-full p-4 resize-none outline-none text-sm text-slate-700 font-medium leading-relaxed"
                            placeholder="Type internal production notes here..."
                          ></textarea>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
