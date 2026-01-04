// src/app/(admin)/layout.js
import Link from "next/link";
import { Home } from "lucide-react";

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* APP HEADER / BACK BUTTON */}
      <div className="fixed top-4 right-6 z-[100]">
        <Link
          href="/"
          className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
        >
          <Home size={12} />
          <span>Exit to Website</span>
        </Link>
      </div>

      <main className="w-full">{children}</main>
    </div>
  );
}
