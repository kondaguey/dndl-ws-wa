"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  BookOpen,
  Clock,
  PauseCircle,
  CheckCircle2,
  PlayCircle,
  Undo2,
  AlertCircle,
  User,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  Hash,
  Tag,
  Mic2,
  Pencil,
  Save,
  Calculator,
  CalendarDays,
  FileText,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Skull,
  X,
  Briefcase,
  Mic,
  Clapperboard,
  UserPlus,
  Rocket,
  AtSign,
  Link as LinkIcon,
  Calendar,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const TRACKER_TABLE = "3_onboarding_first_15";

const TABS = [
  { id: "cinesonic", label: "CineSonic", icon: Clapperboard },
  { id: "pending", label: "Pending", icon: BookOpen },
  { id: "postponed", label: "Postponed", icon: Clock },
  { id: "on_hold", label: "On Hold", icon: PauseCircle },
  { id: "greenlit", label: "Greenlit", icon: CheckCircle2 },
  { id: "production", label: "Production", icon: Briefcase },
];

// --- HELPERS ---
const formatNumberWithCommas = (value) => {
  if (!value) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const cleanNumber = (value) => {
  if (!value) return 0;
  return parseInt(String(value).replace(/,/g, ""), 10);
};

const calcPFH = (words) => (words ? (words / 9300).toFixed(1) : "0.0");

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0]);
  const monthIndex = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  const date = new Date(year, monthIndex, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function PendingProjects({ onUpdate, navigateTab }) {
  const [requests, setRequests] = useState([]);
  const [trackedIds, setTrackedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cinesonic");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    item: null,
  });

  // Toast State
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const fetchData = async () => {
    setLoading(true);

    const { data: requestData, error: requestError } = await supabase
      .from("2_booking_requests")
      .select("*")
      .neq("status", "deleted")
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (requestError) {
      console.error("Error fetching requests:", requestError);
      showToast("Sync failed", "error");
      setLoading(false);
      return;
    }

    const { data: trackerData } = await supabase
      .from(TRACKER_TABLE)
      .select("request_id");

    const confirmedIds = new Set(trackerData?.map((t) => t.request_id) || []);

    setRequests(requestData || []);
    setTrackedIds(confirmedIds);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS ---

  const openBootModal = (item) => {
    setModal({ isOpen: true, type: "boot", item });
  };

  const openGreenlightModal = (item) => {
    setModal({ isOpen: true, type: "greenlight", item });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: null, item: null });
  };

  const handleAddToLeads = async (item) => {
    setProcessingId(item.id);
    try {
      const { error } = await supabase.from("1_responsive_leads").insert([
        {
          full_name: item.client_name,
          email: item.email,
          lead_type: item.client_type || "Unknown",
          lead_source: "Booking Request",
          platform: "Website",
          last_reply: "Initial Inquiry",
          vibes: "New",
          next_action: "Email",
          status: "active",
        },
      ]);

      if (error) throw error;
      showToast("Successfully added to Leads");
    } catch (e) {
      console.error("Error adding lead:", e);
      showToast("Failed to add to Leads", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const executeBoot = async () => {
    const item = modal.item;
    if (!item) return;

    setProcessingId(item.id);
    closeModal();

    try {
      const { error: insertError } = await supabase.from("6_archive").insert([
        {
          original_data: item,
          archived_at: new Date(),
          reason: "Booted from Dashboard",
        },
      ]);

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("2_booking_requests")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      setRequests((prev) => prev.filter((r) => r.id !== item.id));
      showToast("Project Booted to Archives");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      showToast("Failed to boot project", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const executeRouting = async (routeType) => {
    const item = modal.item;
    if (!item) return;

    setProcessingId(item.id);
    closeModal();

    const targetStatus = routeType === "Roster" ? "first_15" : "onboarding";

    try {
      if (!trackedIds.has(item.id)) {
        const { error: insertError } = await supabase
          .from(TRACKER_TABLE)
          .insert([{ request_id: item.id }]);

        if (insertError) throw insertError;
      }

      const { error: updateError } = await supabase
        .from("2_booking_requests")
        .update({
          status: targetStatus,
          client_type: routeType,
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === item.id
            ? { ...r, status: targetStatus, client_type: routeType }
            : r
        )
      );
      setTrackedIds((prev) => new Set(prev).add(item.id));

      showToast(`Routed to ${routeType}`);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      showToast("Failed to route project", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({
      book_title: item.book_title || "",
      client_name: item.client_name || "",
      client_type: item.client_type || "Direct",
      email: item.email || "",
      email_thread_link: item.email_thread_link || "",
      word_count: item.word_count || 0,
      word_count_display: formatNumberWithCommas(item.word_count || 0),
      genre: item.genre || "",
      narration_style: item.narration_style || "",
      start_date: item.start_date ? item.start_date.split("T")[0] : "",
      end_date: item.end_date ? item.end_date.split("T")[0] : "",
      notes: item.notes || "",
      ref_number: item.ref_number || item.id.slice(0, 8),
      cover_image_url: item.cover_image_url || "",
    });
  };

  const saveEdits = async () => {
    try {
      const payload = {
        ...editForm,
        word_count: cleanNumber(editForm.word_count_display),
      };
      delete payload.word_count_display;

      const { error } = await supabase
        .from("2_booking_requests")
        .update(payload)
        .eq("id", editingId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
      );
      setEditingId(null);
      showToast("Project details updated");
    } catch (error) {
      console.error(error);
      showToast("Update failed", "error");
    }
  };

  const updateStatus = async (item, newStatus) => {
    try {
      const { error } = await supabase
        .from("2_booking_requests")
        .update({ status: newStatus })
        .eq("id", item.id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, status: newStatus } : r))
      );
      showToast("Status updated");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      showToast("Update failed", "error");
    }
  };

  const toggleClientType = async (item) => {
    const newType = item.client_type === "Roster" ? "Direct" : "Roster";
    try {
      const { error } = await supabase
        .from("2_booking_requests")
        .update({ client_type: newType })
        .eq("id", item.id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, client_type: newType } : r))
      );
      showToast(`Switched to ${newType}`);
    } catch (e) {
      showToast("Failed to switch type", "error");
    }
  };

  const handleImageUpload = async (e, itemId, isEditingMode = false) => {
    try {
      setUploadingId(itemId);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("admin")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("admin").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      if (isEditingMode) {
        setEditForm((prev) => ({ ...prev, cover_image_url: publicUrl }));
      } else {
        await supabase
          .from("2_booking_requests")
          .update({ cover_image_url: publicUrl })
          .eq("id", itemId);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === itemId ? { ...r, cover_image_url: publicUrl } : r
          )
        );
        showToast("Cover updated");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Upload failed", "error");
    } finally {
      setUploadingId(null);
    }
  };

  const getTabForStatus = (status) => {
    if (status === "pending") return "pending";
    if (status === "cinesonic") return "cinesonic";
    if (status === "postponed") return "postponed";
    if (status === "on_hold") return "on_hold";
    if (
      status === "approved" ||
      status === "onboarding" ||
      status === "first_15"
    )
      return "greenlit";
    if (status === "production") return "production";
    return null;
  };

  const visibleItems = requests.filter(
    (r) => getTabForStatus(r.status) === activeTab
  );

  return (
    <div className="space-y-8 pb-24 md:px-12 relative">
      {/* Toast Notification - Centered Bottom */}
      <div
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${
          toast.show
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md ${
            toast.type === "error"
              ? "bg-red-50/95 border-red-200 text-red-600"
              : "bg-slate-900/95 border-slate-800 text-white"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-white p-1.5 rounded-full border border-slate-200 shadow-sm overflow-x-auto max-w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = requests.filter(
              (r) => getTabForStatus(r.status) === tab.id
            ).length;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                <Icon size={14} /> {tab.label}{" "}
                {count > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] ${
                      isActive
                        ? "bg-white text-slate-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-32 text-slate-300 flex flex-col items-center gap-3 animate-pulse">
          <Loader2 className="animate-spin" size={32} />
          <span className="text-xs font-bold uppercase tracking-widest">
            Scanning Intake...
          </span>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 mx-auto max-w-2xl">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {activeTab.replace("_", " ")} Projects Found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {visibleItems.map((item) => {
            const isRoster = item.client_type === "Roster";
            const isUploading = uploadingId === item.id;
            const isEditing = editingId === item.id;

            const isInPipeline = trackedIds.has(item.id);
            const destinationName = isRoster ? "First 15" : "Onboarding";
            const isProduction = activeTab === "production";

            return (
              <div
                key={item.id}
                className={`group bg-white p-6 lg:p-8 rounded-[2.5rem] border shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 ${
                  isEditing
                    ? "border-indigo-200 ring-4 ring-indigo-50 z-20"
                    : isProduction
                      ? "border-emerald-100 ring-1 ring-emerald-50"
                      : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* --- COVER IMAGE --- */}
                  <div className="shrink-0 w-full lg:w-40 mx-auto lg:mx-0">
                    <div className="aspect-[2/3] bg-slate-100 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200 group/image">
                      {isEditing ? (
                        <div className="w-full h-full relative">
                          {editForm.cover_image_url ? (
                            <img
                              src={editForm.cover_image_url}
                              alt="Cover"
                              className="w-full h-full object-cover opacity-50"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                              <ImageIcon size={32} />
                            </div>
                          )}
                          <label className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 cursor-pointer hover:bg-slate-200/50 transition-colors">
                            {uploadingId === "editing" ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <UploadCloud size={32} />
                            )}
                            <span className="text-[10px] font-bold uppercase mt-1">
                              Upload New
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleImageUpload(e, "editing", true)
                              }
                              disabled={uploadingId === "editing"}
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          {item.cover_image_url ? (
                            <img
                              src={item.cover_image_url}
                              alt="Cover"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                              <ImageIcon
                                size={32}
                                className="mb-2 opacity-50"
                              />
                              <span className="text-[9px] font-black uppercase opacity-50">
                                No Cover
                              </span>
                            </div>
                          )}
                          <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                            {isUploading ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <UploadCloud size={24} />
                            )}
                            <span className="text-[9px] font-bold uppercase mt-2 tracking-widest">
                              {isUploading ? "Uploading..." : "Change Cover"}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, item.id)}
                              disabled={isUploading}
                            />
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  {/* --- DETAILS (VIEW VS EDIT) --- */}
                  <div className="flex-grow flex flex-col justify-between">
                    {isEditing ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2">
                        {/* --- ROBUST EDIT FORM --- */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner mb-4">
                          <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                              <Pencil size={14} /> Editing Project Data
                            </h3>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">
                              ID: {editingId.slice(0, 8)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CORE DETAILS */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                  Book Title
                                </label>
                                <div className="relative mt-1">
                                  <BookOpen
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    value={editForm.book_title}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        book_title: e.target.value,
                                      })
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                  Client Name
                                </label>
                                <div className="relative mt-1">
                                  <User
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    value={editForm.client_name}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        client_name: e.target.value,
                                      })
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                  Email
                                </label>
                                <div className="relative mt-1">
                                  <AtSign
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    value={editForm.email}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        email: e.target.value,
                                      })
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                  Ref Number
                                </label>
                                <div className="relative mt-1">
                                  <Hash
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    value={editForm.ref_number}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        ref_number: e.target.value,
                                      })
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* PRODUCTION SPECS */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                  Word Count
                                </label>
                                <div className="relative mt-1">
                                  <Calculator
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    value={editForm.word_count_display}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        word_count_display:
                                          formatNumberWithCommas(
                                            e.target.value.replace(/,/g, "")
                                          ),
                                      })
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                    Genre
                                  </label>
                                  <div className="relative mt-1">
                                    <Tag
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                      size={14}
                                    />
                                    <input
                                      value={editForm.genre}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          genre: e.target.value,
                                        })
                                      }
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                    Style
                                  </label>
                                  <div className="relative mt-1">
                                    <Mic2
                                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                      size={14}
                                    />
                                    <input
                                      value={editForm.narration_style}
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          narration_style: e.target.value,
                                        })
                                      }
                                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={editForm.start_date}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        start_date: e.target.value,
                                      })
                                    }
                                    className="mt-1 w-full p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase text-slate-400 pl-1">
                                    End Date
                                  </label>
                                  <input
                                    type="date"
                                    value={editForm.end_date}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        end_date: e.target.value,
                                      })
                                    }
                                    className="mt-1 w-full p-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* ADMIN & NOTES */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-2 block">
                                  Routing & Status
                                </label>
                                <div className="flex gap-4 mb-4">
                                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <input
                                      type="radio"
                                      name="client_type"
                                      value="Direct"
                                      checked={
                                        editForm.client_type === "Direct"
                                      }
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          client_type: e.target.value,
                                        })
                                      }
                                      className="accent-indigo-600"
                                    />
                                    <span className="text-xs font-bold text-slate-700">
                                      Direct (Onboarding)
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                    <input
                                      type="radio"
                                      name="client_type"
                                      value="Roster"
                                      checked={
                                        editForm.client_type === "Roster"
                                      }
                                      onChange={(e) =>
                                        setEditForm({
                                          ...editForm,
                                          client_type: e.target.value,
                                        })
                                      }
                                      className="accent-indigo-600"
                                    />
                                    <span className="text-xs font-bold text-slate-700">
                                      Roster (First 15)
                                    </span>
                                  </label>
                                </div>
                                <div className="relative">
                                  <LinkIcon
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    placeholder="Email Thread Link"
                                    value={editForm.email_thread_link}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        email_thread_link: e.target.value,
                                      })
                                    }
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-200 outline-none"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 pl-1 mb-1 block">
                                  Notes
                                </label>
                                <textarea
                                  value={editForm.notes}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      notes: e.target.value,
                                    })
                                  }
                                  className="w-full p-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 h-24 resize-none focus:ring-2 focus:ring-indigo-200 outline-none"
                                  placeholder="Internal notes..."
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-6 mt-4 border-t border-slate-200">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-6 py-2.5 text-xs font-bold uppercase text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEdits}
                              className="px-8 py-2.5 text-xs font-bold uppercase text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2"
                            >
                              <Save size={14} /> Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-in fade-in">
                        {/* READ ONLY MODE */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {/* TYPE BADGE */}
                              {isProduction ? (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 animate-pulse">
                                  In Production
                                </span>
                              ) : activeTab === "greenlit" ? (
                                <button
                                  onClick={() => toggleClientType(item)}
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors ${
                                    isRoster
                                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                  }`}
                                >
                                  {item.client_type || "Direct"} (Switch)
                                </button>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                    isRoster
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-blue-50 text-blue-600"
                                  }`}
                                >
                                  {item.client_type || "Direct"}
                                </span>
                              )}

                              <span
                                className="text-[9px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600"
                                title="Reference Number"
                              >
                                Ref: {item.ref_number || item.id.slice(0, 8)}
                              </span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 leading-tight mb-1">
                              {item.book_title || "Untitled Project"}
                            </h3>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                              <User size={14} />{" "}
                              {item.client_name || "Unknown Client"}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {item.email_thread_link && (
                              <a
                                href={item.email_thread_link}
                                target="_blank"
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-blue-100 transition-colors"
                                title="Open Thread"
                              >
                                <ExternalLink size={14} /> Open Thread
                              </a>
                            )}
                            {!activeTab.includes("cinesonic") && (
                              <button
                                onClick={() => startEditing(item)}
                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                              >
                                <Pencil size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* --- STATS GRID --- */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Hash size={10} /> Word Count
                            </div>
                            <div className="text-xs font-black text-slate-700">
                              {formatNumberWithCommas(item.word_count)}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Calculator size={10} /> PFH Est.
                            </div>
                            <div className="text-xs font-black text-slate-700">
                              {calcPFH(item.word_count)} hrs
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Tag size={10} /> Genre
                            </div>
                            <div className="text-xs font-black text-slate-700 truncate">
                              {item.genre || "-"}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Mic2 size={10} /> Style
                            </div>
                            <div className="text-xs font-black text-slate-700 truncate">
                              {item.narration_style || "-"}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <CalendarDays size={10} /> Timeline
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700">
                                {formatDate(item.start_date)}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                to {formatDate(item.end_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="flex gap-3 items-start p-4 bg-amber-50 rounded-xl border border-amber-100/50">
                            <FileText
                              size={14}
                              className="text-amber-400 mt-0.5 shrink-0"
                            />
                            <p className="text-xs font-medium text-amber-900/80 leading-relaxed italic">
                              {item.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* --- ACTIONS --- */}
                  {!isEditing && (
                    <div className="lg:w-56 shrink-0 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                      {activeTab === "production" && (
                        <div className="flex flex-col gap-3">
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                            <Rocket
                              size={24}
                              className="mx-auto text-emerald-500 mb-2"
                            />
                            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                              Project is Active
                            </p>
                          </div>
                          {navigateTab ? (
                            <button
                              onClick={() => navigateTab("production")}
                              className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                              <Briefcase size={16} /> Go To Board
                            </button>
                          ) : (
                            <div className="text-[9px] text-slate-400 text-center">
                              View in Production Tab
                            </div>
                          )}

                          <button
                            onClick={() => updateStatus(item, "first_15")}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Undo2 size={14} /> Revert to First 15
                          </button>
                        </div>
                      )}

                      {/* --- CINESONIC TAB --- */}
                      {activeTab === "cinesonic" && (
                        <div className="flex flex-col gap-2">
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center mb-1">
                            <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                              Manual Setup Req.
                            </p>
                          </div>
                          <button
                            onClick={() => handleAddToLeads(item)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2"
                            disabled={processingId === item.id}
                          >
                            {processingId === item.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <UserPlus size={16} />
                            )}
                            Add to Leads
                          </button>
                        </div>
                      )}

                      {/* --- PENDING TAB --- */}
                      {activeTab === "pending" && (
                        <>
                          <button
                            onClick={() => openGreenlightModal(item)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 group/btn"
                            disabled={processingId === item.id}
                          >
                            {processingId === item.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <PlayCircle size={16} />
                            )}
                            Greenlight
                          </button>
                          <button
                            onClick={() => handleAddToLeads(item)}
                            className="w-full py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                            disabled={processingId === item.id}
                          >
                            <UserPlus size={14} /> Add to Leads
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => updateStatus(item, "on_hold")}
                              className="py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex flex-col items-center gap-1"
                            >
                              <PauseCircle size={14} /> Hold
                            </button>
                            <button
                              onClick={() => updateStatus(item, "postponed")}
                              className="py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all flex flex-col items-center gap-1"
                            >
                              <Clock size={14} /> Later
                            </button>
                          </div>
                          <button
                            onClick={() => openBootModal(item)}
                            className="w-full py-2 text-slate-300 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            <Skull size={12} /> Boot (Archive)
                          </button>
                        </>
                      )}

                      {/* ... Other Tabs ... */}
                      {activeTab === "on_hold" && (
                        <>
                          <button
                            onClick={() => openGreenlightModal(item)}
                            className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <PlayCircle size={16} /> Activate
                          </button>
                          <button
                            onClick={() => updateStatus(item, "pending")}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Undo2 size={14} /> Back to Pending
                          </button>
                        </>
                      )}

                      {activeTab === "postponed" && (
                        <>
                          <button
                            onClick={() => updateStatus(item, "pending")}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <Undo2 size={16} /> Revive
                          </button>
                          <button
                            onClick={() => openBootModal(item)}
                            className="w-full py-3 bg-white border border-red-100 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Skull size={14} /> Boot (Archive)
                          </button>
                        </>
                      )}

                      {activeTab === "greenlit" && (
                        <div className="flex flex-col gap-2">
                          {isInPipeline ? (
                            <div
                              className={`flex flex-col items-center justify-center rounded-xl border p-4 mb-2 ${
                                isRoster
                                  ? "bg-purple-50 border-purple-100 text-purple-600"
                                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
                              }`}
                            >
                              <CheckCircle2 size={32} className="mb-2" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-center">
                                Confirmed In {destinationName}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => openGreenlightModal(item)}
                              disabled={processingId === item.id}
                              className="w-full py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-md transition-all flex flex-col items-center justify-center gap-1 p-2"
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={16} />
                                <span>Not in {destinationName}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-80 text-[9px]">
                                <span>Click to Push</span>{" "}
                                <ArrowRight size={10} />
                              </div>
                              {processingId === item.id && (
                                <Loader2
                                  className="animate-spin mt-1"
                                  size={12}
                                />
                              )}
                            </button>
                          )}

                          <button
                            onClick={() => updateStatus(item, "pending")}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Undo2 size={14} /> Back to Pending
                          </button>
                          <button
                            onClick={() => openBootModal(item)}
                            className="w-full py-3 bg-white border border-red-100 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Skull size={14} /> Boot
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ... (Modals remain unchanged) ... */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-100">
            <div
              className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${modal.type === "boot" ? "bg-red-50" : "bg-slate-50"}`}
            >
              <h3
                className={`font-black uppercase tracking-wider text-sm flex items-center gap-2 ${modal.type === "boot" ? "text-red-700" : "text-slate-800"}`}
              >
                {modal.type === "boot" ? (
                  <>
                    <Skull size={18} /> Boot Project
                  </>
                ) : (
                  <>
                    <PlayCircle size={18} className="text-emerald-500" />{" "}
                    Greenlight Project
                  </>
                )}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {modal.type === "boot" ? (
                <>
                  <p className="text-slate-600 font-medium text-sm mb-2">
                    Are you sure you want to boot{" "}
                    <strong className="text-slate-900">
                      {modal.item?.book_title}
                    </strong>
                    ?
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This will move the project to the Archives. It can be
                    restored later if needed.
                  </p>
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={closeModal}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeBoot}
                      className="px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                    >
                      Boot Project
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-4 text-center">
                    Select Pipeline Destination
                  </p>
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => executeRouting("Direct")}
                      className="group relative flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                          Direct Client
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                          Routes to Onboarding
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="ml-auto text-blue-300 group-hover:text-blue-600 transition-colors"
                      />
                    </button>

                    <button
                      onClick={() => executeRouting("Roster")}
                      className="group relative flex items-center gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Mic size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                          Roster Talent
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                          Routes to First 15
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="ml-auto text-purple-300 group-hover:text-purple-600 transition-colors"
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
