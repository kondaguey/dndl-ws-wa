import React, { useState, useMemo } from "react";
import {
  Users,
  UserX,
  Search,
  Edit2,
  Save,
  X,
  Mail,
  Clock,
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
  MessageCircle,
  Plus,
  Filter,
  RefreshCw,
  Loader2,
  ThumbsDown,
  UserMinus,
  FileX,
  Trash2,
  RotateCcw,
  MoveRight,
} from "lucide-react";

// --- CONSTANTS ---

const PLATFORMS = [
  "Twitter",
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

// --- MOCK DATA ---

const INITIAL_PROSPECTS = [
  {
    id: "uuid-1",
    full_name: "Sarah Miller",
    company_name: "Nebula Press",
    email: "sarah.m@example.com",
    lead_type: "Author: Sci-Fi",
    lead_source: "Inbound DM",
    platform: "Twitter",
    vibes: "Good energy",
    next_action: "Send proposal PDF",
    days_dormant: 5,
    status: "active",
    last_reply_date: "2025-12-28",
  },
  {
    id: "uuid-2",
    full_name: "David Chen",
    company_name: "",
    email: "david.c@example.com",
    lead_type: "Author: Fantasy",
    lead_source: "Cold Outreach",
    platform: "LinkedIn",
    vibes: "Professional",
    next_action: "Follow up on contract terms",
    days_dormant: 45,
    status: "active",
    last_reply_date: "2025-11-20",
  },
  {
    id: "uuid-3",
    full_name: "Jessica Bloom",
    company_name: "Bloom Indie",
    email: "j.bloom@example.com",
    lead_type: "Indie Publisher",
    lead_source: "Referral",
    platform: "Email",
    vibes: "Chill",
    next_action: "Waiting on signature",
    days_dormant: 1,
    status: "contract_sent",
    last_reply_date: "2026-01-02",
  },
];

const INITIAL_DNC = [
  {
    id: 1,
    full_name: "Chris Philbrook",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Sci-Fi",
    reason: "Dormant client",
    date_last_contacted: "2025-10-01",
  },
  {
    id: 2,
    full_name: "Jim Christ",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Other",
    reason: "Dormant client",
    date_last_contacted: "2025-11-01",
  },
  {
    id: 3,
    full_name: "Kelsie Rae",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Conflict of interest",
    date_last_contacted: "",
  },
  {
    id: 4,
    full_name: "A.A. Dark",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Conflict of interest",
    date_last_contacted: "",
  },
  {
    id: 5,
    full_name: "Alaska Angelini",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Conflict of interest",
    date_last_contacted: "",
  },
  {
    id: 6,
    full_name: "Maggie Mayhem",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Conflict of interest",
    date_last_contacted: "",
  },
  {
    id: 7,
    full_name: "J. Sterling",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Conflict of interest",
    date_last_contacted: "",
  },
  {
    id: 8,
    full_name: "Jonah York",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Conflict of interest",
    date_last_contacted: "",
  },
  {
    id: 9,
    full_name: "April Barnswell",
    indie_or_company: "Indie",
    email: "",
    lead_type: "Author: Romance",
    reason: "Not good fit",
    date_last_contacted: "",
  },
];

// --- HELPER FUNCTIONS ---

const getDaysIdle = (dateString) => {
  if (!dateString) return null;
  const last = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - last);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- COMPONENTS ---

const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all duration-200 outline-none focus:outline-none focus:ring-0 ${
      active
        ? "border-blue-600 text-blue-700 bg-blue-50/60 font-semibold"
        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium"
    }`}
  >
    <Icon size={18} className={active ? "text-blue-600" : "text-slate-400"} />
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-1 ${
          active ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatusBadge = ({ status }) => {
  const config = {
    // Prospects
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
    // DNC Reasons
    "Active client": {
      style: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle2,
      label: "Active Client",
    },
    "Contact later": {
      style: "bg-blue-50 text-blue-700 border border-blue-200",
      icon: Clock,
      label: "Contact Later",
    },
    "Dormant client": {
      style: "bg-slate-100 text-slate-600 border border-slate-200",
      icon: Clock,
      label: "Dormant",
    },
    "Dormant Client": {
      style: "bg-slate-100 text-slate-600 border border-slate-200",
      icon: Clock,
      label: "Dormant",
    },
    Unsubbed: {
      style: "bg-orange-50 text-orange-700 border border-orange-200",
      icon: UserMinus,
      label: "Unsubbed",
    },
    Ghosted: {
      style: "bg-slate-50 text-slate-500 border border-slate-200",
      icon: UserX,
      label: "Ghosted",
    },
    "Not good fit": {
      style: "bg-slate-100 text-slate-600 border border-slate-200",
      icon: X,
      label: "Not Good Fit",
    },
    "Firm disinterest": {
      style: "bg-red-50 text-red-700 border border-red-200",
      icon: ThumbsDown,
      label: "Firm Disinterest",
    },
    Rude: {
      style: "bg-red-100 text-red-800 border border-red-200",
      icon: AlertCircle,
      label: "Rude",
    },
    "Failed onboarding": {
      style: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: FileX,
      label: "Failed Onboarding",
    },
    "Failed F15": {
      style: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: FileX,
      label: "Failed F15",
    },
    "Rejected F15": {
      style: "bg-red-50 text-red-700 border border-red-200",
      icon: XCircle,
      label: "Rejected F15",
    },
    "Conflict of interest": {
      style: "bg-purple-50 text-purple-700 border border-purple-200",
      icon: Ban,
      label: "Conflict of Interest",
    },
    Reconnecting: {
      style: "bg-blue-100 text-blue-800 border border-blue-300",
      icon: RefreshCw,
      label: "Reconnecting...",
    },
  };

  const {
    style,
    icon: Icon,
    label,
  } = config[status] || {
    style: "bg-gray-100 text-gray-700 border border-gray-200",
    icon: null,
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {label}
    </span>
  );
};

const DaysIdleBadge = ({ date }) => {
  if (!date) return <span className="text-slate-300 text-xs italic">N/A</span>;
  const days = getDaysIdle(date);
  let colorClass = "bg-slate-50 text-slate-600 border-slate-200";
  let Icon = CheckCircle2;

  if (days > 30) {
    colorClass = "bg-red-50 text-red-600 border-red-200 font-semibold";
    Icon = AlertCircle;
  } else if (days > 14) {
    colorClass = "bg-amber-50 text-amber-600 border-amber-200";
    Icon = Clock;
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${colorClass} w-fit`}
    >
      <Icon size={12} />
      <span>{days} days</span>
    </div>
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
      className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group select-none text-${align} outline-none focus:outline-none focus:ring-0`}
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
          {isActive && currentSort.direction === "asc" && <ArrowUp size={14} />}
          {isActive && currentSort.direction === "desc" && (
            <ArrowDown size={14} />
          )}
          {!isActive && <ArrowUpDown size={14} />}
        </span>
      </div>
    </th>
  );
};

export default function LeadManagementDashboard() {
  const [activeTab, setActiveTab] = useState("prospects");
  const [prospects, setProspects] = useState(INITIAL_PROSPECTS);
  const [dncList, setDncList] = useState(INITIAL_DNC);

  const [isMoving, setIsMoving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const startEdit = (item, type) => {
    setEditingState({
      id: item.id,
      listType: type,
      data: { ...item },
    });
  };

  const cancelEdit = () => {
    setEditingState({ id: null, listType: null, data: {} });
  };

  const handleRevertDNC = (row) => {
    // Add this confirmation check
    if (
      !window.confirm(
        `Are you sure you want to revert ${row.full_name} to the active Prospect list?`
      )
    ) {
      return;
    }

    setIsMoving(true);
    setTimeout(() => {
      // 1. Remove from DNC
      setDncList((prev) => prev.filter((item) => item.id !== row.id));

      // 2. Add to Prospects
      const reconnectedProspect = {
        id: `revert-${Date.now()}`,
        full_name: row.full_name,
        company_name:
          row.indie_or_company === "Indie" ? "" : row.indie_or_company,
        email: row.email,
        lead_type: row.lead_type,
        lead_source: "Reconnected",
        platform: "Email", // Defaulting
        vibes: "",
        next_action: `Reverted from DNC on ${new Date().toLocaleDateString()}`,
        days_dormant: 0,
        status: "active",
        last_reply_date: new Date().toISOString().split("T")[0],
      };

      setProspects((prev) => [reconnectedProspect, ...prev]);
      setActiveTab("prospects");
      setIsMoving(false);
    }, 1200);
  };

  // Move Prospect to DNC List
  const handleMoveToDNC = (row) => {
    if (
      window.confirm(
        `Are you sure you want to move ${row.full_name} to the Do Not Contact list?`
      )
    ) {
      setProspects((prev) => prev.filter((p) => p.id !== row.id));

      const newDNC = {
        id: `dnc-${Date.now()}`,
        full_name: row.full_name,
        indie_or_company: row.company_name || "Indie",
        email: row.email,
        lead_type: row.lead_type || "Author: Other",
        reason: "Not good fit", // Default reason
        date_last_contacted: row.last_reply_date,
      };

      setDncList((prev) => [newDNC, ...prev]);
    }
  };

  const deleteProspect = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this prospect? This cannot be undone."
      )
    ) {
      setProspects((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const saveEdit = () => {
    const { listType, data, id } = editingState;

    if (listType === "dnc" && data.reason === "Reconnecting") {
      cancelEdit();
      handleRevertDNC(data);
      return;
    }

    if (listType === "prospects") {
      setProspects((prev) => prev.map((p) => (p.id === id ? data : p)));
    } else if (listType === "dnc") {
      setDncList((prev) => prev.map((d) => (d.id === id ? data : d)));
    }
    cancelEdit();
  };

  const handleEditChange = (field, value) => {
    setEditingState((prev) => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }));
  };

  const addNewProspect = () => {
    const newId = `new-${Date.now()}`;
    const newProspect = {
      id: newId,
      full_name: "",
      company_name: "",
      email: "",
      lead_type: "",
      lead_source: "Cold Outreach",
      platform: "Twitter",
      vibes: "",
      next_action: "",
      days_dormant: 0,
      status: "active",
      last_reply_date: new Date().toISOString().split("T")[0],
    };

    setProspects([newProspect, ...prospects]);
    setEditingState({
      id: newId,
      listType: "prospects",
      data: newProspect,
    });
  };

  const filteredData = useMemo(() => {
    const data = activeTab === "prospects" ? prospects : dncList;
    let filtered = data;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lowerQuery)
        )
      );
    }

    if (showFilters) {
      if (activeTab === "prospects") {
        if (filters.status)
          filtered = filtered.filter((i) => i.status === filters.status);
        if (filters.platform)
          filtered = filtered.filter((i) => i.platform === filters.platform);
      } else {
        if (filters.reason)
          filtered = filtered.filter((i) => i.reason === filters.reason);
      }
    }

    return [...filtered].sort((a, b) => {
      let key = sortConfig.key;
      if (activeTab === "dnc" && key === "last_reply_date")
        key = "date_last_contacted";

      const aVal = a[key] || "";
      const bVal = b[key] || "";

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
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
    <div className="w-full max-w-7xl mx-auto p-8 space-y-8 bg-slate-50 min-h-screen font-sans relative">
      {isMoving && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <div className="text-lg font-semibold text-slate-800">
              Reconnecting Contact...
            </div>
            <p className="text-slate-500 text-sm">
              Moving back to active prospects pipeline.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            Lead Command Center
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Manage your pipeline and exclusions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Search className="text-slate-400 ml-2" size={20} />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-2 py-1.5 outline-none text-slate-700 w-64 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-red-500 mr-1"
              >
                <XCircle size={16} fill="currentColor" className="text-white" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all outline-none focus:outline-none focus:ring-0 ${
              showFilters
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter size={20} />
          </button>

          {activeTab === "prospects" && (
            <button
              onClick={addNewProspect}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 outline-none focus:outline-none focus:ring-0"
            >
              <Plus size={18} strokeWidth={2.5} />
              Add Prospect
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 animate-in slide-in-from-top-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Filters:
          </span>

          {activeTab === "prospects" ? (
            <>
              <select
                className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-0"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="contract_sent">Contract Sent</option>
                <option value="closed_won">Closed Won</option>
                <option value="closed_lost">Closed Lost</option>
              </select>

              <select
                className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-0"
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
            </>
          ) : (
            <select
              className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-0"
              value={filters.reason}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, reason: e.target.value }))
              }
            >
              <option value="">All Reasons</option>
              {DNC_REASONS.filter((r) => r !== "Reconnecting").map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

          {(filters.status || filters.platform || filters.reason) && (
            <button
              onClick={() =>
                setFilters({ status: "", platform: "", reason: "" })
              }
              className="ml-auto text-xs text-red-500 hover:underline outline-none focus:outline-none"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden ring-1 ring-slate-900/5">
        <div className="flex items-center border-b border-slate-200 bg-white px-4">
          <TabButton
            active={activeTab === "prospects"}
            onClick={() => {
              setActiveTab("prospects");
              setSortConfig({ key: "last_reply_date", direction: "desc" });
            }}
            icon={Users}
            label="Prospect Pipeline"
            count={prospects.length}
          />
          <TabButton
            active={activeTab === "dnc"}
            onClick={() => {
              setActiveTab("dnc");
              setSortConfig({ key: "date_last_contacted", direction: "desc" });
            }}
            icon={UserX}
            label="Do Not Contact"
            count={dncList.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-xs">
              <tr>
                <SortableHeader
                  label="Name & Company"
                  sortKey="full_name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />

                {activeTab === "prospects" && (
                  <SortableHeader
                    label="Platform & Source"
                    sortKey="platform"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                )}

                {activeTab === "dnc" && (
                  <SortableHeader
                    label="Company/Indie"
                    sortKey="indie_or_company"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                )}

                <SortableHeader
                  label={activeTab === "prospects" ? "Status" : "Reason"}
                  sortKey={activeTab === "prospects" ? "status" : "reason"}
                  currentSort={sortConfig}
                  onSort={handleSort}
                />

                {activeTab === "prospects" && (
                  <SortableHeader
                    label="Vibes"
                    sortKey="vibes"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                )}

                {activeTab === "dnc" && (
                  <SortableHeader
                    label="Type"
                    sortKey="lead_type"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                )}

                {activeTab === "prospects" && (
                  <th className="px-6 py-4">Notes / Next Action</th>
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

                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {editingState.id === row.id &&
                  editingState.listType === activeTab ? (
                    // --- EDIT MODE ---
                    <>
                      <td className="px-6 py-4">
                        <input
                          className="border border-blue-300 p-1.5 rounded-md w-full mb-1 focus:ring-2 focus:ring-blue-200 outline-none font-medium"
                          placeholder="Full Name"
                          value={editingState.data.full_name}
                          onChange={(e) =>
                            handleEditChange("full_name", e.target.value)
                          }
                        />
                        {activeTab === "prospects" ? (
                          <input
                            className="border border-slate-200 p-1.5 rounded-md w-full text-xs mb-1"
                            placeholder="Company Name"
                            value={editingState.data.company_name}
                            onChange={(e) =>
                              handleEditChange("company_name", e.target.value)
                            }
                          />
                        ) : null}
                        <input
                          className="border border-slate-200 p-1.5 rounded-md w-full text-xs text-slate-500"
                          placeholder="Email"
                          value={editingState.data.email}
                          onChange={(e) =>
                            handleEditChange("email", e.target.value)
                          }
                        />
                      </td>

                      {activeTab === "prospects" && (
                        <td className="px-6 py-4">
                          <select
                            className="border border-blue-300 p-1.5 rounded w-full mb-1 bg-white text-xs"
                            value={editingState.data.platform}
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
                            className="border border-slate-200 p-1.5 rounded w-full text-xs text-slate-600 bg-white"
                            value={editingState.data.lead_source}
                            onChange={(e) =>
                              handleEditChange("lead_source", e.target.value)
                            }
                          >
                            {SOURCES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {activeTab === "dnc" && (
                        <td className="px-6 py-4">
                          <input
                            className="border p-1.5 rounded w-full"
                            placeholder="Indie/Company"
                            value={editingState.data.indie_or_company}
                            onChange={(e) =>
                              handleEditChange(
                                "indie_or_company",
                                e.target.value
                              )
                            }
                          />
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <select
                          className="border border-blue-300 p-1.5 rounded w-full bg-white"
                          value={
                            activeTab === "prospects"
                              ? editingState.data.status
                              : editingState.data.reason
                          }
                          onChange={(e) =>
                            handleEditChange(
                              activeTab === "prospects" ? "status" : "reason",
                              e.target.value
                            )
                          }
                        >
                          {activeTab === "prospects" ? (
                            <>
                              <option value="active">Active</option>
                              <option value="contract_sent">
                                Contract Sent
                              </option>
                              <option value="closed_won">Closed Won</option>
                              <option value="closed_lost">Closed Lost</option>
                            </>
                          ) : (
                            // DO NOT CONTACT REASONS
                            DNC_REASONS.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))
                          )}
                        </select>
                      </td>

                      {activeTab === "prospects" && (
                        <td className="px-6 py-4">
                          <input
                            className="border p-1.5 rounded w-full"
                            placeholder="Vibes"
                            value={editingState.data.vibes}
                            onChange={(e) =>
                              handleEditChange("vibes", e.target.value)
                            }
                          />
                        </td>
                      )}

                      {activeTab === "dnc" && (
                        <td className="px-6 py-4">
                          <input
                            className="border p-1.5 rounded w-full"
                            placeholder="Lead Type"
                            value={editingState.data.lead_type}
                            onChange={(e) =>
                              handleEditChange("lead_type", e.target.value)
                            }
                          />
                        </td>
                      )}

                      {activeTab === "prospects" && (
                        <td className="px-6 py-4">
                          <textarea
                            className="border p-1.5 rounded w-full text-xs"
                            placeholder="Next Action / Notes"
                            rows={2}
                            value={editingState.data.next_action}
                            onChange={(e) =>
                              handleEditChange("next_action", e.target.value)
                            }
                          />
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <input
                          type="date"
                          className="border p-1.5 rounded w-full"
                          value={
                            activeTab === "prospects"
                              ? editingState.data.last_reply_date
                              : editingState.data.date_last_contacted
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

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={saveEdit}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // --- VIEW MODE ---
                    <>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base">
                          {row.full_name}
                        </div>
                        {activeTab === "prospects" && row.company_name && (
                          <div className="text-xs text-slate-600 font-medium mb-0.5">
                            {row.company_name}
                          </div>
                        )}
                        <div className="text-slate-500 text-xs flex items-center gap-1">
                          {row.email ? (
                            <>
                              <Mail size={10} /> {row.email}
                            </>
                          ) : (
                            <span className="italic text-slate-400">
                              No email
                            </span>
                          )}
                        </div>
                      </td>

                      {activeTab === "prospects" && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            {row.platform === "Twitter" ? (
                              <MessageCircle size={14} />
                            ) : (
                              <Globe size={14} />
                            )}
                            {row.platform}
                          </div>
                          <div className="text-xs text-slate-400">
                            {row.lead_source}
                          </div>
                        </td>
                      )}

                      {activeTab === "dnc" && (
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {row.indie_or_company}
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <StatusBadge
                          status={
                            activeTab === "prospects" ? row.status : row.reason
                          }
                        />
                      </td>

                      {activeTab === "prospects" && (
                        <td className="px-6 py-4">
                          <span className="text-slate-600 text-sm">
                            {row.vibes || "-"}
                          </span>
                        </td>
                      )}

                      {activeTab === "dnc" && (
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {row.lead_type}
                        </td>
                      )}

                      {activeTab === "prospects" && (
                        <td className="px-6 py-4 max-w-xs">
                          <div className="flex items-start gap-2 text-slate-600 text-sm">
                            <StickyNote
                              size={14}
                              className="mt-0.5 text-amber-400 shrink-0"
                            />
                            <span>{row.next_action || "No notes"}</span>
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-700 font-medium text-xs">
                            {activeTab === "prospects"
                              ? row.last_reply_date
                              : row.date_last_contacted}
                          </span>
                          {activeTab === "prospects" && (
                            <DaysIdleBadge date={row.last_reply_date} />
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(row, activeTab)}
                            className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>

                          {activeTab === "prospects" && (
                            <>
                              <button
                                onClick={() => handleMoveToDNC(row)}
                                className="text-slate-300 hover:text-amber-600 hover:bg-amber-50 p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                                title="Move to DNC"
                              >
                                <Ban size={18} />
                              </button>
                              <button
                                onClick={() => deleteProspect(row.id)}
                                className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                                title="Delete Prospect"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}

                          {activeTab === "dnc" && (
                            <button
                              onClick={() => handleRevertDNC(row)}
                              className="text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                              title="Revert to Prospect"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
