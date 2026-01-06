"use client";

import Link from "next/link";
import { createClient } from "@/src/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  PenTool,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Activity,
  Home, // Import Home Icon
} from "lucide-react";

export default function AdminHubPage() {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* --- BACKGROUND ATMOSPHERE --- */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* --- CONTENT WRAPPER --- */}
      <div className="max-w-4xl w-full relative z-10">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm mb-6 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              System Online
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tight mb-2">
            Command Center
          </h1>
          <p className="text-slate-400 font-medium italic">
            Select your interface protocol.
          </p>
        </div>

        {/* --- CONTROL GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* CARD 1: VIBE WRITER */}
          <Link
            href="/admin/vibe-writer"
            className="group relative p-8 md:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-purple-900/20 hover:border-purple-500/50 transition-all duration-500 overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 w-20 h-20 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-500/30 text-purple-400">
              <PenTool size={40} />
            </div>

            <h2 className="relative z-10 text-2xl font-black uppercase text-white mb-2 tracking-wide group-hover:text-purple-300 transition-colors">
              Vibe Writer
            </h2>
            <p className="relative z-10 text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-purple-400/80 transition-colors">
              Content & SEO Engine
            </p>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
              <Sparkles className="text-purple-500" size={24} />
            </div>
          </Link>

          {/* CARD 2: PRODUCTION MANAGER */}
          <Link
            href="/admin/production-manager"
            className="group relative p-8 md:p-12 rounded-[2.5rem] bg-white/5 border border-white/10 hover:bg-teal-900/20 hover:border-teal-500/50 transition-all duration-500 overflow-hidden flex flex-col items-center text-center"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 w-20 h-20 rounded-2xl bg-teal-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-teal-500/30 text-teal-400">
              <LayoutDashboard size={40} />
            </div>

            <h2 className="relative z-10 text-2xl font-black uppercase text-white mb-2 tracking-wide group-hover:text-teal-300 transition-colors">
              Production Manager
            </h2>
            <p className="relative z-10 text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-teal-400/80 transition-colors">
              Schedule & Logistics
            </p>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
              <Activity className="text-teal-500" size={24} />
            </div>
          </Link>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-12 flex justify-center gap-8">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} /> Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
}
