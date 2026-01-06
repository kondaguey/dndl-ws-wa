"use client";

import { useState, Suspense } from "react";
import { createClient } from "../../utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // This is the dynamic part: it looks for ?next= in the URL
  const nextPath = searchParams.get("next") || "/admin";

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
      router.push(nextPath);
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 px-4">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-teal-400 shadow-inner border border-white/5">
            <Lock size={40} />
          </div>
        </div>

        <h1 className="text-3xl font-black uppercase text-center text-white mb-2 tracking-tight">
          Mission Control
        </h1>
        <p className="text-slate-400 text-center text-sm mb-8 font-medium italic">
          Authorized Personnel Only
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-red-200 text-xs font-bold text-center mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white p-4 rounded-xl font-bold outline-none focus:border-teal-500 transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white p-4 rounded-xl font-bold outline-none focus:border-teal-500 transition-colors"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 font-black uppercase tracking-widest py-4 rounded-xl hover:bg-teal-400 transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Authenticate"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="bg-slate-900 h-screen w-screen" />}>
      <LoginContent />
    </Suspense>
  );
}
