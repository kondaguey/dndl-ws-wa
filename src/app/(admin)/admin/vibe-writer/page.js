"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@supabase/supabase-js";
import {
  Image as ImageIcon,
  Globe,
  Cpu,
  Copy,
  Check,
  Sun,
  Save,
  Send,
  Ban,
  RefreshCw,
  CloudDownload,
  X,
  FilePlus,
  Archive,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Layout,
  AlignLeft,
  Maximize,
  ArrowRightCircle,
  Film,
  Trash2,
} from "lucide-react";
import { FaHotdog } from "react-icons/fa6";
import { Canvas } from "@react-three/fiber";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Dynamic import for the snow logic
const DystopianSnow = dynamic(
  () => import("@/src/components/write/DystopianSnow"),
  { ssr: false }
);

const CATEGORIES = [
  "Life",
  "Esotericism",
  "Acting",
  "Audiobook Acting",
  "Entrepreneurship",
  "Production",
];

export default function MasterEditorPage() {
  const ejInstance = useRef(null);
  const [postId, setPostId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urlPath, setUrlPath] = useState("");
  const [tag, setTag] = useState("Life");
  const [date, setDate] = useState("");
  const [imageCaption, setImageCaption] = useState("");

  const [images, setImages] = useState({
    main: "",
    img2: "",
    img3: "",
    img4: "",
    img5: "",
  });
  const [imgSettings, setImgSettings] = useState({
    img2: { size: "lg", align: "center", display: "block" },
    img3: { size: "lg", align: "center", display: "block" },
    img4: { size: "lg", align: "center", display: "block" },
    img5: { size: "lg", align: "center", display: "block" },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [theme, setTheme] = useState("teal");

  const isDark = theme !== "light";
  const fileInputRefs = {
    main: useRef(null),
    img2: useRef(null),
    img3: useRef(null),
    img4: useRef(null),
    img5: useRef(null),
  };

  const themeHex = theme === "yellow" ? "#facc15" : "#2dd4bf";
  const themeTextClass =
    theme === "yellow" ? "text-yellow-400" : "text-teal-400";
  const themeBorderClass =
    theme === "yellow" ? "border-yellow-500" : "border-teal-500";
  const sceneBgColor = theme === "yellow" ? "#1a1000" : "#001010";

  // --- EDITOR INITIALIZATION ---
  const initEditor = async () => {
    if (ejInstance.current) return;

    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const List = (await import("@editorjs/list")).default;
    const RawTool = (await import("@editorjs/raw")).default;

    const editor = new EditorJS({
      holder: "editorjs-vibe",
      placeholder: "Start your transmission...",
      tools: {
        header: {
          class: Header,
          inlineToolbar: true,
          config: {
            placeholder: "Header",
            // Important: Explicitly enable levels 1-4 for your H1/H2 needs
            levels: [1, 2, 3, 4],
            defaultLevel: 2,
          },
        },
        list: { class: List, inlineToolbar: true },
        raw: { class: RawTool },
      },
      data: content ? JSON.parse(content) : { blocks: [] },
      onChange: async () => {
        const savedData = await editor.save();
        setContent(JSON.stringify(savedData));
      },
      onReady: () => {
        ejInstance.current = editor;
      },
    });
  };

  useEffect(() => {
    initEditor();
    return () => {
      if (
        ejInstance.current &&
        typeof ejInstance.current.destroy === "function"
      ) {
        ejInstance.current.destroy();
        ejInstance.current = null;
      }
    };
  }, []);

  // Sync Data on Draft Load
  useEffect(() => {
    if (ejInstance.current && content && postId) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.blocks && ejInstance.current.render)
          ejInstance.current.render(parsed);
      } catch (e) {
        console.error("Sync Error");
      }
    }
  }, [postId]);

  // --- UTILS & ASSETS ---
  const getStoragePathFromUrl = (url) =>
    url?.includes("blog-images/") ? url.split("blog-images/")[1] : null;
  const deleteOldAsset = async (url) => {
    const path = getStoragePathFromUrl(url);
    if (path) await supabase.storage.from("blog-images").remove([path]);
  };
  const fetchRecentAssets = async () => {
    const { data } = await supabase.storage
      .from("blog-images")
      .list("", { limit: 12, sortBy: { column: "created_at", order: "desc" } });
    if (data) setRecentAssets(data);
  };

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    fetchRecentAssets();
    const saved = localStorage.getItem("vibewriter-autosave");
    if (saved && !postId) {
      try {
        const parsed = JSON.parse(saved);
        setTitle(parsed.title || "");
        setTag(parsed.tag || "Life");
        setImages(
          parsed.images || { main: "", img2: "", img3: "", img4: "", img5: "" }
        );
        setUrlPath(parsed.urlPath || "");
        if (parsed.content) setContent(parsed.content);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const payload = { title, content, tag, images, urlPath };
    localStorage.setItem("vibewriter-autosave", JSON.stringify(payload));
  }, [title, content, tag, images, urlPath]);

  useEffect(() => {
    if (!postId)
      setUrlPath(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
  }, [title, postId]);

  const handleFileUpload = async (e, slotKey) => {
    const file = e.target.files[0];
    if (!file || !urlPath) return alert("Title required.");
    setUploadingSlot(slotKey);
    try {
      if (images[slotKey]) await deleteOldAsset(images[slotKey]);
      const fileName = `${slotKey}-${Math.random().toString(36).substring(7)}.${file.name.split(".").pop()}`;
      const filePath = `${urlPath}/assets/${fileName}`;
      await supabase.storage
        .from("blog-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);
      setImages((prev) => ({ ...prev, [slotKey]: publicUrl }));
      fetchRecentAssets();
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploadingSlot(null);
    }
  };

  const updateImgSetting = (key, field, value) => {
    setImgSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const generateImageHtml = (key, url) => {
    const s = imgSettings[key];
    let style =
      "border-radius: 1.5rem; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); transition: all 0.3s ease; ";
    if (s.size === "sm") style += "width: 30%; min-width: 250px; ";
    if (s.size === "md") style += "width: 55%; min-width: 300px; ";
    if (s.size === "lg") style += "width: 100%; ";

    if (s.display === "inline")
      style += "display: inline-block; vertical-align: top; margin: 1%; ";
    else {
      style += "display: block; ";
      if (s.align === "left")
        style += "float: left; margin-right: 2.5rem; margin-bottom: 1.5rem; ";
      if (s.align === "right")
        style += "float: right; margin-left: 2.5rem; margin-bottom: 1.5rem; ";
      if (s.align === "center")
        style +=
          "margin-left: auto; margin-right: auto; float: none; margin-top: 2rem; margin-bottom: 2rem; ";
    }
    return `<img src="${url}" alt="vibe-asset" style="${style}" data-asset-slot="${key}" />`;
  };

  const insertImageToEditor = (key, urlOverride = null) => {
    const url = urlOverride || images[key];
    if (!url || !ejInstance.current) return;
    const html = generateImageHtml(key, url);
    ejInstance.current.blocks.insert("raw", { html: html });
  };

  const toggleTheme = () => {
    if (theme === "light") setTheme("teal");
    else if (theme === "teal") setTheme("yellow");
    else setTheme("light");
  };

  const handleDatabaseAction = async (actionType) => {
    setIsSaving(true);
    const targetStatus = actionType === "PUBLISH";
    const payload = {
      title,
      slug: urlPath,
      date: new Date().toISOString().split("T")[0],
      tag,
      content,
      image: images.main,
      image_2: images.img2,
      image_3: images.img3,
      image_4: images.img4,
      image_5: images.img5,
      published: targetStatus,
    };
    try {
      const query = supabase.from("posts");
      if (postId) await query.update(payload).eq("id", postId);
      else {
        const { data } = await query.insert([payload]).select();
        if (data?.[0]) setPostId(data[0].id);
      }
      setIsPublished(targetStatus);
      alert(targetStatus ? "LIVE!" : "SAVED");
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchDrafts = async () => {
    setShowLoadModal(true);
    const { data } = await supabase
      .from("posts")
      .select("id, title, date, slug, tag, published")
      .order("date", { ascending: false });
    if (data) setAvailableDrafts(data);
  };

  const loadDraft = async (id) => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();
    if (data) {
      setPostId(data.id);
      setTitle(data.title);
      setUrlPath(data.slug);
      setTag(data.tag);
      setContent(data.content);
      setDate(data.date);
      setIsPublished(data.published || false);
      setImages({
        main: data.image || "",
        img2: data.image_2 || "",
        img3: data.image_3 || "",
        img4: data.image_4 || "",
        img5: data.image_5 || "",
      });
      setShowLoadModal(false);
    }
  };

  return (
    <div
      className={`transition-all duration-1000 min-h-screen relative font-sans ${isDark ? "bg-[#02020a] text-slate-100" : "bg-slate-50 text-slate-900"}`}
      style={{ backgroundColor: isDark ? sceneBgColor : "#f8fafc" }}
    >
      {isDark && (
        <div className="fixed inset-0 z-0 opacity-100 pointer-events-none">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
              <color attach="background" args={[sceneBgColor]} />
              <fog attach="fog" args={[sceneBgColor, 10, 200]} />
              <DystopianSnow theme={theme} />
            </Canvas>
          </Suspense>
        </div>
      )}

      {showLoadModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full md:w-[90%] max-w-2xl bg-[#0a0a0a] border-2 ${themeBorderClass} rounded-2xl p-6 shadow-2xl`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-black uppercase ${themeTextClass}`}>
                Load Transmission
              </h2>
              <button onClick={() => setShowLoadModal(false)}>
                <X />
              </button>
            </div>
            {availableDrafts.map((draft) => (
              <div
                key={draft.id}
                onClick={() => loadDraft(draft.id)}
                className="p-4 border border-white/10 rounded-lg mb-2 flex justify-between cursor-pointer hover:bg-white/5"
              >
                <span>{draft.title}</span>
                <CloudDownload size={18} className={themeTextClass} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 pt-24 pb-20 px-4 md:px-16 max-w-[1600px] mx-auto">
        <header className="flex flex-col xl:flex-row items-center justify-between mb-16 gap-6 relative">
          <div
            className="absolute bottom-[-40px] left-0 right-0 h-[2px]"
            style={{
              backgroundColor: isDark ? themeHex : "#e2e8f0",
              boxShadow: isDark ? `0 0 25px ${themeHex}` : "none",
            }}
          />
          <h1
            className={`text-3xl font-black uppercase tracking-[0.4em] ${isDark ? `${themeTextClass} glitch-title` : "text-slate-900"}`}
            data-text="VibeWriter™"
          >
            VibeWriter™
          </h1>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPostId(null)}
              className="p-4 rounded-full bg-white/5 border hover:border-red-500"
            >
              <FilePlus size={18} />
            </button>
            <button
              onClick={fetchDrafts}
              className="px-6 py-4 rounded-full bg-white/5 border border-white/20 uppercase font-bold text-xs tracking-widest"
            >
              <Archive size={14} />
            </button>
            <button
              onClick={() => handleDatabaseAction("DRAFT")}
              className={`p-4 rounded-full bg-white/5 border ${themeBorderClass}`}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            </button>
            <button
              onClick={() => handleDatabaseAction("PUBLISH")}
              className="px-6 py-4 rounded-full bg-emerald-900/50 text-emerald-400 font-bold border border-emerald-500 uppercase text-xs"
            >
              Post
            </button>
            <button
              onClick={toggleTheme}
              className={`p-4 rounded-full bg-white/5 border ${themeBorderClass}`}
            >
              {theme === "light" ? (
                <Sun size={18} />
              ) : theme === "yellow" ? (
                <FaHotdog size={18} />
              ) : (
                <Cpu size={18} />
              )}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <div
              className={`p-8 rounded-[2.5rem] border-2 ${isDark ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-60 shadow-neon-box-ultra` : "bg-white border-slate-200 shadow-sm"}`}
            >
              <div className="space-y-6">
                <input
                  value={urlPath}
                  onChange={(e) => setUrlPath(e.target.value)}
                  placeholder="URL slug"
                  className={`w-full p-4 rounded-xl text-sm font-bold outline-none border-2 bg-transparent ${isDark ? `border-white/10 focus:${themeBorderClass}` : "border-slate-200"}`}
                />
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className={`w-full p-4 rounded-xl text-sm font-black outline-none border-2 bg-transparent ${isDark ? `border-white/10 focus:${themeBorderClass}` : "border-slate-200"}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-black">
                      {c}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={images.main}
                    onChange={(e) =>
                      setImages({ ...images, main: e.target.value })
                    }
                    placeholder="Hero URL"
                    className="flex-grow p-4 bg-transparent border-2 border-white/10 rounded-xl outline-none text-[10px]"
                  />
                  <button
                    onClick={() => fileInputRefs.main.current.click()}
                    className="p-4 rounded-xl border-2 border-white/10"
                  >
                    <Upload size={18} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefs.main}
                    onChange={(e) => handleFileUpload(e, "main")}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div
              className={`p-8 rounded-[2.5rem] border-2 ${isDark ? "bg-black/20 " + themeBorderClass : "bg-white border-slate-200"}`}
            >
              <h3 className="font-black uppercase text-[10px] opacity-40 mb-4">
                Config Assets
              </h3>
              {["img2", "img3", "img4", "img5"].map((key, i) => (
                <div
                  key={key}
                  className="p-3 mb-2 rounded-xl border border-white/5 bg-black/10 flex gap-2 items-center"
                >
                  <input
                    value={images[key]}
                    onChange={(e) =>
                      setImages({ ...images, [key]: e.target.value })
                    }
                    placeholder={`Img ${i + 2}`}
                    className="flex-grow bg-transparent text-[10px] outline-none"
                  />
                  <button onClick={() => fileInputRefs[key].current.click()}>
                    <Upload size={14} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRefs[key]}
                    onChange={(e) => handleFileUpload(e, key)}
                    className="hidden"
                  />
                  {images[key] && (
                    <button onClick={() => insertImageToEditor(key)}>
                      <ArrowRightCircle
                        size={14}
                        className="text-emerald-400"
                      />
                    </button>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button
                  onClick={() => updateImgSetting("img2", "align", "left")}
                  className="text-[10px] p-1 border rounded hover:bg-white/10"
                >
                  Left
                </button>
                <button
                  onClick={() => updateImgSetting("img2", "align", "center")}
                  className="text-[10px] p-1 border rounded hover:bg-white/10"
                >
                  Center
                </button>
                <button
                  onClick={() => updateImgSetting("img2", "align", "right")}
                  className="text-[10px] p-1 border rounded hover:bg-white/10"
                >
                  Right
                </button>
              </div>
            </div>
          </div>

          {/* MAIN EDITOR */}
          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="POST TITLE"
              className={`w-full p-4 text-5xl font-black outline-none bg-transparent border-b-2 placeholder-title ${isDark ? themeBorderClass : "border-slate-200"}`}
            />

            <div
              className={`rounded-[2.5rem] border-2 p-12 min-h-[700px] ${isDark ? `bg-black/60 backdrop-blur-xl shadow-neon-box-ultra ${themeBorderClass}` : "bg-white border-slate-200 shadow-xl"}`}
            >
              <div id="editorjs-vibe" className="editorjs-vibe-container" />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        :root {
          --theme-hex: ${themeHex};
          --theme-rgb: ${theme === "yellow" ? "250, 204, 21" : "45, 212, 191"};
        }

        /* EDITOR.JS UI FIXES (Readable Plus/Dots) */
        /* We remove background color to kill the 'weird dot' and only show it on hover */
        .ce-toolbar__plus,
        .ce-toolbar__settings-btn {
          color: rgba(255, 255, 255, 0.9) !important;
          background-color: transparent !important;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .ce-toolbar__plus:hover,
        .ce-toolbar__settings-btn:hover {
          background-color: var(--theme-hex) !important;
          color: #000 !important;
        }
        .ce-inline-toolbar {
          color: black !important;
          background-color: white !important;
          border: 1px solid var(--theme-hex);
        }

        /* TITLE PLACEHOLDER COLOR */
        .placeholder-title::placeholder {
          color: var(--theme-hex) !important;
          opacity: 0.5;
        }

        .codex-editor__redactor {
          padding-bottom: 150px !important;
        }

        /* EASIER DELETION: Add spacing to blocks so they aren't impossible to select */
        .ce-block__content {
          max-width: 95% !important;
          margin: 0 auto;
          padding: 0.25rem 0;
        }

        /* KILLER SPECIFICITY RESTORED & SEPARATED */
        .editorjs-vibe-container .ce-header {
          all: revert !important;
          display: block !important;
          font-weight: 900 !important;
          color: ${isDark ? "#fff" : "#0f172a"} !important;
          line-height: 1.1 !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
        }
        /* Specific rules for H1 vs H2 vs H3 */
        .editorjs-vibe-container h1.ce-header {
          font-size: 3.5rem !important;
        }
        .editorjs-vibe-container h2.ce-header {
          font-size: 2.25rem !important;
          color: var(--theme-hex) !important;
        }
        .editorjs-vibe-container h3.ce-header {
          font-size: 1.75rem !important;
        }

        .editorjs-vibe-container .ce-paragraph {
          font-size: 1.15rem !important;
          line-height: 1.8 !important;
          color: ${isDark ? "rgba(255,255,255,0.9)" : "#334155"} !important;
          margin-bottom: 1rem !important;
        }
        .editorjs-vibe-container .cdx-list__item {
          font-size: 1.15rem !important;
          line-height: 1.8;
        }
        .ce-rawtool__textarea {
          display: none;
        }

        .shadow-neon-box-ultra {
          box-shadow:
            0 0 130px rgba(var(--theme-rgb), 0.25),
            inset 0 0 40px rgba(var(--theme-rgb), 0.1);
        }
        .glitch-title {
          position: relative;
          animation: glitch 4s infinite;
          text-shadow:
            0.05em 0 0 rgba(255, 0, 81, 0.8),
            -0.025em -0.05em 0 rgba(0, 255, 225, 0.8);
        }
        @keyframes glitch {
          0%,
          100% {
            text-shadow:
              0.05em 0 0 rgba(255, 0, 81, 0.8),
              -0.05em -0.025em 0 rgba(0, 255, 225, 0.8);
          }
          50% {
            text-shadow:
              0.025em 0.05em 0 rgba(255, 0, 81, 0.8),
              0.05em 0 0 rgba(0, 255, 225, 0.8);
          }
        }
      `}</style>
    </div>
  );
}
