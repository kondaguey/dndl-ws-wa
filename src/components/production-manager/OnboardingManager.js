"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Loader2,
  CheckSquare,
  CreditCard,
  Mail,
  BookOpen,
  User,
  Clock,
  Ban,
  Calendar,
  FolderInput,
  PenTool,
  FileCheck,
  DollarSign,
  List,
  ArrowRightCircle,
  ShieldAlert,
  Headphones,
  CheckCircle2,
  Zap,
  ExternalLink,
  Send,
  AlertTriangle,
  ThumbsUp,
  X,
  MessageSquare,
  Repeat,
  Megaphone,
  UserPlus,
  RotateCcw,
  Tag,
  Mic2,
  CalendarRange,
  StickyNote,
  Hash,
  PauseCircle,
  Search,
  ArrowUpDown,
  CalendarClock,
  ToggleLeft,
  ToggleRight,
  Play,
  Rocket,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABLE_NAME = "3_onboarding_first_15";
const PRODUCTION_TABLE = "4_production";

// --- CONFIGURATION: UI STEPS ---
const ONBOARDING_STEPS = [
  { key: "contract_sent", label: "Email 1: Kickoff Sent", icon: Mail },
  { key: "esig_sent", label: "E-Sig Request Sent", icon: PenTool },
  { key: "contract_signed", label: "Contract Signed", icon: FileCheck },
  { key: "deposit_sent", label: "Email 2: Invoice Sent", icon: CreditCard },
  { key: "deposit_paid", label: "Deposit Paid (15%)", icon: DollarSign },
  {
    key: "email_receipt_sent",
    label: "Email 3: Folder Link",
    icon: FolderInput,
  },
  { key: "breakdown_received", label: "Breakdown Sheet Rcvd", icon: List },
  { key: "manuscript_received", label: "Manuscript Rcvd", icon: BookOpen },
  { key: "added_to_contacts", label: "Added to Contacts", icon: UserPlus },
  { key: "backend_folder", label: "Backend Folder Setup", icon: FolderInput },
  {
    key: "moved_to_f15",
    label: "Graduate to First 15",
    icon: ArrowRightCircle,
  },
];

const F15_STEPS = [
  { key: "f15_sent", label: "F15 Sent to Client", icon: Send },
  {
    key: "f15_feedback_rcvd",
    label: "Feedback/Notes Rcvd",
    icon: MessageSquare,
  },
  { key: "f15_revision_req", label: "Revision Required?", icon: AlertTriangle },
  { key: "f15_r2_sent", label: "Revision Sent", icon: Repeat },
  { key: "f15_approved", label: "Approved & Locked", icon: ThumbsUp },
];

// --- DB MAPPING ---
const DB_MAPPING = {
  added_to_contacts: { type: "bool", col: "added_to_contacts" },
  backend_folder: { type: "bool", col: "backend_folder" },
  docs_customized: { type: "bool", col: "docs_customized" },
  production_folder: { type: "bool", col: "production_folder" },
  contract_sent: { type: "bool", col: "contract_sent" },
  esig_sent: { type: "bool", col: "esig_sent" },
  deposit_sent: { type: "bool", col: "deposit_sent" },
  email_receipt_sent: { type: "bool", col: "email_receipt_sent" },
  manuscript_received: { type: "bool", col: "manuscript_received" },
  contract_signed: {
    type: "mixed",
    boolCol: "contract_signed",
    dateCol: "contract_signed_date",
  },
  deposit_paid: {
    type: "mixed",
    boolCol: "deposit_paid",
    dateCol: "deposit_paid_date",
  },
  breakdown_received: {
    type: "mixed",
    boolCol: "breakdown_received",
    dateCol: "breakdown_received_date",
  },
  f15_sent: { type: "date", col: "f15_sent_date" },
  f15_feedback_rcvd: { type: "date", col: "f15_feedback_received_date" },
  f15_r2_sent: { type: "date", col: "f15_r2_sent_date" },
  f15_revision_req: { type: "bool", col: "f15_revision_req" },
  f15_approved: { type: "bool", col: "f15_approved" },
  moved_to_f15: { type: "special" },
};

// --- HELPER: FORMATTERS ---
const formatNumber = (num) => (num ? num.toLocaleString() : "0");
const formatDate = (str) => {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const today = new Date();
  const diffTime = start - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- COMPONENTS ---

const SafetyCheckModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 shadow-lg"
          >
            Yes, Undo
          </button>
        </div>
      </div>
    </div>
  );
};

const RefundModal = ({ isOpen, onConfirm, onCancel }) => {
  const [refundAmount, setRefundAmount] = useState(0);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-red-100 scale-100 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-50 rounded-full text-red-600 border border-red-100">
            <DollarSign size={32} />
          </div>
        </div>
        <h3 className="text-2xl font-black text-center text-slate-900 mb-2">
          Issue Refund?
        </h3>
        <p className="text-sm text-center text-slate-500 font-medium mb-8">
          Is a deposit return required for this cancellation?
        </p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[0, 50, 100].map((amt) => (
            <button
              key={amt}
              onClick={() => setRefundAmount(amt)}
              className={`py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                refundAmount === amt
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-100 text-slate-400 hover:border-slate-300"
              }`}
            >
              {amt === 0 ? "No Refund" : `${amt}%`}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(refundAmount)}
            className="flex-1 py-4 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 flex items-center justify-center gap-2"
          >
            <Ban size={16} /> Boot Project
          </button>
        </div>
      </div>
    </div>
  );
};

const DateConfirmModal = ({
  isOpen,
  title,
  dateValue,
  setDateValue,
  onConfirm,
  onCancel,
  isHolding = false,
  isProduction = false,
  extraDates,
  setExtraDates,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4">
          <div
            className={`p-3 rounded-full ${
              isHolding
                ? "bg-blue-100 text-blue-600"
                : isProduction
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isHolding ? (
              <CalendarClock size={32} />
            ) : isProduction ? (
              <Rocket size={32} />
            ) : (
              <CheckSquare size={32} />
            )}
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 mb-1 text-center">
          {title}
        </h3>

        {isHolding && (
          <p className="text-xs text-blue-600 font-bold text-center mb-4 bg-blue-50 py-2 rounded-lg">
            Moving to Holding Tank until Start Date.
          </p>
        )}
        {isProduction && (
          <p className="text-xs text-emerald-600 font-bold text-center mb-4 bg-emerald-50 py-2 rounded-lg">
            Set initial Production Dates.
          </p>
        )}
        {!isHolding && !isProduction && (
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-4 text-center">
            Confirm Date
          </p>
        )}

        {isProduction ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Recording Start
              </label>
              <input
                type="date"
                value={extraDates?.recordingStart || ""}
                onChange={(e) =>
                  setExtraDates({
                    ...extraDates,
                    recordingStart: e.target.value,
                  })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Recording Due
              </label>
              <input
                type="date"
                value={extraDates?.recordingDue || ""}
                onChange={(e) =>
                  setExtraDates({ ...extraDates, recordingDue: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        ) : (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-slate-900 mb-6"
          />
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg ${
              isHolding
                ? "bg-blue-600 hover:bg-blue-700"
                : isProduction
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isHolding
              ? "Move to Holding"
              : isProduction
              ? "Start Production"
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OnboardingManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState("checklist");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [dateModal, setDateModal] = useState({
    isOpen: false,
    item: null,
    stepKey: null,
    date: "",
    extraDates: {},
  });
  const [safetyModal, setSafetyModal] = useState({
    isOpen: false,
    onConfirm: null,
  });
  const [refundModal, setRefundModal] = useState({ isOpen: false, item: null });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `*, request:2_booking_requests!inner (id, book_title, client_name, client_type, cover_image_url, status, start_date, end_date, days_needed, ref_number, email, email_thread_link, word_count, genre, narration_style, notes, is_returning)`
        )
        .in("request.status", ["approved", "f15_production", "f15_holding"])
        .order("id", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Pipeline Error:", error);
      showToast("Sync failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const checkIsDone = (item, stepKey) => {
    const config = DB_MAPPING[stepKey];
    if (!config) return false;
    if (config.type === "bool") return item[config.col] === true;
    if (config.type === "date") return !!item[config.col];
    if (config.type === "mixed") return item[config.boolCol] === true;
    return false;
  };

  const getDisplayDate = (item, stepKey) => {
    const config = DB_MAPPING[stepKey];
    if (!config) return null;
    let dateVal = null;
    if (config.type === "date") dateVal = item[config.col];
    if (config.type === "mixed") dateVal = item[config.dateCol];
    if (item.step_dates && item.step_dates[stepKey])
      return formatDate(item.step_dates[stepKey]);
    if (!dateVal) return null;
    return formatDate(dateVal);
  };

  const toggleAdvancedBooking = async (item) => {
    const currentStatus = item.step_dates?.is_advanced_booking || false;
    const newStatus = !currentStatus;
    const updatedDates = { ...item.step_dates, is_advanced_booking: newStatus };
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

  const initiateStepToggle = (item, stepKey) => {
    const isDone = checkIsDone(item, stepKey);
    if (isDone) {
      setSafetyModal({
        isOpen: true,
        onConfirm: () => {
          performBatchUpdate(item, {
            [stepKey]: { isDone: false, date: null },
          });
          setSafetyModal({ isOpen: false, onConfirm: null });
        },
      });
      return;
    }
    const today = new Date().toISOString().split("T")[0];

    // Set default recording dates based on request
    const recStart = item.request.start_date
      ? item.request.start_date.split("T")[0]
      : today;
    const recDue = item.request.end_date
      ? item.request.end_date.split("T")[0]
      : today;

    setDateModal({
      isOpen: true,
      item,
      stepKey,
      date: today,
      extraDates: { recordingStart: recStart, recordingDue: recDue },
    });
  };

  const confirmDateStep = () => {
    const { item, stepKey, date, extraDates } = dateModal;
    const currentSteps = subTab === "checklist" ? ONBOARDING_STEPS : F15_STEPS;
    const targetIndex = currentSteps.findIndex((s) => s.key === stepKey);
    const stepsToUpdate = currentSteps.slice(0, targetIndex + 1);
    const batchUpdates = {};

    stepsToUpdate.forEach((step) => {
      if (step.key === stepKey || !checkIsDone(item, step.key)) {
        batchUpdates[step.key] = { isDone: true, date: date };
      }
    });

    if (stepKey === "moved_to_f15") {
      graduateToF15(item, batchUpdates);
    } else if (stepKey === "f15_approved") {
      const isAdvanced = item.step_dates?.is_advanced_booking;
      if (isAdvanced) graduateToHolding(item, batchUpdates);
      else graduateToFullProduction(item, batchUpdates, date, extraDates);
    } else {
      performBatchUpdate(item, batchUpdates);
    }
    setDateModal({
      isOpen: false,
      item: null,
      stepKey: null,
      date: "",
      extraDates: {},
    });
  };

  const performBatchUpdate = async (item, updatesObj) => {
    const payload = { step_dates: { ...(item.step_dates || {}) } };
    Object.keys(updatesObj).forEach((key) => {
      const { isDone, date } = updatesObj[key];
      const config = DB_MAPPING[key];
      if (!config) return;
      if (config.type === "bool") payload[config.col] = isDone;
      else if (config.type === "date")
        payload[config.col] = isDone ? date : null;
      else if (config.type === "mixed") {
        payload[config.boolCol] = isDone;
        payload[config.dateCol] = isDone ? date : null;
      }
      if (isDone) payload.step_dates[key] = date;
      else delete payload.step_dates[key];
    });
    setItems((prev) =>
      prev.map((i) => (i.id !== item.id ? i : { ...i, ...payload }))
    );
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq("id", item.id);
    if (error) {
      showToast("Save failed", "error");
      fetchPipeline();
    }
  };

  const graduateToF15 = async (item, batchUpdates) => {
    await performBatchUpdate(item, batchUpdates);
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
    showToast("Moved to First 15 Tab!");
  };

  const graduateToHolding = async (item, batchUpdates) => {
    await performBatchUpdate(item, batchUpdates);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, request: { ...i.request, status: "f15_holding" } }
          : i
      )
    );
    await supabase
      .from("2_booking_requests")
      .update({ status: "f15_holding" })
      .eq("id", item.request.id);
    showToast("Moved to Holding Tank");
  };

  const graduateToFullProduction = async (
    item,
    batchUpdates,
    date,
    extraDates
  ) => {
    await performBatchUpdate(item, batchUpdates);
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    // Check if Production Record Exists First (Deduplication)
    const { data: existing } = await supabase
      .from(PRODUCTION_TABLE)
      .select("id")
      .eq("request_id", item.request.id)
      .single();

    const prodPayload = {
      request_id: item.request.id,
      status: "recording",
      recording_start_date: extraDates?.recordingStart || date,
      recording_due_date: extraDates?.recordingDue || date,
    };

    if (existing) {
      // Update existing record
      await supabase
        .from(PRODUCTION_TABLE)
        .update(prodPayload)
        .eq("id", existing.id);
      console.log("Updated existing production record");
    } else {
      // Insert new record
      const { error: prodError } = await supabase
        .from(PRODUCTION_TABLE)
        .insert([prodPayload]);
      if (prodError) console.error("Production Insert Error:", prodError);
    }

    await supabase
      .from("2_booking_requests")
      .update({ status: "production" })
      .eq("id", item.request.id);
    showToast("Moved to Production Pipeline.");
  };

  const activateFromHolding = async (item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    const recStart = item.request.start_date || new Date().toISOString();
    const recDue = item.request.end_date || new Date().toISOString();

    const prodPayload = {
      request_id: item.request.id,
      status: "recording",
      recording_start_date: recStart,
      recording_due_date: recDue,
    };

    // Check if Production Record Exists First (Deduplication)
    const { data: existing } = await supabase
      .from(PRODUCTION_TABLE)
      .select("id")
      .eq("request_id", item.request.id)
      .single();

    if (existing) {
      await supabase
        .from(PRODUCTION_TABLE)
        .update(prodPayload)
        .eq("id", existing.id);
    } else {
      await supabase.from(PRODUCTION_TABLE).insert([prodPayload]);
    }

    await supabase
      .from("2_booking_requests")
      .update({ status: "production" })
      .eq("id", item.request.id);
    showToast("Activated to Production!");
  };

  // ... (Rest of the component remains unchanged) ...
  const handleNudge = async (item) => {
    const now = new Date().toISOString().split("T")[0];
    const newStrikes = Math.min((item.strike_count || 0) + 1, 3);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, last_nudge_date: now, strike_count: newStrikes }
          : i
      )
    );
    await supabase
      .from(TABLE_NAME)
      .update({ last_nudge_date: now, strike_count: newStrikes })
      .eq("id", item.id);
    if (newStrikes === 1) showToast("Gentle nudge recorded.");
    else if (newStrikes === 2) showToast("Firm nudge recorded!", "warning");
    else if (newStrikes === 3)
      showToast("RED ALERT: Strike 3 Recorded.", "error");
  };

  const handleUndoNudge = async (item) => {
    const newStrikes = Math.max(0, (item.strike_count || 0) - 1);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, strike_count: newStrikes } : i
      )
    );
    await supabase
      .from(TABLE_NAME)
      .update({ strike_count: newStrikes })
      .eq("id", item.id);
    showToast("Nudge count decreased.");
  };

  const initiateStatusChange = (item, type) => {
    if (type === "rejected") {
      setRefundModal({ isOpen: true, item });
    } else {
      executeStatusChange(item, type);
    }
  };
  const executeStatusChange = async (item, newStatus, refundData = null) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await supabase
      .from("2_booking_requests")
      .update({ status: newStatus })
      .eq("id", item.request.id);
    if (newStatus === "rejected" && refundData) {
      await supabase
        .from(TABLE_NAME)
        .update({
          refund_percentage: refundData.percentage,
          refund_date: new Date().toISOString().split("T")[0],
          current_status: "Rejected",
        })
        .eq("id", item.id);
    }
    showToast(
      newStatus === "postponed"
        ? "Project Postponed"
        : "Project Booted & Refund Logged"
    );
    setRefundModal({ isOpen: false, item: null });
  };
  const getNudgeStyles = (count) => {
    if (!count || count === 0)
      return {
        label: "Send Nudge",
        style:
          "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
        icon: Send,
      };
    if (count === 1)
      return {
        label: "Nudge Again (1)",
        style: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100",
        icon: Megaphone,
      };
    if (count === 2)
      return {
        label: "Firm Nudge (2)",
        style:
          "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100",
        icon: AlertTriangle,
      };
    return {
      label: "RED ALERT (3)",
      style:
        "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 animate-pulse",
      icon: ShieldAlert,
    };
  };

  const onboardingItems = items.filter((i) => i.request.status === "approved");
  const f15Items = items.filter((i) => i.request.status === "f15_production");
  const holdingItems = items.filter((i) => i.request.status === "f15_holding");
  let activeItems = [];
  if (subTab === "checklist") activeItems = onboardingItems;
  if (subTab === "f15") activeItems = f15Items;
  if (subTab === "holding") activeItems = holdingItems;
  const filteredAndSortedItems = useMemo(() => {
    let result = [...activeItems];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.request.book_title?.toLowerCase().includes(q) ||
          item.request.client_name?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortOrder === "newest") return b.id.localeCompare(a.id);
      if (sortOrder === "oldest") return a.id.localeCompare(b.id);
      if (sortOrder === "title")
        return (a.request.book_title || "").localeCompare(
          b.request.book_title || ""
        );
      if (sortOrder === "start_date")
        return (
          new Date(a.request.start_date || 0) -
          new Date(b.request.start_date || 0)
        );
      return 0;
    });
    return result;
  }, [activeItems, searchQuery, sortOrder]);
  const currentSteps = subTab === "checklist" ? ONBOARDING_STEPS : F15_STEPS;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-300 font-bold uppercase tracking-widest gap-4 animate-pulse">
        <Loader2 className="animate-spin" size={32} />
        Loading Pipeline...
      </div>
    );

  return (
    <div className="relative w-full space-y-12 pb-24">
      <DateConfirmModal
        isOpen={dateModal.isOpen}
        title={
          dateModal.stepKey === "moved_to_f15"
            ? "Graduate to First 15?"
            : dateModal.stepKey === "f15_approved"
            ? dateModal.item?.step_dates?.is_advanced_booking
              ? "Move to Holding Tank?"
              : "Start Production?"
            : "Mark Step Complete"
        }
        isHolding={
          dateModal.stepKey === "f15_approved" &&
          dateModal.item?.step_dates?.is_advanced_booking
        }
        isProduction={
          dateModal.stepKey === "f15_approved" &&
          !dateModal.item?.step_dates?.is_advanced_booking
        }
        dateValue={dateModal.date}
        setDateValue={(d) => setDateModal({ ...dateModal, date: d })}
        extraDates={dateModal.extraDates}
        setExtraDates={(d) => setDateModal({ ...dateModal, extraDates: d })}
        onConfirm={confirmDateStep}
        onCancel={() =>
          setDateModal({
            isOpen: false,
            item: null,
            stepKey: null,
            date: "",
            extraDates: {},
          })
        }
      />
      <SafetyCheckModal
        isOpen={safetyModal.isOpen}
        title="Undo Completed Step?"
        message="This will remove the completion date and mark this step as pending. Proceed?"
        onConfirm={safetyModal.onConfirm}
        onCancel={() => setSafetyModal({ isOpen: false, onConfirm: null })}
      />
      <RefundModal
        isOpen={refundModal.isOpen}
        onCancel={() => setRefundModal({ isOpen: false, item: null })}
        onConfirm={(amount) =>
          executeStatusChange(refundModal.item, "rejected", {
            percentage: amount,
          })
        }
      />

      {/* HEADER TABS & FILTER */}
      <div className="sticky top-4 z-40 space-y-4">
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-xl flex">
            <button
              onClick={() => setSubTab("checklist")}
              className={`flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                subTab === "checklist"
                  ? "bg-slate-900 text-white shadow-lg scale-105"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <BookOpen size={16} /> Onboarding{" "}
              <span className="opacity-40 ml-1">
                | {onboardingItems.length}
              </span>
            </button>
            <button
              onClick={() => setSubTab("f15")}
              className={`flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                subTab === "f15"
                  ? "bg-purple-600 text-white shadow-lg scale-105"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Headphones size={16} /> First 15{" "}
              <span className="opacity-40 ml-1">| {f15Items.length}</span>
            </button>
            <button
              onClick={() => setSubTab("holding")}
              className={`flex items-center gap-2 px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                subTab === "holding"
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <CalendarClock size={16} /> Holding{" "}
              <span className="opacity-40 ml-1">| {holdingItems.length}</span>
            </button>
          </div>
        </div>
        {(onboardingItems.length > 0 ||
          f15Items.length > 0 ||
          holdingItems.length > 0) && (
          <div className="flex flex-col md:flex-row justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <Search className="text-slate-400 ml-2" size={16} />
              <input
                type="text"
                placeholder="Filter projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 placeholder:text-slate-400 w-48 px-2"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X
                    size={14}
                    className="text-slate-400 hover:text-slate-600 mr-1"
                  />
                </button>
              )}
            </div>
            <div className="flex items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <ArrowUpDown size={12} /> Sort:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="start_date">Start Date</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200 mx-auto max-w-2xl">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            {searchQuery
              ? "No matches found"
              : `No projects in ${
                  subTab === "checklist"
                    ? "Onboarding"
                    : subTab === "f15"
                    ? "First 15"
                    : "Holding Tank"
                }`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {filteredAndSortedItems.map((item) => {
            const isRoster = item.request.client_type === "Roster";
            const completedCount = currentSteps.filter((s) =>
              checkIsDone(item, s.key)
            ).length;
            const progress = Math.round(
              (completedCount / currentSteps.length) * 100
            );
            const strikes = item.strike_count || 0;
            const nudgeConfig = getNudgeStyles(strikes);
            const NudgeIcon = nudgeConfig.icon;
            const isAdvanced = item.step_dates?.is_advanced_booking;
            const daysUntilStart = getDaysUntil(item.request.start_date);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border relative overflow-hidden group transition-colors duration-500 ${
                  strikes >= 3
                    ? "border-red-100 bg-red-50/30"
                    : "border-slate-100"
                }`}
              >
                {/* HEADER */}
                <div className="flex flex-col lg:flex-row gap-8 mb-8 pb-8 border-b border-slate-100">
                  <div className="w-32 h-48 lg:w-40 lg:h-60 bg-slate-100 rounded-xl shrink-0 shadow-md relative overflow-hidden mx-auto lg:mx-0">
                    {item.request.cover_image_url ? (
                      <img
                        src={item.request.cover_image_url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                isRoster
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {item.request.client_type}
                            </span>
                            {item.request.is_returning && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 flex items-center gap-1">
                                <RotateCcw size={8} /> Returning
                              </span>
                            )}
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 leading-tight">
                            {item.request.book_title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                            <User size={14} /> {item.request.client_name}
                          </div>
                        </div>
                        <div className="flex gap-1 items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full ${
                                i < strikes
                                  ? strikes === 1
                                    ? "bg-blue-500"
                                    : strikes === 2
                                    ? "bg-orange-500"
                                    : "bg-red-600"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Hash size={10} /> Word Count
                          </div>
                          <div className="text-xs font-black text-slate-700">
                            {formatNumber(item.request.word_count)}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Tag size={10} /> Genre
                          </div>
                          <div className="text-xs font-black text-slate-700 truncate">
                            {item.request.genre || "-"}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Mic2 size={10} /> Style
                          </div>
                          <div className="text-xs font-black text-slate-700 truncate">
                            {item.request.narration_style || "-"}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <CalendarRange size={10} /> Timeline
                          </div>
                          <div className="text-xs font-black text-slate-700 truncate">
                            {formatDate(item.request.start_date)} -{" "}
                            {formatDate(item.request.end_date)}
                          </div>
                        </div>
                      </div>
                      {item.request.notes && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4 flex gap-3">
                          <StickyNote
                            size={14}
                            className="text-amber-400 shrink-0 mt-0.5"
                          />
                          <p className="text-[10px] font-medium text-amber-900 leading-relaxed line-clamp-2">
                            {item.request.notes}
                          </p>
                        </div>
                      )}

                      {/* CONTROLS */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {isRoster && subTab === "checklist" && (
                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100 flex-grow">
                            <Zap size={16} className="text-purple-600" />
                            <span className="text-xs font-bold text-purple-800">
                              Roster Client Detected.
                            </span>
                            <button
                              onClick={() => graduateToF15(item, {})}
                              className="ml-auto px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-700"
                            >
                              Skip to F15
                            </button>
                          </div>
                        )}
                        {subTab === "f15" && (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 flex-grow">
                            <button
                              onClick={() => toggleAdvancedBooking(item)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {isAdvanced ? (
                                <ToggleRight size={24} />
                              ) : (
                                <ToggleLeft size={24} />
                              )}
                            </button>
                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                              Advanced Booking / Pay?
                            </span>
                            <span className="text-[9px] text-blue-400 ml-auto font-medium hidden md:block">
                              Moves to Holding Tank if checked
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* PROGRESS BAR */}
                    {subTab !== "holding" && (
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mt-auto relative">
                        <div
                          className={`h-full transition-all duration-700 ${
                            subTab === "f15" ? "bg-purple-600" : "bg-slate-900"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider ${
                              progress > 50 ? "text-white" : "text-slate-500"
                            }`}
                          >
                            {progress}% Complete
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* ACTIONS */}
                  <div className="lg:w-48 shrink-0 flex flex-col gap-2">
                    <a
                      href={item.request.email_thread_link || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full py-3 px-4 rounded-xl border flex items-center justify-between text-[10px] font-black uppercase tracking-widest transition-all ${
                        item.request.email_thread_link
                          ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                      }`}
                      onClick={(e) =>
                        !item.request.email_thread_link && e.preventDefault()
                      }
                    >
                      Open Thread <ExternalLink size={14} />
                    </a>
                    {subTab === "holding" ? (
                      <div className="space-y-2">
                        <div className="p-4 bg-slate-900 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                            Starts In
                          </span>
                          <span className="text-2xl font-black text-white">
                            {daysUntilStart} Days
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 block mt-1">
                            {formatDate(item.request.start_date)}
                          </span>
                        </div>
                        <button
                          onClick={() => activateFromHolding(item)}
                          className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg flex items-center justify-center gap-2"
                        >
                          <Play size={16} /> Activate
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleNudge(item)}
                          className={`flex-grow py-3 px-4 border rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${nudgeConfig.style}`}
                        >
                          {nudgeConfig.label} <NudgeIcon size={14} />
                        </button>
                        {strikes > 0 && (
                          <button
                            onClick={() => handleUndoNudge(item)}
                            className="w-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600"
                            title="Undo Last Nudge"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => initiateStatusChange(item, "postponed")}
                        className="flex-1 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center gap-1"
                        title="Postpone Project"
                      >
                        <PauseCircle size={16} />{" "}
                        <span className="text-[10px] font-black uppercase">
                          Postpone
                        </span>
                      </button>
                      <button
                        onClick={() => initiateStatusChange(item, "rejected")}
                        className={`flex-1 py-3 border rounded-xl transition-all flex items-center justify-center gap-1 ${
                          strikes >= 3
                            ? "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-lg animate-pulse"
                            : "bg-white border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                        }`}
                        title="Boot Project"
                      >
                        <Ban size={16} />{" "}
                        <span className="text-[10px] font-black uppercase">
                          Boot
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* STEPS */}
                {subTab !== "holding" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {currentSteps.map((step, index) => {
                      const isDone = checkIsDone(item, step.key);
                      const dateStamp = getDisplayDate(item, step.key);
                      const Icon = step.icon;
                      return (
                        <button
                          key={step.key}
                          onClick={() => initiateStepToggle(item, step.key)}
                          className={`relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                            isDone
                              ? "bg-slate-900 border-slate-900 shadow-lg scale-[1.01]"
                              : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isDone
                                ? "bg-white/10 text-emerald-400"
                                : "bg-slate-100 text-slate-300"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black opacity-30 ${
                                  isDone ? "text-white" : "text-slate-400"
                                }`}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold uppercase tracking-wide truncate block ${
                                isDone ? "text-white" : "text-slate-600"
                              }`}
                            >
                              {step.label}
                            </span>
                            {isDone && dateStamp && (
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={10} /> {dateStamp}
                              </span>
                            )}
                          </div>
                          {isDone && (
                            <CheckCircle2
                              size={16}
                              className="absolute top-2 right-2 text-emerald-500"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
