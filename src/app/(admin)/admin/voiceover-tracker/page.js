"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";
import VoiceoverProjectModal from "@/src/components/voiceover-tracker/VoiceoverProjectModal";
import VoiceoverTip from "@/src/components/voiceover-tracker/VoiceoverTip";
// Imported the new component here:
import Countdown from "@/src/components/voiceover-tracker/Countdown";

import {
  Mic,
  Clock,
  ArrowRight,
  Trophy,
  Loader2,
  ExternalLink,
  FolderOpen,
  AlertTriangle,
  Search,
  ChevronDown,
  Check,
  ChevronLeft,
  Trash2,
  Star,
  Archive,
  RotateCcw,
  BarChart3,
  TrendingUp,
  Wand2,
  User,
  AlertCircle,
  Zap,
  Send,
  ArrowUpDown,
  Pencil,
  Flame,
  Ban,
  ArrowLeft, // Added ArrowLeft here as it was missing in your imports previously
} from "lucide-react";

const supabase = createClient();

// --- UI COMPONENTS ---
const CustomSelect = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative z-20 w-full md:w-auto" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl px-4 py-3 transition-all justify-between min-w-[140px]"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-slate-500" />}
          {options.find((o) => o.value === value)?.label || label}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="flex items-center justify-between w-full px-4 py-3 text-left text-xs font-bold uppercase text-slate-400 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- CHART COMPONENTS ---
const MetricCard = ({ label, value, icon: Icon, color }) => (
  <div
    className={`p-5 rounded-3xl border bg-slate-800/30 backdrop-blur-sm relative overflow-hidden group ${color === "green" ? "border-green-500/20" : color === "purple" ? "border-purple-500/20" : color === "blue" ? "border-blue-500/20" : color === "red" ? "border-red-500/20" : "border-slate-700"}`}
  >
    <div
      className={`absolute -right-4 -top-4 p-8 rounded-full opacity-5 group-hover:opacity-10 transition-all ${color === "green" ? "bg-green-500" : color === "purple" ? "bg-purple-500" : color === "blue" ? "bg-blue-500" : color === "red" ? "bg-red-500" : "bg-slate-500"}`}
    />
    <div className="flex items-center justify-between mb-3">
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </p>
      {Icon && (
        <Icon
          size={16}
          className={
            color === "green"
              ? "text-green-400"
              : color === "purple"
                ? "text-purple-400"
                : color === "blue"
                  ? "text-blue-400"
                  : color === "red"
                    ? "text-red-400"
                    : "text-slate-400"
          }
        />
      )}
    </div>
    <h3 className="text-2xl md:text-3xl font-black text-white">{value}</h3>
  </div>
);

const FunnelChart = ({ data }) => {
  const max = Math.max(data.auditions, 1);
  return (
    <div className="flex flex-col gap-4">
      {[
        { l: "Auditions", v: data.auditions, c: "bg-slate-600" },
        { l: "Submitted", v: data.submitted, c: "bg-blue-600" },
        { l: "Shortlist", v: data.shortlist, c: "bg-purple-500" },
        { l: "Booked", v: data.booked, c: "bg-green-500" },
      ].map((step, i) => (
        <div key={step.l} className="group relative">
          <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1.5">
            <span>{step.l}</span>
            <span>{step.v}</span>
          </div>
          <div className="h-3 md:h-4 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{
                width: `${(step.v / (i === 0 ? Math.max(data.auditions, 1) : max)) * 100}%`,
              }}
              className={`h-full ${step.c} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data, colors }) => {
  const total = data.reduce((acc, val) => acc + val.value, 0);
  let cumulative = 0;
  if (total === 0)
    return (
      <div className="w-full h-40 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase border-4 border-slate-800 rounded-full">
        No Data
      </div>
    );
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40">
      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
        {data.map((item, i) => {
          const percentage = item.value / total;
          const strokeDasharray = `${percentage * 314} 314`;
          const strokeDashoffset = -cumulative * 314;
          cumulative += percentage;
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={colors[i]}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl md:text-2xl font-black text-white">
          {total}
        </span>
        <span className="text-[8px] font-bold uppercase text-slate-500 tracking-widest">
          Total
        </span>
      </div>
    </div>
  );
};

const BarChart = ({ data }) => {
  if (data.length === 0)
    return (
      <div className="h-40 flex items-center justify-center text-xs text-slate-600">
        No history available
      </div>
    );
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end justify-between h-32 md:h-40 gap-1 md:gap-2 w-full">
      {data.map((item, i) => {
        const height = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-2 flex-1 group"
          >
            <div className="relative w-full bg-slate-900 rounded-t-md flex items-end h-full overflow-hidden">
              <div
                style={{ height: `${height}%` }}
                className="w-full bg-gradient-to-t from-blue-600 to-indigo-400 opacity-80 group-hover:opacity-100 transition-all duration-500 relative"
              >
                {item.value > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[7px] md:text-[9px] font-black py-0.5 px-1 md:px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.value}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[7px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden md:block">
              {item.label}
            </span>
            <span className="text-[6px] md:text-[7px] font-bold text-slate-500 uppercase tracking-wider md:hidden">
              {item.label.substring(0, 1)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const DailyHeatmap = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex justify-between items-end h-16 gap-1 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-2">
          <div className="w-full bg-slate-900 rounded-md h-full relative overflow-hidden group">
            <div
              style={{ height: `${max > 0 ? (d.value / max) * 100 : 0}%` }}
              className="absolute bottom-0 w-full bg-blue-500/50 group-hover:bg-blue-400 transition-all rounded-md"
            />
          </div>
          <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase">
            {d.day.substring(0, 1)}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- 3. MAIN PAGE ---

export default function VoiceoverTrackerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Auditions");

  // --- FILTERS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgency");

  // --- MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // --- CONFIRM MODAL ---
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("11_voiceover_tracker")
      .select("*")
      .order("due_date", { ascending: true });
    if (error) console.error(error);
    else setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HELPERS ---
  const getTimeRemaining = (isoDate) => {
    if (!isoDate) return null;
    return (new Date(isoDate) - new Date()) / (1000 * 60 * 60);
  };

  const isStale = (date) => {
    if (!date) return false;
    const diffTime = Math.abs(new Date() - new Date(date));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) > 7;
  };

  const panicCount = useMemo(() => {
    return items.filter(
      (i) =>
        i.status === "inbox" &&
        getTimeRemaining(i.due_date) < 6 &&
        getTimeRemaining(i.due_date) > -1
    ).length;
  }, [items]);

  // --- FILTER ENGINE ---
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (activeTab === "Auditions")
      result = result.filter((i) => i.status === "inbox");
    else if (activeTab === "Submitted")
      result = result.filter((i) => i.status === "submitted");
    else if (activeTab === "Shortlist")
      result = result.filter((i) => i.status === "shortlist");
    else if (activeTab === "Booked")
      result = result.filter((i) => i.status === "booked");
    else if (activeTab === "Archives")
      result = result.filter((i) =>
        ["archived", "rejected"].includes(i.status)
      );
    else if (activeTab === "Skipped")
      result = result.filter((i) => i.status === "skipped");

    if (focusFilter !== "all") {
      result = result.filter((i) => {
        const hrs = getTimeRemaining(i.due_date);
        if (focusFilter === "overdue") return hrs < 0;
        if (focusFilter === "critical") return hrs > 0 && hrs <= 3;
        if (focusFilter === "get_ready") return hrs > 0 && hrs <= 12;
        if (focusFilter === "fast") return hrs > 0 && hrs <= 24;
        if (focusFilter === "upcoming") return hrs > 24;
        return true;
      });
    }

    if (clientFilter !== "all")
      result = result.filter((i) => i.client_name === clientFilter);
    if (searchQuery)
      result = result.filter(
        (i) =>
          i.project_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    result.sort((a, b) => {
      if (sortBy === "urgency") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });
    return result;
  }, [items, activeTab, focusFilter, clientFilter, searchQuery, sortBy]);

  const staleCount = useMemo(
    () =>
      items.filter((i) => i.status === "submitted" && isStale(i.due_date))
        .length,
    [items]
  );

  // --- INSIGHTS ENGINE ---
  const insights = useMemo(() => {
    const submitted = items.filter((i) =>
      ["submitted", "shortlist", "booked", "rejected", "archived"].includes(
        i.status
      )
    ).length;
    const inbox = items.filter((i) => i.status === "inbox").length;
    const shortlist = items.filter((i) =>
      ["shortlist", "booked"].includes(i.status)
    ).length;
    const booked = items.filter((i) => i.status === "booked").length;
    const skipped = items.filter((i) => i.status === "skipped").length;
    const asp = items.filter((i) => i.client_name === "ASP").length;
    const idiom = items.filter((i) => i.client_name === "IDIOM").length;
    const totalClients = items.length;

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const count = items.filter((x) => {
        const xd = new Date(x.created_at);
        return (
          !isNaN(xd) &&
          xd.getMonth() === d.getMonth() &&
          xd.getFullYear() === d.getFullYear()
        );
      }).length;
      months.push({
        label: d.toLocaleString("default", { month: "short" }),
        value: count,
      });
    }

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts = new Array(7).fill(0);
    items.forEach((item) => {
      const d = new Date(item.created_at || item.due_date);
      if (!isNaN(d)) dayCounts[d.getDay()]++;
    });
    const heatmap = dayCounts.map((val, i) => ({ day: days[i], value: val }));

    return {
      counts: { auditions: inbox, submitted, shortlist, booked, skipped },
      rates: {
        booking: submitted ? ((booked / submitted) * 100).toFixed(1) : 0,
        shortlist: submitted ? ((shortlist / submitted) * 100).toFixed(1) : 0,
      },
      clients: [
        { label: "ASP", value: asp },
        { label: "IDIOM", value: idiom },
        { label: "Other", value: totalClients - asp - idiom },
      ],
      history: months,
      heatmap: heatmap,
    };
  }, [items]);

  // --- ACTIONS ---
  const updateStatus = async (id, newStatus) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, status: newStatus } : i
    );
    setItems(updated);
    await supabase
      .from("11_voiceover_tracker")
      .update({ status: newStatus })
      .eq("id", id);
    setConfirmConfig({ isOpen: false });
  };

  const handleBulkArchive = async () => {
    const staleIds = items
      .filter((i) => i.status === "submitted" && isStale(i.due_date))
      .map((i) => i.id);
    if (staleIds.length === 0) return;
    const updated = items.map((i) =>
      staleIds.includes(i.id) ? { ...i, status: "archived" } : i
    );
    setItems(updated);
    for (const id of staleIds)
      await supabase
        .from("11_voiceover_tracker")
        .update({ status: "archived" })
        .eq("id", id);
  };

  const handleRequestAction = (id, actionType, e) => {
    e.stopPropagation();
    let config = {};

    switch (actionType) {
      case "submit":
        config = {
          title: "Submit Audition?",
          message: "Moving this project to the 'Submitted' pipeline.",
          color: "blue",
          icon: Send,
          action: () => updateStatus(id, "submitted"),
        };
        break;
      case "shortlist":
        config = {
          title: "Shortlisted!",
          message: "Congrats! Moving to 'Shortlist'.",
          color: "purple",
          icon: Star,
          action: () => updateStatus(id, "shortlist"),
        };
        break;
      case "book":
        config = {
          title: "Project Booked!",
          message: "Awesome! Moving to 'Booked'.",
          color: "green",
          icon: Trophy,
          action: () => updateStatus(id, "booked"),
        };
        break;
      case "archive":
        config = {
          title: "Archive Project?",
          message: "Moving to archives. Stats will still count.",
          color: "slate",
          icon: Archive,
          action: () => updateStatus(id, "archived"),
        };
        break;
      case "skip":
        config = {
          title: "Skip Audition?",
          message: "Moving to 'Skipped'. Stats will track this pass.",
          color: "red",
          icon: Ban,
          action: () => updateStatus(id, "skipped"),
        };
        break;
      case "recover":
        config = {
          title: "Recover Project?",
          message: "Moving back to Inbox.",
          color: "blue",
          icon: RotateCcw,
          action: () => updateStatus(id, "inbox"),
        };
        break;
      case "demote":
        config = {
          title: "Move Back?",
          message: "Demoting status back to 'Submitted'.",
          color: "slate",
          icon: ArrowLeft,
          action: () => updateStatus(id, "submitted"),
        };
        break;
      case "delete":
        config = {
          title: "Permanently Delete?",
          message: "This cannot be undone. It will be wiped from stats.",
          color: "red",
          icon: Trash2,
          action: async () => {
            setItems((prev) => prev.filter((i) => i.id !== id));
            await supabase.from("11_voiceover_tracker").delete().eq("id", id);
            setConfirmConfig({ isOpen: false });
          },
        };
        break;
      default:
        return;
    }
    setConfirmConfig({ isOpen: true, ...config });
  };

  const handleOpenModal = (item = null) => {
    setEditingProject(item);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 md:p-8 pb-32 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* HEADER & TABS */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-400 mb-4 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={14} /> Back to Hub
          </Link>

          {/* MOBILE SCROLLABLE TABS */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0 md:flex-wrap md:pb-0">
            {[
              "Auditions",
              "Submitted",
              "Shortlist",
              "Booked",
              "Archives",
              "Skipped",
              "Stats",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* --- PANIC BAR (6 HOUR ALERT) --- */}
        {panicCount > 0 && activeTab === "Auditions" && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 text-white rounded-full shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-red-100">
                  Action Required
                </h3>
                <p className="text-xs font-bold text-red-300">
                  You have {panicCount} auditions due in less than 6 hours.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFocusFilter("get_ready")}
              className="w-full md:w-auto px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-black uppercase text-[10px] tracking-widest rounded-lg transition-colors"
            >
              Focus Mode
            </button>
          </div>
        )}

        {/* --- CONTENT AREA --- */}
        {activeTab === "Stats" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <MetricCard
                label="Submissions"
                value={insights.counts.submitted}
                icon={Mic}
              />
              <MetricCard
                label="Booked"
                value={insights.counts.booked}
                icon={Trophy}
                color="green"
              />
              <MetricCard
                label="Win Rate"
                value={`${insights.rates.booking}%`}
                icon={TrendingUp}
                color="purple"
              />
              <MetricCard
                label="Pass Rate"
                value={insights.counts.skipped}
                icon={Ban}
                color="red"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-slate-800/30 border border-slate-700 rounded-3xl p-6 md:p-8">
                <h3 className="text-lg font-black uppercase text-white mb-6">
                  Pipeline Funnel
                </h3>
                <FunnelChart data={insights.counts} />
              </div>
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-6 md:p-8">
                  <h3 className="text-lg font-black uppercase text-white mb-6 flex items-center justify-between">
                    Monthly Velocity{" "}
                    <BarChart3 size={18} className="text-slate-500" />
                  </h3>
                  <BarChart data={insights.history} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center relative">
                    <h3 className="text-xs font-black uppercase text-slate-500 mb-4 self-start">
                      Client Loyalty
                    </h3>
                    <DonutChart
                      data={insights.clients}
                      colors={["#3b82f6", "#a855f7", "#64748b"]}
                    />
                  </div>
                  <VoiceoverTip />
                </div>
              </div>
            </div>
            <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-black uppercase text-white mb-6">
                Submission Heatmap
              </h3>
              <DailyHeatmap data={insights.heatmap} />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* TOOLBAR */}
            <div className="flex flex-col xl:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Projects..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:border-blue-500 outline-none uppercase placeholder:normal-case"
                />
              </div>
              <div className="flex flex-col md:flex-row flex-wrap gap-2">
                {activeTab === "Auditions" && (
                  <CustomSelect
                    label="Urgency"
                    value={focusFilter}
                    icon={AlertCircle}
                    options={[
                      { label: "Show All", value: "all" },
                      { label: "🚨 Overdue", value: "overdue" },
                      { label: "⚡ Critical (<3h)", value: "critical" },
                      { label: "🔥 Get Ready (<12h)", value: "get_ready" },
                      { label: "🏃 Fast (<24h)", value: "fast" },
                      { label: "📅 Upcoming", value: "upcoming" },
                    ]}
                    onChange={setFocusFilter}
                  />
                )}
                <div className="flex gap-2 w-full md:w-auto">
                  <CustomSelect
                    label="Client"
                    value={clientFilter}
                    icon={User}
                    options={[
                      { label: "All Clients", value: "all" },
                      { label: "ASP", value: "ASP" },
                      { label: "IDIOM", value: "IDIOM" },
                    ]}
                    onChange={setClientFilter}
                  />
                  <CustomSelect
                    label="Sort"
                    value={sortBy}
                    icon={ArrowUpDown}
                    options={[
                      { label: "Urgency", value: "urgency" },
                      { label: "Newest", value: "newest" },
                    ]}
                    onChange={setSortBy}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsModalOpen(true);
                }}
                className="w-full xl:w-auto bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
              >
                <Wand2 size={16} /> New Audition
              </button>
            </div>

            {/* STALE ALERT */}
            {activeTab === "Submitted" && staleCount > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-orange-900/20 border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-orange-500" size={20} />
                  <span className="text-xs font-bold text-orange-200">
                    You have {staleCount} stale submissions (Older than 7 days).
                  </span>
                </div>
                <button
                  onClick={handleBulkArchive}
                  className="w-full md:w-auto px-4 py-2 bg-orange-500/20 hover:bg-orange-500 text-orange-200 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <Archive size={12} /> Auto-Archive All
                </button>
              </div>
            )}

            {/* LIST VIEW */}
            {loading ? (
              <div className="flex justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold uppercase text-xs tracking-widest border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                {activeTab === "Auditions"
                  ? "Inbox Zero! 🎉"
                  : "No projects found"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    onClick={() => {
                      setEditingProject(item);
                      setIsModalOpen(true);
                    }}
                    key={item.id}
                    className="group bg-slate-800/40 border border-slate-700/50 hover:border-slate-500 hover:bg-slate-800 rounded-2xl p-4 md:p-5 transition-all flex flex-col md:flex-row gap-4 md:gap-6 relative overflow-hidden cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.client_name === "ASP" ? "bg-blue-500" : item.client_name === "IDIOM" ? "bg-purple-500" : "bg-slate-500"}`}
                    />

                    {/* INFO: CLIENT & ROLE */}
                    <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2 md:w-32 shrink-0">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded w-fit border ${item.client_name === "ASP" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : item.client_name === "IDIOM" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-slate-700 text-slate-400 border-slate-600"}`}
                      >
                        {item.client_name || "UNK"}
                      </span>
                      {item.role && (
                        <div className="text-xs font-bold text-slate-400 truncate flex items-center gap-1">
                          <User size={10} /> {item.role}
                        </div>
                      )}
                      {/* Mobile Urgency Badge */}
                      <div className="md:hidden ml-auto">
                        {activeTab === "Auditions" && (
                          <Countdown date={item.due_date} />
                        )}
                      </div>
                    </div>

                    {/* INFO: TITLE & LINKS */}
                    <div className="flex-grow min-w-0 md:w-1/3">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-blue-200 transition-colors">
                          {item.project_title}
                        </h3>
                        <div className="hidden md:block">
                          {activeTab === "Auditions" && (
                            <Countdown date={item.due_date} />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs text-slate-400 font-medium">
                        {item.audition_link && (
                          <a
                            href={item.audition_link}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700"
                          >
                            <ExternalLink size={10} /> Audition
                          </a>
                        )}
                        {item.file_link && (
                          <a
                            href={item.file_link}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 hover:text-blue-400 transition-colors bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700"
                          >
                            <FolderOpen size={10} /> Files
                          </a>
                        )}
                      </div>
                    </div>

                    {/* INFO: RATE/NOTES (Collapsible on mobile maybe? For now just showing) */}
                    <div className="md:w-1/4 border-l border-slate-700/50 pl-4 md:pl-6">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Rate / Notes
                      </p>
                      <div className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed opacity-70">
                        {item.rate || item.specs || (
                          <span className="italic opacity-50">
                            No details provided
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2 md:ml-auto pt-4 md:pt-0 border-t md:border-0 border-slate-700/50 mt-2 md:mt-0 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(item);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      {activeTab === "Auditions" && (
                        <>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "skip", e)
                            }
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-all"
                            title="Skip/Pass"
                          >
                            <Ban size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "submit", e)
                            }
                            className="group/btn relative px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                          >
                            <span>Submit</span>{" "}
                            <Send
                              size={12}
                              className="group-hover/btn:translate-x-1 transition-transform"
                            />
                          </button>
                        </>
                      )}
                      {activeTab === "Submitted" && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "shortlist", e)
                            }
                            className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 transition-all"
                            title="Shortlist"
                          >
                            <Star size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "book", e)
                            }
                            className="p-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20 transition-all"
                            title="Book It!"
                          >
                            <Trophy size={16} />
                          </button>
                          <div className="w-px h-8 bg-slate-700 mx-1" />
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "archive", e)
                            }
                            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
                            title="Archive"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      )}
                      {activeTab === "Shortlist" && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "book", e)
                            }
                            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap"
                            title="Book It!"
                          >
                            <Trophy size={14} /> Book
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "demote", e)
                            }
                            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                            title="Demote"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "archive", e)
                            }
                            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                            title="Archive"
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      )}
                      {(activeTab === "Skipped" ||
                        activeTab === "Archives" ||
                        activeTab === "Booked") && (
                        <>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "recover", e)
                            }
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-all"
                            title="Recover"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "delete", e)
                            }
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete Forever"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <VoiceoverProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={editingProject}
        onSave={handleModalSave}
      />

      {/* --- CONFIRM ACTION MODAL --- */}
      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden group`}
          >
            <div
              className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${confirmConfig.color === "green" ? "bg-green-500" : confirmConfig.color === "red" ? "bg-red-500" : confirmConfig.color === "blue" ? "bg-blue-500" : confirmConfig.color === "purple" ? "bg-purple-500" : "bg-slate-500"}`}
            />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 ${confirmConfig.color === "green" ? "bg-green-500/20 text-green-400" : confirmConfig.color === "red" ? "bg-red-500/20 text-red-400" : confirmConfig.color === "blue" ? "bg-blue-500/20 text-blue-400" : confirmConfig.color === "purple" ? "bg-purple-500/20 text-purple-400" : "bg-slate-800 text-slate-400"}`}
            >
              {confirmConfig.icon ? (
                <confirmConfig.icon size={32} />
              ) : (
                <AlertCircle size={32} />
              )}
            </div>

            <h3 className="text-xl font-black uppercase text-white mb-2 relative z-10">
              {confirmConfig.title}
            </h3>
            <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed relative z-10">
              {confirmConfig.message}
            </p>

            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => setConfirmConfig({ isOpen: false })}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmConfig.action}
                className={`flex-1 py-3 rounded-xl font-bold uppercase text-white shadow-lg transition-colors ${confirmConfig.color === "green" ? "bg-green-600 hover:bg-green-500 shadow-green-900/20" : confirmConfig.color === "red" ? "bg-red-600 hover:bg-red-500 shadow-red-900/20" : confirmConfig.color === "purple" ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20" : confirmConfig.color === "blue" ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20" : "bg-slate-600 hover:bg-slate-500"}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .action-btn {
          @apply px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
