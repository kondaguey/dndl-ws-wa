"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import Link from "next/link";
import VoiceoverProjectModal from "@/src/components/voiceover-tracker/VoiceoverProjectModal";
import Countdown from "@/src/components/voiceover-tracker/Countdown";
import StickyNotes from "@/src/components/voiceover-tracker/StickyNotes";
import VoiceoverStats from "@/src/components/voiceover-tracker/VoiceoverStats";

import {
  Mic,
  Trophy,
  Loader2,
  ExternalLink,
  FolderOpen,
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
  Send,
  ArrowUpDown,
  Pencil,
  Ban,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from "lucide-react";

const supabase = createClient();

// --- HELPER COMPONENTS ---
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
    <div className="relative z-20 w-full sm:w-auto" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-300 text-xs font-bold uppercase rounded-xl px-4 py-3 transition-all justify-between min-w-[140px]"
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={14} className="text-slate-500 shrink-0" />}
          <span className="truncate">
            {options.find((o) => o.value === value)?.label || label}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
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

export default function VoiceoverTrackerPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Auditions");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusFilter, setFocusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgency");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
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
    if (error) console.error("Fetch Error:", error);
    else setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FILTER LOGIC ---
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

  // --- ACTIONS ---
  const updateStatus = async (id, newStatus, extraFields = {}) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, status: newStatus, ...extraFields } : i
    );
    setItems(updated);
    setConfirmConfig({ isOpen: false });

    const { error } = await supabase
      .from("11_voiceover_tracker")
      .update({ status: newStatus, ...extraFields })
      .eq("id", id);

    if (error) {
      console.error("Update Failed:", error);
      alert("Failed to save changes. Please check your connection.");
      fetchData();
    }
  };

  const handleRequestAction = (id, actionType, e) => {
    e.stopPropagation();
    let config = {};
    const actions = {
      submit: {
        title: "Submit Audition?",
        msg: "Moving to 'Submitted' pipeline.",
        color: "blue",
        icon: Send,
        fn: () =>
          updateStatus(id, "submitted", {
            submitted_at: new Date().toISOString(),
            submitted_timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
      },
      revert: {
        title: "Revert to Audition?",
        msg: "Moving back to Inbox. This clears the submission time.",
        color: "slate",
        icon: ArrowLeft,
        fn: () =>
          updateStatus(id, "inbox", {
            submitted_at: null,
          }),
      },
      shortlist: {
        title: "Shortlist!",
        msg: "Congrats! Moving to 'Shortlist'.",
        color: "purple",
        icon: Star,
        fn: () => updateStatus(id, "shortlist"),
      },
      book: {
        title: "Project Booked!",
        msg: "Awesome! Moving to 'Booked'.",
        color: "green",
        icon: Trophy,
        fn: () => updateStatus(id, "booked"),
      },
      archive: {
        title: "Archive Project?",
        msg: "Moving to archives.",
        color: "slate",
        icon: Archive,
        fn: () => updateStatus(id, "archived"),
      },
      skip: {
        title: "Skip Audition?",
        msg: "Moving to 'Skipped'.",
        color: "red",
        icon: Ban,
        fn: () => updateStatus(id, "skipped"),
      },
      recover: {
        title: "Recover Project?",
        msg: "Moving back to Inbox.",
        color: "blue",
        icon: RotateCcw,
        fn: () => updateStatus(id, "inbox"),
      },
      delete: {
        title: "Permanently Delete?",
        msg: "This cannot be undone.",
        color: "red",
        icon: Trash2,
        fn: async () => {
          setItems((prev) => prev.filter((i) => i.id !== id));
          await supabase.from("11_voiceover_tracker").delete().eq("id", id);
          setConfirmConfig({ isOpen: false });
        },
      },
    };

    if (actionType === "demote")
      config = {
        title: "Move Back?",
        message: "Demoting to Submitted.",
        color: "slate",
        icon: ArrowLeft,
        action: () => updateStatus(id, "submitted"),
      };
    else if (actions[actionType])
      config = {
        title: actions[actionType].title,
        message: actions[actionType].msg,
        color: actions[actionType].color,
        icon: actions[actionType].icon,
        action: actions[actionType].fn,
      };

    setConfirmConfig({ isOpen: true, ...config });
  };

  const handleModalSave = () => {
    fetchData();
  };

  // --- COMPONENT: STATUS BADGE ---
  const StatusBadge = ({ item }) => {
    const formatSubmission = (iso, tz) => {
      if (!iso) return { date: "UNK", time: "--" };
      try {
        const d = new Date(iso);
        const targetZone =
          tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const dateStr = d.toLocaleDateString("en-US", {
          timeZone: targetZone,
          month: "short",
          day: "numeric",
        });
        const timeStr = d.toLocaleTimeString("en-US", {
          timeZone: targetZone,
          hour: "numeric",
          minute: "2-digit",
        });
        return { date: dateStr, time: timeStr };
      } catch (e) {
        return { date: "ERR", time: "--" };
      }
    };

    if (item.status === "submitted") {
      const { date, time } = formatSubmission(
        item.submitted_at,
        item.submitted_timezone
      );
      return (
        <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-md">
          <span className="text-[8px] font-black uppercase tracking-tight leading-none mb-0.5">
            {date}
          </span>
          <span className="text-[7px] font-bold opacity-80 leading-none">
            {time}
          </span>
        </div>
      );
    }
    if (item.status === "booked") {
      return (
        <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-green-500/30 bg-green-500/10 text-green-400 shadow-md shadow-green-900/20">
          <Trophy size={14} className="mb-0.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">
            WON
          </span>
        </div>
      );
    }
    if (item.status === "shortlist") {
      return (
        <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-md">
          <Star size={14} className="mb-0.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">
            SHORT
          </span>
        </div>
      );
    }
    if (item.status === "skipped") {
      return (
        <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 aspect-square rounded-xl border-2 border-slate-700 bg-slate-800 text-slate-500">
          <Ban size={14} className="mb-0.5" />
          <span className="text-[7px] font-black uppercase tracking-wider">
            SKIP
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-40 font-sans relative">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* --- 1. CENTERED TOP NAVIGATION (Fixed Clipping) --- */}
        <div className="mb-8 flex justify-start md:justify-center">
          {/* FIX: Changed py-2 to p-4 (adds padding on ALL sides)
             FIX: Changed -mx-4 to -mx-4 to pull container to edge, 
             but the p-4 ensures the content inside isn't cut off by overflow 
          */}
          <div className="pt-18 md:pt-2 flex gap-2 overflow-x-auto md:overflow-visible p-4 scrollbar-hide -mx-4 md:mx-0 md:p-0 md:flex-wrap">
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

        {activeTab === "Stats" ? (
          <VoiceoverStats data={items} />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* --- 2. RESPONSIVE SEARCH & FILTERS --- */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8 items-stretch lg:items-center">
              <div className="relative flex-grow lg:flex-grow-0 lg:w-96">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Projects..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white focus:border-blue-500 outline-none uppercase placeholder:normal-case transition-colors"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 flex-wrap flex-grow">
                {activeTab === "Auditions" && (
                  <CustomSelect
                    label="Urgency"
                    value={focusFilter}
                    icon={AlertCircle}
                    options={[
                      { label: "Show All", value: "all" },
                      { label: "🚨 Overdue", value: "overdue" },
                      { label: "📅 Upcoming", value: "upcoming" },
                    ]}
                    onChange={setFocusFilter}
                  />
                )}
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

              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsModalOpen(true);
                }}
                className="w-full lg:w-auto bg-white text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg active:scale-95 whitespace-nowrap shrink-0"
              >
                <Wand2 size={16} /> New Audition
              </button>
            </div>

            {/* --- LOADING & EMPTY STATES --- */}
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
                {/* --- 3. RESPONSIVE CARD LAYOUT --- */}
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

                    {/* CLIENT & ROLE */}
                    <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:w-32 shrink-0">
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
                    </div>

                    {/* MAIN INFO & LINKS */}
                    <div className="flex-grow min-w-0 md:flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-bold text-white truncate group-hover:text-blue-200 transition-colors">
                          {item.project_title}
                        </h3>
                        <div onClick={(e) => e.stopPropagation()}>
                          {item.status === "inbox" ? (
                            <Countdown date={item.due_date} />
                          ) : (
                            <StatusBadge item={item} />
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

                    {/* NOTES/RATE */}
                    <div className="md:w-48 lg:w-64 border-l border-slate-700/50 pl-0 md:pl-6 pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
                      <div className="flex flex-row md:flex-col gap-2 md:gap-0 justify-between md:justify-start items-center md:items-start">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1 hidden md:block">
                          Rate / Notes
                        </p>
                        <div className="text-xs text-slate-300 font-mono line-clamp-2 md:line-clamp-3 leading-relaxed opacity-70 w-full">
                          {item.rate || item.specs || (
                            <span className="italic opacity-50">
                              No details provided
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-2 md:ml-auto pt-4 md:pt-0 border-t md:border-0 border-slate-700/50 mt-2 md:mt-0 overflow-x-auto pb-2 md:pb-0 px-1 no-scrollbar shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(item);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
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
                          >
                            <Ban size={16} />
                          </button>
                          <div className="p-1">
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
                          </div>
                        </>
                      )}
                      {activeTab === "Submitted" && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "revert", e)
                            }
                            className="p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                            title="Revert to Audition"
                          >
                            <ArrowLeft size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "shortlist", e)
                            }
                            className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 transition-all"
                          >
                            <Star size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "book", e)
                            }
                            className="p-2.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20 transition-all"
                          >
                            <Trophy size={16} />
                          </button>
                          <div className="w-px h-8 bg-slate-700 mx-1" />
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "archive", e)
                            }
                            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
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
                          >
                            <Trophy size={14} /> Book
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "demote", e)
                            }
                            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                          >
                            <ArrowLeft size={14} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "archive", e)
                            }
                            className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "recover", e)
                            }
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-slate-700 transition-all"
                          >
                            <RotateCcw size={14} />
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
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={(e) =>
                              handleRequestAction(item.id, "delete", e)
                            }
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
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

      {/* NEW STICKY NOTES COMPONENT */}
      <StickyNotes />

      {confirmConfig.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden group">
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
