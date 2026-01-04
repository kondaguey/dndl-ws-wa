"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Mic2,
  X,
  Clock,
  User,
  MapPin,
  Star,
  PhoneIncoming,
  Plus,
  Save,
  Loader2,
  FileText,
  ExternalLink,
  Calendar,
  AlertCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- HELPERS ---

// Returns a human-friendly status object for the deadline
const getDeadlineStatus = (dateString) => {
  if (!dateString)
    return {
      color: "text-slate-400",
      bg: "bg-slate-100",
      border: "border-slate-200",
      label: "No Deadline",
      icon: Clock,
    };

  const due = new Date(dateString).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return {
      color: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-100",
      label: "Expired",
      subLabel: `${Math.abs(diffDays)}d ago`,
      icon: AlertCircle,
    };

  if (diffDays === 0)
    return {
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      label: "Due Today",
      subLabel: "Do it now!",
      icon: AlertCircle,
    };

  if (diffDays <= 2)
    return {
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      label: "Due Soon",
      subLabel: `${diffDays} days left`,
      icon: Clock,
    };

  return {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "On Track",
    subLabel: `${diffDays} days left`,
    icon: Calendar,
  };
};

export default function AuditionManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    book_title: "",
    client_name: "",
    platform: "",
    due_date: "",
    material_url: "", // The link to the script/side
  });

  // --- FETCH ---
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("5_auditions")
      .select("*")
      .not("status", "in", '("booked","archive")')
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // --- ACTIONS ---

  const addNewAudition = async () => {
    if (!formData.book_title) return alert("Title is required");

    setLoading(true);
    const { error } = await supabase.from("5_auditions").insert([
      {
        book_title: formData.book_title,
        client_name: formData.client_name,
        roster_producer: formData.platform,
        // FIX: Ensure empty date strings become null
        end_date: formData.due_date || null,
        material_url: formData.material_url,
        production_status: "auditioning",
        status: "active",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Error adding audition");
      setLoading(false);
    } else {
      setFormData({
        book_title: "",
        client_name: "",
        platform: "",
        due_date: "",
        material_url: "",
      });
      setShowAddForm(false);
      fetchItems();
    }
  };

  const toggleStatus = async (id, currentStatus, type) => {
    let newStatus = currentStatus === type ? "auditioning" : type;
    await supabase
      .from("5_auditions")
      .update({ production_status: newStatus })
      .eq("id", id);
    fetchItems();
  };

  const bookAudition = async (item, type) => {
    const confirmBook = confirm(
      `Congrats! Move "${item.book_title}" to Active Projects?`
    );
    if (!confirmBook) return;

    // 1. GRADUATE to Projects Table
    const { error: insertError } = await supabase
      .from("2_booking_requests")
      .insert([
        {
          book_title: item.book_title,
          client_name: item.client_name,
          client_type: type,
          status: "pending",
          start_date: new Date().toISOString(),
          end_date: item.end_date || new Date().toISOString(),
          notes: `Booked from Audition. Source: ${
            item.roster_producer || "Unknown"
          } | Side: ${item.material_url || "N/A"}`,
        },
      ]);

    if (insertError) {
      console.error("Migration failed", insertError);
      alert("Failed to create project.");
      return;
    }

    // 2. MARK as Booked in Audition Log
    await supabase
      .from("5_auditions")
      .update({ status: "booked" })
      .eq("id", item.id);

    fetchItems();
  };

  const archiveAudition = async (id) => {
    if (!confirm("Archive this audition?")) return;
    await supabase
      .from("5_auditions")
      .update({ status: "archive" })
      .eq("id", id);
    fetchItems();
  };

  // --- RENDER ---
  if (loading && !items.length)
    return (
      <div className="text-center py-24 text-slate-300 flex flex-col items-center gap-3 animate-pulse">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-xs font-bold uppercase tracking-widest">
          Loading Opportunities...
        </span>
      </div>
    );

  return (
    <div className="space-y-8 pb-24">
      {/* HEADER & CONTROLS */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-black uppercase text-slate-900 text-3xl flex items-center gap-3 tracking-tight">
            <Mic2 className="text-emerald-500" size={32} /> Audition Deck
          </h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 ml-1">
            {items.length} Active •{" "}
            {items.filter((i) => i.production_status === "callback").length}{" "}
            Callbacks
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg hover:scale-105 ${
            showAddForm
              ? "bg-slate-100 text-slate-400 shadow-none"
              : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
          }`}
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? "Close Form" : "New Opportunity"}
        </button>
      </div>

      {/* ADD FORM */}
      {showAddForm && (
        <div className="animate-in slide-in-from-top-4 fade-in duration-300 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                Book Title
              </label>
              <input
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-400 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                placeholder="The Great Novel..."
                value={formData.book_title}
                onChange={(e) =>
                  setFormData({ ...formData, book_title: e.target.value })
                }
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                Link to Script / Side
              </label>
              <div className="relative">
                <FileText
                  size={16}
                  className="absolute left-4 top-4 text-slate-400"
                />
                <input
                  className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-400 focus:bg-white outline-none font-medium text-sm text-slate-600 transition-all"
                  placeholder="https://docs.google.com/..."
                  value={formData.material_url}
                  onChange={(e) =>
                    setFormData({ ...formData, material_url: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                Author / Client
              </label>
              <input
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-400 focus:bg-white outline-none font-bold text-sm text-slate-600 transition-all"
                placeholder="Name..."
                value={formData.client_name}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                Platform
              </label>
              <input
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-400 focus:bg-white outline-none font-bold text-sm text-slate-600 transition-all"
                placeholder="ACX, P2P..."
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-1 block">
                Due Date
              </label>
              <input
                type="date"
                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-400 focus:bg-white outline-none font-bold text-sm text-slate-600 transition-all"
                value={formData.due_date}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
            <div className="lg:col-span-6 flex justify-end">
              <button
                onClick={addNewAudition}
                className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200 transition-all flex items-center gap-3 transform active:scale-95"
              >
                <Save size={18} /> Save to Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY STATE - COMFORTING */}
      {!loading && items.length === 0 && !showAddForm && (
        <div className="text-center py-24 px-6 rounded-[3rem] bg-slate-50 border-4 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Mic2 className="text-slate-300" size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight mb-2">
            The Deck is Clear
          </h3>
          <p className="text-slate-400 font-medium max-w-md mx-auto">
            No active auditions right now. That's okay! Take a breath, hydrate,
            and when you're ready, hunt for the next big one.
          </p>
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item) => {
          const deadline = getDeadlineStatus(item.end_date);
          const isCallback = item.production_status === "callback";
          const isShortlist = item.production_status === "shortlist";

          return (
            <div
              key={item.id}
              className={`group relative bg-white p-7 rounded-[2.5rem] border transition-all duration-300 flex flex-col justify-between h-auto
                  ${
                    isCallback
                      ? "border-purple-200 shadow-xl shadow-purple-100/50 ring-4 ring-purple-50"
                      : isShortlist
                      ? "border-amber-200 shadow-xl shadow-amber-100/50 ring-4 ring-amber-50"
                      : "border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-slate-300/40 hover:-translate-y-1"
                  }
                `}
            >
              {/* TOP ROW: PLATFORM & DEADLINE */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col items-start gap-2">
                  {item.roster_producer && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin size={10} /> {item.roster_producer}
                    </span>
                  )}
                  {/* SIDE LINK */}
                  {item.material_url ? (
                    <a
                      href={item.material_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                    >
                      <FileText size={10} /> View Script
                      <ExternalLink size={8} />
                    </a>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={10} /> No Script
                    </span>
                  )}
                </div>

                {/* DEADLINE BADGE */}
                <div
                  className={`flex flex-col items-end px-4 py-2 rounded-2xl border ${deadline.bg} ${deadline.border}`}
                >
                  <div
                    className={`flex items-center gap-1.5 ${deadline.color}`}
                  >
                    <deadline.icon size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {deadline.label}
                    </span>
                  </div>
                  {deadline.subLabel && (
                    <span className={`text-xs font-bold ${deadline.color}`}>
                      {deadline.subLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* MAIN CONTENT */}
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {item.book_title}
                </h3>
                <div className="flex items-center gap-2 text-slate-400">
                  <User size={14} />
                  <p className="text-xs font-bold uppercase tracking-widest line-clamp-1">
                    {item.client_name || "Unknown Author"}
                  </p>
                </div>
              </div>

              {/* STATUS TOGGLES */}
              <div className="flex gap-3 mb-6 bg-slate-50 p-1.5 rounded-2xl">
                <button
                  onClick={() =>
                    toggleStatus(item.id, item.production_status, "callback")
                  }
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                        ${
                          isCallback
                            ? "bg-purple-500 text-white shadow-md shadow-purple-200"
                            : "text-slate-400 hover:text-purple-500 hover:bg-white"
                        }`}
                >
                  <PhoneIncoming size={12} /> Callback
                </button>
                <button
                  onClick={() =>
                    toggleStatus(item.id, item.production_status, "shortlist")
                  }
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                        ${
                          isShortlist
                            ? "bg-amber-400 text-white shadow-md shadow-amber-200"
                            : "text-slate-400 hover:text-amber-500 hover:bg-white"
                        }`}
                >
                  <Star size={12} /> Shortlist
                </button>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-5 border-t border-slate-50 grid grid-cols-5 gap-3">
                <button
                  onClick={() => archiveAudition(item.id)}
                  className="col-span-1 flex items-center justify-center bg-slate-50 text-slate-300 rounded-2xl hover:bg-red-50 hover:text-red-400 transition-colors group/archive"
                  title="Archive (Hidden)"
                >
                  <X
                    size={18}
                    className="group-hover/archive:scale-110 transition-transform"
                  />
                </button>

                <button
                  onClick={() => bookAudition(item, "Direct")}
                  className="col-span-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                >
                  Book Direct
                </button>

                <button
                  onClick={() => bookAudition(item, "Roster")}
                  className="col-span-2 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                >
                  Book Roster
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
