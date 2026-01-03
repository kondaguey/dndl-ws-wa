"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client";
import {
  Skull,
  Undo2,
  Trash2,
  ShieldAlert,
  Trophy,
  Loader2,
  CalendarDays,
  User,
  Mail,
  BookOpen,
  FileText,
  Briefcase,
  ImageIcon,
  AlertOctagon,
  Ban,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- HELPERS ---
const parseLocalDate = (dateString) => {
  if (!dateString) return new Date();
  try {
    const str = String(dateString);
    const [year, month, day] = str.split("T")[0].split("-").map(Number);
    if (!year || !month || !day) return new Date(dateString);
    return new Date(year, month - 1, day);
  } catch (e) {
    console.error("Date error:", e);
    return new Date();
  }
};

export default function Archives() {
  const [bootedItems, setBootedItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [deletedItems, setDeletedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("completed"); // completed | booted | deleted

  // --- FETCH ---
  const fetchArchives = async () => {
    setLoading(true);
    try {
      // 1. GET BOOTED (From Table 7)
      const { data: bootedData } = await supabase
        .from("7_archive")
        .select("*")
        .order("archived_at", { ascending: false });

      const mappedBooted = (bootedData || []).map((row) => {
        // The original data is stored in a JSON column, we need to extract it
        // to match the flat structure of the other items
        const details = row.original_data?.request || row.original_data || {};
        return {
          ...details, // Spread original details (book_title, cover_image_url, etc.)
          ...row, // Overlay archive specific fields (id, is_blacklisted)
          archive_id: row.id, // ID in Table 7
          request_id: details.id, // Original ID
          status: "booted",
        };
      });
      setBootedItems(mappedBooted);

      // 2. GET COMPLETED (Table 2: status = archived)
      // Note: 'archived' in table 2 usually means completed/rejected in your flow
      // Adjusting logic based on previous context: typically 'archived' was used for rejection/completion
      // Let's assume status='archived' OR 'completed' if you have that
      const { data: completedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .in("status", ["archived", "completed"])
        .order("end_date", { ascending: false });

      // Filter out duplicates if they exist in boot table
      const bootedIds = mappedBooted.map((b) => b.request_id);
      const cleanCompleted = (completedData || []).filter(
        (c) => !bootedIds.includes(c.id)
      );
      setCompletedItems(cleanCompleted);

      // 3. GET DELETED (Table 2: status = deleted)
      const { data: deletedData } = await supabase
        .from("2_booking_requests")
        .select("*")
        .eq("status", "deleted")
        .order("created_at", { ascending: false });

      setDeletedItems(deletedData || []);
    } catch (error) {
      console.error("Error fetching archives:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // --- ACTIONS ---

  const hardDelete = async (id, table) => {
    if (!confirm("Permanently delete this record? This cannot be undone."))
      return;

    if (table === "2_booking_requests") {
      await supabase.from("3_onboarding").delete().eq("request_id", id);
    }
    await supabase.from(table).delete().eq("id", id);
    fetchArchives();
  };

  const reviveProject = async (item) => {
    if (!confirm(`Restore "${item.book_title}" to active status?`)) return;

    let targetId = item.id;
    if (view === "booted") {
      targetId = item.request_id || item.id;
    }

    // Set back to 'pending'
    const { error } = await supabase
      .from("2_booking_requests")
      .update({ status: "pending" })
      .eq("id", targetId);

    if (!error && view === "booted") {
      // Remove from archive table
      await supabase.from("7_archive").delete().eq("id", item.archive_id);
    }

    fetchArchives();
  };

  const toggleBlacklist = async (item) => {
    const newVal = !item.is_blacklisted;
    // We need to update the JSON column in table 7
    // This assumes specific structure of your table 7 data
    const updatedOriginal = { ...item.original_data, is_blacklisted: newVal };

    await supabase
      .from("7_archive")
      .update({ is_blacklisted: newVal, original_data: updatedOriginal })
      .eq("id", item.archive_id);

    fetchArchives();
  };

  // --- RENDER HELPERS ---
  const getItems = () => {
    if (view === "booted") return bootedItems;
    if (view === "deleted") return deletedItems;
    return completedItems;
  };

  const items = getItems();

  return (
    <div className="space-y-8">
      {/* --- TABS --- */}
      <div className="flex items-center justify-between bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
        <div className="flex gap-1">
          <button
            onClick={() => setView("completed")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              view === "completed"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Trophy
              size={14}
              className={view === "completed" ? "text-yellow-400" : ""}
            />{" "}
            Completed
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${
                view === "completed"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {completedItems.length}
            </span>
          </button>

          <button
            onClick={() => setView("booted")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              view === "booted"
                ? "bg-orange-600 text-white shadow-md shadow-orange-200"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Skull size={14} /> Booted
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${
                view === "booted"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {bootedItems.length}
            </span>
          </button>

          <button
            onClick={() => setView("deleted")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              view === "deleted"
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Trash2 size={14} /> Trash
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${
                view === "deleted"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {deletedItems.length}
            </span>
          </button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      {loading ? (
        <div className="text-center py-24 text-slate-300 animate-pulse font-bold uppercase tracking-widest text-xs flex flex-col items-center gap-4">
          <Loader2 className="animate-spin" /> Syncing Archives...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-32 bg-white/50 rounded-[2rem] border border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
            No {view} projects found
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {items.map((r) => {
            const startDate = parseLocalDate(r.start_date);
            const endDate = parseLocalDate(r.end_date);
            const isBooted = view === "booted";
            const isDeleted = view === "deleted";

            // Style Logic
            let containerClass = "bg-white border-slate-200";
            if (isBooted) containerClass = "bg-orange-50/30 border-orange-100";
            if (isDeleted)
              containerClass =
                "bg-slate-50 border-slate-200 opacity-60 grayscale-[0.8]";
            if (view === "completed")
              containerClass = "bg-emerald-50/20 border-emerald-100";

            return (
              <div
                key={r.id || r.archive_id}
                className={`relative rounded-[2rem] border shadow-sm transition-all duration-300 overflow-hidden ${containerClass}`}
              >
                <div className="flex flex-col lg:flex-row min-h-[160px]">
                  {/* --- LEFT: IMAGE OR DATE --- */}
                  <div className="w-full lg:w-40 relative flex flex-col items-center justify-center bg-slate-100/50 border-b lg:border-b-0 lg:border-r border-slate-200/60 shrink-0 overflow-hidden">
                    {r.cover_image_url ? (
                      <img
                        src={r.cover_image_url}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-90"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-slate-400">
                        {isBooted ? (
                          <Ban size={32} />
                        ) : isDeleted ? (
                          <Trash2 size={32} />
                        ) : (
                          <Trophy size={32} className="text-yellow-400" />
                        )}
                        <span className="mt-2 text-[9px] font-black uppercase tracking-widest">
                          {isBooted ? "Booted" : isDeleted ? "Deleted" : "Done"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* --- MIDDLE: INFO --- */}
                  <div className="flex-grow p-6 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">
                          {r.book_title || "Untitled Project"}
                        </h3>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                            <Briefcase size={10} /> {r.client_type || "Direct"}
                          </span>
                          {isBooted && r.is_blacklisted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black text-white text-[9px] font-bold uppercase tracking-wider">
                              <AlertOctagon size={10} /> Blacklisted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium text-slate-500">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span className="font-bold text-slate-700 uppercase tracking-wide">
                            {r.client_name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          <span>{r.email || "-"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-400" />
                          <span>
                            {r.word_count
                              ? Number(r.word_count).toLocaleString()
                              : 0}{" "}
                            Words
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          <span>{startDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {r.notes && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                        <FileText size={12} className="text-slate-300 mt-0.5" />
                        <p className="text-[10px] text-slate-400 italic line-clamp-1">
                          {r.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* --- RIGHT: ACTIONS --- */}
                  <div className="w-full lg:w-48 p-4 bg-white/50 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col gap-2 justify-center">
                    {/* Restore Button */}
                    <button
                      onClick={() => reviveProject(r)}
                      className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Undo2 size={14} /> Restore
                    </button>

                    {/* Blacklist (Booted Only) */}
                    {isBooted && (
                      <button
                        onClick={() => toggleBlacklist(r)}
                        className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          r.is_blacklisted
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <ShieldAlert size={14} />{" "}
                        {r.is_blacklisted ? "Un-Blacklist" : "Blacklist"}
                      </button>
                    )}

                    {/* Permanent Delete */}
                    <button
                      onClick={() =>
                        hardDelete(
                          r.id || r.archive_id,
                          isBooted ? "7_archive" : "2_booking_requests"
                        )
                      }
                      className="w-full py-3 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Wipe
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
