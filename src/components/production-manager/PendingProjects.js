"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  BookOpen,
  Clock,
  PauseCircle,
  CheckCircle2,
  PlayCircle,
  Ban,
  Undo2,
  Trash2,
  AlertCircle,
  User,
  Mail,
  CalendarDays,
  FileText,
  Loader2,
  ExternalLink,
  UploadCloud,
  Image as ImageIcon,
  Hash,
  Tag,
  Mic2,
  Pencil,
  Save,
  Calculator,
  ArrowRight,
  X as XIcon,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- CONFIG ---
const TRACKER_TABLE = "3_onboarding_first_15";

const TABS = [
  { id: "pending", label: "Pending", icon: BookOpen },
  { id: "postponed", label: "Postponed", icon: Clock },
  { id: "on_hold", label: "On Hold", icon: PauseCircle },
  { id: "greenlit", label: "Greenlit", icon: CheckCircle2 },
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

// *** FIX: Manual Date Parsing to ignore Timezones ***
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  // Split the string "YYYY-MM-DD" directly to avoid UTC conversion issues
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0]);
  const monthIndex = parseInt(parts[1]) - 1; // Month is 0-indexed
  const day = parseInt(parts[2]);

  const date = new Date(year, monthIndex, day);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function PendingProjects({ onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingId, setUploadingId] = useState(null);

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

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
      showToast("Sync failed", "error");
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // --- ACTIONS ---

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
      // Ensure we grab just the YYYY-MM-DD part for the input value
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

  const handleGreenlight = async (item) => {
    const isRoster = item.client_type === "Roster";
    const targetStatus = isRoster ? "f15_production" : "approved";

    try {
      const { data: existing } = await supabase
        .from(TRACKER_TABLE)
        .select("id")
        .eq("request_id", item.id)
        .single();

      if (!existing) {
        await supabase.from(TRACKER_TABLE).insert([{ request_id: item.id }]);
      }

      const { error } = await supabase
        .from("2_booking_requests")
        .update({ status: targetStatus })
        .eq("id", item.id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, status: targetStatus } : r))
      );
      if (onUpdate) onUpdate();
      showToast(
        `Project Greenlit! Moved to ${isRoster ? "First 15" : "Onboarding"}`
      );
    } catch (error) {
      console.error(error);
      showToast("Failed to greenlight", "error");
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
      if (onUpdate) onUpdate();
      showToast(`Project moved to ${newStatus.replace("_", " ")}`);
    } catch (error) {
      console.error(error);
      showToast("Update failed", "error");
    }
  };

  const deleteRequest = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await supabase
        .from("2_booking_requests")
        .update({ status: "deleted" })
        .eq("id", id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showToast("Project deleted");
    } catch (e) {
      showToast("Delete failed", "error");
    }
  };

  const handleImageUpload = async (e, itemId, isEditingMode = false) => {
    try {
      setUploadingId(itemId);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("book-covers")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("book-covers")
        .getPublicUrl(filePath);
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

  // --- FILTER LOGIC ---
  const getTabForStatus = (status) => {
    if (status === "pending") return "pending";
    if (status === "postponed") return "postponed";
    if (status === "on_hold") return "on_hold";
    if (["approved", "f15_production"].includes(status)) return "greenlit";
    return null;
  };

  const visibleItems = requests.filter(
    (r) => getTabForStatus(r.status) === activeTab
  );

  return (
    <div className="space-y-8 pb-24 md:px-12">
      <div
        className={`fixed top-6 right-6 z-50 transition-all duration-300 transform ${
          toast.show
            ? "translate-y-0 opacity-100"
            : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
            toast.type === "error"
              ? "bg-red-50/90 border-red-200 text-red-600"
              : "bg-slate-900/90 border-slate-800 text-white"
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

            return (
              <div
                key={item.id}
                className={`group bg-white p-6 lg:p-8 rounded-[2.5rem] border shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300 ${
                  isEditing
                    ? "border-slate-300 ring-2 ring-slate-100"
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            className="text-xl font-black text-slate-900 bg-slate-50 border-b-2 border-slate-200 focus:border-slate-900 outline-none p-2 rounded-t-lg w-full"
                            value={editForm.book_title}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                book_title: e.target.value,
                              })
                            }
                            placeholder="Book Title"
                          />
                          <select
                            className="bg-slate-50 border-b-2 border-slate-200 focus:border-slate-900 outline-none p-2 rounded-t-lg w-full text-sm font-bold text-slate-700"
                            value={editForm.client_type}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                client_type: e.target.value,
                              })
                            }
                          >
                            <option value="Direct">Direct Client</option>
                            <option value="Roster">Roster Client</option>
                          </select>
                        </div>
                        {/* NEW: REF NUMBER EDIT */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">
                            Project Reference (Invoice #)
                          </label>
                          <input
                            className="w-full bg-slate-50 p-2 rounded text-xs font-mono font-bold text-slate-700 uppercase"
                            value={editForm.ref_number}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                ref_number: e.target.value,
                              })
                            }
                            placeholder="REF-2024-001"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            className="bg-slate-50 border-b border-slate-200 focus:border-slate-400 outline-none p-2 text-sm font-medium"
                            value={editForm.client_name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                client_name: e.target.value,
                              })
                            }
                            placeholder="Client Name"
                          />
                          <input
                            className="bg-slate-50 border-b border-slate-200 focus:border-slate-400 outline-none p-2 text-sm font-medium"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            placeholder="Email Address"
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400">
                              Word Count
                            </label>
                            <input
                              className="w-full bg-slate-50 p-2 rounded text-xs font-bold"
                              value={editForm.word_count_display}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  word_count_display: formatNumberWithCommas(
                                    e.target.value.replace(/[^0-9]/g, "")
                                  ),
                                })
                              }
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400">
                              PFH Est.
                            </label>
                            <div className="w-full bg-slate-100 p-2 rounded text-xs font-bold text-slate-600 flex items-center gap-1">
                              <Calculator size={10} />{" "}
                              {calcPFH(
                                cleanNumber(editForm.word_count_display)
                              )}{" "}
                              hrs
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400">
                              Genre
                            </label>
                            <input
                              className="w-full bg-slate-50 p-2 rounded text-xs font-bold"
                              value={editForm.genre}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  genre: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400">
                              Style
                            </label>
                            <input
                              className="w-full bg-slate-50 p-2 rounded text-xs font-bold"
                              value={editForm.narration_style}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  narration_style: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-bold text-slate-400">
                              Start Date
                            </label>
                            <input
                              type="date"
                              className="w-full bg-slate-50 p-2 rounded text-xs font-bold"
                              value={editForm.start_date || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  start_date: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400">
                              End Date
                            </label>
                            <input
                              type="date"
                              className="w-full bg-slate-50 p-2 rounded text-xs font-bold"
                              value={editForm.end_date || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  end_date: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">
                            Email Thread Link
                          </label>
                          <input
                            className="w-full bg-slate-50 p-2 rounded text-xs font-mono text-blue-600"
                            value={editForm.email_thread_link}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email_thread_link: e.target.value,
                              })
                            }
                            placeholder="https://mail.google.com..."
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">
                            Notes
                          </label>
                          <textarea
                            className="w-full bg-slate-50 p-2 rounded text-xs font-medium h-20 resize-none"
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                notes: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveEdits}
                            className="px-6 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-emerald-600 shadow-md flex items-center gap-2"
                          >
                            <Save size={14} /> Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                  isRoster
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-50 text-blue-600"
                                }`}
                              >
                                {item.client_type}
                              </span>
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
                                <ExternalLink size={14} /> Open Email Thread
                              </a>
                            )}
                            <button
                              onClick={() => startEditing(item)}
                              className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </div>

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

                  {/* --- ACTIONS (Only if not editing) --- */}
                  {!isEditing && (
                    <div className="lg:w-56 shrink-0 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                      {activeTab === "pending" && (
                        <>
                          <button
                            onClick={() => handleGreenlight(item)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2 group/btn"
                          >
                            <PlayCircle
                              size={16}
                              className="group-hover/btn:scale-110 transition-transform"
                            />{" "}
                            Greenlight
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
                            onClick={() => updateStatus(item, "rejected")}
                            className="w-full py-2 text-slate-300 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            <Ban size={12} /> Reject Project
                          </button>
                        </>
                      )}
                      {activeTab === "on_hold" && (
                        <>
                          <button
                            onClick={() => handleGreenlight(item)}
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
                            <Undo2 size={16} /> Revive Project
                          </button>
                          <button
                            onClick={() => deleteRequest(item.id)}
                            className="w-full py-3 bg-white border border-red-100 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} /> Delete Forever
                          </button>
                        </>
                      )}
                      {activeTab === "greenlit" && (
                        <div className="h-full flex flex-col items-center justify-center text-emerald-500 bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                          <CheckCircle2 size={32} className="mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Active
                          </span>
                          <span className="text-[9px] font-medium opacity-70 mt-1">
                            In Pipeline
                          </span>
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
    </div>
  );
}
