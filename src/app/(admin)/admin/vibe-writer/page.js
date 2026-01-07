"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/src/utils/supabase/client";
import {
  Copy,
  Check,
  Sun,
  Save,
  Ban,
  FilePlus,
  Archive,
  Loader2,
  Cpu,
  Zap,
  Flame,
  Database,
  Terminal,
  X,
  Eye,
  EyeOff,
  CloudDownload,
  AlertTriangle,
  Rocket,
  LogOut,
} from "lucide-react";
import { FaHotdog } from "react-icons/fa6";
import { Canvas } from "@react-three/fiber";

// --- IMPORTS ---
import VibeEditor from "@/src/components/vibe-writer/VibeEditor";
import VibeImageStudio from "@/src/components/vibe-writer/VibeImageStudio";
import AssetSidebar from "@/src/components/vibe-writer/AssetSidebar";
import PopulateMeta from "@/src/components/vibe-writer/PopulateMeta";

const DystopianSnow = dynamic(
  () => import("@/src/components/vibe-writer/DystopianSnow"),
  {
    ssr: false,
    loading: () => null, // This prevents it from blocking the main thread
  }
);

const supabase = createClient();
const sanitize = (name) => name.replace(/[^a-z0-9.]/gi, "-").toLowerCase();

// --- TOAST NOTIFICATION ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-8 right-8 z-[300] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-bottom-5 fade-in duration-300 backdrop-blur-md ${
        type === "error"
          ? "bg-red-950/80 border-red-500 text-red-200"
          : "bg-black/80 border-white/10 text-white"
      }`}
    >
      {type === "error" ? (
        <AlertTriangle size={18} className="text-red-500" />
      ) : (
        <Check size={18} className="text-emerald-400" />
      )}
      <span className="text-xs font-bold uppercase tracking-widest">
        {message}
      </span>
    </div>
  );
};

// --- CONFIRM MODAL ---
const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDark,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl text-center ${isDark ? "bg-[#0f172a] border-white/10" : "bg-white border-slate-200"}`}
      >
        <AlertTriangle size={32} className="mx-auto mb-4 text-amber-500" />
        <h3
          className={`text-lg font-black uppercase mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {title}
        </h3>
        <p
          className={`text-xs mb-6 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-xs uppercase border border-transparent hover:bg-white/5 transition-all text-slate-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold text-xs uppercase bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MasterEditorPage() {
  const [postId, setPostId] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(null);
  const [urlPath, setUrlPath] = useState("");
  const [tag, setTag] = useState("Life");
  const [date, setDate] = useState("");
  const [author, setAuthor] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [images, setImages] = useState({
    main: "",
    img2: "",
    img3: "",
    img4: "",
    img5: "",
    img6: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [generatedSql, setGeneratedSql] = useState("");
  const [showStudio, setShowStudio] = useState(false);
  const [studioImage, setStudioImage] = useState("");
  const [studioInitialTab, setStudioInitialTab] = useState("layout");

  const [toast, setToast] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [availableDrafts, setAvailableDrafts] = useState([]);
  const [recentAssets, setRecentAssets] = useState([]);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const [theme, setTheme] = useState("teal");
  const isDark = theme !== "light";
  const [vibeMode, setVibeMode] = useState("glitch");

  // --- PERFORMANCE OPTIMIZATION STATE ---
  const [mountCanvas, setMountCanvas] = useState(false);

  // --- PERFORMANCE OPTIMIZATION EFFECT ---
  // Delays the 3D Canvas loading by 1.5s to prevent main thread blocking on mobile
  useEffect(() => {
    const timer = setTimeout(() => setMountCanvas(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const getThemeStyles = () => {
    const commonBtn =
      "px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all duration-300 transform active:scale-95";

    switch (theme) {
      case "yellow":
        return {
          bg: "#1a0500",
          text: "text-yellow-500",
          border: "border-yellow-500/30",
          hex: "#facc15",
          title:
            "text-yellow-400 placeholder-yellow-800/50 border-yellow-600/50",
          btnPrimary: `${commonBtn} bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]`,
          btnSecondary: `${commonBtn} bg-yellow-900/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:border-yellow-400`,
          btnGhost: `${commonBtn} bg-transparent border border-transparent text-yellow-700 hover:text-yellow-400 hover:bg-yellow-500/5`,
          btnDanger: `${commonBtn} bg-red-900/20 border border-red-500 text-red-400 hover:bg-red-50 hover:text-white`,
          backBtn:
            "fixed top-6 left-6 px-4 py-2 rounded-full border border-yellow-500/30 bg-black/50 backdrop-blur-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all z-50",
          logo: "text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]",
        };

      case "light":
        return {
          bg: "#f8fafc",
          text: "text-slate-800",
          border: "border-slate-200",
          hex: "#2563eb",
          title: "text-slate-900 placeholder-slate-300 border-slate-200",
          btnPrimary: `${commonBtn} bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5`,
          btnSecondary: `${commonBtn} bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 shadow-sm`,
          btnGhost: `${commonBtn} text-slate-400 hover:text-slate-600 hover:bg-slate-100`,
          btnDanger: `${commonBtn} bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-500`,
          backBtn:
            "fixed top-6 left-6 px-4 py-2 rounded-full border border-slate-200 bg-white/80 backdrop-blur-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all z-50 shadow-sm",
          logo: "text-slate-900",
        };

      default:
        return {
          bg: "#02020a",
          text: "text-teal-400",
          border: "border-teal-500/30",
          hex: "#2dd4bf",
          title: "text-teal-400 placeholder-teal-900/50 border-teal-800/50",
          btnPrimary: `${commonBtn} bg-teal-500 text-black hover:bg-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.4)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)]`,
          btnSecondary: `${commonBtn} bg-teal-900/20 border border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:border-teal-400`,
          btnGhost: `${commonBtn} bg-transparent border border-transparent text-slate-500 hover:text-teal-400 hover:bg-teal-500/5`,
          btnDanger: `${commonBtn} bg-red-900/20 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white`,
          backBtn:
            "fixed top-6 left-6 px-4 py-2 rounded-full border border-teal-500/30 bg-black/50 backdrop-blur-md flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-teal-400 hover:bg-teal-500 hover:text-black transition-all z-50",
          logo: "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]",
        };
    }
  };

  const themeStyle = getThemeStyles();
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchRecentAssets = async () => {
    const { data } = await supabase.storage.from("blog-images").list("", {
      limit: 12,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (data) setRecentAssets(data);
  };

  useEffect(() => {
    if (!date) setDate(new Date().toISOString().split("T")[0]);
    fetchRecentAssets();
  }, []);

  useEffect(() => {
    if (!postId && title) {
      setUrlPath(
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      );
    }
  }, [title, postId]);

  const isReady = title.length > 2;

  const handleClear = () => {
    setPostId(null);
    setTitle("");
    setContent(null);
    setUrlPath("");
    setTag("Life");
    setAuthor("");
    setImageCaption("");
    setImages({ main: "", img2: "", img3: "", img4: "", img5: "", img6: "" });
    setIsPublished(false);
    setDate(new Date().toISOString().split("T")[0]);
    setShowClearConfirm(false);
    showToast("Editor Cleared");
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const openStudio = (url, initialMode = "layout") => {
    if (!url && (initialMode === "layout" || initialMode === "gallery")) {
      return showToast("Upload an image first!", "error");
    }
    setStudioImage(url || "");
    setStudioInitialTab(initialMode);
    setShowStudio(true);
  };

  const handleStudioGenerate = (code) => {
    navigator.clipboard.writeText(code);
    setShowStudio(false);
    showToast("Shortcode copied! Paste into editor.");
  };

  const handleManualAsset = (url, slotKey) => {
    if (!slotKey) return showToast("No slots available!", "error");
    setImages((prev) => ({ ...prev, [slotKey]: url }));
    showToast("Media Link Added");
  };

  const handleAssetReorder = (dragIndex, dropIndex) => {
    const slots = ["img2", "img3", "img4", "img5", "img6"];
    if (
      dragIndex < 0 ||
      dropIndex < 0 ||
      dragIndex >= slots.length ||
      dropIndex >= slots.length
    )
      return;

    const dragKey = slots[dragIndex];
    const dropKey = slots[dropIndex];

    setImages((prev) => {
      const newImages = { ...prev };
      const temp = newImages[dragKey];
      newImages[dragKey] = newImages[dropKey];
      newImages[dropKey] = temp;
      return newImages;
    });
  };

  const generateAndShowSql = () => {
    const escape = (str) => (str ? str.replace(/'/g, "''") : "");
    const sql = `
INSERT INTO posts (title, slug, date, author, tag, image, image_2, image_3, image_4, image_5, image_6, image_caption, content, published) 
VALUES ('${escape(title)}', '${escape(urlPath)}', '${date}', '${escape(author)}', '${escape(tag)}', '${images.main}', '${images.img2}', '${images.img3}', '${images.img4}', '${images.img5}', '${images.img6}', '${escape(imageCaption)}', '${escape(content)}', ${isPublished})
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, image = EXCLUDED.image, image_2 = EXCLUDED.image_2, image_3 = EXCLUDED.image_3, image_4 = EXCLUDED.image_4, image_5 = EXCLUDED.image_5, image_6 = EXCLUDED.image_6, image_caption = EXCLUDED.image_caption, author = EXCLUDED.author, tag = EXCLUDED.tag, published = EXCLUDED.published;`.trim();
    setGeneratedSql(sql);
    setShowSqlModal(true);
  };

  const handleDatabaseAction = async (actionType) => {
    if (!isReady) return showToast("Title is required", "error");
    setIsSaving(true);
    let finalPublishedStatus = isPublished;
    if (actionType === "PUBLISH") finalPublishedStatus = true;
    if (actionType === "UNPUBLISH") finalPublishedStatus = false;

    const payload = {
      title,
      slug: urlPath,
      date,
      author,
      tag,
      content,
      image: images.main,
      image_2: images.img2,
      image_3: images.img3,
      image_4: images.img4,
      image_5: images.img5,
      image_6: images.img6,
      image_caption: imageCaption,
      published: finalPublishedStatus,
    };

    try {
      let query = supabase.from("posts");
      if (postId) {
        const { error } = await query.update(payload).eq("id", postId);
        if (error) throw error;
      } else {
        const { data, error } = await query.insert([payload]).select();
        if (error) throw error;
        if (data && data[0]) setPostId(data[0].id);
      }
      setIsPublished(finalPublishedStatus);
      showToast(finalPublishedStatus ? "Transmission LIVE!" : "Draft Saved");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
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
      setDate(data.date);
      setAuthor(data.author || "");
      setIsPublished(data.published || false);
      setImageCaption(data.image_caption || "");
      setImages({
        main: data.image || "",
        img2: data.image_2 || "",
        img3: data.image_3 || "",
        img4: data.image_4 || "",
        img5: data.image_5 || "",
        img6: data.image_6 || "",
      });
      if (data.content) setContent(data.content);
      setShowLoadModal(false);
      showToast("Transmission Loaded");
    }
  };

  const toggleVisibility = async (e, draftId, currentStatus) => {
    e.stopPropagation();
    const newStatus = !currentStatus;
    setAvailableDrafts((prev) =>
      prev.map((p) => (p.id === draftId ? { ...p, published: newStatus } : p))
    );
    const { error } = await supabase
      .from("posts")
      .update({ published: newStatus })
      .eq("id", draftId);
    if (error) {
      showToast("Error updating status", "error");
      setAvailableDrafts((prev) =>
        prev.map((p) =>
          p.id === draftId ? { ...p, published: currentStatus } : p
        )
      );
    }
  };

  const handleFileUpload = async (e, slotKey) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!urlPath)
      return showToast("Enter a Title first to generate URL slug", "error");
    setUploadingSlot(slotKey);
    try {
      const cleanName = sanitize(file.name);
      let filePath =
        slotKey === "main"
          ? `${urlPath}/hero/${cleanName}`
          : `${urlPath}/content-images/${cleanName}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file, { upsert: true });
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);
      setImages((prev) => ({ ...prev, [slotKey]: publicUrl }));
      fetchRecentAssets();
      showToast("Asset Uploaded");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setUploadingSlot(null);
    }
  };

  const toggleTheme = () =>
    setTheme((prev) =>
      prev === "light" ? "teal" : prev === "teal" ? "yellow" : "light"
    );
  const toggleVibeMode = () =>
    setVibeMode((prev) => (prev === "glitch" ? "sexy" : "glitch"));
  const handleLexicalChange = (htmlString) => setContent(htmlString);

  return (
    <div
      className={`font-sans transition-all duration-1000
        fixed inset-0 overflow-hidden 
        md:relative md:inset-auto md:overflow-visible md:min-h-screen
      `}
      style={{
        backgroundColor: themeStyle.bg,
        color: isDark ? "white" : "#0f172a",
        "--theme-color": themeStyle.hex,
      }}
    >
      {/* GLOBAL ALERTS */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Reset Editor?"
        message="This will clear all unsaved content. Are you sure?"
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
        isDark={isDark}
      />

      {/* --- BACKGROUND CANVAS (DELAYED) --- */}
      {isDark && mountCanvas && (
        <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
              <color attach="background" args={[themeStyle.bg]} />
              <fog attach="fog" args={[themeStyle.bg, 10, 80]} />
              <DystopianSnow theme={theme} />
            </Canvas>
          </Suspense>
        </div>
      )}

      {/* --- BACK BUTTON (Fixed Position) --- */}
      <Link href="/" className={themeStyle.backBtn}>
        <LogOut size={14} /> Exit Studio
      </Link>

      {/* --- SCROLLABLE INNER CONTAINER --- */}
      <div className="h-full w-full overflow-y-auto overscroll-none md:h-auto md:overflow-visible md:overscroll-auto pb-24 md:pb-0">
        {/* --- HEADER TOOLBAR --- */}
        <div className="relative z-10 pt-16 pb-10 px-4 md:px-16 max-w-[1600px] mx-auto">
          <header className="flex flex-col xl:flex-row items-center justify-between mb-12 gap-6">
            <h1
              className={`text-3xl font-black uppercase tracking-[0.4em] cursor-default transition-all duration-300 ${themeStyle.logo} ${
                isDark && vibeMode === "sexy"
                  ? "sexy-text"
                  : isDark
                    ? "glitch-text"
                    : ""
              }`}
            >
              VibeWriter™
            </h1>

            <div className="flex flex-wrap justify-center items-center gap-3 mt-4 xl:mt-0">
              <div className="flex gap-2 mr-2">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className={themeStyle.btnGhost}
                >
                  <FilePlus size={14} /> Reset
                </button>
                <button
                  onClick={generateAndShowSql}
                  className={themeStyle.btnGhost}
                >
                  <Database size={14} /> SQL
                </button>
              </div>

              <div
                className={`w-px h-8 mx-2 hidden md:block ${isDark ? "bg-white/10" : "bg-slate-300"}`}
              ></div>

              <button onClick={fetchDrafts} className={themeStyle.btnSecondary}>
                <Archive size={16} /> Archive
              </button>

              <button
                onClick={() => handleDatabaseAction("DRAFT")}
                className={themeStyle.btnSecondary}
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Save size={16} />
                )}
                Save Draft
              </button>

              {isPublished ? (
                <button
                  onClick={() => handleDatabaseAction("UNPUBLISH")}
                  className={themeStyle.btnDanger}
                >
                  <Ban size={16} /> Unpublish
                </button>
              ) : (
                <button
                  onClick={() => handleDatabaseAction("PUBLISH")}
                  className={themeStyle.btnPrimary}
                >
                  <Rocket size={16} /> Go Live
                </button>
              )}

              {/* 🚨 FIX: Removed divider on mobile (hidden md:flex) */}
              <div
                className={`flex gap-2 ml-4 pl-4 border-l ${
                  isDark ? "border-white/10" : "border-slate-300"
                } hidden md:flex`}
              >
                {isDark && (
                  <button
                    onClick={toggleVibeMode}
                    className={`p-3 rounded-xl border transition-all ${vibeMode === "sexy" ? "bg-pink-500/20 border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                    title="Vibe Mode"
                  >
                    {vibeMode === "sexy" ? (
                      <Flame size={16} className="animate-pulse" />
                    ) : (
                      <Zap size={16} />
                    )}
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-xl border transition-all ${theme === "light" ? "bg-white border-slate-200 text-amber-500 shadow-sm" : "bg-white/5 border-white/10 hover:text-white"}`}
                >
                  {theme === "light" ? (
                    <Sun size={16} />
                  ) : theme === "teal" ? (
                    <Cpu size={16} className="text-teal-400" />
                  ) : (
                    <FaHotdog size={16} className="text-yellow-400" />
                  )}
                </button>
              </div>

              {/* Mobile-only theme/mode buttons (outside the hidden div) */}
              <div className="flex gap-2 md:hidden">
                {isDark && (
                  <button
                    onClick={toggleVibeMode}
                    className={`p-3 rounded-xl border transition-all ${vibeMode === "sexy" ? "bg-pink-500/20 border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)]" : "bg-white/5 border-white/10 text-slate-400 hover:text-white"}`}
                    title="Vibe Mode"
                  >
                    {vibeMode === "sexy" ? (
                      <Flame size={16} className="animate-pulse" />
                    ) : (
                      <Zap size={16} />
                    )}
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className={`p-3 rounded-xl border transition-all ${theme === "light" ? "bg-white border-slate-200 text-amber-500 shadow-sm" : "bg-white/5 border-white/10 hover:text-white"}`}
                >
                  {theme === "light" ? (
                    <Sun size={16} />
                  ) : theme === "teal" ? (
                    <Cpu size={16} className="text-teal-400" />
                  ) : (
                    <FaHotdog size={16} className="text-yellow-400" />
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* 🚨 2. FIX: REORDERED (Meta First on Mobile) */}
            <div className="lg:col-span-4 space-y-8 order-1 lg:order-1">
              <PopulateMeta
                date={date}
                setDate={setDate}
                author={author}
                setAuthor={setAuthor}
                urlPath={urlPath}
                setUrlPath={setUrlPath}
                tag={tag}
                setTag={setTag}
                imageCaption={imageCaption}
                setImageCaption={setImageCaption}
                heroImage={images.main}
                onUpload={handleFileUpload}
                onOpenStudio={openStudio}
                uploadingSlot={uploadingSlot}
                isDark={isDark}
                themeBorderClass={themeStyle.border}
              />
              <AssetSidebar
                images={images}
                onUpload={handleFileUpload}
                onManualInput={handleManualAsset}
                onOpenStudio={openStudio}
                onReorder={handleAssetReorder}
                uploadingSlot={uploadingSlot}
                isDark={isDark}
              />
            </div>

            <div className="lg:col-span-8 space-y-8 order-2 lg:order-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="TRANSMISSION TITLE"
                className={`w-full p-2 md:p-4 text-2xl md:text-4xl lg:text-5xl font-black outline-none bg-transparent border-b-2 transition-colors duration-300 ${themeStyle.title}`}
              />
              <VibeEditor
                initialContent={content}
                onChange={handleLexicalChange}
                theme={theme}
              />
              <div
                className={`flex justify-between text-[10px] font-mono opacity-50 uppercase tracking-widest ${isDark ? "text-white" : "text-slate-500"}`}
              >
                <span>VibeLexical Engine Active</span>
                <span>ID: {postId || "UNSAVED"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS (Placed outside the scroll container) --- */}
      <VibeImageStudio
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        imageUrl={studioImage}
        availableImages={[
          images.main,
          images.img2,
          images.img3,
          images.img4,
          images.img5,
          images.img6,
        ].filter(Boolean)}
        onGenerateCode={handleStudioGenerate}
        initialTab={studioInitialTab}
      />

      {showSqlModal && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-4xl bg-[#0a0a0a] border-2 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] ${themeStyle.border}`}
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Terminal
                  size={20}
                  className={isDark ? "text-white" : "text-slate-900"}
                />
                <h2
                  className={`text-xl font-black uppercase ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  SQL Generator
                </h2>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="hover:text-red-500 text-slate-500"
              >
                <X />
              </button>
            </div>
            <div className="flex-grow overflow-hidden relative rounded-lg border border-white/10 bg-black/50">
              <textarea
                value={generatedSql}
                readOnly
                className="w-full h-[50vh] p-4 bg-transparent text-xs font-mono text-green-400 outline-none resize-none"
              />
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => copyToClipboard(generatedSql)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded text-xs uppercase font-bold backdrop-blur flex items-center gap-2"
                >
                  <Copy size={14} /> Copy SQL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl bg-[#0a0a0a] border-2 rounded-2xl p-6 shadow-2xl ${themeStyle.border}`}
          >
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <h2
                className={`text-xl font-black uppercase ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Load Transmission
              </h2>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-slate-500 hover:text-red-500"
              >
                <X />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {availableDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="w-full p-3 border border-white/10 rounded-lg flex justify-between items-center hover:bg-white/5 group transition-colors"
                >
                  <button
                    onClick={() => loadDraft(draft.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {draft.published ? (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-emerald-500/30">
                          Live
                        </span>
                      ) : (
                        <span className="bg-slate-700/50 text-slate-400 text-[9px] px-2 py-0.5 rounded uppercase font-bold border border-slate-600">
                          Hidden
                        </span>
                      )}
                      <span className="font-bold text-slate-200 group-hover:text-white transition-colors">
                        {draft.title || "Untitled"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {draft.date} • {draft.slug}
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) =>
                        toggleVisibility(e, draft.id, draft.published)
                      }
                      className={`p-2 rounded border transition-all ${draft.published ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white" : "bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300"}`}
                    >
                      {draft.published ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => loadDraft(draft.id)}
                      className="p-2 text-slate-400 hover:text-white"
                    >
                      <CloudDownload size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .sexy-text {
          background: linear-gradient(
            90deg,
            #ff00ff 0%,
            #00ffff 50%,
            #ff00ff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation:
            liquid-flow 3s linear infinite,
            deep-throb 0.4s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 5px rgba(255, 0, 255, 0.6));
        }
        .glitch-text {
          color: var(--theme-color);
          text-shadow:
            2px 0 rgba(255, 0, 0, 0.5),
            -2px 0 rgba(0, 255, 255, 0.5);
        }
        @keyframes liquid-flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes deep-throb {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(255, 0, 255, 0.6));
          }
          100% {
            transform: scale(1.02);
            filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.8));
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
