"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  CheckSquare,
  Square,
  CreditCard,
  Mail,
  BookOpen,
  User,
  Clock,
  Ban,
  Calendar,
  UserPlus,
  FolderInput,
  FileEdit,
  FolderOutput,
  PenTool,
  FileCheck,
  DollarSign,
  MailCheck,
  List,
  ArrowRightCircle,
  ShieldAlert,
  Headphones,
  CheckCircle2,
  RefreshCw,
  Rocket,
  Zap,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIGURATION ---
const STEPS = [
  { key: "added_to_contacts", label: "Added to Contacts", icon: UserPlus },
  { key: "backend_folder", label: "Backend Folder Copied", icon: FolderInput },
  { key: "docs_customized", label: "Docs Customized", icon: FileEdit },
  { key: "production_folder", label: "Prod Folder Copied", icon: FolderOutput },
  { key: "contract_sent", label: "Email 1: Contract", icon: Mail },
  { key: "esig_sent", label: "E-Sig Request Sent", icon: PenTool },
  { key: "contract_signed", label: "Contract Signed", icon: FileCheck },
  { key: "deposit_sent", label: "Email 2: Deposit", icon: CreditCard },
  { key: "deposit_paid", label: "Deposit Paid", icon: DollarSign },
  { key: "email_receipt_sent", label: "Email 3: Receipt", icon: MailCheck },
  { key: "breakdown_received", label: "Breakdown Rcvd", icon: List },
  { key: "manuscript_received", label: "Manuscript Rcvd", icon: BookOpen },
  { key: "moved_to_f15", label: "Move to F15", icon: ArrowRightCircle },
];

const TABLE_NAME = "3_onboarding_first_15";

export default function OnboardingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("checklist"); // 'checklist' | 'f15'

  // --- 1. FETCH PIPELINE ---
  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          request:2_booking_requests!inner (
            id,
            book_title,
            client_name,
            client_type,
            cover_image_url,
            status,
            start_date,
            ref_number,
            email
          )
        `
        )
        // Fetch active pipeline items
        .in("request.status", ["approved", "f15_production"])
        .order("id", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Pipeline Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  // --- 2. ACTIONS: ROBUST UPDATES ---

  // A. Fast Track (The Roster Bypass)
  // This takes an item, marks ALL steps complete, and moves to F15 immediately.
  const fastTrackToF15 = async (item) => {
    const confirmMsg =
      item.request.client_type === "Roster"
        ? `Fast-track Roster client "${item.request.book_title}" to First 15?`
        : `Skip Onboarding for "${item.request.book_title}" and move to F15?`;

    if (!confirm(confirmMsg)) return;

    // 1. Generate "All Done" Data
    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const completedDates = {};
    const completedFlags = {};

    STEPS.forEach((step) => {
      completedFlags[step.key] = true;
      completedDates[step.key] = todayStr;
    });

    // Merge with existing dates to preserve history if any exists
    const finalDates = { ...item.step_dates, ...completedDates };

    // 2. Optimistic UI Update (Remove from Checklist, Add to F15 essentially)
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          return {
            ...i,
            ...completedFlags,
            step_dates: finalDates,
            request: { ...i.request, status: "f15_production" },
          };
        }
        return i;
      })
    );

    try {
      // 3. Update DB: Onboarding Table
      const { error: trackerError } = await supabase
        .from(TABLE_NAME)
        .update({
          ...completedFlags,
          step_dates: finalDates,
        })
        .eq("id", item.id);

      if (trackerError) throw trackerError;

      // 4. Update DB: Parent Status
      const { error: parentError } = await supabase
        .from("2_booking_requests")
        .update({ status: "f15_production" })
        .eq("id", item.request.id);

      if (parentError) throw parentError;
    } catch (error) {
      console.error("Fast Track Failed:", error);
      alert("Sync failed. Refreshing...");
      fetchPipeline();
    }
  };

  // B. Standard Checkbox Toggle
  const handleToggleStep = async (item, stepKey) => {
    const isDone = item[stepKey];

    // Special Case: The final "Move to F15" button
    if (stepKey === "moved_to_f15" && !isDone) {
      if (!confirm(`Graduate "${item.request.book_title}" to First 15?`))
        return;

      // Execute the move
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, request: { ...i.request, status: "f15_production" } }
            : i
        )
      );

      await supabase
        .from("2_booking_requests")
        .update({ status: "f15_production" })
        .eq("id", item.request.id);

      // Also mark the specific step as done in background
      await supabase
        .from(TABLE_NAME)
        .update({ [stepKey]: true })
        .eq("id", item.id);

      return;
    }

    // Normal Toggle Logic
    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const updatedDates = { ...item.step_dates };
    if (!isDone) updatedDates[stepKey] = todayStr;
    else delete updatedDates[stepKey];

    // Optimistic Update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, [stepKey]: !isDone, step_dates: updatedDates }
          : i
      )
    );

    await supabase
      .from(TABLE_NAME)
      .update({ [stepKey]: !isDone, step_dates: updatedDates })
      .eq("id", item.id);
  };

  // C. Update Project Status (Postpone/Reject)
  const updateStatus = async (item, newStatus) => {
    if (!confirm(`Move "${item.request.book_title}" to ${newStatus}?`)) return;

    // Optimistic Remove
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    await supabase
      .from("2_booking_requests")
      .update({ status: newStatus })
      .eq("id", item.request.id);

    // If rejecting, clean up the tracker row to keep DB clean
    if (newStatus === "rejected") {
      await supabase.from(TABLE_NAME).delete().eq("id", item.id);
    }
  };

  // D. First 15 Data Handling
  const updateF15Date = async (item, field, value) => {
    const updatedDates = { ...item.step_dates, [field]: value };
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, step_dates: updatedDates } : i
      )
    );
    await supabase
      .from(TABLE_NAME)
      .update({ step_dates: updatedDates })
      .eq("id", item.id);
  };

  const approveF15 = async (item) => {
    if (!confirm(`Approve F15 for "${item.request.book_title}"?`)) return;

    setItems((prev) => prev.filter((i) => i.id !== item.id));

    await supabase
      .from("2_booking_requests")
      .update({ status: "production" })
      .eq("id", item.request.id);
  };

  // --- 3. FILTER & RENDER ---
  const onboardingItems = items.filter((i) => i.request.status === "approved");
  const f15Items = items.filter((i) => i.request.status === "f15_production");

  const displayedItems = subTab === "checklist" ? onboardingItems : f15Items;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 font-bold uppercase tracking-widest gap-4 animate-pulse">
        <Loader2 className="animate-spin" size={32} />
        Syncing Pipeline...
      </div>
    );

  return (
    <div className="relative w-full space-y-8">
      {/* TABS */}
      <div className="flex justify-center">
        <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex">
          <button
            onClick={() => setSubTab("checklist")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              subTab === "checklist"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <BookOpen size={14} /> Onboarding ({onboardingItems.length})
          </button>
          <button
            onClick={() => setSubTab("f15")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
              subTab === "f15"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Headphones size={14} /> First 15 ({f15Items.length})
          </button>
        </div>
      </div>

      {displayedItems.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No projects in {subTab === "checklist" ? "Onboarding" : "First 15"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {displayedItems.map((item) => {
            const isRoster = item.request.client_type === "Roster";

            // --- SHARED HEADER ---
            const Header = () => (
              <div className="flex flex-col md:flex-row gap-6 border-b border-slate-100/50 pb-6 mb-6">
                {/* Cover Image */}
                <div className="w-20 h-28 bg-white rounded-xl shrink-0 overflow-hidden border border-slate-200/50 shadow-sm relative group">
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
                  {item.strike_count >= 3 && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white backdrop-blur-sm">
                      <ShieldAlert size={24} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.request.ref_number && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            #{item.request.ref_number}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                            isRoster
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {item.request.client_type}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight mb-1">
                        {item.request.book_title}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <User size={12} /> {item.request.client_name}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(item, "postponed")}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-colors"
                        title="Postpone"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => updateStatus(item, "rejected")}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Reject"
                      >
                        <Ban size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );

            // === VIEW: ONBOARDING ===
            if (subTab === "checklist") {
              const completedCount = STEPS.filter((s) => item[s.key]).length;
              const progress = Math.round(
                (completedCount / STEPS.length) * 100
              );

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden"
                >
                  <Header />

                  {/* ROSTER BYPASS ALERT */}
                  {isRoster && (
                    <div className="mb-8 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-purple-900 uppercase tracking-wide">
                            Roster Client Detected
                          </p>
                          <p className="text-[10px] text-purple-600 font-medium">
                            Skip manual onboarding steps?
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => fastTrackToF15(item)}
                        className="px-5 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 shadow-md flex items-center gap-2"
                      >
                        <Rocket size={14} /> Fast Track to F15
                      </button>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8 overflow-hidden">
                    <div
                      className="h-full bg-slate-900 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Steps Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STEPS.map((step) => {
                      const isDone = item[step.key];
                      const dateStamp = item.step_dates?.[step.key];
                      const Icon = step.icon;

                      return (
                        <button
                          key={step.key}
                          onClick={() => handleToggleStep(item, step.key)}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left group overflow-hidden ${
                            isDone
                              ? "bg-slate-900 border-slate-900 text-white shadow-md"
                              : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`shrink-0 transition-colors ${
                              isDone ? "text-emerald-400" : "text-slate-300"
                            }`}
                          >
                            {isDone ? (
                              <CheckSquare size={18} />
                            ) : (
                              <Square size={18} />
                            )}
                          </div>
                          <div className="flex flex-col z-10 w-full overflow-hidden">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider truncate ${
                                isDone ? "text-slate-200" : "text-slate-600"
                              }`}
                            >
                              {step.label}
                            </span>
                            {isDone && dateStamp && (
                              <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={10} /> {dateStamp}
                              </span>
                            )}
                          </div>
                          <Icon
                            className={`absolute -bottom-2 -right-2 w-10 h-10 transition-opacity pointer-events-none ${
                              isDone
                                ? "text-white opacity-5"
                                : "text-slate-900 opacity-0 group-hover:opacity-5"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* MANUAL SKIP BUTTON (For non-roster exceptions) */}
                  {!isRoster && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => fastTrackToF15(item)}
                        className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500"
                      >
                        Skip all & Graduate
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // === VIEW: FIRST 15 ===
            if (subTab === "f15") {
              const inRevision = item.step_dates?.in_revision;

              const DateInput = ({ label, field }) => (
                <div className="p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-200 transition-colors focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-200">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    {label}
                  </span>
                  <input
                    type="date"
                    className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent"
                    value={item.step_dates?.[field] || ""}
                    onChange={(e) => updateF15Date(item, field, e.target.value)}
                  />
                </div>
              );

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      inRevision ? "bg-orange-400" : "bg-purple-500"
                    }`}
                  />
                  <Header />

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* PHASE 1: KICKOFF */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px]">
                          1
                        </span>{" "}
                        Kickoff
                      </h4>
                      <DateInput
                        label="Breakdown Rcvd"
                        field="f15_breakdown_rcvd"
                      />
                      <DateInput
                        label="Internal Due Date"
                        field="f15_due_internal"
                      />
                      <DateInput label="Sent to Client" field="f15_sent" />
                    </div>

                    {/* PHASE 2: REVIEW */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-700 mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center text-[9px]">
                          2
                        </span>{" "}
                        Client Review
                      </h4>
                      <DateInput label="Approval Due" field="f15_client_due" />
                      <DateInput
                        label="Feedback Rcvd"
                        field="f15_feedback_rcvd"
                      />
                    </div>

                    {/* PHASE 3: REVISION */}
                    <div
                      className={`space-y-3 transition-all ${
                        inRevision ? "opacity-100" : "opacity-40 grayscale"
                      }`}
                    >
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-[9px]">
                          3
                        </span>{" "}
                        Revision
                      </h4>
                      <DateInput label="R2 Due (Int)" field="f15_r2_due" />
                      <DateInput label="R2 Sent" field="f15_r2_sent" />
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-col gap-3 justify-end">
                      <button
                        onClick={() => {
                          const isRev = !inRevision;
                          updateF15Date(item, "in_revision", isRev);
                        }}
                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 transition-all ${
                          inRevision
                            ? "bg-orange-50 border-orange-200 text-orange-600"
                            : "bg-white border-slate-200 text-slate-400 hover:border-orange-300 hover:text-orange-500"
                        }`}
                      >
                        <RefreshCw size={14} />{" "}
                        {inRevision ? "Revision Active" : "Trigger Revision"}
                      </button>

                      <button
                        onClick={() => approveF15(item)}
                        className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                      >
                        <CheckCircle2 size={16} /> Approve & Ship
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
