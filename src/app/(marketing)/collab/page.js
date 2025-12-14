"use client";
import { useState } from "react";
import {
  Copy,
  Check,
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Sparkles,
  ArrowRight,
  Send,
  Facebook, // <--- Imported Facebook Icon
} from "lucide-react";

export default function CollabPage() {
  const [copied, setCopied] = useState(false);
  const email = "dm@danielnotdaylewis.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#E8F3F1] to-[#E0E7FF] px-4 pt-24 pb-24 selection:bg-teal-200 selection:text-teal-900">
      <div className="w-full max-w-2xl relative z-10 animate-fade-in-up">
        {/* --- HEADER --- */}
        <div className="text-center mb-12">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm mb-8">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
              Open for Biz
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500 animate-gradient-x">
              Don't be shy.
            </span>
          </h1>
          <p className="text-slate-500 text-xl font-medium">
            Contact me to collab on audiobooks, acting/voice acting (reluctantly
            including content creation), or other creative business ventures. Or
            we can backpack together.
          </p>
        </div>

        {/* --- MAIN GLASS CARD --- */}
        <div className="bg-white/60 backdrop-blur-2xl border border-white/60 p-2 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden group">
          {/* Inner Content */}
          <div className="bg-white/50 rounded-[2rem] border border-white p-8 md:p-12 text-center relative z-10">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
              Direct Email
            </p>

            {/* Email Display */}
            <div
              onClick={handleCopy}
              className="group/email relative cursor-pointer inline-block w-full"
            >
              <div className="text-2xl md:text-4xl font-black text-slate-800 break-all font-mono tracking-tight hover:text-teal-600 transition-colors duration-300">
                {email}
              </div>

              {/* Copied Tooltip */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 -top-10 transition-all duration-300 ${
                  copied
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
              >
                <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Check size={12} /> Copied
                </span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3 mt-10 justify-center">
              <button
                onClick={handleCopy}
                className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy Address"}
              </button>

              <a
                href={`mailto:${email}`}
                className="flex-[1.5] bg-slate-900 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-teal-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
              >
                <Send size={16} /> Open Mail App
              </a>
            </div>
          </div>

          {/* Subtle Background Blob inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl -z-0 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl -z-0 pointer-events-none" />
        </div>

        {/* --- SOCIALS ROW --- */}
        <div className="flex justify-center gap-4 mt-12">
          {/* FACEBOOK AUDIOBOOKS LINK */}
          <SocialLink
            href="https://www.facebook.com/danlewisaudiobookactor"
            icon={<Facebook size={18} />}
            label="Audiobooks"
          />
        </div>

        <p className="text-center text-slate-400 mt-12 text-xs font-medium tracking-wide">
          Will Work Worldwide.
        </p>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}

// Helper for Social Links
function SocialLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-2"
    >
      <div className="w-12 h-12 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-110 group-hover:bg-white group-hover:text-teal-600 group-hover:shadow-md transition-all duration-300">
        {icon}
      </div>
    </a>
  );
}
