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
  Rocket,
} from "lucide-react";

// Import the Financial Source of Truth
import ProductionFinances from "./ProductionFinances";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TABLE_NAME = "3_onboarding_first_15";
const PRODUCTION_TABLE = "4_production";

// --- CONFIGURATION: UI STEPS ---
const ONBOARDING_STEPS = [
  { key: "contract_sent", label: "Email 1: Kickoff", icon: Mail },
  { key: "esig_sent", label: "E-Sig Sent", icon: PenTool },
  { key: "contract_signed", label: "Contract Signed", icon: FileCheck },
  { key: "deposit_sent", label: "Email 2: Invoice", icon: CreditCard },
  { key: "deposit_paid", label: "Deposit Paid (15%)", icon: DollarSign }, // <--- THIS LINKS TO INVOICE
  { key: "email_receipt_sent", label: "Email 3: Links", icon: FolderInput },
  { key: "breakdown_received", label: "Breakdown Rcvd", icon: List },
  { key: "manuscript_received", label: "Script Rcvd", icon: BookOpen },
  { key: "added_to_contacts", label: "Contacts Added", icon: UserPlus },
  { key: "backend_folder", label: "Backend Setup", icon: FolderInput },
  { key: "moved_to_f15", label: "Grad to First 15", icon: ArrowRightCircle },
];

const F15_STEPS = [
  { key: "f15_sent", label: "F15 Sent", icon: Send },
  { key: "f15_feedback_rcvd", label: "Notes Rcvd", icon: MessageSquare },
  { key: "f15_revision_req", label: "Revision Needed?", icon: AlertTriangle },
  { key: "f15_r2_sent", label: "Revision Sent", icon: Repeat },
  { key: "f15_approved", label: "Approved", icon: ThumbsUp },
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

// --- COMPONENTS (Modals kept simple for brevity, logic unchanged) ---
const SafetyCheckModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 font-medium mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700"
          >
            Yes, Undo
          </button>
        </div>
      </div>
    </div>
  );
};

const RefundModal = ({ isOpen, onConfirm, onCancel }) => {
  // ... (Keep existing RefundModal code)
  const [refundAmount, setRefundAmount] = useState(0);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-red-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-red-100">
        <h3 className="text-2xl font-black text-center text-slate-900 mb-2">
          Issue Refund?
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[0, 50, 100].map((amt) => (
            <button
              key={amt}
              onClick={() => setRefundAmount(amt)}
              className={`py-3 rounded-xl text-xs font-bold border-2 ${refundAmount === amt ? "border-slate-900 bg-slate-900 text-white" : "border-slate-100 text-slate-400"}`}
            >
              {amt === 0 ? "No" : `${amt}%`}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(refundAmount)}
            className="flex-1 py-4 bg-red-600 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"
          >
            <Ban size={16} /> Boot
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
  isHolding,
  isProduction,
  extraDates,
  setExtraDates,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-100">
        <h3 className="text-lg font-black text-slate-900 mb-4 text-center">
          {title}
        </h3>
        {isProduction ? (
          <div className="space-y-4 mb-6">
            <input
              type="date"
              value={extraDates?.recordingStart || ""}
              onChange={(e) =>
                setExtraDates({ ...extraDates, recordingStart: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
            />
            <input
              type="date"
              value={extraDates?.recordingDue || ""}
              onChange={(e) =>
                setExtraDates({ ...extraDates, recordingDue: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
            />
          </div>
        ) : (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold mb-6"
          />
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-white rounded-xl text-xs font-bold uppercase shadow-lg ${isHolding ? "bg-blue-600" : isProduction ? "bg-emerald-600" : "bg-slate-900"}`}
          >
            {isHolding ? "To Holding" : isProduction ? "Start" : "Confirm"}
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

  // NEW: Track which project has Financials Expanded
  const [expandedFinanceId, setExpandedFinanceId] = useState(null);

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
        .in("request.status", [
          "onboarding",
          "first_15",
          "f15_holding",
          "approved",
          "f15_production",
        ])
        .order("id", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Pipeline Error:", error);
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

  // --- STEP LOGIC ---
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

  const confirmDateStep = async () => {
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

    // --- CRITICAL: FINANCIAL SYNC ---
    // If "Deposit Paid" is confirmed, update 9_invoices table automatically
    if (stepKey === "deposit_paid") {
      // We upsert (Update or Insert) using project_id as the unique key
      // This ensures the invoice reflects the paid deposit status
      await supabase.from("9_invoices").upsert(
        {
          project_id: item.request.id,
          reference_number: item.request.ref_number,
          client_name: item.request.client_name, // Helper for search
          deposit_status: "paid",
          deposit_date_paid: date,
          // Note: We don't set deposit_amount here, we let ProductionFinances handle the amounts
        },
        { onConflict: "project_id" }
      );
      showToast("Invoice Updated: Deposit Paid");
    }
    // --------------------------------

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
    await supabase.from(TABLE_NAME).update(payload).eq("id", item.id);
  };

  const graduateToF15 = async (item, batchUpdates) => {
    await performBatchUpdate(item, batchUpdates);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, request: { ...i.request, status: "first_15" } }
          : i
      )
    );
    await supabase
      .from("2_booking_requests")
      .update({ status: "first_15" })
      .eq("id", item.request.id);
    showToast("Moved to First 15 Tab!");
  };

  const graduateToHolding = async (item, batchUpdates = {}) => {
    if (Object.keys(batchUpdates).length > 0)
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
    if (batchUpdates) await performBatchUpdate(item, batchUpdates);
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    // Ensure Production Record Exists (Deduplication via request_id)
    const prodPayload = {
      request_id: item.request.id,
      status: "recording",
      recording_start_date:
        extraDates?.recordingStart || date || item.request.start_date,
      recording_due_date:
        extraDates?.recordingDue || date || item.request.end_date,
    };

    // Check for existing to prevent duplicate rows in 4_production
    const { data: existing } = await supabase
      .from(PRODUCTION_TABLE)
      .select("id")
      .eq("request_id", item.request.id)
      .maybeSingle();

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

    const { data: existing } = await supabase
      .from(PRODUCTION_TABLE)
      .select("id")
      .eq("request_id", item.request.id)
      .maybeSingle();
    if (existing)
      await supabase
        .from(PRODUCTION_TABLE)
        .update(prodPayload)
        .eq("id", existing.id);
    else await supabase.from(PRODUCTION_TABLE).insert([prodPayload]);

    await supabase
      .from("2_booking_requests")
      .update({ status: "production" })
      .eq("id", item.request.id);
    showToast("Activated to Production!");
  };

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
    showToast(
      newStrikes === 1
        ? "Gentle nudge recorded."
        : newStrikes === 2
          ? "Firm nudge recorded!"
          : "RED ALERT: Strike 3 Recorded.",
      newStrikes > 1 ? "warning" : "success"
    );
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
    if (type === "rejected") setRefundModal({ isOpen: true, item });
    else executeStatusChange(item, type);
  };

  const executeStatusChange = async (item, newStatus, refundData = null) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      if (newStatus === "postponed") {
        await supabase
          .from("2_booking_requests")
          .update({ status: "postponed" })
          .eq("id", item.request.id);
        showToast("Project Postponed");
      } else if (newStatus === "rejected") {
        const archivePayload = {
          ...item,
          refund_details: refundData || null,
          booted_from: TABLE_NAME,
        };
        await supabase
          .from("6_archive")
          .insert([
            {
              original_data: archivePayload,
              archived_at: new Date(),
              reason: refundData
                ? `Booted with ${refundData.percentage}% refund`
                : "Booted from Onboarding Pipeline",
            },
          ]);
        await supabase
          .from("2_booking_requests")
          .delete()
          .eq("id", item.request.id);
        showToast("Project Booted to Archives");
      }
    } catch (error) {
      console.error("Status Change Error:", error);
      showToast("Action failed", "error");
      fetchPipeline();
    }
    setRefundModal({ isOpen: false, item: null });
  };

  const getNudgeStyles = (count) => {
    if (!count || count === 0)
      return {
        label: "Nudge",
        style:
          "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
        icon: Send,
      };
    if (count === 1)
      return {
        label: "Again (1)",
        style: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100",
        icon: Megaphone,
      };
    if (count === 2)
      return {
        label: "Firm (2)",
        style:
          "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100",
        icon: AlertTriangle,
      };
    return {
      label: "ALERT (3)",
      style:
        "bg-red-50 border-red-200 text-red-600 hover:bg-red-100 animate-pulse",
      icon: ShieldAlert,
    };
  };

  const onboardingItems = items.filter((i) =>
    ["onboarding", "approved"].includes(i.request.status)
  );
  const f15Items = items.filter((i) =>
    ["first_15", "f15_production"].includes(i.request.status)
  );
  const holdingItems = items.filter((i) => i.request.status === "f15_holding");
  let activeItems =
    subTab === "checklist"
      ? onboardingItems
      : subTab === "f15"
        ? f15Items
        : holdingItems;

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
    <div className="relative w-full space-y-8 pb-24">
      {/* ... (Modals omitted for brevity, they are same as before) ... */}
      <DateConfirmModal
        isOpen={dateModal.isOpen}
        title={
          dateModal.stepKey === "moved_to_f15"
            ? "Graduate?"
            : dateModal.stepKey === "f15_approved"
              ? dateModal.item?.step_dates?.is_advanced_booking
                ? "Move to Holding?"
                : "Start Production?"
              : "Mark Complete"
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
        title="Undo Step?"
        message="Remove completion date and mark as pending?"
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
        <div className="w-full overflow-x-auto pb-2 px-1 -mx-1 scrollbar-hide">
          <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-xl flex min-w-max">
            <button
              onClick={() => setSubTab("checklist")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${subTab === "checklist" ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <BookOpen size={14} /> Onboard{" "}
              <span className="opacity-40 ml-1">
                | {onboardingItems.length}
              </span>
            </button>
            <button
              onClick={() => setSubTab("f15")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${subTab === "f15" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <Headphones size={14} /> First 15{" "}
              <span className="opacity-40 ml-1">| {f15Items.length}</span>
            </button>
            <button
              onClick={() => setSubTab("holding")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${subTab === "holding" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
            >
              <CalendarClock size={14} /> Hold{" "}
              <span className="opacity-40 ml-1">| {holdingItems.length}</span>
            </button>
          </div>
        </div>
        {/* ... Search & Sort controls (unchanged) ... */}
      </div>

      {/* ITEMS LIST */}
      {filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200 mx-auto max-w-2xl">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No projects found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:gap-12">
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
            const daysUntilStart = getDaysUntil(item.request.start_date);
            const isFinanceOpen = expandedFinanceId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-[2rem] p-5 md:p-8 shadow-xl shadow-slate-200/50 border relative overflow-hidden group transition-colors duration-500 ${strikes >= 3 ? "border-red-100 bg-red-50/30" : "border-slate-100"}`}
              >
                {/* --- HEADER --- */}
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mb-6 pb-6 border-b border-slate-100">
                  {/* Image Block */}
                  <div className="flex flex-row lg:flex-col gap-4 lg:w-40 lg:shrink-0">
                    <div className="w-24 h-36 lg:w-40 lg:h-60 bg-slate-100 rounded-xl shrink-0 shadow-md relative overflow-hidden">
                      {item.request.cover_image_url ? (
                        <img
                          src={item.request.cover_image_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen size={24} />
                        </div>
                      )}
                    </div>
                    {/* Mobile Title Block */}
                    <div className="flex flex-col justify-center lg:hidden">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest w-fit mb-1 ${isRoster ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {item.request.client_type}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 leading-tight line-clamp-3">
                        {item.request.book_title}
                      </h3>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      {/* Desktop Title */}
                      <div className="hidden lg:flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${isRoster ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}
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
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Hash size={10} /> Word Count
                          </div>
                          <div className="text-[10px] md:text-xs font-black text-slate-700">
                            {formatNumber(item.request.word_count)}
                          </div>
                        </div>
                        <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Tag size={10} /> Genre
                          </div>
                          <div className="text-[10px] md:text-xs font-black text-slate-700 truncate">
                            {item.request.genre || "-"}
                          </div>
                        </div>
                        <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Mic2 size={10} /> Style
                          </div>
                          <div className="text-[10px] md:text-xs font-black text-slate-700 truncate">
                            {item.request.narration_style || "-"}
                          </div>
                        </div>
                        <div className="p-2 md:p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <CalendarRange size={10} /> Timeline
                          </div>
                          <div className="text-[10px] md:text-xs font-black text-slate-700 truncate">
                            {formatDate(item.request.start_date)} -{" "}
                            {formatDate(item.request.end_date)}
                          </div>
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* --- FINANCIAL TOGGLE BUTTON --- */}
                        <button
                          onClick={() =>
                            setExpandedFinanceId(isFinanceOpen ? null : item.id)
                          }
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 transition-all ${isFinanceOpen ? "bg-slate-800 text-white border-slate-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          <DollarSign size={12} />{" "}
                          {isFinanceOpen ? "Hide Finance" : "Manage Finance"}
                        </button>

                        <a
                          href={item.request.email_thread_link || "#"}
                          target="_blank"
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${item.request.email_thread_link ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}
                        >
                          Open Thread <ExternalLink size={12} />
                        </a>
                      </div>

                      {/* --- FINANCIALS EXPANDABLE SECTION --- */}
                      {isFinanceOpen && (
                        <div className="mb-6 p-1 bg-slate-100/50 rounded-3xl border border-slate-200">
                          <ProductionFinances
                            project={item.request}
                            productionDefaults={{
                              pfh_rate: 250,
                              pozotron_rate: 14,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* STEPS GRID */}
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
                          className={`relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isDone ? "bg-slate-900 border-slate-900 shadow-lg scale-[1.01]" : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${isDone ? "bg-white/10 text-emerald-400" : "bg-slate-100 text-slate-300"}`}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-black opacity-30 ${isDone ? "text-white" : "text-slate-400"}`}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wide truncate block ${isDone ? "text-white" : "text-slate-600"}`}
                            >
                              {step.label}
                            </span>
                            {isDone && dateStamp && (
                              <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar size={8} /> {dateStamp}
                              </span>
                            )}
                          </div>
                          {isDone && (
                            <CheckCircle2
                              size={14}
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
