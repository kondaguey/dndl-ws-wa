"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  Video,
  Music,
  Plus,
  Code,
  X,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Images,
  Play,
  Settings2,
  AlertCircle,
  FileAudio,
  Info, // Added Info Icon
} from "lucide-react";

export default function AssetSidebar({
  images,
  onUpload,
  onManualInput,
  onOpenStudio,
  onReorder,
  onPlayAudio,
  isDark,
  bgOpacity = 20,
}) {
  const fileInputRefs = useRef({});

  // UI States
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState(null);
  const [manualUrl, setManualUrl] = useState("");

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null);

  const contentSlots = ["img2", "img3", "img4", "img5", "img6"];
  const nextEmptySlot = contentSlots.find((key) => !images[key]);
  const isFull = !nextEmptySlot;

  // Reset delete confirmation if user clicks away
  useEffect(() => {
    const handleClickOutside = () => setDeletingId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleCloseMenu = () => {
    setIsAddMenuOpen(false);
    setActiveInputMode(null);
    setManualUrl("");
  };

  const triggerUpload = (key) => {
    if (fileInputRefs.current[key]) fileInputRefs.current[key].click();
    handleCloseMenu();
  };

  const handleManualSubmit = () => {
    if (!manualUrl) return;
    if (isFull) return;
    onManualInput(manualUrl, nextEmptySlot);
    handleCloseMenu();
  };

  const moveAsset = (currentIndex, direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= contentSlots.length) return;
    onReorder(currentIndex, newIndex);
  };

  const getAssetType = (url) => {
    if (!url) return "empty";
    const lower = url.toLowerCase();
    if (
      lower.includes("youtube") ||
      lower.includes("youtu.be") ||
      lower.includes("vimeo")
    )
      return "video";
    if (
      lower.includes("spotify") ||
      lower.includes("soundcloud") ||
      lower.endsWith(".mp3")
    )
      return "audio";
    return "image";
  };

  // --- SUB-COMPONENT: ASSET CARD ---
  const AssetCard = ({ assetKey, label, index }) => {
    const url = images[assetKey];
    if (!url) return null;

    const type = getAssetType(url);
    const isSoundCloud = url.toLowerCase().includes("soundcloud");
    const isPendingDelete = deletingId === assetKey;

    return (
      <div
        className={`group relative flex items-center gap-2 p-2 rounded-xl border mb-3 transition-all animate-in fade-in slide-in-from-right-4 duration-300 ${
          isDark
            ? "bg-black/40 border-white/5 hover:border-teal-500/30"
            : "bg-white border-slate-200 hover:border-teal-500/30"
        } ${isPendingDelete ? "border-red-500/50 bg-red-500/5" : ""}`}
      >
        {/* REORDER CONTROLS */}
        <div className="flex flex-col gap-1 items-center justify-center pr-2 border-r border-white/5">
          <button
            onClick={() => moveAsset(index, -1)}
            disabled={index === 0}
            className={`p-1 rounded hover:bg-white/10 ${index === 0 ? "opacity-20" : "text-slate-400 hover:text-white"}`}
          >
            <ChevronUp size={10} />
          </button>
          <button
            onClick={() => moveAsset(index, 1)}
            disabled={index === 4}
            className={`p-1 rounded hover:bg-white/10 ${index === 4 ? "opacity-20" : "text-slate-400 hover:text-white"}`}
          >
            <ChevronDown size={10} />
          </button>
        </div>

        {/* THUMBNAIL AREA */}
        <div
          className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center relative ${isDark ? "bg-black border-white/10" : "bg-slate-100 border-slate-200"}`}
        >
          {type === "image" && (
            <img
              src={url}
              alt="asset"
              className="w-full h-full object-cover pointer-events-none"
            />
          )}
          {type === "video" && <Video size={20} className="text-red-500" />}

          {/* Audio Play Button (VIBE CHECK) */}
          {type === "audio" && (
            <div className="relative w-full h-full group/play">
              <button
                onClick={() => onPlayAudio(url)}
                className={`w-full h-full flex items-center justify-center hover:bg-white/10 transition-colors ${isSoundCloud ? "text-[#ff5500]" : "text-emerald-500"}`}
              >
                <Play size={20} fill="currentColor" />
              </button>
              {/* Tiny Vibe Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max px-2 py-1 bg-black text-white text-[8px] rounded opacity-0 group-hover/play:opacity-100 pointer-events-none transition-opacity">
                Test Vibe
              </div>
            </div>
          )}
        </div>

        {/* INFO TEXT */}
        <div className="flex-1 min-w-0 ml-1">
          <p
            className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {type === "image"
              ? label
              : isSoundCloud
                ? "SOUNDCLOUD"
                : type.toUpperCase()}
          </p>
          <div className="text-[10px] truncate font-mono opacity-50 pr-2">
            {url}
          </div>
        </div>

        {/* ACTIONS (Code & Delete) */}
        <div className="flex gap-1 items-center">
          {/* INSERT TO BLOG BUTTON (The Inline Part) */}
          <div className="relative group/tooltip">
            <button
              onClick={() => onOpenStudio(url)}
              className="p-2 rounded-lg hover:bg-teal-500/10 hover:text-teal-400 text-slate-500 transition-all"
            >
              <Code size={14} />
            </button>
            {/* Tooltip for Clarity */}
            <div className="absolute bottom-full right-0 mb-2 w-32 p-2 bg-black/90 text-white text-[9px] rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50 text-center border border-white/10 shadow-xl">
              Embed Player inside Blog Post
            </div>
          </div>

          {/* DELETE BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPendingDelete) {
                onManualInput("", assetKey);
                setDeletingId(null);
              } else {
                setDeletingId(assetKey);
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              isPendingDelete
                ? "bg-red-500 text-white hover:bg-red-600"
                : "hover:bg-red-500/10 hover:text-red-500 text-slate-600"
            }`}
          >
            {isPendingDelete ? (
              <CheckCircle2 size={14} />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div
      className={`w-full h-[500px] lg:h-[750px] rounded-[2.5rem] border-2 overflow-hidden flex flex-col ${isDark ? "border-white/10" : "bg-white border-slate-200"}`}
      style={
        isDark
          ? {
              backgroundColor: `rgba(0, 0, 0, ${bgOpacity / 100})`,
              backdropFilter: `blur(${bgOpacity * 0.2}px)`,
              transition: "all 0.3s ease",
            }
          : {}
      }
    >
      {/* HEADER */}
      <div
        className={`p-6 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}
      >
        <h3
          className={`font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
        >
          <Settings2 size={16} className="text-teal-500" /> Media Stream
        </h3>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {contentSlots.map((key, i) => (
          <AssetCard
            key={key}
            assetKey={key}
            label={`Asset ${i + 1}`}
            index={i}
          />
        ))}

        {/* ADD BUTTON */}
        {!isAddMenuOpen ? (
          <button
            onClick={() => !isFull && setIsAddMenuOpen(true)}
            disabled={isFull}
            className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group ${
              isFull
                ? "opacity-50 cursor-not-allowed border-slate-700 text-slate-700"
                : isDark
                  ? "border-white/10 text-slate-500 hover:border-teal-500/50 hover:text-teal-400 hover:bg-teal-500/5"
                  : "border-slate-200 text-slate-400 hover:border-teal-500/50 hover:text-teal-600 hover:bg-teal-50"
            }`}
          >
            {isFull ? (
              "Stream Full"
            ) : (
              <>
                <Plus
                  size={16}
                  className="group-hover:scale-110 transition-transform"
                />{" "}
                Add To Stream
              </>
            )}
          </button>
        ) : (
          <div
            className={`rounded-xl border p-2 animate-in zoom-in-95 duration-200 ${isDark ? "bg-black/40 border-teal-500/30" : "bg-white border-slate-200 shadow-lg"}`}
          >
            {/* MENU HEADER */}
            <div className="flex justify-between items-center mb-3 px-2 pt-1">
              <div className="flex items-center gap-2">
                {activeInputMode && (
                  <button
                    onClick={() => setActiveInputMode(null)}
                    className="hover:text-white text-slate-500 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-teal-500" : "text-teal-600"}`}
                >
                  {activeInputMode ? `Add ${activeInputMode}` : "Select Type"}
                </span>
              </div>
              <button
                onClick={handleCloseMenu}
                className={`hover:text-red-500 transition-colors ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                <X size={14} />
              </button>
            </div>

            {!activeInputMode ? (
              <div className="flex flex-col gap-2">
                {/* 1. VISUAL ASSETS */}
                <div className="px-1 text-[8px] font-bold uppercase opacity-40 tracking-widest mt-1">
                  Blog Assets
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerUpload(nextEmptySlot)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                  >
                    <Images size={16} />
                    <span className="text-[8px] font-bold uppercase">
                      Image
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveInputMode("video")}
                    className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600"}`}
                  >
                    <Video size={16} />
                    <span className="text-[8px] font-bold uppercase">
                      Video
                    </span>
                  </button>
                </div>

                {/* DIVIDER */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

                {/* 2. AUDIO / VIBE ASSETS */}
                <div className="px-1 text-[8px] font-bold uppercase opacity-40 tracking-widest flex items-center justify-between">
                  <span>Vibe / Ambiance</span>
                  <FileAudio size={10} />
                </div>
                <button
                  onClick={() => setActiveInputMode("audio")}
                  className={`p-3 rounded-lg flex items-center justify-between gap-3 transition-all group ${isDark ? "bg-teal-500/10 hover:bg-teal-500/20 text-teal-400" : "bg-teal-50 hover:bg-teal-100 text-teal-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <Music size={16} />
                    <div className="flex flex-col items-start">
                      <span className="text-[9px] font-bold uppercase">
                        Spotify / SoundCloud
                      </span>
                      {/* UPDATED TEXT HERE */}
                      <span className="text-[8px] opacity-60">
                        Vibes & Embedding
                      </span>
                    </div>
                  </div>
                  <ChevronLeft
                    size={12}
                    className="rotate-180 opacity-50 group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </div>
            ) : null}

            {/* INPUT FORM */}
            {(activeInputMode === "video" || activeInputMode === "audio") && (
              <div className="space-y-3">
                {/* NEW EXPLICIT INSTRUCTION BOX FOR AUDIO */}
                {activeInputMode === "audio" && (
                  <div
                    className={`p-2 rounded border text-left ${isDark ? "bg-teal-500/10 border-teal-500/20" : "bg-teal-50 border-teal-200"}`}
                  >
                    <h4
                      className={`text-[9px] font-bold uppercase flex items-center gap-1 mb-1 ${isDark ? "text-teal-400" : "text-teal-700"}`}
                    >
                      <Info size={10} /> How this works:
                    </h4>
                    <p
                      className={`text-[9px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      1. <strong>Play:</strong> Listen here while you write
                      (Vibe).
                      <br />
                      2. <strong>Embed:</strong> Use the{" "}
                      <Code size={8} className="inline mx-0.5" /> button later
                      to add the player to your blog.
                    </p>
                  </div>
                )}

                <input
                  autoFocus
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder={
                    activeInputMode === "video"
                      ? "YouTube / Vimeo Link..."
                      : "Paste Song Link Here..."
                  }
                  className={`w-full p-3 rounded-lg text-xs outline-none border transition-all ${isDark ? "bg-black/50 border-white/10 focus:border-teal-500 text-white" : "bg-slate-50 border-slate-200 focus:border-teal-500 text-slate-900"}`}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualUrl}
                  className={`w-full py-3 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    !manualUrl
                      ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                      : isDark
                        ? "bg-teal-500 text-black hover:bg-teal-400"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                >
                  <CheckCircle2 size={14} />
                  Confirm Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HIDDEN FILE INPUTS */}
      <div className="hidden">
        {contentSlots.map((key) => (
          <input
            key={key}
            type="file"
            ref={(el) => (fileInputRefs.current[key] = el)}
            onChange={(e) => {
              onUpload(e, key);
              e.target.value = null;
            }}
            className="hidden"
          />
        ))}
      </div>
    </div>
  );
}
