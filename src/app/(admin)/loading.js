import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-white" size={48} />
        <p className="text-xs font-black uppercase tracking-widest animate-pulse">
          Authenticating Secure Protocol...
        </p>
      </div>
    </div>
  );
}
