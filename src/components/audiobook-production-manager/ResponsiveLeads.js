"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Users,
  UserX,
  Search,
  Edit2,
  Save,
  X as CloseIcon,
  Mail,
  AlertCircle,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Ban,
  CheckCircle2,
  XCircle,
  StickyNote,
  Globe,
  Briefcase,
  Upload,
  Download,
  Filter,
  Loader2,
  Trash2,
  RefreshCw,
  Linkedin,
  Instagram,
  Facebook,
  Monitor,
  AlertTriangle,
  FileSpreadsheet,
} from "lucide-react";

// --- SUPABASE CLIENT ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONSTANTS ---
const PLATFORMS = [
  "TikTok",
  "LinkedIn",
  "Instagram",
  "Facebook",
  "Email",
  "Upwork",
  "Website",
  "Other",
];

const SOURCES = [
  "Cold Outreach",
  "Inbound DM",
  "Referral",
  "Conference/Event",
  "Website Form",
  "Other",
];

const DNC_REASONS = [
  "Active client",
  "Contact later",
  "Dormant client",
  "Unsubbed",
  "Ghosted",
  "Not good fit",
  "Firm disinterest",
  "Rude",
  "Failed onboarding",
  "Failed F15",
  "Rejected F15",
  "Conflict of interest",
  "Reconnecting",
];

const DNC_SEVERITY = {
  "Active client": "orange",
  "Contact later": "orange",
  Reconnecting: "orange",
  "Dormant client": "orange",
  Unsubbed: "red",
  Ghosted: "red",
  "Not good fit": "red",
  "Firm disinterest": "red",
  Rude: "crimson",
  "Failed onboarding": "crimson",
  "Failed F15": "crimson",
  "Rejected F15": "crimson",
  "Conflict of interest": "crimson",
};

// --- HELPER COMPONENTS ---

const PlatformIcon = ({ platform }) => {
  const size = 14;
  const normalized = (platform || "").toLowerCase();

  switch (normalized) {
    case "tiktok":
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="currentColor"
          className="text-pink-500"
        >
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case "linkedin":
      return <Linkedin size={size} className="text-blue-700" />;
    case "instagram":
      return <Instagram size={size} className="text-pink-600" />;
    case "facebook":
      return <Facebook size={size} className="text-blue-600" />;
    case "email":
      return <Mail size={size} className="text-slate-500" />;
    case "website":
      return <Monitor size={size} className="text-emerald-500" />;
    case "upwork":
      return <Briefcase size={size} className="text-green-600" />;
    default:
      return <Globe size={size} className="text-slate-400" />;
  }
};

const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split("-");
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const getDaysIdle = (dateString) => {
  if (!dateString) return 0;
  const last = parseLocalDate(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (!last) return 0;
  const diffTime = Math.abs(now - last);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const downloadCSV = (data, filename) => {
  if (!data.length) {
    alert("No data to export");
    return;
  }
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          let value = row[fieldName] ?? "";
          if (typeof value === "string") {
            value = value.replace(/"/g, '""');
            if (value.includes(",")) value = `"${value}"`;
          }
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- UPDATED: Responsive Tab Button ---
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 md:flex-none flex items-center justify-center gap-2 
      py-3 md:py-4 md:px-8 border-b-2 transition-all duration-200 
      outline-none focus:outline-none focus:ring-0
      ${
        active
          ? "border-slate-900 text-slate-900 bg-slate-50 font-black tracking-tight"
          : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-medium"
      }
    `}
  >
    <Icon size={18} className={active ? "text-slate-900" : "text-slate-400"} />
    <span className="text-xs md:text-sm whitespace-nowrap">{label}</span>
    {count !== undefined && (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
          active ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatusBadge = ({ status, type = "prospect" }) => {
  if (type === "dnc") {
    const severity = DNC_SEVERITY[status] || "orange";
    let style = "";
    let Icon = XCircle;

    if (severity === "orange") {
      style = "bg-orange-50 text-orange-700 border border-orange-200";
      Icon = AlertCircle;
    } else if (severity === "red") {
      style = "bg-red-50 text-red-600 border border-red-200";
      Icon = Ban;
    } else if (severity === "crimson") {
      style = "bg-red-100 text-red-900 border border-red-300 shadow-sm";
      Icon = AlertTriangle;
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${style}`}
      >
        <Icon size={12} strokeWidth={2.5} />
        {status}
      </span>
    );
  }

  const config = {
    active: {
      style: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: CheckCircle2,
      label: "Active",
    },
    contract_sent: {
      style: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      icon: Mail,
      label: "Contract Sent",
    },
    closed_won: {
      style:
        "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm",
      icon: Trophy,
      label: "Closed Won",
    },
    closed_lost: {
      style: "bg-slate-100 text-slate-600 border border-slate-200",
      icon: XCircle,
      label: "Closed Lost",
    },
  };

  const {
    style,
    icon: IconComp,
    label,
  } = config[status] || {
    style: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: null,
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${style}`}
    >
      {IconComp && <IconComp size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
};

const DaysTicker = ({ date }) => {
  const days = getDaysIdle(date);
  if (!date) return <span className="text-slate-300 text-xs italic">-</span>;
  let colorClass = "bg-slate-100 text-slate-500 border-slate-200";
  if (days > 60) colorClass = "bg-red-100 text-red-700 border-red-200";
  else if (days > 30)
    colorClass = "bg-orange-50 text-orange-600 border-orange-200";
  else if (days > 14)
    colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${colorClass}`}
    >
      <Briefcase size={10} />
      {days}d
    </span>
  );
};

const SortableHeader = ({
  label,
  sortKey,
  currentSort,
  onSort,
  align = "left",
}) => {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      className={`px-4 md:px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none text-${align} outline-none whitespace-nowrap`}
      onClick={() => onSort(sortKey)}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "right" ? "justify-end" : ""
        }`}
      >
        {label}
        <span
          className={`text-slate-400 transition-opacity ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          }`}
        >
          {isActive && currentSort.direction === "asc" && <ArrowUp size={12} />}
          {isActive && currentSort.direction === "desc" && (
            <ArrowDown size={12} />
          )}
          {!isActive && <ArrowUpDown size={12} />}
        </span>
      </div>
    </th>
  );
};

export default function ResponsiveLeads() {
  const [activeTab, setActiveTab] = useState("prospects");
  const [prospects, setProspects] = useState([]);
  const [dncList, setDncList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    platform: "",
    reason: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "last_reply_date",
    direction: "desc",
  });
  const [editingState, setEditingState] = useState({
    id: null,
    listType: null,
    data: {},
  });

  const fetchData = async () => {
    setLoading(true);
    const { data: prospectsData } = await supabase
      .from("1_responsive_leads")
      .select("*")
      .order("last_reply_date", { ascending: false });
    if (prospectsData) setProspects(prospectsData);
    const { data: dncData } = await supabase
      .from("8_do_not_contact")
      .select("*")
      .order("date_last_contacted", { ascending: false });
    if (dncData) setDncList(dncData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    const dataToExport = filteredData.map(
      ({ id, created_at, ...rest }) => rest
    );
    const dateStr = new Date().toISOString().split("T")[0];
    downloadCSV(dataToExport, `${activeTab}_export_${dateStr}`);
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split("\n");
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, "").toLowerCase());
      const newEntries = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!row) continue;
        const entry = {};
        headers.forEach((h, index) => {
          const val = row[index] ? row[index].replace(/^"|"$/g, "") : "";
          if (h.includes("name")) entry.full_name = val;
          else if (h.includes("company")) {
            entry.company_name = val;
            entry.indie_or_company = val;
          } else if (h.includes("email")) entry.email = val;
          else if (h.includes("platform")) entry.platform = val;
          else if (h.includes("status")) entry.status = val;
          else if (h.includes("reason")) entry.reason = val;
          else if (h.includes("source")) entry.lead_source = val;
        });
        if (activeTab === "prospects") {
          if (!entry.status) entry.status = "active";
          if (!entry.last_reply_date)
            entry.last_reply_date = new Date().toISOString().split("T")[0];
        } else {
          if (!entry.reason) entry.reason = "Not good fit";
          if (!entry.date_last_contacted)
            entry.date_last_contacted = new Date().toISOString().split("T")[0];
        }
        newEntries.push(entry);
      }

      if (newEntries.length > 0) {
        const tableMap = {
          prospects: "1_responsive_leads",
          dnc: "8_do_not_contact",
        };
        const { error } = await supabase
          .from(tableMap[activeTab])
          .insert(newEntries);
        if (error) alert("Import failed: " + error.message);
        else {
          alert(`Success! Imported ${newEntries.length} records.`);
          fetchData();
        }
      }
      setImporting(false);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const saveEdit = async () => {
    const { listType, data, id } = editingState;
    if (listType === "prospects") {
      setProspects((prev) => prev.map((p) => (p.id === id ? data : p)));
      await supabase.from("1_responsive_leads").update(data).eq("id", id);
    } else {
      setDncList((prev) => prev.map((d) => (d.id === id ? data : d)));
      await supabase.from("8_do_not_contact").update(data).eq("id", id);
    }
    cancelEdit();
  };

  const handleEditChange = (field, value) => {
    setEditingState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  };

  const startEdit = (item, type) => {
    setEditingState({ id: item.id, listType: type, data: { ...item } });
  };
  const cancelEdit = () => {
    setEditingState({ id: null, listType: null, data: {} });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete?")) return;
    if (activeTab === "prospects") {
      setProspects((prev) => prev.filter((p) => p.id !== id));
      await supabase.from("1_responsive_leads").delete().eq("id", id);
    } else {
      setDncList((prev) => prev.filter((d) => d.id !== id));
      await supabase.from("8_do_not_contact").delete().eq("id", id);
    }
  };

  const handleMoveToDNC = async (row) => {
    if (!window.confirm(`Move ${row.full_name} to DNC?`)) return;
    setProcessing(true);
    setProspects((prev) => prev.filter((p) => p.id !== row.id));
    await supabase.from("1_responsive_leads").delete().eq("id", row.id);
    const newDNC = {
      full_name: row.full_name,
      indie_or_company: row.company_name || "Indie",
      email: row.email,
      lead_type: row.lead_type || "Author",
      reason: "Not good fit",
      date_last_contacted: row.last_reply_date,
    };
    const { data } = await supabase
      .from("8_do_not_contact")
      .insert([newDNC])
      .select()
      .single();
    if (data) setDncList((prev) => [data, ...prev]);
    setProcessing(false);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let data = activeTab === "prospects" ? prospects : dncList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(q))
      );
    }
    if (showFilters && activeTab === "prospects") {
      if (filters.status)
        data = data.filter((i) => i.status === filters.status);
      if (filters.platform)
        data = data.filter((i) => i.platform === filters.platform);
    }
    return [...data].sort((a, b) => {
      let key = sortConfig.key;
      if (activeTab === "dnc" && key === "last_reply_date")
        key = "date_last_contacted";
      const aVal = a[key] || "";
      const bVal = b[key] || "";
      return sortConfig.direction === "asc"
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
          ? 1
          : -1;
    });
  }, [
    activeTab,
    prospects,
    dncList,
    searchQuery,
    sortConfig,
    filters,
    showFilters,
  ]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 md:space-y-8 bg-slate-50 min-h-screen font-sans relative p-4 md:p-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".csv"
        className="hidden"
      />

      {(processing || importing) && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-slate-900" size={48} />
            <div className="text-lg font-black uppercase tracking-widest text-slate-900">
              {importing ? "Importing..." : "Processing..."}
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATED: Header Section Stacks on Mobile --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tight">
            Lead Ops
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Admin Dashboard
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleImportTrigger}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl shadow-sm transition-all font-bold text-xs uppercase tracking-wide"
            >
              <FileSpreadsheet size={16} className="text-emerald-500" /> Import
            </button>
            <button
              onClick={handleExport}
              className="flex-1 md:flex-none flex justify-center items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-sm transition-all font-bold text-xs uppercase tracking-wide"
            >
              <Download size={16} /> Export
            </button>
          </div>
          {/* Vertical Divider Hidden on Mobile */}
          <div className="hidden md:block w-px h-8 bg-slate-200 mx-1"></div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              <Search className="text-slate-400 ml-2" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2 outline-none text-slate-700 w-full md:w-48 bg-transparent text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-red-500"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all flex-shrink-0 ${
                showFilters
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600"
              }`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && activeTab === "prospects" && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Filters:
          </span>
          <select
            className="p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 outline-none uppercase w-full md:w-auto"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="contract_sent">Contract Sent</option>
          </select>
          <select
            className="p-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 outline-none uppercase w-full md:w-auto"
            value={filters.platform}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, platform: e.target.value }))
            }
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
        {/* --- UPDATED: Tabs Flex on Mobile --- */}
        <div className="flex items-center border-b border-slate-200 bg-white px-2 md:px-6">
          <TabButton
            active={activeTab === "prospects"}
            onClick={() => setActiveTab("prospects")}
            icon={Users}
            label="Prospects"
            count={prospects.length}
          />
          <TabButton
            active={activeTab === "dnc"}
            onClick={() => setActiveTab("dnc")}
            icon={UserX}
            label="DNC" // Shortened for Mobile
            count={dncList.length}
          />
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center gap-3 text-slate-400 font-bold uppercase tracking-widest">
            <Loader2 className="animate-spin" /> Loading...
          </div>
        ) : (
          // --- UPDATED: Horizontal Scroll Wrapper ---
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px]">
                <tr>
                  <SortableHeader
                    label="Name / Lead"
                    sortKey="full_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  {activeTab === "prospects" && (
                    <>
                      <SortableHeader
                        label="Platform"
                        sortKey="platform"
                        currentSort={sortConfig}
                        onSort={handleSort}
                      />
                      <SortableHeader
                        label="Status"
                        sortKey="status"
                        currentSort={sortConfig}
                        onSort={handleSort}
                      />
                      <th className="px-4 md:px-6 py-4">Notes</th>
                    </>
                  )}
                  {activeTab === "dnc" && (
                    <>
                      <SortableHeader
                        label="Reason"
                        sortKey="reason"
                        currentSort={sortConfig}
                        onSort={handleSort}
                      />
                      <th className="px-4 md:px-6 py-4">Type</th>
                    </>
                  )}
                  <SortableHeader
                    label="Last Contact"
                    sortKey={
                      activeTab === "prospects"
                        ? "last_reply_date"
                        : "date_last_contacted"
                    }
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {editingState.id === row.id &&
                    editingState.listType === activeTab ? (
                      <>
                        <td className="px-4 md:px-6 py-4 align-top">
                          <input
                            className="border border-blue-300 p-2 rounded-lg w-40 md:w-full mb-2 font-bold text-slate-800"
                            value={editingState.data.full_name || ""}
                            onChange={(e) =>
                              handleEditChange("full_name", e.target.value)
                            }
                            placeholder="Name"
                          />
                          <input
                            className="border border-slate-200 p-1.5 rounded-lg w-40 md:w-full text-xs text-slate-500"
                            value={editingState.data.email || ""}
                            onChange={(e) =>
                              handleEditChange("email", e.target.value)
                            }
                            placeholder="Email"
                          />
                        </td>
                        {activeTab === "prospects" && (
                          <>
                            <td className="px-4 md:px-6 py-4 align-top">
                              <select
                                className="border p-2 rounded-lg w-32 md:w-full text-xs mb-2 bg-white"
                                value={editingState.data.platform || ""}
                                onChange={(e) =>
                                  handleEditChange("platform", e.target.value)
                                }
                              >
                                {PLATFORMS.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </select>
                              <select
                                className="border p-2 rounded-lg w-32 md:w-full text-xs bg-white text-slate-500"
                                value={editingState.data.lead_source || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    "lead_source",
                                    e.target.value
                                  )
                                }
                              >
                                {SOURCES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 md:px-6 py-4 align-top">
                              <select
                                className="border border-blue-300 p-2 rounded-lg w-32 md:w-full bg-white font-medium"
                                value={editingState.data.status || ""}
                                onChange={(e) =>
                                  handleEditChange("status", e.target.value)
                                }
                              >
                                <option value="active">Active</option>
                                <option value="contract_sent">
                                  Contract Sent
                                </option>
                                <option value="closed_won">Closed Won</option>
                                <option value="closed_lost">Closed Lost</option>
                              </select>
                            </td>
                            <td className="px-4 md:px-6 py-4 align-top">
                              <textarea
                                className="border p-2 rounded-lg w-48 md:w-full text-xs h-20 resize-none bg-white"
                                value={editingState.data.next_action || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    "next_action",
                                    e.target.value
                                  )
                                }
                                placeholder="Notes..."
                              />
                            </td>
                          </>
                        )}
                        {activeTab === "dnc" && (
                          <>
                            <td className="px-4 md:px-6 py-4 align-top">
                              <select
                                className="border p-2 rounded w-32 md:w-full"
                                value={editingState.data.reason || ""}
                                onChange={(e) =>
                                  handleEditChange("reason", e.target.value)
                                }
                              >
                                {DNC_REASONS.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 md:px-6 py-4">
                              <input
                                className="border p-2 rounded w-32 md:w-full"
                                value={editingState.data.indie_or_company || ""}
                                onChange={(e) =>
                                  handleEditChange(
                                    "indie_or_company",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          </>
                        )}
                        <td className="px-4 md:px-6 py-4 align-top">
                          <input
                            type="date"
                            className="border p-2 rounded-lg w-32 md:w-full text-xs"
                            value={
                              (activeTab === "prospects"
                                ? editingState.data.last_reply_date
                                : editingState.data.date_last_contacted) || ""
                            }
                            onChange={(e) =>
                              handleEditChange(
                                activeTab === "prospects"
                                  ? "last_reply_date"
                                  : "date_last_contacted",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={saveEdit}
                              className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 bg-red-100 text-red-700 rounded-lg"
                            >
                              <CloseIcon size={18} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 md:px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">
                            {row.full_name}
                          </div>
                          <div className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                            {row.email ? (
                              <>
                                <Mail size={10} /> {row.email}
                              </>
                            ) : (
                              <span className="italic">No email</span>
                            )}
                          </div>
                        </td>
                        {activeTab === "prospects" && (
                          <>
                            <td className="px-4 md:px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                                <PlatformIcon platform={row.platform} />
                                {row.platform || "Unknown"}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase mt-1 ml-6">
                                {row.lead_source}
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4">
                              <StatusBadge
                                status={row.status}
                                type="prospect"
                              />
                            </td>
                            <td className="px-4 md:px-6 py-4 max-w-xs whitespace-normal">
                              {row.next_action ? (
                                <div className="flex items-start gap-2 text-slate-600 text-xs bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                                  <StickyNote
                                    size={14}
                                    className="text-amber-400 shrink-0 mt-0.5"
                                  />
                                  <span>{row.next_action}</span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs italic">
                                  -
                                </span>
                              )}
                            </td>
                          </>
                        )}
                        {activeTab === "dnc" && (
                          <>
                            <td className="px-4 md:px-6 py-4">
                              <StatusBadge status={row.reason} type="dnc" />
                            </td>
                            <td className="px-4 md:px-6 py-4 text-slate-600 text-xs">
                              {row.indie_or_company}
                            </td>
                          </>
                        )}
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-slate-700 font-bold text-xs">
                              {activeTab === "prospects"
                                ? row.last_reply_date
                                : row.date_last_contacted}
                            </span>
                            <DaysTicker
                              date={
                                activeTab === "prospects"
                                  ? row.last_reply_date
                                  : row.date_last_contacted
                              }
                            />
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                          {/* --- UPDATED: Actions Visible on Mobile --- */}
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(row, activeTab)}
                              className="text-slate-400 hover:text-blue-600 p-2 rounded-lg"
                            >
                              <Edit2 size={16} />
                            </button>
                            {activeTab === "prospects" && (
                              <button
                                onClick={() => handleMoveToDNC(row)}
                                className="text-slate-400 hover:text-amber-600 p-2 rounded-lg"
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="text-slate-400 hover:text-red-600 p-2 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
