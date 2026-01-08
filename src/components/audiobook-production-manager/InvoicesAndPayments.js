"use client";

import { useState, useEffect, useMemo } from "react";
import nextDynamic from "next/dynamic";
import { createClient } from "@/src/utils/supabase/client";
import {
  FileText,
  Save,
  Loader2,
  Calculator,
  TrendingUp,
  RotateCcw,
  Percent,
  PlusCircle,
  Receipt,
  FileCheck,
  ShieldAlert,
  Link2,
  TrainFront,
  Bomb,
  Flame,
  Zap,
  Mail,
  Briefcase,
  Search,
  Trophy,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  UploadCloud,
  Plus,
  Trash2,
  Wallet,
  Ban,
} from "lucide-react";

import InvoicePDF from "./InvoicePDF";

// Dynamic Import for PDF generation (Client-side only)
const PDFDownloadLink = nextDynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <span className="text-xs font-bold text-slate-400">Loading PDF...</span>
    ),
  }
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- UTILS ---
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount || 0
  );

// --- COMPONENTS ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] transition-all duration-300 transform animate-in slide-in-from-bottom-5`}
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

const ActionModal = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  const styles = {
    complete: {
      icon: Trophy,
      color: "text-emerald-500",
      btn: "bg-emerald-600 hover:bg-emerald-700",
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
            className="flex-1 py-5 text-xs font-bold uppercase text-slate-400 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-5 text-xs font-bold uppercase text-white transition-colors ${style.btn}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function InvoicesAndPayments({ initialProject }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [productionDataMap, setProductionDataMap] = useState({});

  const [activeTab, setActiveTab] = useState("open"); // open, waiting, paid, deposits, refunds
  const [selectedProject, setSelectedProject] = useState(
    initialProject || null
  );
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [mailFeedback, setMailFeedback] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ isOpen: false });
  const [lastSaved, setLastSaved] = useState(Date.now());

  // REFUND STATE
  const [refundPercentage, setRefundPercentage] = useState(100);

  const [formData, setFormData] = useState({
    pfh_count: 0,
    pfh_rate: 0,
    sag_ph_percent: 0,
    convenience_fee: 0,
    line_items: [],
    payment_link: "",
    contract_link: "",
    custom_note: "",
    invoiced_date: "",
    due_date: "",
    reminders_sent: 0,
    ledger_tab: "open",
    logo_url: "",
    deposit_amount: 0,
    deposit_status: "pending",
    deposit_date_paid: null,
  });

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);

    const { data: iData } = await supabase.from("9_invoices").select("*");
    setInvoices(iData || []);

    const { data: prodData } = await supabase
      .from("4_production")
      .select("request_id, pfh_rate, pozotron_rate");

    const activeProductionIds = prodData?.map((p) => p.request_id) || [];

    const { data: completedData } = await supabase
      .from("2_booking_requests")
      .select("id")
      .eq("status", "completed");

    const completedIds = completedData?.map((c) => c.id) || [];
    const validIds = new Set([...activeProductionIds, ...completedIds]);

    // Include IDs for Deposits and Refunds tabs (so they show even if not in production)
    const financialIds =
      iData
        ?.filter((i) => i.deposit_amount > 0 || i.deposit_status === "refunded")
        .map((i) => i.project_id) || [];

    financialIds.forEach((id) => validIds.add(id));

    if (validIds.size > 0) {
      const { data: bData, error: bError } = await supabase
        .from("2_booking_requests")
        .select("*")
        .in("id", Array.from(validIds))
        .neq("status", "deleted")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (bError) console.error("Booking Fetch Error:", bError);
      setProjects(bData || []);
    } else {
      setProjects([]);
    }

    const prodMap = {};
    if (prodData) {
      prodData.forEach((item) => {
        prodMap[item.request_id] = {
          pfh_rate: item.pfh_rate,
          pozotron_rate: item.pozotron_rate,
        };
      });
    }
    setProductionDataMap(prodMap);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      if (
        selectedProject &&
        !projects.find((p) => p.id === selectedProject.id)
      ) {
        setSelectedProject(projects[0]);
      } else if (!selectedProject) {
        setSelectedProject(projects[0]);
      }
    } else {
      setSelectedProject(null);
    }
  }, [projects]);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedProject?.id) return;
      setLoading(true);
      setShowPDF(false);
      setRefundPercentage(100);

      const existingInvoice = invoices.find(
        (i) => i.project_id === selectedProject.id
      );
      const savedLogo =
        typeof window !== "undefined"
          ? localStorage.getItem("default_invoice_logo")
          : "";

      if (existingInvoice) {
        setFormData({
          ...existingInvoice,
          logo_url: existingInvoice.logo_url || savedLogo,
          line_items: Array.isArray(existingInvoice.line_items)
            ? existingInvoice.line_items
            : [],
        });
        setIsEditing(false);
      } else {
        const prodDefaults = productionDataMap[selectedProject.id];
        const calculatedPFH = selectedProject.word_count
          ? (selectedProject.word_count / 9300).toFixed(2)
          : 0;

        setFormData({
          pfh_count: calculatedPFH,
          pfh_rate: prodDefaults?.pfh_rate || 250,
          sag_ph_percent: 0,
          convenience_fee: 0,
          line_items: [],
          payment_link: "",
          contract_link: "",
          custom_note: "",
          invoiced_date: new Date().toISOString().split("T")[0],
          due_date: "",
          reminders_sent: 0,
          ledger_tab: "open",
          logo_url: savedLogo,
          deposit_amount: 0,
          deposit_status: "pending",
          deposit_date_paid: null,
        });
        setIsEditing(true);
      }
      setLoading(false);
    };
    loadData();
  }, [selectedProject, invoices, productionDataMap]);

  // --- CALCULATIONS ---
  const calcs = useMemo(() => {
    const base = Number(formData.pfh_count) * Number(formData.pfh_rate);
    const sag = base * (Number(formData.sag_ph_percent) / 100);
    const customItemsTotal = (formData.line_items || []).reduce(
      (acc, item) => acc + Number(item.amount),
      0
    );
    const total =
      base + sag + Number(formData.convenience_fee) + customItemsTotal;

    // Deposit Logic
    const deposit = Number(formData.deposit_amount) || 0;
    const finalDue = total - (formData.deposit_status === "paid" ? deposit : 0);

    // Refund Logic (Based on DEPOSIT amount, since that's what's usually refunded)
    const refundTotal = deposit * (refundPercentage / 100);

    return { base, sag, total, deposit, finalDue, refundTotal };
  }, [formData, refundPercentage]);

  // --- FIX: OVERDUE DAYS DEFINITION ---
  const overdueDays = useMemo(() => {
    if (!formData.due_date || formData.ledger_tab === "paid") return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(formData.due_date);
    return due ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0;
  }, [formData.due_date, formData.ledger_tab]);

  // --- FILTER LOGIC ---
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const inv = invoices.find((i) => i.project_id === p.id);

        if (activeTab === "deposits") {
          return inv?.deposit_amount > 0 || inv?.deposit_status === "pending";
        }
        if (activeTab === "refunds") {
          // Show in refunds if they have ever paid a deposit (eligible for refund) OR explicitly marked refunded
          return (
            inv?.deposit_status === "paid" || inv?.deposit_status === "refunded"
          );
        }

        return (inv?.ledger_tab || "open") === activeTab;
      })
      .filter((p) =>
        p.book_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [projects, invoices, activeTab, searchQuery]);

  const handleSave = async (silent = false) => {
    if (!selectedProject) return;
    if (!silent) setLoading(true);

    const payload = {
      project_id: selectedProject.id,
      pfh_count: Number(formData.pfh_count) || 0,
      pfh_rate: Number(formData.pfh_rate) || 0,
      sag_ph_percent: Number(formData.sag_ph_percent) || 0,
      convenience_fee: Number(formData.convenience_fee) || 0,
      est_tax_rate: 25,
      total_amount: Number(calcs.total) || 0,
      final_amount: Number(calcs.finalDue) || 0,
      reminders_sent: Number(formData.reminders_sent) || 0,
      invoiced_date: formData.invoiced_date || null,
      due_date: formData.due_date || null,
      payment_link: formData.payment_link || "",
      contract_link: formData.contract_link || "",
      custom_note: formData.custom_note || "",
      ledger_tab: formData.ledger_tab || "open",
      logo_url: formData.logo_url || "",
      reference_number: selectedProject.ref_number,
      line_items: Array.isArray(formData.line_items) ? formData.line_items : [],
      other_expenses: 0,
      deposit_amount: Number(formData.deposit_amount),
      deposit_status: formData.deposit_status,
      deposit_date_paid: formData.deposit_date_paid,
    };

    let result;
    const existingInvoice = invoices.find(
      (i) => i.project_id === selectedProject.id
    );

    // Sync financial data back to Production
    await supabase
      .from("4_production")
      .update({ pfh_rate: payload.pfh_rate })
      .eq("request_id", selectedProject.id);

    if (existingInvoice?.id) {
      result = await supabase
        .from("9_invoices")
        .update(payload)
        .eq("id", existingInvoice.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("9_invoices")
        .insert([payload])
        .select()
        .single();
    }

    if (!result.error) {
      setInvoices((prev) => {
        const exists = prev.find((i) => i.id === result.data.id);
        if (exists)
          return prev.map((i) => (i.id === result.data.id ? result.data : i));
        return [...prev, result.data];
      });
      setFormData(result.data);
      setIsEditing(false);
      setLastSaved(Date.now());
      if (!silent) showToast("Saved");
    } else {
      if (!silent) showToast(`Save Failed`, "error");
    }
    if (!silent) setLoading(false);
    return result;
  };

  const copyEmailDraft = () => {
    const total = formatCurrency(calcs.total);
    let subject = `Invoice ${selectedProject.ref_number}: ${selectedProject.book_title}`;
    let body = `Hi,\n\nPlease find the invoice for "${selectedProject.book_title}" attached. Total due is ${total}.\n\nPayment Link: ${formData.payment_link}\nDue: ${formData.due_date} (NET 15)\n\nThanks!`;
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setMailFeedback(true);
    setTimeout(() => setMailFeedback(false), 2000);
  };

  const triggerComplete = () => {
    setModal({
      isOpen: true,
      type: "complete",
      title: "Complete Project",
      message: `Mark "${selectedProject.book_title}" as 100% complete? This moves it to the Completed Archive.`,
      action: executeComplete,
    });
  };

  const executeComplete = async () => {
    setLoading(true);
    await handleSave(true);
    const { error: updateError } = await supabase
      .from("2_booking_requests")
      .update({ status: "completed", end_date: new Date().toISOString() })
      .eq("id", selectedProject.id);
    if (updateError) {
      showToast("Completion Failed", "error");
      setLoading(false);
      setModal({ isOpen: false });
      return;
    }
    await supabase
      .from("4_production")
      .delete()
      .eq("request_id", selectedProject.id);
    setProjects((prev) => prev.filter((p) => p.id !== selectedProject.id));
    setModal({ isOpen: false });
    setLoading(false);
    showToast("Project Completed!");
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("admin")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("admin").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
      localStorage.setItem("default_invoice_logo", publicUrl);

      showToast("Logo Uploaded");
    } catch (error) {
      console.error("Logo upload error:", error);
      showToast("Upload Failed", "error");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { description: "", amount: 0 }],
    }));
  };

  const updateLineItem = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index][field] = value;
    setFormData((prev) => ({ ...prev, line_items: newItems }));
  };

  const removeLineItem = (index) => {
    const newItems = [...formData.line_items];
    newItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, line_items: newItems }));
  };

  const status = useMemo(() => {
    switch (formData.reminders_sent) {
      case 1:
        return {
          label: "Level 1: Gentle",
          color: "text-orange-500",
          icon: <ShieldAlert size={18} />,
        };
      case 2:
        return {
          label: "Level 2: Urgent",
          color: "text-red-500",
          icon: <Bomb size={18} />,
        };
      case 3:
        return {
          label: "Level 3: NUCLEAR",
          color: "text-red-700 animate-pulse",
          icon: <TrainFront size={18} />,
        };
      default:
        return {
          label: "On Track",
          color: "text-slate-400",
          icon: <CheckCircle size={18} />,
        };
    }
  }, [formData.reminders_sent]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start pb-20">
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

      {/* SIDEBAR */}
      <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-8 self-start shrink-0">
        <div className="bg-white rounded-[2rem] border flex flex-col overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                placeholder="Filter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="p-2 flex border-b bg-slate-50 overflow-x-auto">
            {["open", "waiting", "paid", "deposits", "refunds"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 px-3 py-3 text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === t ? "bg-white text-slate-900 shadow-sm rounded-lg" : "text-slate-400"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-2 space-y-1 max-h-[30vh] lg:max-h-[50vh] overflow-y-auto custom-scrollbar">
            {filteredProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full text-left p-3 rounded-xl transition-all border border-transparent ${selectedProject?.id === p.id ? "bg-slate-900 text-white shadow-md" : "hover:bg-slate-50 hover:border-slate-100 text-slate-600"}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black uppercase opacity-60">
                    Inv #{p.ref_number}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeTab === "paid"
                        ? "bg-emerald-400"
                        : activeTab === "deposits" &&
                            invoices.find((i) => i.project_id === p.id)
                              ?.deposit_status === "paid"
                          ? "bg-emerald-400"
                          : activeTab === "refunds"
                            ? "bg-red-500"
                            : "bg-slate-200"
                    }`}
                  ></span>
                </div>
                <p className="font-bold text-xs truncate">{p.book_title}</p>
              </button>
            ))}
            {filteredProjects.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
                No projects
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 w-full bg-white rounded-[3rem] border shadow-sm flex flex-col p-6 md:p-10 min-h-screen">
        {!selectedProject ? (
          <div className="m-auto text-slate-300 font-black uppercase text-xs tracking-widest text-center">
            Select Target Project
          </div>
        ) : (
          <div className="space-y-10">
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white sticky top-0 z-20 pb-6 border-b gap-4">
              <div className="flex items-center gap-6">
                {/* Logo Logic */}
                <div className="relative group w-20 h-20 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      className="w-full h-full object-contain p-1"
                      alt="Logo"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-slate-300" />
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-slate-900/10 hover:bg-slate-900/60 flex flex-col items-center justify-center cursor-pointer z-20 transition-all">
                      <div className="opacity-0 group-hover:opacity-100 flex flex-col items-center">
                        <UploadCloud size={16} className="text-white" />
                        <span className="text-[8px] text-white font-bold uppercase mt-1">
                          Upload
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={isUploadingLogo}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">
                    {activeTab === "deposits"
                      ? "Deposit Invoice"
                      : activeTab === "refunds"
                        ? "Refund Processing"
                        : `Collection: ${selectedProject.ref_number}`}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    {selectedProject.book_title}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={
                    isEditing
                      ? () => handleSave(false)
                      : () => setIsEditing(true)
                  }
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase shadow-lg flex gap-2 items-center"
                >
                  {isEditing ? <Save size={14} /> : <FileText size={14} />}{" "}
                  {isEditing ? "Save" : "Edit"}
                </button>
              </div>
            </div>

            {/* --- REFUND MODULE --- */}
            {activeTab === "refunds" && (
              <div className="bg-red-50 rounded-[2.5rem] p-8 border border-red-100 relative overflow-hidden animate-in zoom-in-95">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Ban size={120} className="text-red-600" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase text-red-900 mb-6 flex items-center gap-2">
                    <Ban size={16} /> Refund Calculator
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black uppercase text-red-400 ml-1 mb-2 block">
                        Refund Percentage
                      </label>
                      <div className="flex gap-2">
                        {[25, 50, 75, 100].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setRefundPercentage(pct)}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${refundPercentage === pct ? "bg-red-600 text-white border-red-600 shadow-md" : "bg-white border-red-200 text-red-400 hover:bg-red-100"}`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-red-400 ml-1 mb-2 block">
                        Refund Amount
                      </label>
                      <div className="text-4xl font-black text-red-600 tracking-tighter">
                        {formatCurrency(calcs.refundTotal)}
                      </div>
                      <div className="text-[10px] font-bold text-red-400">
                        Based on Paid Deposit: {formatCurrency(calcs.deposit)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-red-200/50">
                    <PDFDownloadLink
                      document={
                        <InvoicePDF
                          project={selectedProject}
                          data={{
                            ...formData,
                            is_refund: true,
                            refund_percentage: refundPercentage,
                          }}
                          calcs={calcs}
                        />
                      }
                      fileName={`REFUND_${selectedProject.ref_number}.pdf`}
                      className="w-full p-4 bg-red-600 text-white rounded-2xl font-bold uppercase text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-red-700"
                    >
                      {({ loading }) =>
                        loading ? "Generating..." : "Download Refund Receipt"
                      }
                    </PDFDownloadLink>
                  </div>
                </div>
              </div>
            )}

            {/* --- DEPOSIT MODULE --- */}
            {activeTab === "deposits" && (
              <div className="bg-blue-50 rounded-[2.5rem] p-8 border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Wallet size={120} className="text-blue-600" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-black uppercase text-blue-900 mb-6 flex items-center gap-2">
                    <Wallet size={16} /> Deposit Management
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-400 ml-1">
                        Deposit Amount
                      </label>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={formData.deposit_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deposit_amount: e.target.value,
                          })
                        }
                        className="w-full p-4 rounded-2xl border-none bg-white text-lg font-bold text-blue-900 shadow-sm outline-none focus:ring-2 ring-blue-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-blue-400 ml-1">
                        Status
                      </label>
                      <select
                        disabled={!isEditing}
                        value={formData.deposit_status}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deposit_status: e.target.value,
                          })
                        }
                        className="w-full p-4 rounded-2xl border-none bg-white text-sm font-bold text-blue-900 shadow-sm outline-none focus:ring-2 ring-blue-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <PDFDownloadLink
                      document={
                        <InvoicePDF
                          project={selectedProject}
                          data={{ ...formData, is_deposit: true }}
                          calcs={{ total: formData.deposit_amount }}
                        />
                      }
                      fileName={`DEPOSIT_${selectedProject.ref_number}.pdf`}
                      className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold uppercase text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700"
                    >
                      {({ loading }) =>
                        loading ? "Loading..." : "Download Deposit Invoice"
                      }
                    </PDFDownloadLink>
                  </div>
                </div>
              </div>
            )}

            {/* MAIN INVOICE LEDGER (Hidden in special tabs) */}
            {activeTab !== "deposits" && activeTab !== "refunds" && (
              <div
                className={`rounded-[3rem] p-8 text-white shadow-2xl space-y-8 bg-slate-950`}
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase">
                      PFH Count
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={formData.pfh_count}
                      onChange={(e) =>
                        setFormData({ ...formData, pfh_count: e.target.value })
                      }
                      className="bg-slate-900 w-full p-4 rounded-2xl text-2xl font-black border border-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[10px] font-black uppercase">
                      PFH Rate
                    </label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={formData.pfh_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, pfh_rate: e.target.value })
                      }
                      className="bg-slate-900 w-full p-4 rounded-2xl text-2xl font-black border border-slate-800 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  {/* ... other inputs ... */}
                </div>

                <div className="pt-8 border-t border-slate-800 flex justify-between items-end">
                  <div>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest block">
                      Total Due
                    </span>
                    <span className="text-6xl font-black tracking-tighter text-emerald-400">
                      {formatCurrency(calcs.finalDue)}
                    </span>
                    {formData.deposit_status === "paid" && (
                      <div className="text-xs font-bold text-slate-500 mt-2 flex items-center gap-2">
                        <CheckCircle2 size={12} /> Deposit of{" "}
                        {formatCurrency(formData.deposit_amount)} deducted
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LINKS & STATUS & DATES (Visible in all tabs for context, or you can hide) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="p-6 md:p-10 rounded-[2.5rem] bg-slate-50 border shadow-sm space-y-4">
                <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <Link2 size={16} /> Payment Link
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border text-xs font-bold outline-none focus:border-blue-500"
                    value={formData.payment_link || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_link: e.target.value })
                    }
                  />
                ) : (
                  <a
                    href={formData.payment_link}
                    target="_blank"
                    className="text-xs font-black text-blue-600 underline uppercase truncate block"
                  >
                    {formData.payment_link || "None"}
                  </a>
                )}
              </div>
              {/* ... other link ... */}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              {/* ... Status Buttons ... */}
              <div className="p-6 md:p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 items-center text-slate-900">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase block tracking-[0.2em]">
                    Invoiced Date
                  </label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-bold bg-transparent outline-none"
                    value={formData.invoiced_date || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoiced_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase block tracking-[0.2em]">
                    NET 15 Due
                  </label>
                  <input
                    type="date"
                    disabled={!isEditing}
                    className={`w-full p-4 rounded-2xl border text-sm font-bold bg-transparent outline-none ${overdueDays > 0 ? "text-red-600 border-red-200 shadow-xl" : "border-slate-200"}`}
                    value={formData.due_date || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
