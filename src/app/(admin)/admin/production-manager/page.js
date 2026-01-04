"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { useRouter } from "next/navigation";

// --- COMPONENTS ---
import ResponsiveLeads from "@/src/components/production-manager/ResponsiveLeads";
import AuditionManager from "@/src/components/production-manager/AuditionManager";
import PendingProjects from "@/src/components/production-manager/PendingProjects";
import SchedulerDashboard from "@/src/components/production-manager/SchedulerDashboard";
import OnboardingManager from "@/src/components/production-manager/OnboardingManager";
import ProductionBoard from "@/src/components/production-manager/ProductionBoard";
// IMPORT THE NEW COMPONENT
import InvoicesAndPayments from "@/src/components/production-manager/InvoicesAndPayments";
import Archives from "@/src/components/production-manager/Archives";

import {
  Inbox,
  Kanban,
  Mic2,
  Briefcase,
  Archive,
  CalendarRange,
  MessageCircle,
  DollarSign, // Added DollarSign icon
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
  // ADDED FINANCIALS BEFORE ARCHIVE
  { id: "financials", label: "Financials", icon: DollarSign },
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
  // We fetch basic counts here for the notification badges
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

          {/* Audition Tracker */}
          {activeTab === "auditions" && <AuditionManager />}

          {/* New Leads/Inquiries */}
          {activeTab === "requests" && (
            <PendingProjects
              onUpdate={fetchAllData}
              containerRef={allProjectsRef}
            />
          )}

          {activeTab === "calendar" && <SchedulerDashboard />}
          {activeTab === "onboarding" && <OnboardingManager />}

          {/* Production Board (Contains Invoice Modal Logic) */}
          {activeTab === "production" && <ProductionBoard />}

          {activeTab === "financials" && (
            <InvoicesAndPayments
              initialProject={null} // Component will now fetch and allow selection
            />
          )}

          {activeTab === "archive" && <Archives />}
        </div>
      </div>
    </div>
  );
}
