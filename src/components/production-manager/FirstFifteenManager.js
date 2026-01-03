"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Mic2,
  Headphones,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
  Mail,
  Send,
  User,
  Hash,
  BookOpen,
  CalendarDays,
  ShieldAlert,
  Ban,
  Undo2,
  Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Helper for date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export default function FirstFifteenManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    // Explicitly fetching items where parent status is 'f15_production' OR 'approved'
    const { data, error } = await supabase
      .from("4_first_15")
      .select(
        `
        *,
        request:2_booking_requests!inner (
          id,
          book_title,
          client_name,
          ref_number,
          cover_image_url,
          email,
          status
        )
      `
      )
      .eq("approved", false)
      .in("request.status", ["approved", "f15_production"])
      .order("due_date", { ascending: true });

    if (error) {
      console.error("Error fetching F15:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---

  const updateField = async (id, field, value) => {
    // Optimistic
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    // Database
    await supabase
      .from("4_first_15")
      .update({ [field]: value })
      .eq("id", id);
  };

  const toggleRevision = async (item) => {
    const newVal = !item.revision_req;
    updateField(item.id, "revision_req", newVal);
  };

  const updateStrikes = async (id, currentVal, change) => {
    const newVal = Math.min(Math.max(0, currentVal + change), 3);
    updateField(id, "strike_count", newVal);
  };

  const sendNudge = async (id) => {
    if (!confirm("Record a 'Nudge Sent' for today?")) return;
    const today = new Date().toISOString().split("T")[0];
    updateField(id, "last_nudge_date", today);
  };

  const approveF15 = async (item) => {
    if (
      !confirm(
        `Approve F15 for "${item.request.book_title}" and move to Full Production?`
      )
    )
      return;

    // 1. Mark F15 table as approved
    await supabase
      .from("4_first_15")
      .update({ approved: true })
      .eq("id", item.id);

    // 2. Update Main Status to 'production'
    await supabase
      .from("2_booking_requests")
      .update({ status: "production" })
      .eq("id", item.request.id);

    fetchItems();
  };

  const failF15 = async (item) => {
    if (
      !confirm(
        `Fail F15 for "${item.request.book_title}"? This will move client to REJECTED.`
      )
    )
      return;

    await supabase
      .from("2_booking_requests")
      .update({ status: "rejected" })
      .eq("id", item.request.id);
    fetchItems();
  };

  // --- RENDER HELPERS ---
  const DateBlock = ({ label, value, field, id, highlight }) => (
    <div
      className={`p-3 rounded-xl border flex flex-col gap-1 w-full transition-colors ${
        highlight
          ? "bg-red-50 border-red-200"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">
        {label}
      </span>
      <input
        type="date"
        className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full p-0"
        value={value || ""}
        onChange={(e) => updateField(id, field, e.target.value)}
      />
    </div>
  );

  if (loading)
    return (
      <div className="text-center py-24 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        <Loader2 className="animate-spin inline mr-2" /> Loading F15 Queue...
      </div>
    );

  if (items.length === 0)
    return (
      <div className="text-center py-32 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
        <div className="flex justify-center mb-4 text-slate-300">
          <Headphones size={48} />
        </div>
        <h3 className="text-slate-900 font-black uppercase tracking-wide mb-2">
          F15 Queue Empty
        </h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
          Move projects here from Requests or Onboarding.
        </p>
      </div>
    );

  return (
    <div className="w-full space-y-8">
      {items.map((item) => {
        const isLate =
          item.due_date &&
          new Date(item.due_date) < new Date() &&
          !item.sent_date;
        const waitingOnClient = item.sent_date && !item.client_feedback_date;
        const inRevision = item.revision_req;
        const strikes = item.strike_count || 0;

        // Card Styling
        let statusColor = "bg-white border-slate-200";
        if (strikes >= 3)
          statusColor = "bg-red-50/30 border-red-200 ring-1 ring-red-100";
        else if (inRevision) statusColor = "bg-orange-50/30 border-orange-200";

        return (
          <div
            key={item.id}
            className={`rounded-[2.5rem] p-8 shadow-sm border transition-all hover:shadow-lg relative overflow-hidden group ${statusColor}`}
          >
            {/* Top Progress Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 ${
                inRevision
                  ? "bg-orange-400"
                  : waitingOnClient
                  ? "bg-purple-400"
                  : isLate
                  ? "bg-red-500"
                  : "bg-teal-500"
              }`}
            />

            <div className="flex flex-col xl:flex-row gap-10">
              {/* --- LEFT: PROJECT INFO --- */}
              <div className="w-full xl:w-1/4 flex flex-col gap-6">
                <div className="flex gap-4">
                  {/* Cover */}
                  <div className="w-20 h-28 bg-white rounded-2xl shrink-0 overflow-hidden border border-slate-200/50 shadow-sm relative">
                    {item.request.cover_image_url ? (
                      <img
                        src={item.request.cover_image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <BookOpen size={24} />
                      </div>
                    )}
                    {strikes >= 3 && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white backdrop-blur-[1px]">
                        <ShieldAlert size={24} />
                      </div>
                    )}
                  </div>

                  {/* Titles */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                        <Hash size={10} /> {item.request.ref_number || "---"}
                      </span>
                      {inRevision && (
                        <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Revision
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">
                      {item.request.book_title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      <User size={12} /> {item.request.client_name}
                    </div>
                  </div>
                </div>

                {/* Status & Nudge Box */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                      Strikes
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStrikes(item.id, strikes, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-slate-700 text-xs font-bold"
                      >
                        -
                      </button>
                      <span
                        className={`w-4 text-center font-black text-xs ${
                          strikes > 0 ? "text-red-500" : "text-slate-300"
                        }`}
                      >
                        {strikes}
                      </span>
                      <button
                        onClick={() => updateStrikes(item.id, strikes, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-400 hover:text-red-500 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">
                        Last Nudge
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {formatDate(item.last_nudge_date)}
                      </span>
                    </div>
                    <button
                      onClick={() => sendNudge(item.id)}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all"
                      title="Send Nudge"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* --- MIDDLE: WORKFLOW GRID (Matching TSV Columns) --- */}
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. KICKOFF */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                      Kickoff
                    </h4>
                  </div>
                  <DateBlock
                    id={item.id}
                    field="breakdown_received_date"
                    label="Breakdown Rcvd"
                    value={item.breakdown_received_date}
                  />
                  <DateBlock
                    id={item.id}
                    field="due_date"
                    label="F15 Due (Internal)"
                    value={item.due_date}
                    highlight={isLate}
                  />
                  <DateBlock
                    id={item.id}
                    field="sent_date"
                    label="F15 Sent"
                    value={item.sent_date}
                  />
                </div>

                {/* 2. CLIENT REVIEW */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-900">
                      Client Review
                    </h4>
                  </div>
                  <DateBlock
                    id={item.id}
                    field="client_due_date"
                    label="Approval Due"
                    value={item.client_due_date}
                  />
                  <DateBlock
                    id={item.id}
                    field="client_feedback_date"
                    label="Feedback Rcvd"
                    value={item.client_feedback_date}
                  />
                </div>

                {/* 3. REVISION */}
                <div
                  className={`space-y-3 transition-all duration-300 ${
                    inRevision ? "opacity-100" : "opacity-40 grayscale"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        inRevision
                          ? "bg-orange-100 text-orange-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      3
                    </span>
                    <h4
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        inRevision ? "text-orange-900" : "text-slate-400"
                      }`}
                    >
                      Revision
                    </h4>
                  </div>
                  <DateBlock
                    id={item.id}
                    field="r2_due_date"
                    label="R2 Due (Int)"
                    value={item.r2_due_date}
                  />
                  <DateBlock
                    id={item.id}
                    field="r2_sent_date"
                    label="R2 Sent"
                    value={item.r2_sent_date}
                  />
                  <DateBlock
                    id={item.id}
                    field="f15_r2_client_due_date"
                    label="R2 Approve Due"
                    value={item.f15_r2_client_due_date}
                  />
                </div>

                {/* 4. ACTIONS */}
                <div className="flex flex-col gap-3 justify-end pb-1">
                  <button
                    onClick={() => toggleRevision(item)}
                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 transition-all ${
                      inRevision
                        ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm"
                        : "bg-white border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500"
                    }`}
                  >
                    <RefreshCw size={14} />{" "}
                    {inRevision ? "Revision Active" : "Trigger Revision"}
                  </button>

                  <button
                    onClick={() => approveF15(item)}
                    className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Approve & Ship
                  </button>

                  <button
                    onClick={() => failF15(item)}
                    className="w-full py-3 bg-white border border-slate-100 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2 mt-auto"
                  >
                    <Ban size={14} /> Fail / Refund
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
