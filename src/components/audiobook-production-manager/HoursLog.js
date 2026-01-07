// src/components/production-manager/HoursLog.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Clock,
  TrendingUp,
  Trash2,
  PlusCircle,
  Loader2,
  Download,
  ShieldCheck,
  Zap,
  LineChart,
  Coins,
  Receipt,
  Landmark,
  Mic2,
  Scissors,
  Coffee,
  Search,
  BookOpen,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HoursLog({ initialProject }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const [selectedProject, setSelectedProject] = useState(
    initialProject || null
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().split("T")[0],
    activity: "Recording",
    duration_hrs: "",
    notes: "",
  });

  const [forecast, setForecast] = useState({
    pfh_rate: 250,
    pozotron_rate: 14,
    other_expenses: 0,
    tax_rate: 25,
  });

  // --- FETCH DATA (Source of Truth) ---
  const fetchData = async () => {
    // 1. Fetch Projects (Filter out deleted/archived)
    const { data: bData } = await supabase
      .from("2_booking_requests")
      .select("*")
      .neq("status", "deleted")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    // 2. Fetch Financials & Logs
    const { data: iData } = await supabase.from("9_invoices").select("*");
    const { data: sData } = await supabase
      .from("10_session_logs")
      .select("*")
      .order("date", { ascending: false });

    setProjects(bData || []);
    setInvoices(iData || []);
    setSessionLogs(sData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- SYNC SELECTED PROJECT ---
  // If the selected project is deleted elsewhere, switch selection
  useEffect(() => {
    if (projects.length > 0) {
      // If currently selected project no longer exists in the fetched list
      if (
        selectedProject &&
        !projects.find((p) => p.id === selectedProject.id)
      ) {
        setSelectedProject(projects[0]);
      }
      // If nothing selected, select first
      else if (!selectedProject) {
        setSelectedProject(projects[0]);
      }
    } else {
      setSelectedProject(null);
    }
  }, [projects]);

  const activeLogs = useMemo(
    () => sessionLogs.filter((l) => l.project_id === selectedProject?.id),
    [sessionLogs, selectedProject]
  );

  // --- FINANCIAL CALCS ---
  const money = useMemo(() => {
    if (!selectedProject) return null;

    const getProjectFinances = (proj, inv, config) => {
      const wc = Number(proj.word_count || 0);
      const estPFH = wc / 9300;
      const pfhCount = inv?.pfh_count || estPFH;
      const rate = inv?.pfh_rate || config.pfh_rate;
      const grossTotal = pfhCount * rate;
      const pozotronEst = pfhCount * Number(config.pozotron_rate);
      const netBeforeTax =
        grossTotal - pozotronEst - Number(config.other_expenses);
      const taxWithQbi = netBeforeTax * 0.8 * (config.tax_rate / 100);
      const takeHomeWithQbi = netBeforeTax - taxWithQbi;
      const taxNoQbi = netBeforeTax * (config.tax_rate / 100);
      const takeHomeNoQbi = netBeforeTax - taxNoQbi;

      return {
        grossTotal,
        netBeforeTax,
        takeHomeWithQbi,
        takeHomeNoQbi,
        taxNoQbi,
        taxWithQbi,
        pfhCount,
        pozotronEst,
      };
    };

    const currentInv = invoices.find(
      (inv) => inv.project_id === selectedProject.id
    );
    const current = getProjectFinances(selectedProject, currentInv, forecast);

    // Cumulative stats
    let cumGross = 0;
    let cumNet = 0;
    let cumTakeHome = 0;
    let cumHours = 0;
    projects.forEach((p) => {
      const inv = invoices.find((i) => i.project_id === p.id);
      const pLogs = sessionLogs.filter((l) => l.project_id === p.id);
      const pHours = pLogs.reduce(
        (acc, l) => acc + Number(l.duration_hrs || 0),
        0
      );
      if (pHours > 0) {
        const pFin = getProjectFinances(p, inv, forecast);
        cumGross += pFin.grossTotal;
        cumNet += pFin.netBeforeTax;
        cumTakeHome += pFin.takeHomeWithQbi;
        cumHours += pHours;
      }
    });

    const currentProjectHours = activeLogs.reduce(
      (acc, l) => acc + Number(l.duration_hrs || 0),
      0
    );

    return {
      ...current,
      currentProjectHours,
      cumGrossEPH: cumHours > 0 ? cumGross / cumHours : 0,
      cumNetEPH: cumHours > 0 ? cumNet / cumHours : 0,
      cumTakeHomeEPH: cumHours > 0 ? cumTakeHome / cumHours : 0,
      projGrossEPH:
        currentProjectHours > 0 ? current.grossTotal / currentProjectHours : 0,
      projNetEPH:
        currentProjectHours > 0
          ? current.netBeforeTax / currentProjectHours
          : 0,
      projTakeHomeEPH:
        currentProjectHours > 0
          ? current.takeHomeWithQbi / currentProjectHours
          : 0,
      effectiveTaxRate:
        current.netBeforeTax > 0
          ? ((current.netBeforeTax - current.takeHomeWithQbi) /
              current.netBeforeTax) *
            100
          : forecast.tax_rate,
    };
  }, [selectedProject, invoices, sessionLogs, forecast, projects, activeLogs]);

  const handleAddLog = async () => {
    if (!newLog.duration_hrs || !selectedProject) return;
    setLoading(true);
    const { error } = await supabase.from("10_session_logs").insert([
      {
        ...newLog,
        project_id: selectedProject.id,
        duration_hrs: Number(newLog.duration_hrs),
      },
    ]);
    if (!error) {
      setNewLog({ ...newLog, duration_hrs: "", notes: "" });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteLog = async (id) => {
    await supabase.from("10_session_logs").delete().eq("id", id);
    fetchData();
  };

  const exportToTSV = () => {
    if (!selectedProject || !money) return;
    const headers = ["Date", "Activity", "Duration", "Project", "Gross", "Net"];
    const rows = activeLogs.map((log) => [
      log.date,
      log.activity,
      log.duration_hrs,
      selectedProject.book_title,
      "",
      "",
    ]);
    const content = [headers, ...rows].map((e) => e.join("\t")).join("\n");
    const blob = new Blob([content], { type: "text/tab-separated-values" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedProject.ref_number}_Report.tsv`;
    link.click();
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val || 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start pb-20 animate-in fade-in duration-500">
      {/* SIDEBAR */}
      <div className="w-full lg:w-80 bg-white rounded-[2rem] border border-slate-200 flex flex-col overflow-hidden lg:sticky lg:top-8 self-start shadow-sm shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              placeholder="Search Projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex border-b bg-slate-50">
          {["open", "waiting", "paid"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${
                activeTab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-2 space-y-1 max-h-[30vh] lg:max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                className={`w-full text-left p-3 rounded-xl transition-all border border-transparent ${
                  selectedProject?.id === p.id
                    ? "bg-slate-900 text-white shadow-md"
                    : "hover:bg-slate-50 hover:border-slate-100 text-slate-600"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black uppercase opacity-60">
                    #{p.ref_number}
                  </span>
                  <span className="text-[9px] font-bold uppercase opacity-60">
                    {p.client_name}
                  </span>
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

      <div className="flex-1 w-full space-y-8">
        {!selectedProject ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <Clock size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase text-sm">
              Select a Project to Log Hours
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-2">
                  <BookOpen size={12} /> Ref: {selectedProject.ref_number}
                </div>
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">
                  {selectedProject.book_title}
                </h2>
              </div>
              <button
                onClick={exportToTSV}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all"
              >
                <Download size={14} /> Export Report
              </button>
            </div>

            {/* EPH STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
                <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400 flex items-center gap-2 mb-4">
                  <TrendingUp size={14} /> Current Project EPH
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">
                      Gross
                    </p>
                    <p className="text-lg font-black">
                      {formatCurrency(money?.projGrossEPH)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">
                      Net
                    </p>
                    <p className="text-lg font-black">
                      {formatCurrency(money?.projNetEPH)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-emerald-500 uppercase">
                      Take Home
                    </p>
                    <p className="text-lg font-black text-emerald-600">
                      {formatCurrency(money?.projTakeHomeEPH)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl text-white">
                <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                  <LineChart size={14} /> Global Averages
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">
                      Gross
                    </p>
                    <p className="text-lg font-black">
                      {formatCurrency(money?.cumGrossEPH)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">
                      Net
                    </p>
                    <p className="text-lg font-black">
                      {formatCurrency(money?.cumNetEPH)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-emerald-400 uppercase">
                      Take Home
                    </p>
                    <p className="text-lg font-black text-emerald-400">
                      {formatCurrency(money?.cumTakeHomeEPH)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FINANCIAL CALCULATOR */}
            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Gross Total
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-2xl font-black">
                      {formatCurrency(money?.grossTotal)}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Pre-Expense
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Pozotron Est.
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-2xl font-black text-red-400">
                      {formatCurrency(money?.pozotronEst)}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Net: {formatCurrency(money?.netBeforeTax)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 opacity-60">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Standard Home
                  </p>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xl font-black">
                      {formatCurrency(money?.takeHomeNoQbi)}
                    </p>
                    <p className="text-[9px] text-red-500 mt-1">
                      {forecast.tax_rate}% Tax
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> QBI Shield
                  </p>
                  <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                    <p className="text-2xl font-black text-emerald-400">
                      {formatCurrency(money?.takeHomeWithQbi)}
                    </p>
                    <p className="text-[9px] text-emerald-500 mt-1">
                      Eff. Tax: {money?.effectiveTaxRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Toggle */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { l: "PFH Rate", v: "pfh_rate", i: Coins },
                  { l: "Pozotron $/PFH", v: "pozotron_rate", i: Zap },
                  { l: "Other Expenses", v: "other_expenses", i: Receipt },
                  { l: "Tax Bracket %", v: "tax_rate", i: Landmark },
                ].map((field) => (
                  <div key={field.l} className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-1">
                      {field.i && <field.i size={10} />} {field.l}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-bold outline-none focus:border-emerald-500 transition-colors"
                      value={forecast[field.v]}
                      onChange={(e) =>
                        setForecast({ ...forecast, [field.v]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* LOG TABLE */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  Session Tracker
                </h2>
                <div className="bg-white px-4 py-2 rounded-xl border shadow-sm text-xs">
                  <span className="font-black text-slate-400 uppercase mr-2">
                    Total:
                  </span>
                  <span className="font-black text-slate-900">
                    {money?.currentProjectHours.toFixed(2)}h
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl border bg-white font-bold text-xs"
                    value={newLog.date}
                    onChange={(e) =>
                      setNewLog({ ...newLog, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Activity
                  </label>
                  <select
                    className="w-full p-3 rounded-xl border bg-white font-bold text-xs"
                    value={newLog.activity}
                    onChange={(e) =>
                      setNewLog({ ...newLog, activity: e.target.value })
                    }
                  >
                    <option>Prep</option>
                    <option>Recording</option>
                    <option>Editing</option>
                    <option>Proofing</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Hrs
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    className="w-full p-3 rounded-xl border bg-white font-bold text-xs"
                    value={newLog.duration_hrs}
                    onChange={(e) =>
                      setNewLog({ ...newLog, duration_hrs: e.target.value })
                    }
                  />
                </div>
                <button
                  onClick={handleAddLog}
                  disabled={loading}
                  className="h-[42px] bg-slate-900 text-white rounded-xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-slate-800 transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <PlusCircle size={14} />
                  )}{" "}
                  Log
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">
                        Date
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">
                        Activity
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400">
                        Time
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 text-right">
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {activeLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition-all"
                      >
                        <td className="px-8 py-4 font-bold text-slate-600">
                          {log.date}
                        </td>
                        <td className="px-8 py-4">
                          <span
                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase inline-flex items-center gap-2 ${
                              log.activity === "Recording"
                                ? "bg-emerald-100 text-emerald-700"
                                : log.activity === "Editing"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {log.activity === "Recording" && <Mic2 size={10} />}
                            {log.activity === "Editing" && (
                              <Scissors size={10} />
                            )}
                            {log.activity === "Prep" && <Coffee size={10} />}
                            {log.activity}
                          </span>
                        </td>
                        <td className="px-8 py-4 font-black text-slate-900">
                          {Number(log.duration_hrs).toFixed(2)}h
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="text-slate-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {activeLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-slate-300 text-xs italic"
                        >
                          No logs yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
