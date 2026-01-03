"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Check,
  X,
  BookOpen,
  Mic2,
  Zap,
  User,
  Undo2,
  CalendarDays,
  FileText,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function IncomingBookings({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("pending");

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("2_booking_requests")
      .select("*")
      .eq("status", activeSubTab)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching requests:", error);
    else setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [activeSubTab]);

  const updateStatus = async (id, newStatus) => {
    if (newStatus === "archived" && !confirm("Reject this request?")) return;

    const { error } = await supabase
      .from("2_booking_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      // 1. Refresh local list immediately
      fetchRequests();

      // 2. Wait 100ms before telling Parent to refresh to ensure DB write is visible
      if (onUpdate) {
        setTimeout(() => {
          onUpdate();
        }, 100);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* --- HEADER & SUB-TABS --- */}
      <div className="flex items-center justify-between">
        <div className="flex p-1 bg-white rounded-full border border-slate-200 shadow-sm">
          {["pending", "approved", "archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeSubTab === tab
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "archived" ? "Rejected" : tab}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
          {requests.length} Projects
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-300 animate-pulse font-bold uppercase tracking-widest text-xs">
          Syncing...
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {activeSubTab} items
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.id}
              className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-start"
            >
              {/* 1. DATE BOX */}
              <div className="shrink-0 flex lg:flex-col items-center justify-center gap-1 bg-slate-50 p-4 rounded-2xl w-full lg:w-28 border border-slate-100 h-full min-h-[100px]">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  {new Date(r.start_date).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </span>
                <span className="text-4xl font-black text-slate-900 leading-none">
                  {new Date(r.start_date).getDate()}
                </span>
                <div className="w-8 h-0.5 bg-slate-200 rounded-full my-1 hidden lg:block" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {r.days_needed} Days
                </span>
              </div>

              {/* 2. MAIN INFO */}
              <div className="flex-grow w-full space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900">
                    {r.book_title}
                  </h3>
                  {r.is_returning && (
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                      Returning
                    </span>
                  )}
                  {r.client_type && (
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-1 rounded-md">
                      {r.client_type}
                    </span>
                  )}
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-300" />
                    <span className="truncate text-slate-600 font-bold">
                      {r.client_name}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="truncate">{r.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-slate-300" />
                    <span className="font-mono text-[11px]">
                      {new Date(r.start_date).toLocaleDateString()} —{" "}
                      {new Date(r.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={14} className="text-slate-300" />
                    <span>
                      {r.word_count ? Number(r.word_count).toLocaleString() : 0}{" "}
                      Words
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic2 size={14} className="text-slate-300" />
                    <span>{r.narration_style || "Solo"}</span>
                    <span className="text-slate-300">•</span>
                    <span>{r.genre || "General"}</span>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {r.discount_applied && r.discount_applied !== "None" && (
                    <span className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2 py-1 rounded-md font-bold text-[10px] uppercase border border-teal-100">
                      <Zap size={10} /> {r.discount_applied} Discount
                    </span>
                  )}
                </div>

                {r.notes && (
                  <div className="flex gap-2 items-start mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <FileText
                      size={12}
                      className="text-slate-400 mt-0.5 shrink-0"
                    />
                    <p className="text-xs text-slate-500 italic leading-relaxed">
                      "{r.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* 3. SLEEK ACTIONS */}
              <div className="flex lg:flex-col gap-2 w-full lg:w-auto justify-end mt-2 lg:mt-0">
                {activeSubTab === "pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(r.id, "approved")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 transition-all shadow-md"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "archived")}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                {activeSubTab === "approved" && (
                  <button
                    onClick={() => updateStatus(r.id, "pending")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-orange-500 hover:border-orange-200 transition-all"
                  >
                    <Undo2 size={14} /> Revert
                  </button>
                )}
                {activeSubTab === "archived" && (
                  <button
                    onClick={() => updateStatus(r.id, "pending")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-orange-500 hover:border-orange-200 transition-all"
                  >
                    <Undo2 size={14} /> Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
