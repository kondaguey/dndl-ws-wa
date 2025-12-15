"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Database,
  Lock,
  Key,
  Terminal,
  FileText,
  Image as ImageIcon,
  Tag,
  Calendar,
  ChevronRight,
  Sparkles,
  Unlock,
  AlertCircle,
  ArrowLeft,
  Layout,
  ExternalLink,
} from "lucide-react";

// --- CONFIGURATION ---
const SECRET_CODE = "admin123"; // 🔴 CHANGE THIS TO YOUR PASSWORD

// ==========================================
// MAIN COMPONENT (The Default Export)
// ==========================================
export default function WritePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const isLogged = sessionStorage.getItem("admin_logged_in");
    if (isLogged === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (password) => {
    if (password === SECRET_CODE) {
      sessionStorage.setItem("admin_logged_in", "true");
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-sans text-slate-900 selection:bg-teal-200 selection:text-teal-900">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-teal-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-400/20 rounded-full blur-[120px]" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 pt-24 md:pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        {!isAuthenticated ? (
          <LoginGate onLogin={handleLogin} />
        ) : (
          <StudioContent />
        )}
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: LOGIN GATE
// ==========================================
function LoginGate({ onLogin }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(input);
    if (!success) {
      setError(true);
      setShake(true);
      setInput(""); // Clear input on fail
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] w-full">
      <div
        className={`w-full max-w-sm md:max-w-md bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-transform duration-100 ${
          shake ? "translate-x-[-10px]" : ""
        }`}
        style={{
          animation: shake
            ? "shake 0.4s cubic-bezier(.36,.07,.19,.97) both"
            : "none",
        }}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon Circle */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500 ${
              error ? "bg-red-50 text-red-500" : "bg-teal-50 text-teal-600"
            }`}
          >
            {error ? <AlertCircle size={40} /> : <Lock size={40} />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-800">
              Restricted Area
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              Enter admin passcode to access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
            <div className="relative group">
              <Key
                size={18}
                className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                  error
                    ? "text-red-400"
                    : "text-slate-400 group-focus-within:text-teal-500"
                }`}
              />
              <input
                type="password"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(false);
                }}
                placeholder="Passcode"
                className={`w-full bg-slate-50 border-2 rounded-xl py-4 pl-12 pr-4 outline-none font-bold tracking-widest text-base md:text-lg transition-all
                ${
                  error
                    ? "border-red-200 focus:border-red-500 text-red-900 placeholder:text-red-300"
                    : "border-slate-200 focus:border-teal-500 text-slate-800 placeholder:text-slate-400 focus:bg-white"
                }`}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-sm md:text-base rounded-xl hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              <span>Unlock Studio</span>
              <Unlock
                size={18}
                className="text-slate-400 group-hover:text-white transition-colors"
              />
            </button>
          </form>
        </div>
      </div>

      <Link
        href="/"
        className="mt-8 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-teal-600 transition-colors flex items-center gap-2"
      >
        <ArrowLeft size={14} /> Back to Homepage
      </Link>

      <style jsx>{`
        @keyframes shake {
          10%,
          90% {
            transform: translate3d(-1px, 0, 0);
          }
          20%,
          80% {
            transform: translate3d(2px, 0, 0);
          }
          30%,
          50%,
          70% {
            transform: translate3d(-4px, 0, 0);
          }
          40%,
          60% {
            transform: translate3d(4px, 0, 0);
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// SUB-COMPONENT: STUDIO CONTENT
// ==========================================
function StudioContent() {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tag: "Life",
    image: "/images/blog-placeholder.webp",
    image_caption: "",
    content: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, title: value, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const generateSQL = () => {
    const formattedContent = formData.content
      .split("\n\n")
      .map((para) => para.trim())
      .filter((para) => para.length > 0)
      .map((para) => (para.startsWith("<") ? para : `<p>${para}</p>`))
      .join("\n      ");

    const finalHTML = `<div class="content-flow">
      ${formattedContent}
    </div>`;

    const safeTitle = formData.title.replace(/'/g, "''");
    const safeCaption = formData.image_caption.replace(/'/g, "''");

    return `INSERT INTO public.posts (slug, title, date, tag, image, image_caption, content)
VALUES (
  '${formData.slug}',
  '${safeTitle}',
  '${formData.date}',
  '${formData.tag}',
  '${formData.image}',
  '${safeCaption}', 
  $$
    ${finalHTML}
  $$
);`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSQL());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* HEADER: Stack on mobile, Row on desktop */}
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">
            The Studio
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-bold text-[10px] md:text-xs uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden md:inline">Database Connection Active</span>
            <span className="md:hidden">DB Active</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link
            href="/blog"
            target="_blank"
            className="flex items-center justify-center gap-2 font-bold text-slate-500 hover:text-slate-900 transition-colors text-xs md:text-sm uppercase tracking-wider px-4 py-3 rounded-lg border border-slate-200 hover:bg-white bg-white/50"
          >
            <Layout size={16} /> View Blog
          </Link>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            className="flex items-center justify-center gap-2 font-bold text-teal-700 hover:text-teal-800 transition-colors text-xs md:text-sm uppercase tracking-wider bg-teal-100 hover:bg-teal-200 px-4 py-3 rounded-lg"
          >
            Supabase <ExternalLink size={16} />
          </a>
        </div>
      </header>

      {/* MAIN GRID: Stack on mobile, Side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* --- LEFT: WRITER UI --- */}
        <div className="space-y-8 animate-fade-in-up">
          {/* META DATA CARD */}
          <div className="bg-white p-5 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
            <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2 mb-6 border-b border-slate-50 pb-2">
              <Sparkles size={14} className="text-teal-500" /> Meta Data
            </h3>

            <div className="space-y-4">
              {/* TITLE */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">
                  Blog Title
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="The Great American Novel..."
                  className="w-full text-xl md:text-2xl font-bold text-slate-900 placeholder:text-slate-300 border-b-2 border-slate-100 focus:border-teal-500 bg-transparent py-2 outline-none transition-colors"
                />
              </div>

              {/* SLUG */}
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-mono text-xs md:text-sm">
                  /blog/
                </span>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="bg-transparent w-full font-mono text-xs md:text-sm text-slate-600 outline-none"
                />
              </div>

              {/* TAG & DATE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1">
                    <Tag size={12} /> Tag
                  </label>
                  <div className="relative">
                    <select
                      name="tag"
                      value={formData.tag}
                      onChange={handleChange}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all cursor-pointer"
                    >
                      <option>Life</option>
                      <option>Acting</option>
                      <option>Travel & Language</option>
                      <option>Esotericism</option>
                      <option>Tech</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight
                        size={14}
                        className="rotate-90 text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1">
                    <Calendar size={12} /> Date
                  </label>
                  <input
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                  />
                </div>
              </div>

              {/* IMAGE PATH */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1">
                  <ImageIcon size={12} /> Image Path
                </label>
                <input
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-mono text-xs text-slate-600 outline-none focus:border-teal-500"
                />
              </div>
              {/* CAPTION */}
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-2 block">
                  Image Caption
                </label>
                <input
                  name="image_caption"
                  value={formData.image_caption}
                  onChange={handleChange}
                  placeholder="Optional..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-medium text-sm text-slate-600 outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* CONTENT EDITOR */}
          <div className="bg-white p-5 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
              <h3 className="font-black text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-teal-500" /> Content
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">
                HTML ENABLED
              </span>
            </div>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your masterpiece here..."
              className="w-full min-h-[400px] p-0 border-none outline-none text-base md:text-lg leading-loose font-serif text-slate-800 placeholder:text-slate-300 placeholder:italic resize-y"
            />
          </div>
        </div>

        {/* --- RIGHT: TERMINAL GENERATOR --- */}
        <div
          className="lg:sticky lg:top-32 h-fit space-y-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* TERMINAL BOX */}
          <div className="bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-800">
            {/* Terminal Header */}
            <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-2">
                <Terminal size={12} /> SQL_GENERATOR.exe
              </div>
              <div className="w-10" />
            </div>

            {/* Code Output */}
            <div className="p-6 relative group">
              <div className="absolute top-2 right-2 md:top-4 md:right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={handleCopy}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm transition-all border border-white/10"
                  title="Copy Code"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>

              <pre className="font-mono text-xs md:text-sm leading-relaxed text-teal-300 overflow-x-auto whitespace-pre-wrap max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                <code>{generateSQL()}</code>
              </pre>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-[#252525] border-t border-white/5">
              <button
                onClick={handleCopy}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs md:text-sm transition-all flex items-center justify-center gap-2
                      ${
                        copied
                          ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                          : "bg-white text-black hover:bg-teal-400 hover:scale-[1.01] active:scale-[0.99]"
                      }`}
              >
                {copied ? (
                  <>
                    <Check size={18} /> Copied!
                  </>
                ) : (
                  <>
                    <Database size={18} /> Copy SQL Command
                  </>
                )}
              </button>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/50 text-slate-500 text-xs font-medium leading-relaxed">
            <p>
              <strong className="text-slate-900">Pro Tip:</strong> Paste the
              generated SQL code directly into your Supabase SQL Editor. The
              code handles single-quote escaping and HTML wrapping
              automatically.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
