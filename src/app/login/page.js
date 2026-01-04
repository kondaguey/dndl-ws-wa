"use client";

import { useState } from "react";
// FIXED: Using relative path to avoid "Module not found" error
import { createClient } from "../../utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/admin/production-manager");
      router.refresh();
    }
  };

  return (
    // FIXED: z-[100] ensures this sits ON TOP of your global footer
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 px-4">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] shadow-2xl animate-scale-in relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-teal-400 shadow-inner border border-white/5">
            <Lock size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-black uppercase text-center text-white mb-2 tracking-tight">
          Mission Control
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8 font-medium">
          Restricted Access. Authorized Personnel Only.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-200 text-xs font-bold text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 p-4 rounded-xl font-bold outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 p-4 rounded-xl font-bold outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 font-black uppercase tracking-widest py-4 rounded-xl hover:bg-teal-400 hover:scale-[1.02] transition-all shadow-lg shadow-teal-500/20 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Authenticate"}
          </button>
        </form>
      </div>
    </div>
  );
}
