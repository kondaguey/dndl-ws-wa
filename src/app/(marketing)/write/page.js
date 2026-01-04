"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/src/utils/supabase/client";
import {
  Database,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  Bold,
  Italic,
  List,
  Quote,
  Languages,
  Eye,
  Code,
  Upload,
  Trash2,
  Maximize2,
  Minimize2,
  Type,
  X,
} from "lucide-react";

const SECRET_CODE = "1425";

export default function WritePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const supabase = createClient();

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
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 pt-12 pb-20 px-4 md:px-8 max-w-[1400px] mx-auto">
        {!isAuthenticated ? (
          <LoginGate onLogin={handleLogin} />
        ) : (
          <StudioContent supabase={supabase} />
        )}
      </div>
    </div>
  );
}

function LoginGate({ onLogin }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin(input)) return;
    setError(true);
    setShake(true);
    setInput("");
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div
        className={`w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-12 shadow-2xl transition-transform ${
          shake ? "translate-x-2" : ""
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
              error ? "bg-red-50 text-red-500" : "bg-teal-50 text-teal-600"
            }`}
          >
            {error ? <AlertCircle size={40} /> : <Lock size={40} />}
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">
            Studio Lock
          </h1>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(false);
              }}
              placeholder="Passcode"
              className="w-full bg-slate-50 border-2 rounded-xl py-4 px-6 text-center font-bold tracking-widest outline-none focus:border-teal-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white font-black uppercase rounded-xl hover:bg-teal-600 transition-all"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StudioContent({ supabase }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const mainImageRef = useRef(null);

  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mainImageUploading, setMainImageUploading] = useState(false);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [activeStyles, setActiveStyles] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    date: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tag: "Life",
    image: "", // Main Blog Image
    image_caption: "",
    content: "",
  });

  // Handle Image sizing and deletion inside editor
  useEffect(() => {
    const handleEditorClick = (e) => {
      const target = e.target;
      if (target.tagName === "IMG" && editorRef.current.contains(target)) {
        const figure = target.closest("figure");
        if (!figure) return;

        // Basic UI toggle for demo: cycling through sizes
        const sizes = ["size-small", "size-medium", "size-full"];
        let currentSizeIndex = sizes.findIndex((s) =>
          figure.classList.contains(s)
        );

        // If user Alt+Clicks, delete the image
        if (e.altKey) {
          figure.remove();
          setFormData((prev) => ({
            ...prev,
            content: editorRef.current.innerHTML,
          }));
          return;
        }
      }
    };

    const editor = editorRef.current;
    if (editor) editor.addEventListener("click", handleEditorClick);
    return () => editor?.removeEventListener("click", handleEditorClick);
  }, []);

  const updateActiveStyles = () => {
    if (!editorRef.current) return;
    const styles = [];
    if (document.queryCommandState("bold")) styles.push("bold");
    if (document.queryCommandState("italic")) styles.push("italic");
    if (document.queryCommandState("insertUnorderedList")) styles.push("list");
    setActiveStyles(styles);
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    setFormData((prev) => ({ ...prev, content: editorRef.current.innerHTML }));
    updateActiveStyles();
  };

  // Resize function for the toolbar to target the "last" or "selected" image
  const setImgSize = (sizeClass) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const container = selection.anchorNode.parentElement.closest("figure");
      if (container) {
        container.classList.remove("size-small", "size-medium", "size-full");
        container.classList.add(sizeClass);
        setFormData((prev) => ({
          ...prev,
          content: editorRef.current.innerHTML,
        }));
      }
    }
  };

  const deleteSelectedImage = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const container = selection.anchorNode.parentElement.closest("figure");
      if (container) container.remove();
      setFormData((prev) => ({
        ...prev,
        content: editorRef.current.innerHTML,
      }));
    }
  };

  const handleFileUpload = async (e, isMain = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isMain) setMainImageUploading(true);
    else setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      if (isMain) {
        setFormData((prev) => ({ ...prev, image: publicUrl }));
      } else {
        const html = `<figure class="size-medium"><img src="${publicUrl}" alt="Post Image"/><figcaption>Description here...</figcaption></figure><p><br></p>`;
        execCommand("insertHTML", html);
      }
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setMainImageUploading(false);
      setUploading(false);
    }
  };

  const generateSQL = () => {
    const safeTitle = formData.title.replace(/'/g, "''");
    const safeContent = formData.content.replace(/'/g, "''");
    return `INSERT INTO public.posts (slug, title, date, tag, image, content) 
VALUES ('${formData.slug}', '${safeTitle}', '${formData.date}', '${formData.tag}', '${formData.image}', $$<div class="content-flow">${safeContent}</div>$$);`;
  };

  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
            The Studio
          </h2>
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />{" "}
            Engine Online
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/blog"
            target="_blank"
            className="px-6 py-3 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest bg-white hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Eye size={14} /> View Blog
          </Link>
          <a
            href="https://supabase.com"
            target="_blank"
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            <Database size={14} /> Supabase
          </a>
        </div>
      </header>

      <div className="flex flex-col gap-10 max-w-5xl mx-auto">
        {/* TOP META PANEL */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
          {/* Main Image Uploader */}
          <div className="w-full md:w-1/3 group">
            <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">
              Featured Image
            </label>
            <div
              onClick={() => mainImageRef.current.click()}
              className="relative aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden cursor-pointer hover:border-teal-400 transition-all"
            >
              {formData.image ? (
                <>
                  <img
                    src={formData.image}
                    className="w-full h-full object-cover"
                    alt="Featured"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase">
                    Change Image
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                  {mainImageUploading ? (
                    <Upload className="animate-bounce" />
                  ) : (
                    <ImageIcon size={24} />
                  )}
                  <span className="text-[9px] font-bold uppercase">
                    Upload Cover
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={mainImageRef}
              onChange={(e) => handleFileUpload(e, true)}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Form Fields */}
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="md:col-span-2">
              <label className="text-[9px] font-black uppercase text-slate-400">
                Post Title
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    title: val,
                    slug: val
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  }));
                }}
                placeholder="Name your story..."
                className="w-full text-3xl font-black border-b-2 outline-none focus:border-teal-500 py-1 bg-transparent"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400">
                Category
              </label>
              <select
                name="tag"
                value={formData.tag}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tag: e.target.value }))
                }
                className="w-full bg-slate-50 border-2 p-3 rounded-xl font-bold text-xs"
              >
                <option>Life</option>
                <option>Acting</option>
                <option>Travel</option>
                <option>Tech</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400">
                Publication Date
              </label>
              <input
                name="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full bg-slate-50 border-2 p-3 rounded-xl font-bold text-xs"
              />
            </div>
          </div>
        </div>

        {/* COMPACT EDITOR */}
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[700px]">
          {/* Toolbar */}
          <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center gap-3 sticky top-0 z-30">
            <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
              <ToolbarButton
                icon={<Bold size={16} />}
                onClick={() => execCommand("bold")}
                isActive={activeStyles.includes("bold")}
              />
              <ToolbarButton
                icon={<Italic size={16} />}
                onClick={() => execCommand("italic")}
                isActive={activeStyles.includes("italic")}
              />
              <ToolbarButton
                icon={<List size={16} />}
                onClick={() => execCommand("insertUnorderedList")}
                isActive={activeStyles.includes("list")}
              />
            </div>

            <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
              <ToolbarButton
                icon={<Minimize2 size={16} />}
                onClick={() => setImgSize("size-small")}
                title="Small Image"
              />
              <ToolbarButton
                icon={<Type size={16} />}
                onClick={() => setImgSize("size-medium")}
                title="Medium Image"
              />
              <ToolbarButton
                icon={<Maximize2 size={16} />}
                onClick={() => setImgSize("size-full")}
                title="Full Image"
              />
              <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
              <ToolbarButton
                icon={<Trash2 size={16} />}
                onClick={deleteSelectedImage}
                title="Delete Image"
                className="text-red-400 hover:bg-red-500/20"
              />
            </div>

            <button
              onMouseDown={(e) => {
                e.preventDefault();
                fileInputRef.current.click();
              }}
              className={`ml-auto p-3 rounded-xl transition-all border-2 ${
                uploading
                  ? "animate-pulse border-teal-500"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {uploading ? (
                <Upload size={18} className="animate-bounce" />
              ) : (
                <ImageIcon size={18} />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Canvas */}
          <div className="px-12 py-16 md:px-24 md:py-20 flex-grow bg-white">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning={true}
              spellCheck={spellCheckEnabled}
              onInput={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  content: e.currentTarget.innerHTML,
                }))
              }
              className="editor-canvas w-full h-full outline-none text-slate-800 text-xl leading-relaxed font-serif max-w-2xl mx-auto min-h-[400px]"
              data-placeholder="Begin your story..."
            />
          </div>
        </div>

        {/* SQL OUTPUT */}
        <div className="bg-[#111] rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-8 py-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-mono text-teal-500 font-bold uppercase tracking-widest">
              Database Sync Ready
            </span>
          </div>
          <div className="p-8">
            <pre className="font-mono text-[11px] text-teal-300/80 overflow-x-auto whitespace-pre-wrap max-h-[250px] leading-relaxed">
              <code>{generateSQL()}</code>
            </pre>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generateSQL());
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={`w-full py-6 font-black uppercase text-xs tracking-[0.2em] transition-all ${
              copied
                ? "bg-green-500 text-white"
                : "bg-teal-500 text-slate-950 hover:bg-teal-400"
            }`}
          >
            {copied ? "SQL Copied to Clipboard" : "Copy SQL Code"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .editor-canvas:empty:before {
          content: attr(data-placeholder);
          color: #cbd5e1;
          font-style: italic;
          display: block; /* Fixes the first-line jump issue */
        }
        .editor-canvas p {
          margin-bottom: 1.5rem;
          display: block;
          min-height: 1em;
        }
        .editor-canvas figure {
          margin: 2.5rem auto;
          transition: all 0.3s ease;
          position: relative;
        }

        /* Image Sizes */
        .editor-canvas .size-small {
          max-w: 300px;
        }
        .editor-canvas .size-medium {
          max-w: 100%;
        }
        .editor-canvas .size-full {
          max-w: 100vw;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
        }

        .editor-canvas img {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          cursor: pointer;
        }
        .editor-canvas img:hover {
          outline: 3px solid #2dd4bf;
        }
        .editor-canvas figcaption {
          text-align: center;
          font-size: 0.8rem;
          color: #94a3b8;
          margin-top: 0.75rem;
          font-family: sans-serif;
          font-style: italic;
        }

        .editor-canvas ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .editor-canvas h1 {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
        }
      `}</style>
    </>
  );
}

function ToolbarButton({ icon, onClick, isActive, title, className = "" }) {
  return (
    <button
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`p-2.5 rounded-lg transition-all ${
        isActive
          ? "bg-teal-500 text-slate-900 shadow-inner"
          : `text-slate-400 hover:text-white hover:bg-white/10`
      } ${className}`}
    >
      {icon}
    </button>
  );
}
