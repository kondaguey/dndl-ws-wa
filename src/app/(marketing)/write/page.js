"use client";
import { useState, useEffect } from "react";
import { Copy, Check, Database, Lock, Key } from "lucide-react";

// --- CONFIGURATION ---
const SECRET_CODE = "admin123"; // Change this to your password

export default function WritePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by confirming we are on client
  useEffect(() => {
    setIsClient(true);
    const isLogged = sessionStorage.getItem("admin_logged_in");
    if (isLogged === "true") setIsAuthenticated(true);
  }, []);

  const handleLogin = (password) => {
    if (password === SECRET_CODE) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_logged_in", "true");
    } else {
      alert("Access Denied: Wrong Passcode");
    }
  };

  // Prevent hydration flicker
  if (!isClient) return null;

  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return <LoginGate onLogin={handleLogin} />;
  }

  // 2. STUDIO
  return <StudioContent />;
}

// ==========================================
// SUB-COMPONENT: LOGIN SCREEN
// ==========================================
function LoginGate({ onLogin }) {
  const [input, setInput] = useState("");

  return (
    // We use the default background color to blend with global layout
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-bg)] p-6 pt-32 pb-32">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl text-center space-y-6 border-4 border-slate-800 animate-fade-in-up">
        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Lock size={32} />
        </div>

        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tight">
            Restricted Access
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2">
            Enter the studio passcode to proceed.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(input);
          }}
          className="space-y-4"
        >
          <div className="relative group">
            <Key
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors"
              size={20}
            />
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Passcode..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-teal-500 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:font-medium placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/20"
          >
            Unlock Studio
          </button>
        </form>
      </div>
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
    // Basic formatting: Wrap double newlines in paragraph tags
    const formattedContent = formData.content
      .split("\n\n")
      .map((para) => para.trim())
      .filter((para) => para.length > 0)
      .map((para) => {
        // If it starts with <, assume manual HTML, otherwise wrap in <p>
        return para.startsWith("<") ? para : `<p>${para}</p>`;
      })
      .join("\n      ");

    const finalHTML = `<div class="content-flow">
      ${formattedContent}
    </div>`;

    // SQL Generation
    return `INSERT INTO public.posts (slug, title, date, tag, image, image_caption, content)
VALUES (
  '${formData.slug}',
  '${formData.title.replace(/'/g, "''")}',
  '${formData.date}',
  '${formData.tag}',
  '${formData.image}',
  '${formData.image_caption.replace(/'/g, "''")}', 
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
    <div className="min-h-screen bg-[var(--color-bg)] py-24 px-6 selection:bg-teal-200 selection:text-teal-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT COLUMN: EDITOR */}
        <div className="space-y-8 animate-fade-in">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
              The Studio
            </h1>
            <p className="text-gray-500 font-medium tracking-wide uppercase text-xs mt-2">
              Database Edition
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">
                  Title
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter blog title..."
                  className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-teal-500 outline-none transition-colors font-bold text-gray-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">
                  Slug
                </label>
                <input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-500 outline-none font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">
                  Date
                </label>
                <input
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">
                  Tag
                </label>
                <select
                  name="tag"
                  value={formData.tag}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none bg-white"
                >
                  <option>Life</option>
                  <option>Acting</option>
                  <option>Travel & Language</option>
                  <option>Esotericism</option>
                  <option>Tech</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">
                  Image Path
                </label>
                <input
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">
                Main Image Caption
              </label>
              <input
                name="image_caption"
                value={formData.image_caption}
                onChange={handleChange}
                placeholder="Optional caption..."
                className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 outline-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400 flex justify-between">
                <span>Content</span>
                <span className="text-teal-600">HTML Allowed</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Start writing..."
                className="w-full h-[400px] p-6 rounded-xl border-2 border-gray-200 focus:border-teal-500 outline-none text-lg leading-relaxed resize-none shadow-inner font-serif"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GENERATOR */}
        <div
          className="lg:sticky lg:top-24 h-fit space-y-6 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="bg-white p-6 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
            <h3 className="font-black uppercase flex items-center gap-2 mb-4 text-slate-900">
              <Database size={20} className="text-teal-600" /> New Publishing
              Flow
            </h3>
            <ol className="list-decimal pl-4 space-y-3 text-sm text-slate-600 font-medium">
              <li>Write your post here.</li>
              <li>
                Click{" "}
                <strong className="text-teal-700">Copy SQL Command</strong>.
              </li>
              <li>
                Go to{" "}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  className="underline hover:text-teal-600"
                >
                  Supabase Dashboard
                </a>{" "}
                &rarr; SQL Editor.
              </li>
              <li>
                Paste and click <strong>Run</strong>.
              </li>
            </ol>
          </div>

          <div className="relative group">
            <div className="absolute -top-3 left-4 bg-slate-800 text-teal-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest border border-slate-600">
              Generated SQL
            </div>
            <pre className="bg-[#1e1e1e] text-teal-300 p-6 rounded-xl overflow-x-auto text-xs md:text-sm font-mono leading-relaxed shadow-2xl border-4 border-slate-800 h-[300px]">
              {generateSQL()}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              {copied ? (
                <Check className="text-green-400" size={18} />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
          <button
            onClick={handleCopy}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl ${
              copied
                ? "bg-green-500 text-white shadow-green-500/20 scale-95"
                : "bg-slate-900 text-white shadow-slate-900/20 hover:bg-teal-600 hover:shadow-teal-600/30 hover:-translate-y-1"
            }`}
          >
            {copied ? "Copied SQL!" : "Copy SQL Command"}
          </button>
        </div>
      </div>
    </div>
  );
}
