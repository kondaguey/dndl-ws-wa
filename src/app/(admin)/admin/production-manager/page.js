"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { useRouter } from "next/navigation";

// --- COMPONENTS ---
import ResponsiveLeads from "@/src/components/production-manager/ResponsiveLeads";
import PendingProjects from "@/src/components/production-manager/PendingProjects";
import SchedulerDashboard from "@/src/components/production-manager/SchedulerDashboard";
import OnboardingManager from "@/src/components/production-manager/OnboardingManager";
import ProductionBoard from "@/src/components/production-manager/ProductionBoard"; // Imported
import Archives from "@/src/components/production-manager/Archives";

import {
  Inbox,
  Kanban,
  Mic2,
  Briefcase,
  Archive,
  CheckCircle2,
  CalendarRange,
  MessageCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// --- TABS CONFIG ---
const TABS = [
  { id: "responsive", label: "Leads", icon: MessageCircle },
  { id: "auditions", label: "Auditions", icon: Mic2 },
  { id: "requests", label: "Pending Projects", icon: Inbox },
  { id: "calendar", label: "Calendar Ops", icon: CalendarRange },
  { id: "onboarding", label: "Onboarding & First 15", icon: Kanban },
  { id: "production", label: "Production", icon: Briefcase },
  { id: "archive", label: "Archive", icon: Archive },
];

export default function ProductionManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("responsive");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ref to trigger focus on child component
  const allProjectsRef = useRef(null);

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("2_booking_requests")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) console.error("Error fetching:", error);
    else setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- ACTIONS ---
  const moveBooking = async (id, newStatus, extraUpdates = {}) => {
    const { error } = await supabase
      .from("2_booking_requests")
      .update({ status: newStatus, ...extraUpdates })
      .eq("id", id);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: newStatus, ...extraUpdates } : b
        )
      );
      fetchAllData();
    }
  };

  const filteredBookings = bookings.filter((b) => {
    // Only used for Auditions now
    if (activeTab === "auditions")
      return (
        b.client_type === "Audition" &&
        !["production", "archive", "booted"].includes(b.status)
      );
    return true;
  });

  // --- KEYBOARD NAVIGATION ---
  const handleTabNavigation = (e) => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < TABS.length) {
        setActiveTab(TABS[nextIndex].id);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        setActiveTab(TABS[prevIndex].id);
      }
    } else if (e.key === "ArrowDown") {
      if (activeTab === "requests" && allProjectsRef.current) {
        e.preventDefault();
        allProjectsRef.current.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 pb-12 pt-32 md:pt-40">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER AREA */}
        <div className="flex flex-col gap-8 mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-black uppercase text-slate-900 tracking-tighter mb-2">
              Mission Control
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              System Operational
            </p>
          </div>

          {/* TABS BAR */}
          <div className="w-full overflow-x-auto p-4 -ml-4">
            <div
              tabIndex={0}
              onKeyDown={handleTabNavigation}
              className="inline-flex bg-white p-2 rounded-full border border-slate-200 shadow-sm gap-2 min-w-max focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all cursor-pointer"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                let count = 0;
                if (tab.id === "requests")
                  count = bookings.filter((b) => b.status === "pending").length;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    tabIndex={-1}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span
                        className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
                          tab.id === "requests"
                            ? "bg-orange-500 text-white animate-pulse"
                            : isActive
                            ? "bg-white text-slate-900"
                            : "bg-slate-200 text-slate-500"
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
        </div>

        {/* CONTENT */}
        <div className="space-y-4">
          {activeTab === "responsive" && <ResponsiveLeads />}

          {activeTab === "requests" && (
            <PendingProjects
              onUpdate={fetchAllData}
              containerRef={allProjectsRef}
            />
          )}

          {activeTab === "calendar" && <SchedulerDashboard />}
          {activeTab === "onboarding" && <OnboardingManager />}

          {/* HERE IS THE FIX: Explicitly rendering ProductionBoard */}
          {activeTab === "production" && <ProductionBoard />}

          {activeTab === "archive" && <Archives />}

          {/* SHARED LISTS (Now only for Auditions) */}
          {activeTab === "auditions" && (
            <div className="grid grid-cols-1 gap-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">
                    No projects in {activeTab}
                  </p>
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-pink-100 text-pink-600">
                        {b.book_title?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900">
                          {b.book_title}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                          {b.client_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          Due Date
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {new Date(b.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => moveBooking(b.id, "archive")}
                        className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
