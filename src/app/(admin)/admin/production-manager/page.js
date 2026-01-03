"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/src/utils/supabase/client"; // Check your relative path
import { useRouter } from "next/navigation";

// --- COMPONENTS ---
import ResponsiveLeads from "@/src/components/production-manager/ResponsiveLeads";
import BookingRequests from "@/src/components/production-manager/BookingRequests";
import SchedulerDashboard from "@/src/components/production-manager/SchedulerDashboard";
import OnboardingManager from "@/src/components/production-manager/OnboardingManager";
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
  { id: "responsive", label: "Responsive Leads", icon: MessageCircle },
  { id: "requests", label: "Booking Requests", icon: Inbox },
  { id: "calendar", label: "Calendar Ops", icon: CalendarRange },
  { id: "onboarding", label: "Onboarding & First 15", icon: Kanban }, // RENAMED
  // F15 TAB DELETED HERE
  { id: "production", label: "Production", icon: Briefcase },
  { id: "auditions", label: "Auditions", icon: Mic2 },
  { id: "archive", label: "Archive", icon: Archive },
];

export default function ProductionManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("responsive");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const routeAudition = async (id, type) => {
    if (!confirm(`Move to Active Production as ${type}?`)) return;
    await moveBooking(id, "production", { client_type: type });
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "production")
      return ["production", "approved", "booked"].includes(b.status);
    if (activeTab === "auditions")
      return (
        b.client_type === "Audition" &&
        !["production", "archive", "booted"].includes(b.status)
      );
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 pb-12 pt-12 md:pt-24">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="pt-10 text-4xl md:text-5xl font-black uppercase text-slate-900 tracking-tighter mb-2">
              Mission Control
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              System Operational
            </p>
          </div>

          {/* TABS */}
          <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm flex gap-1 overflow-x-auto max-w-full scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              // Count Logic
              let count = 0;
              if (tab.id === "requests")
                count = bookings.filter((b) => b.status === "pending").length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
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

        {/* CONTENT */}
        <div className="space-y-4">
          {activeTab === "responsive" && <ResponsiveLeads />}
          {activeTab === "requests" && (
            <BookingRequests onUpdate={fetchAllData} />
          )}
          {activeTab === "calendar" && <SchedulerDashboard />}

          {/* RENAMED TAB RENDERS HERE */}
          {activeTab === "onboarding" && <OnboardingManager />}

          {/* DELETED F15 PLACEHOLDER */}

          {activeTab === "archive" && <Archives />}

          {/* SHARED LISTS */}
          {["production", "auditions"].includes(activeTab) && (
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
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                          activeTab === "production"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-pink-100 text-pink-600"
                        }`}
                      >
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
