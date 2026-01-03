"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  CheckSquare,
  Square,
  FileSignature,
  CreditCard,
  Mail,
  BookOpen,
  Settings,
  FolderOpen,
  AlertTriangle,
  User,
  Clock,
  Ban,
  Calendar,
  Lock,
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
  CalendarDays,
  Hash,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// EXACT MAPPING FROM YOUR CSV
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

export default function Onboarding() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // active | completed

  // --- MODAL STATE ---
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "confirm",
    onConfirm: null,
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  // --- FETCH DATA ---
  // --- FETCH DATA ---
  const fetchOnboarding = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("3_onboarding")
      .select(
        `
        *,
        request:2_booking_requests!inner (
          id,
          book_title,
          client_name,
          cover_image_url,
          status,
          start_date,
          end_date,
          genre,
          word_count,
          ref_number
        )
      `
      )
      .in("request.status", ["approved", "f15_production"])
      .order("id", { ascending: false });

    if (error) {
      // Improved Logging: Prints the full error details
      console.error(
        "Supabase Error:",
        error.message,
        error.details,
        error.hint
      );
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOnboarding();
  }, []);

  // --- ACTIONS ---

  const handleToggleStep = (item, stepKey) => {
    const isDone = item[stepKey];
    const label = STEPS.find((s) => s.key === stepKey)?.label;

    if (stepKey === "moved_to_f15" && !isDone) {
      setModal({
        isOpen: true,
        title: "Graduate to F15?",
        message: `This will mark onboarding as complete and move "${item.request.book_title}" to the F15 Dashboard.`,
        type: "confirm",
        onConfirm: () => confirmMoveToF15(item),
      });
      return;
    }

    setModal({
      isOpen: true,
      title: isDone ? "Revoke Status?" : "Confirm Step",
      message: isDone
        ? `Uncheck "${label}"? This removes the timestamp.`
        : `Mark "${label}" as complete?`,
      type: isDone ? "danger" : "confirm",
      onConfirm: () => confirmToggleStep(item, stepKey, !isDone),
    });
  };

  const confirmMoveToF15 = async (item) => {
    await confirmToggleStep(item, "moved_to_f15", true);

    // Create F15 Record if missing
    const { error: insertError } = await supabase
      .from("4_first_15")
      .insert([{ request_id: item.request.id }]);

    if (insertError) console.error("Error creating F15 record:", insertError);

    await supabase
      .from("2_booking_requests")
      .update({ status: "f15_production" })
      .eq("id", item.request.id);

    fetchOnboarding();
  };

  const confirmToggleStep = async (item, field, newValue) => {
    const todayStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const updatedDates = { ...item.step_dates } || {};

    if (newValue) {
      updatedDates[field] = todayStr;
    } else {
      delete updatedDates[field];
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, [field]: newValue, step_dates: updatedDates }
          : i
      )
    );
    closeModal();

    await supabase
      .from("3_onboarding")
      .update({
        [field]: newValue,
        step_dates: updatedDates,
      })
      .eq("id", item.id);
  };

  const updateStrikes = async (itemId, currentCount, change) => {
    let newCount = Math.min(Math.max(0, currentCount + change), 3);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, strike_count: newCount } : item
      )
    );
    await supabase
      .from("3_onboarding")
      .update({ strike_count: newCount })
      .eq("id", itemId);
  };

  const updateProjectStatus = (item, newStatus) => {
    const actionLabel = newStatus === "postponed" ? "Postpone" : "Boot";

    setModal({
      isOpen: true,
      title: `${actionLabel} Project?`,
      message: `Move "${item.request.book_title}" to ${
        newStatus === "boot" ? "Rejected" : "Postponed"
      }?`,
      type: "danger",
      onConfirm: async () => {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        closeModal();
        const statusKey = newStatus === "boot" ? "rejected" : "postponed";
        await supabase
          .from("2_booking_requests")
          .update({ status: statusKey })
          .eq("id", item.request.id);
      },
    });
  };

  const calculateProgress = (item) => {
    const completed = STEPS.filter((step) => item[step.key]).length;
    return Math.round((completed / STEPS.length) * 100);
  };

  const displayedItems = items.filter((item) => {
    if (tab === "active") return item.request.status === "approved";
    if (tab === "completed") return item.request.status === "f15_production";
    return false;
  });

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 font-bold uppercase tracking-widest gap-4 animate-pulse">
        <Loader2 className="animate-spin" size={32} />
        Loading Pipeline...
      </div>
    );

  return (
    <div className="relative w-full lg:w-[80%] mx-auto">
      {/* --- CUSTOM MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  modal.type === "danger"
                    ? "bg-red-50 text-red-500"
                    : "bg-slate-900 text-white"
                }`}
              >
                {modal.type === "danger" ? <AlertTriangle /> : <Lock />}
              </div>
              <h3 className="text-lg font-black uppercase text-slate-900">
                {modal.title}
              </h3>
            </div>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
              {modal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-slate-100 rounded-xl text-slate-500 font-bold uppercase text-xs hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={modal.onConfirm}
                className={`flex-1 py-3 rounded-xl text-white font-bold uppercase text-xs transition-all ${
                  modal.type === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-slate-900 hover:bg-emerald-500"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TABS --- */}
      <div className="flex mb-8 bg-white p-1 rounded-full border border-slate-200 w-fit mx-auto shadow-sm">
        <button
          onClick={() => setTab("active")}
          className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
            tab === "active"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Active Pipeline
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
            tab === "completed"
              ? "bg-emerald-500 text-white shadow-md"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Completed Onboarding
        </button>
      </div>

      {displayedItems.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
          <div className="flex justify-center mb-4 text-slate-300">
            {tab === "active" ? (
              <BookOpen size={48} />
            ) : (
              <FileCheck size={48} />
            )}
          </div>
          <h3 className="text-slate-900 font-black uppercase tracking-wide mb-2">
            No {tab === "active" ? "Active" : "Completed"} Onboarding
          </h3>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {displayedItems.map((item) => {
            const progress = calculateProgress(item);
            const strikes = item.strike_count || 0;
            let cardStyle = "bg-white border-slate-100";
            let strikeBadge = "bg-slate-100 text-slate-400";

            if (strikes === 1) {
              cardStyle = "bg-amber-50/50 border-amber-200";
              strikeBadge =
                "bg-amber-100 text-amber-600 border border-amber-200";
            } else if (strikes === 2) {
              cardStyle = "bg-orange-50/50 border-orange-200";
              strikeBadge =
                "bg-orange-100 text-orange-600 border border-orange-200";
            } else if (strikes === 3) {
              cardStyle = "bg-red-50/50 border-red-200 ring-1 ring-red-200";
              strikeBadge =
                "bg-red-100 text-red-600 border border-red-200 animate-pulse";
            }

            if (tab === "completed")
              cardStyle = "bg-emerald-50/30 border-emerald-100 opacity-90";

            return (
              <div
                key={item.id}
                className={`rounded-[2.5rem] p-8 shadow-sm border relative overflow-hidden transition-all hover:shadow-lg ${cardStyle}`}
              >
                {/* --- HEADER SECTION --- */}
                <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-slate-100/50 pb-8">
                  {/* Cover Image */}
                  <div className="w-full md:w-32 h-44 bg-white rounded-2xl shrink-0 overflow-hidden border border-slate-200/50 shadow-sm relative mx-auto md:mx-0">
                    {item.request.cover_image_url ? (
                      <img
                        src={item.request.cover_image_url}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200">
                        <BookOpen size={32} />
                      </div>
                    )}
                    {strikes >= 3 && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white backdrop-blur-[2px]">
                        <ShieldAlert size={32} />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                          {/* Ref & Status */}
                          <div className="flex items-center gap-2 mb-2">
                            {item.request.ref_number && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                                <Hash size={10} /> {item.request.ref_number}
                              </span>
                            )}
                            <div
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                progress === 100
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-900 text-white"
                              }`}
                            >
                              {progress}% Complete
                            </div>
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2">
                            {item.request.book_title || "Untitled Project"}
                          </h3>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wide">
                            <User size={14} className="text-slate-400" />{" "}
                            {item.request.client_name || "Unknown Client"}
                          </div>
                        </div>

                        {/* Main Actions */}
                        {tab === "active" && (
                          <div className="flex gap-2 w-full md:w-auto">
                            <button
                              onClick={() =>
                                updateProjectStatus(item, "postponed")
                              }
                              className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                            >
                              <Clock size={14} /> Postpone
                            </button>
                            <button
                              onClick={() => updateProjectStatus(item, "boot")}
                              className="flex-1 md:flex-none px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                              <Ban size={14} /> Boot
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Project Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                            Start Date
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.request.start_date
                              ? new Date(
                                  item.request.start_date
                                ).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                            End Date
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.request.end_date
                              ? new Date(
                                  item.request.end_date
                                ).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                            Genre
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.request.genre || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">
                            Word Count
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.request.word_count
                              ? item.request.word_count.toLocaleString()
                              : "0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Strikes */}
                    <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex-grow">
                        <div
                          className={`h-full transition-all duration-700 ${
                            progress === 100 ? "bg-emerald-500" : "bg-slate-900"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full md:w-auto gap-4">
                        <div
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${strikeBadge}`}
                        >
                          <AlertTriangle size={14} />{" "}
                          {strikes === 3
                            ? "PROBATION"
                            : `${strikes} Strike${strikes !== 1 ? "s" : ""}`}
                        </div>
                        {tab === "active" && (
                          <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
                            <button
                              onClick={() =>
                                updateStrikes(item.id, strikes, -1)
                              }
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 font-bold transition-colors"
                            >
                              -
                            </button>
                            <button
                              onClick={() => updateStrikes(item.id, strikes, 1)}
                              disabled={strikes >= 3}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 font-bold disabled:opacity-30 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- CHECKLIST GRID --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STEPS.map((step) => {
                    const isDone = item[step.key];
                    const dateStamp = item.step_dates?.[step.key];
                    const Icon = step.icon;
                    return (
                      <button
                        key={step.key}
                        onClick={() => handleToggleStep(item, step.key)}
                        disabled={tab === "completed"} // Read-only if completed
                        className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group overflow-hidden ${
                          isDone
                            ? "bg-slate-900 border-slate-900 text-white shadow-md hover:shadow-lg"
                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        } ${
                          tab === "completed" ? "opacity-75 cursor-default" : ""
                        }`}
                      >
                        <div
                          className={`shrink-0 transition-colors ${
                            isDone
                              ? "text-emerald-400"
                              : "text-slate-300 group-hover:text-slate-400"
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
                          className={`absolute -bottom-2 -right-2 w-10 h-10 opacity-5 pointer-events-none ${
                            isDone ? "text-white" : "text-slate-900"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
