import Link from "next/link";
import { Home, LayoutGrid } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/utils/supabase/server";

export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  // 1. Check for a session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 2. Redirect if not logged in
  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* 🚨 GLOBAL ADMIN NAVIGATION (Visible on all Admin Pages) */}
      <div className="fixed top-4 right-6 z-[100] flex items-center gap-2">
        {/* Link to Admin Hub */}
        <Link
          href="/admin"
          className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest text-white"
        >
          <LayoutGrid size={12} />
          <span className="hidden md:inline">Mission Control</span>
        </Link>

        {/* Link to Public Website */}
        <Link
          href="/"
          className="flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-500"
        >
          <Home size={12} />
          <span className="hidden md:inline">Exit</span>
        </Link>
      </div>

      <main className="w-full">{children}</main>
    </div>
  );
}
