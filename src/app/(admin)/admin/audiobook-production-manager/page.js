"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { useRouter } from "next/navigation";

// --- COMPONENTS ---
import ResponsiveLeads from "@/src/components/audiobook-production-manager/ResponsiveLeads";
import AuditionManager from "@/src/components/audiobook-production-manager/AuditionManager";
import PendingProjects from "@/src/components/audiobook-production-manager/PendingProjects";
import SchedulerDashboard from "@/src/components/audiobook-production-manager/SchedulerDashboard";
import OnboardingManager from "@/src/components/audiobook-production-manager/OnboardingManager";
import ProductionBoard from "@/src/components/audiobook-production-manager/ProductionBoard";
import InvoicesAndPayments from "@/src/components/audiobook-production-manager/InvoicesAndPayments";
import HoursLog from "@/src/components/audiobook-production-manager/HoursLog";
import Archives from "@/src/components/audiobook-production-manager/Archives";

// IMPORT STICKY NOTES FROM VOICEOVER TRACKER FOLDER
import StickyNotes from "@/src/components/voiceover-tracker/StickyNotes";

import {
  Inbox,
  Kanban,
  Mic2,
  Briefcase,
  Archive,
  CalendarRange,
  MessageCircle,
  DollarSign,
  Clock,
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

  { id: "financials", label: "Payments & Contracts", icon: DollarSign },
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
    <div className="min-h-screen bg-slate-50 px-4 md:px-6 pb-24 pt-24 md:pt-12">
      <div className="max-w-[1600px] mx-auto">
        {/* HEADER AREA */}
        <div className="flex flex-col gap-6 md:gap-8 mb-8">
          <div className="flex flex-col">
            <h1 className="text-center text-2xl md:text-4xl font-black uppercase text-slate-900 tracking-tight mb-2 italic leading-none md:leading-tight">
              Daniel (not Day) Lewis: Audiobook Actor
            </h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              System Operational
            </p>
          </div>

          {/* TABS BAR - FIXED UI */}
          <div className="w-full overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 relative z-20 custom-scrollbar">
            <div
              tabIndex={0}
              onKeyDown={handleTabNavigation}
              // Added 'm-1' here to give the focus ring space so it doesn't clip
              className="inline-flex bg-white p-1.5 md:p-2 m-1 rounded-full border border-slate-200 shadow-sm gap-2 min-w-max focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:border-transparent transition-all cursor-pointer"
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
                    className={`flex items-center gap-2 px-6 py-2.5 md:px-8 md:py-3 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md scale-105"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    }`}
                  >
                    <Icon size={14} className="md:w-4 md:h-4" />
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

          {/* Production Board */}
          {activeTab === "production" && <ProductionBoard />}

          {/* HOURS LOG RENDERED BEFORE FINANCIALS */}
          {activeTab === "hours" && <HoursLog initialProject={null} />}

          {activeTab === "financials" && (
            <InvoicesAndPayments initialProject={null} />
          )}

          {activeTab === "archive" && <Archives />}
        </div>
      </div>

      {/* --- FLOATING STICKY NOTES --- */}
      <StickyNotes />

      <style jsx global>{`
        /* Custom Scrollbar Styling */
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px; /* Horizontal scrollbar height */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1; /* Slate-300 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8; /* Slate-400 */
        }
      `}</style>
    </div>
  );
}
