// src/components/production-manager/InvoicesAndPayments.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  FileText,
  ExternalLink,
  Save,
  Search,
  Loader2,
  Hash,
  Calculator,
  TrendingUp,
  BookOpen,
  Layers,
  Calendar,
  Clock,
  AlertTriangle,
  Bell,
  CheckCircle,
  RotateCcw,
  Percent,
  CreditCard,
  PlusCircle,
  Copy,
  Download,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
};

export default function InvoicesAndPayments({ initialProject }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const [selectedProject, setSelectedProject] = useState(
    initialProject || null
  );
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    pfh_count: 0,
    pfh_rate: 0,
    sag_ph_percent: 0,
    convenience_fee: 100,
    total_amount: 0,
    invoice_pdf_link: "",
    tracker_sheet_link: "",
    invoiced_date: "",
    due_date: "",
    reminders_sent: 0,
    ledger_tab: "open",
  });

  const fetchData = async () => {
    const { data: bData } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: iData } = await supabase.from("9_invoices").select("*");
    setProjects(bData || []);
    setInvoices(iData || []);
    if (!selectedProject && bData?.length > 0) setSelectedProject(bData[0]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const inv = invoices.find((i) => i.project_id === p.id);
      const currentStatus = inv?.ledger_tab || "open";
      return currentStatus === activeTab;
    });
  }, [projects, invoices, activeTab]);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!selectedProject?.id) return;
      setLoading(true);
      const { data } = await supabase
        .from("9_invoices")
        .select("*")
        .eq("project_id", selectedProject.id)
        .single();
      if (data) {
        setInvoice(data);
        setFormData({ ...data });
        setIsEditing(false);
      } else {
        const estimatedPFH = selectedProject.word_count
          ? (selectedProject.word_count / 9300).toFixed(2)
          : 0;
        setFormData({
          pfh_count: estimatedPFH,
          pfh_rate: 0,
          sag_ph_percent: 0,
          convenience_fee: 100,
          total_amount: 0,
          invoice_pdf_link: "",
          tracker_sheet_link: "",
          invoiced_date: new Date().toISOString().split("T")[0],
          due_date: "",
          reminders_sent: 0,
          ledger_tab: "open",
        });
        setIsEditing(true);
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [selectedProject]);

  // CALCULATION ENGINE
  const calculations = useMemo(() => {
    const base = Number(formData.pfh_count) * Number(formData.pfh_rate);
    const sagAmount = base * (Number(formData.sag_ph_percent) / 100);
    const fee = Number(formData.convenience_fee);
    const total = base + sagAmount + fee;
    const net = total - fee;
    const tax = net * 0.25;
    const incomeAfterTax = net - tax;

    return { base, sagAmount, fee, total, net, tax, incomeAfterTax };
  }, [
    formData.pfh_count,
    formData.pfh_rate,
    formData.sag_ph_percent,
    formData.convenience_fee,
  ]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      total_amount: calculations.total.toFixed(2),
    }));
  }, [calculations.total]);

  const handleSave = async () => {
    if (!selectedProject) return;
    setLoading(true);
    const payload = {
      ...formData,
      project_id: selectedProject.id,
      reminders_sent: Math.min(formData.reminders_sent, 3),
    };
    let result = invoice?.id
      ? await supabase
          .from("9_invoices")
          .update(payload)
          .eq("id", invoice.id)
          .select()
          .single()
      : await supabase.from("9_invoices").insert([payload]).select().single();
    if (!result.error) {
      setInvoice(result.data);
      setFormData(result.data);
      fetchData();
      setIsEditing(false);
    }
    setLoading(false);
  };

  // CSV EXPORT LOGIC
  const downloadRowCSV = () => {
    const headers = [
      "Project Reference",
      "Title / Project",
      "Timesheet & Invoice(s)",
      "Gross",
      "Overhead",
      "Net",
      "25% Tax",
      "P&H",
      "Income After Tax",
      "Payment Status",
    ];
    const row = [
      selectedProject.ref_number || "",
      selectedProject.book_title || "",
      formData.invoice_pdf_link || "",
      calculations.total.toFixed(2),
      calculations.fee.toFixed(2),
      calculations.net.toFixed(2),
      calculations.tax.toFixed(2),
      calculations.sagAmount.toFixed(2),
      calculations.incomeAfterTax.toFixed(2),
      formData.ledger_tab,
    ];

    const csvContent = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Ledger_Entry_${selectedProject.ref_number || "Draft"}.csv`
    );
    link.click();
  };

  const overdueDays = (() => {
    if (!formData.due_date || formData.ledger_tab === "paid") return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = parseLocalDate(formData.due_date);
    return due ? Math.ceil((today - due) / (1000 * 60 * 60 * 24)) : 0;
  })();

  return (
    <div className="flex gap-6 h-[calc(100vh-250px)]">
      {/* SIDEBAR */}
      <div className="w-80 bg-white rounded-[2rem] border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="p-2 flex border-b border-slate-100 bg-slate-50">
          {["open", "waiting", "paid"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                selectedProject?.id === p.id
                  ? "bg-slate-900 text-white shadow-xl"
                  : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <p className="text-[9px] font-black uppercase opacity-60 mb-1 leading-none">
                Invoice # {p.ref_number || "PENDING"}
              </p>
              <p className="font-bold text-sm truncate">{p.book_title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-y-auto flex flex-col">
        {!selectedProject ? (
          <div className="flex-1 flex items-center justify-center text-slate-300 uppercase font-black text-xs tracking-widest">
            Select project
          </div>
        ) : (
          <>
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">
                  Invoice # {selectedProject.ref_number || "NO REF"}
                </div>
                {overdueDays > 0 && (
                  <div className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-black uppercase">
                    Late {overdueDays}d
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={downloadRowCSV}
                  className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs flex items-center gap-2 hover:bg-slate-50"
                >
                  <Download size={14} /> CSV Export
                </button>
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-black"
                  >
                    <Save size={16} /> Save
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* LEDGER MATH ENGINE */}
              <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-start relative z-10">
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Calculator size={10} /> PFH Count
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        className="bg-slate-900 text-white text-xl font-black p-3 rounded-xl w-full border border-slate-800 outline-none"
                        value={formData.pfh_count}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pfh_count: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="text-2xl font-black">
                        {formData.pfh_count}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 font-bold">
                      Base: {formatCurrency(calculations.base)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp size={10} /> Rate
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        className="bg-slate-900 text-white text-xl font-black p-3 rounded-xl w-full border border-slate-800 outline-none"
                        value={formData.pfh_rate}
                        onChange={(e) =>
                          setFormData({ ...formData, pfh_rate: e.target.value })
                        }
                      />
                    ) : (
                      <div className="text-2xl font-black">
                        {formatCurrency(formData.pfh_rate)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <Percent size={10} /> SAG P&H %
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        className="bg-slate-900 text-white text-xl font-black p-3 rounded-xl w-full border border-slate-800 outline-none"
                        value={formData.sag_ph_percent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sag_ph_percent: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="text-2xl font-black">
                        {formData.sag_ph_percent}%
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-500/80 font-bold tracking-tight">
                      + {formatCurrency(calculations.sagAmount)} to total
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <PlusCircle size={10} /> Conv. Fee
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        className="bg-slate-900 text-white text-xl font-black p-3 rounded-xl w-full border border-slate-800 outline-none"
                        value={formData.convenience_fee}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            convenience_fee: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="text-2xl font-black">
                        {formatCurrency(formData.convenience_fee)}
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-500/80 font-bold tracking-tight">
                      + {formatCurrency(calculations.fee)} to total
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-800 flex justify-between items-end">
                  <div>
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                      Total Project Gross
                    </div>
                    <div className="text-5xl font-black tracking-tighter text-emerald-400">
                      {formatCurrency(calculations.total)}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      {["open", "waiting", "paid"].map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            setFormData({ ...formData, ledger_tab: t })
                          }
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${
                            formData.ledger_tab === t
                              ? "bg-white text-slate-900 border-white shadow-lg"
                              : "bg-transparent text-slate-500 border-slate-800"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* THREE STRIKE REMINDERS */}
              <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black uppercase text-xs tracking-widest text-slate-900 flex items-center gap-2 mb-2">
                    <Bell size={16} /> Reminders Sent
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    System hard-cap at 3 strikes
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((strike) => (
                      <div
                        key={strike}
                        className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${
                          formData.reminders_sent >= strike
                            ? "bg-slate-900 border-slate-200 text-white"
                            : "bg-slate-200 border-slate-300 opacity-20"
                        }`}
                      >
                        <span className="font-black text-xs">{strike}</span>
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            reminders_sent: Math.min(p.reminders_sent + 1, 3),
                          }))
                        }
                        className="p-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-md"
                      >
                        Add Strike
                      </button>
                      <button
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            reminders_sent: Math.max(p.reminders_sent - 1, 0),
                          }))
                        }
                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* DATES & LINKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                  <h3 className="font-black uppercase text-xs tracking-widest text-slate-900 flex items-center gap-2">
                    <Calendar size={16} /> Dates
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                        Invoiced
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          className="w-full p-2 rounded-lg border text-xs font-bold"
                          value={formData.invoiced_date || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              invoiced_date: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="text-xs font-bold">
                          {formData.invoiced_date || "-"}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                        Due
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          className="w-full p-2 rounded-lg border text-xs font-bold"
                          value={formData.due_date || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              due_date: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div
                          className={`text-xs font-bold ${
                            overdueDays > 0 ? "text-red-600" : "text-slate-900"
                          }`}
                        >
                          {formData.due_date || "-"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                  <h3 className="font-black uppercase text-xs tracking-widest text-slate-900 flex items-center gap-2">
                    <Layers size={16} /> External
                  </h3>
                  <div className="space-y-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          placeholder="Invoice Link..."
                          className="w-full p-3 bg-white border rounded-xl text-[10px] font-medium outline-none"
                          value={formData.invoice_pdf_link}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              invoice_pdf_link: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Master Ledger Link..."
                          className="w-full p-3 bg-white border rounded-xl text-[10px] font-medium outline-none"
                          value={formData.tracker_sheet_link}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              tracker_sheet_link: e.target.value,
                            })
                          }
                        />
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <a
                          href={formData.invoice_pdf_link}
                          target="_blank"
                          className="flex-1 p-3 bg-white border rounded-xl text-[10px] font-black uppercase text-slate-600 hover:text-blue-600 flex justify-between items-center"
                        >
                          Invoice <ExternalLink size={12} />
                        </a>
                        <a
                          href={formData.tracker_sheet_link}
                          target="_blank"
                          className="flex-1 p-3 bg-white border rounded-xl text-[10px] font-black uppercase text-slate-600 hover:text-emerald-600 flex justify-between items-center"
                        >
                          Ledger <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
