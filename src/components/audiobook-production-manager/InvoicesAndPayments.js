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
  Plus, // Added for line items
  Trash2, // Added for line items
} from "lucide-react";

import InvoicePDF from "./InvoicePDF";

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
  const [productionData, setProductionData] = useState([]);

  const [activeTab, setActiveTab] = useState("open");
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

  const [formData, setFormData] = useState({
    pfh_count: 0,
    pfh_rate: 0,
    sag_ph_percent: 0,
    convenience_fee: 0,
    line_items: [], // ADDED FOR CUSTOM ITEMS
    payment_link: "",
    contract_link: "",
    custom_note: "",
    invoiced_date: "",
    due_date: "",
    reminders_sent: 0,
    ledger_tab: "open",
    logo_url: "",
  });

  const showToast = (msg, type = "success") => setToast({ message: msg, type });

  // --- FETCHING ---
  const fetchData = async () => {
    const { data: bData } = await supabase
      .from("2_booking_requests")
      .select("*")
      .neq("status", "deleted")
      .neq("status", "archived")
      .neq("status", "completed")
      .order("created_at", { ascending: false });

    const { data: pData } = await supabase
      .from("4_production")
      .select("request_id, pfh_rate, pozotron_rate");
    const activeProductionIds = new Set(pData?.map((p) => p.request_id));

    const { data: iData } = await supabase.from("9_invoices").select("*");
    const existingInvoiceIds = new Set(iData?.map((i) => i.project_id));

    const validProjects = (bData || []).filter((p) => {
      return activeProductionIds.has(p.id) || existingInvoiceIds.has(p.id);
    });

    setProjects(validProjects);
    setInvoices(iData || []);
    setProductionData(pData || []);
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
        const prodInfo = productionData.find(
          (p) => p.request_id === selectedProject.id
        );
        const calculatedPFH = selectedProject.word_count
          ? (selectedProject.word_count / 9300).toFixed(2)
          : 0;

        setFormData({
          pfh_count: calculatedPFH,
          pfh_rate: prodInfo?.pfh_rate || 250,
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
        });
        setIsEditing(true);
      }
      setLoading(false);
    };
    loadData();
  }, [selectedProject, invoices, productionData]);

  // --- LINE ITEMS LOGIC ---
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

  // --- CALCS ---
  const calcs = useMemo(() => {
    const base = Number(formData.pfh_count) * Number(formData.pfh_rate);
    const sag = base * (Number(formData.sag_ph_percent) / 100);

    // Sum custom line items
    const customItemsTotal = (formData.line_items || []).reduce(
      (acc, item) => acc + Number(item.amount),
      0
    );

    const total =
      base + sag + Number(formData.convenience_fee) + customItemsTotal;
    return { base, sag, total };
  }, [
    formData.pfh_count,
    formData.pfh_rate,
    formData.sag_ph_percent,
    formData.convenience_fee,
    formData.line_items,
  ]);

  useEffect(() => {
    if (formData.invoiced_date && isEditing) {
      let date = new Date(formData.invoiced_date);
      date.setDate(date.getDate() + 15);
      setFormData((p) => ({
        ...p,
        due_date: date.toISOString().split("T")[0],
      }));
    }
  }, [formData.invoiced_date, isEditing]);

  const overdueDays = useMemo(() => {
    if (!formData.due_date || formData.ledger_tab === "paid") return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(formData.due_date);
    return due ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0;
  }, [formData.due_date, formData.ledger_tab]);

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

  const handleSave = async (silent = false) => {
    if (!selectedProject) return;
    if (!silent) setLoading(true);

    // 1. Prepare Payload with Strict Types
    const payload = {
      project_id: selectedProject.id,
      // Force Numeric
      pfh_count: Number(formData.pfh_count) || 0,
      pfh_rate: Number(formData.pfh_rate) || 0,
      sag_ph_percent: Number(formData.sag_ph_percent) || 0,
      convenience_fee: Number(formData.convenience_fee) || 0,
      est_tax_rate: 25, // Default or from state
      total_amount: Number(calcs.total) || 0,
      reminders_sent: Number(formData.reminders_sent) || 0,

      // Strings/Dates
      invoiced_date: formData.invoiced_date || null,
      due_date: formData.due_date || null,
      payment_link: formData.payment_link || "",
      contract_link: formData.contract_link || "",
      custom_note: formData.custom_note || "",
      ledger_tab: formData.ledger_tab || "open",
      logo_url: formData.logo_url || "",
      reference_number: selectedProject.ref_number, // Ensure ref is synced

      // JSONB (Supabase JS client handles array -> jsonb auto, but ensure it's an array)
      line_items: Array.isArray(formData.line_items) ? formData.line_items : [],

      // Zero out the old flat expense column to avoid confusion
      other_expenses: 0,
    };

    let result;

    // 2. Determine Insert vs Update
    // We look for an existing invoice ID attached to this project
    const existingInvoice = invoices.find(
      (i) => i.project_id === selectedProject.id
    );

    if (existingInvoice?.id) {
      // UPDATE
      result = await supabase
        .from("9_invoices")
        .update(payload)
        .eq("id", existingInvoice.id)
        .select()
        .single();
    } else {
      // INSERT (Don't include 'id' in payload)
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
      setFormData(result.data); // Update local state with DB response (including generated ID)
      setIsEditing(false);
      setLastSaved(Date.now());
      if (!silent) showToast("Invoice Saved");
    } else {
      console.error("Supabase Error:", result.error);
      if (!silent) showToast(`Save Failed: ${result.error.message}`, "error");
    }
    if (!silent) setLoading(false);
    return result;
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

  const copyEmailDraft = () => {
    const total = formatCurrency(calcs.total);
    let subject = `Invoice ${selectedProject.ref_number}: ${selectedProject.book_title}`;
    let body = `Hi,\n\nPlease find the invoice for "${selectedProject.book_title}" attached. Total due is ${total}.\n\nPayment Link: ${formData.payment_link}\nDue: ${formData.due_date} (NET 15)\n\nThanks!`;
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setMailFeedback(true);
    setTimeout(() => setMailFeedback(false), 2000);
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
                placeholder="Filter Invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="p-2 flex border-b bg-slate-50">
            {["open", "waiting", "paid"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-2 space-y-1 max-h-[30vh] lg:max-h-[50vh] overflow-y-auto custom-scrollbar">
            {projects
              .filter(
                (p) =>
                  (invoices.find((i) => i.project_id === p.id)?.ledger_tab ||
                    "open") === activeTab
              )
              .filter((p) =>
                p.book_title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((p) => (
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
                      className={`w-2 h-2 rounded-full ${activeTab === "paid" ? "bg-emerald-400" : "bg-slate-200"}`}
                    ></span>
                  </div>
                  <p className="font-bold text-xs truncate">{p.book_title}</p>
                </button>
              ))}
            {projects.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 font-bold italic">
                No active projects
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full bg-white rounded-[3rem] border shadow-sm flex flex-col p-6 md:p-10 min-h-screen">
        {!selectedProject ? (
          <div className="m-auto text-slate-300 font-black uppercase text-xs tracking-widest text-center">
            Select Target Project
          </div>
        ) : (
          <div className="space-y-10">
            {/* HEADER */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white sticky top-0 z-20 pb-6 border-b gap-4">
              {/* LOGO & TITLE */}
              <div className="flex items-center gap-6">
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
                        {isUploadingLogo ? (
                          <Loader2
                            size={16}
                            className="text-white animate-spin"
                          />
                        ) : (
                          <UploadCloud size={16} className="text-white" />
                        )}
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
                    Collection: {selectedProject.ref_number}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    {selectedProject.book_title}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2 md:gap-3 w-full xl:w-auto">
                {!isEditing && (
                  <>
                    {!showPDF ? (
                      <button
                        onClick={() => setShowPDF(true)}
                        className="flex-grow xl:flex-grow-0 px-4 md:px-6 py-4 bg-blue-100 text-blue-600 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 hover:bg-blue-200 transition-all shadow-sm"
                      >
                        <FileText size={14} /> PDF
                      </button>
                    ) : (
                      <PDFDownloadLink
                        key={`${selectedProject.id}-${lastSaved}`}
                        document={
                          <InvoicePDF
                            project={selectedProject}
                            data={formData}
                            calcs={calcs}
                          />
                        }
                        fileName={`INV_${selectedProject.ref_number}.pdf`}
                        className={`flex-grow xl:flex-grow-0 px-4 md:px-6 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-xl ${overdueDays > 0 ? "bg-red-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                      >
                        {({ loading }) =>
                          loading ? (
                            <>
                              <Loader2 className="animate-spin" size={14} /> ...
                            </>
                          ) : (
                            <>
                              <FileCheck size={14} /> PDF
                            </>
                          )
                        }
                      </PDFDownloadLink>
                    )}
                  </>
                )}
                <button
                  onClick={copyEmailDraft}
                  className={`flex-grow xl:flex-grow-0 px-4 md:px-5 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 transition-all shadow-xl ${mailFeedback ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {mailFeedback ? (
                    <CheckCircle size={14} />
                  ) : (
                    <Mail size={14} />
                  )}{" "}
                  {mailFeedback ? "Copied" : "Draft"}
                </button>
                <button
                  onClick={
                    isEditing
                      ? () => handleSave(false)
                      : () => setIsEditing(true)
                  }
                  className="flex-grow xl:flex-grow-0 px-6 md:px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] md:text-xs shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : isEditing ? (
                    <Save size={16} />
                  ) : (
                    <Receipt size={16} />
                  )}{" "}
                  {isEditing ? "Lock In" : "Edit"}
                </button>
                {!isEditing && (
                  <button
                    onClick={triggerComplete}
                    className="flex-grow xl:flex-grow-0 px-6 md:px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] md:text-xs shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
                  >
                    <Trophy size={16} /> Complete
                  </button>
                )}
              </div>
            </div>

            {/* LEDGER MATH */}
            <div
              className={`rounded-[3rem] p-6 md:p-12 text-white shadow-2xl space-y-8 md:space-y-12 transition-all duration-500 ${formData.reminders_sent === 3 ? "bg-red-950 ring-4 md:ring-8 ring-red-600 animate-[pulse_2s_infinite]" : "bg-slate-950"}`}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {[
                  { l: "PFH Count", v: "pfh_count", i: Calculator },
                  { l: "PFH Rate", v: "pfh_rate", i: TrendingUp },
                  { l: "SAG %", v: "sag_ph_percent", i: Percent },
                  { l: "Fee", v: "convenience_fee", i: PlusCircle },
                ].map((f) => (
                  <div key={f.l} className="space-y-2 md:space-y-3">
                    <label className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase flex items-center gap-2 tracking-[0.2em]">
                      <f.i size={12} /> {f.l}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      className="bg-slate-900 text-white text-lg md:text-2xl font-black p-3 md:p-4 rounded-2xl w-full border border-slate-800 outline-none focus:border-emerald-500 transition-colors"
                      value={formData[f.v]}
                      onChange={(e) =>
                        setFormData({ ...formData, [f.v]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* DYNAMIC LINE ITEMS EDITOR */}
              {isEditing && (
                <div className="border-t border-slate-800 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      Additional Charges / Deductions
                    </span>
                    <button
                      onClick={addLineItem}
                      className="text-[10px] font-bold uppercase text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.line_items.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <input
                          placeholder="Description (e.g. Late Fee)"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(idx, "description", e.target.value)
                          }
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) =>
                            updateLineItem(idx, "amount", e.target.value)
                          }
                          className="w-32 bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm font-bold text-white outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeLineItem(idx)}
                          className="text-slate-600 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-8 md:pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                  <span className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest block">
                    Amount Due
                  </span>
                  <span
                    className={`text-5xl md:text-7xl font-black tracking-tighter text-emerald-400`}
                  >
                    {formatCurrency(calcs.total)}
                  </span>
                </div>
                {isEditing && (
                  <div className="flex gap-2 bg-slate-900 p-2 md:p-2.5 rounded-[1.5rem] border border-slate-800 w-full md:w-auto overflow-x-auto">
                    {["open", "waiting", "paid"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setFormData({ ...formData, ledger_tab: t })
                        }
                        className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${formData.ledger_tab === t ? "bg-white text-slate-900 shadow-2xl scale-105" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* LINKS & STATUS & DATES (Kept same) */}
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
              <div className="p-6 md:p-10 rounded-[2.5rem] bg-slate-50 border shadow-sm space-y-4">
                <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2 text-purple-600">
                  <Briefcase size={16} /> Contract / Agreement
                </h3>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-4 rounded-xl border text-xs font-bold outline-none focus:border-purple-500"
                    value={formData.contract_link || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_link: e.target.value,
                      })
                    }
                  />
                ) : (
                  <a
                    href={formData.contract_link}
                    target="_blank"
                    className="text-xs font-black text-purple-600 underline uppercase truncate block"
                  >
                    {formData.contract_link || "None"}
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
              <div
                className={`p-6 md:p-10 rounded-[2.5rem] border-2 transition-all duration-300 flex flex-col justify-center gap-6 ${formData.reminders_sent === 3 ? "bg-red-50 border-red-600" : "bg-slate-50 border-slate-100"}`}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-black uppercase text-xs md:text-sm flex items-center gap-3 tracking-widest ${status.color}`}
                  >
                    {status.icon} {status.label}
                  </h3>
                  {isEditing && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            reminders_sent: Math.min(p.reminders_sent + 1, 3),
                          }))
                        }
                        className="p-3 md:p-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-200"
                      >
                        <Zap size={20} />
                      </button>
                      <button
                        onClick={() =>
                          setFormData((p) => ({ ...p, reminders_sent: 0 }))
                        }
                        className="p-3 md:p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl"
                      >
                        <RotateCcw size={20} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-16 md:h-20 rounded-[1.5rem] flex items-center justify-center border-2 ${formData.reminders_sent >= s ? (s === 3 ? "bg-red-700 border-red-900 text-white shadow-2xl" : s === 2 ? "bg-red-500 border-red-600 text-white shadow-lg" : "bg-orange-500 border-orange-600 text-white shadow-md") : "bg-white border-slate-100 opacity-40"}`}
                    >
                      {s === 1 && (
                        <ShieldAlert
                          size={24}
                          className={
                            formData.reminders_sent >= s ? "animate-pulse" : ""
                          }
                        />
                      )}
                      {s === 2 && (
                        <Flame
                          size={24}
                          className={
                            formData.reminders_sent >= s ? "animate-bounce" : ""
                          }
                        />
                      )}
                      {s === 3 && (
                        <TrainFront
                          size={30}
                          className={
                            formData.reminders_sent >= s
                              ? "animate-[bounce_2s_infinite]"
                              : ""
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
