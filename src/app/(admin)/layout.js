import Link from "next/link";
import { LogOut, LayoutGrid } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/src/utils/supabase/server";

export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* 🚨 MOVED TO TOP LEFT (Safest Spot) */}
      <div className="fixed top-6 left-6 z-[100] flex items-center p-1 bg-slate-900 rounded-full border border-slate-700 shadow-2xl opacity-50 hover:opacity-100 transition-opacity duration-300">
        {/* Admin Home */}
        <Link
          href="/admin"
          className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-teal-600 transition-all"
          title="Mission Control"
        >
          <LayoutGrid size={14} />
        </Link>

        {/* Divider */}
        <div className="w-px h-3 bg-white/20 mx-1"></div>

        {/* Exit to Site */}
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-red-600 transition-all"
          title="Exit to Public Site"
        >
          <LogOut size={14} />
        </Link>
      </div>

      <main className="w-full">{children}</main>
    </div>
  );
}
