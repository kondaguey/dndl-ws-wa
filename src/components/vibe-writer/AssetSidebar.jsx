"use client";

import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  Settings2,
  Video,
  Music,
  Plus,
  Code,
  X,
  Trash2,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";

export default function AssetSidebar({
  images,
  onUpload,
  onManualInput,
  onOpenStudio,
  uploadingSlot,
  isDark,
}) {
  const fileInputRefs = useRef({});

  // UI States
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState(null); // 'video' | 'audio' | null
  const [manualUrl, setManualUrl] = useState("");

  // CONTENT SLOTS (img2 -> img6)
  const contentSlots = ["img2", "img3", "img4", "img5", "img6"];

  // Calculate next empty slot
  const nextEmptySlot = contentSlots.find((key) => !images[key]);
  const isFull = !nextEmptySlot;

  // --- ACTIONS ---

  const handleCloseMenu = () => {
    setIsAddMenuOpen(false);
    setActiveInputMode(null);
    setManualUrl("");
  };

  const triggerUpload = (key) => {
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key].click();
    }
    handleCloseMenu();
  };

  const handleManualSubmit = () => {
    if (!manualUrl) return;
    if (isFull) return; // Should be blocked by UI anyway

    // Pass the URL to the parent
    onManualInput(manualUrl, nextEmptySlot);
    handleCloseMenu();
  };

  // Detect content type for the thumbnail icon
  const getAssetType = (url) => {
    if (!url) return "empty";
    if (
      url.includes("youtube") ||
      url.includes("youtu.be") ||
      url.includes("vimeo")
    )
      return "video";
    if (url.includes("spotify") || url.endsWith(".mp3")) return "audio";
    return "image";
  };

  // --- SUB-COMPONENT: ASSET CARD ---
  const AssetCard = ({ assetKey, label }) => {
    const url = images[assetKey];
    if (!url) return null;

    const type = getAssetType(url);

    return (
      <div
        className={`group relative flex items-center gap-3 p-3 rounded-xl border mb-3 transition-all animate-in fade-in slide-in-from-bottom-2 ${
          isDark
            ? "bg-black/40 border-white/5 hover:border-teal-500/30"
            : "bg-white border-slate-200 hover:border-teal-500/30"
        }`}
      >
        {/* THUMBNAIL */}
        <div
          className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center relative ${isDark ? "bg-black border-white/10" : "bg-slate-100 border-slate-200"}`}
        >
          {type === "image" && (
            <img src={url} alt="asset" className="w-full h-full object-cover" />
          )}
          {type === "video" && <Video size={20} className="text-red-500" />}
          {type === "audio" && <Music size={20} className="text-emerald-500" />}
        </div>

        {/* LABEL & URL PREVIEW */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[9px] font-black uppercase tracking-wider mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            {type === "image" ? label : type.toUpperCase()}
          </p>
          <div className="text-[10px] truncate font-mono opacity-50 pr-2">
            {url}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-1">
          {/* REPLACE / DELETE BUTTON */}
          <button
            onClick={
              () =>
                type === "image"
                  ? triggerUpload(assetKey)
                  : onManualInput("", assetKey) // Clear the slot if it's text/media
            }
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? "hover:bg-white/10 text-slate-400 hover:text-white"
                : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            }`}
            title={type === "image" ? "Replace Image" : "Remove Link"}
          >
            {uploadingSlot === assetKey ? (
              <Loader2 size={14} className="animate-spin" />
            ) : type === "image" ? (
              <Upload size={14} />
            ) : (
              <Trash2 size={14} />
            )}
          </button>

          {/* STUDIO BUTTON */}
          <button
            onClick={() => onOpenStudio(url)}
            className={`p-2 rounded-lg transition-all ${
              isDark
                ? "bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-black shadow-[0_0_10px_rgba(45,212,191,0.1)]"
                : "bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white"
            }`}
            title="Generate Shortcode"
          >
            <Code size={14} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`h-full rounded-[2.5rem] border-2 overflow-hidden flex flex-col ${
        isDark
          ? "bg-black/20 backdrop-blur-md border-white/10"
          : "bg-white border-slate-200"
      }`}
    >
      <div
        className={`p-6 border-b ${isDark ? "border-white/10" : "border-slate-100"}`}
      >
        <h3
          className={`font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2 ${isDark ? "text-white" : "text-slate-800"}`}
        >
          <Settings2 size={16} className="text-teal-500" />
          Media Stream
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* Render only populated slots */}
        {contentSlots.map((key, i) => (
          <AssetCard key={key} assetKey={key} label={`Asset ${i + 1}`} />
        ))}

        {/* --- ADD MEDIA MENU --- */}
        <div className="mt-4">
          {!isAddMenuOpen ? (
            // 1. ADD BUTTON (DEFAULT STATE)
            <button
              onClick={() =>
                isFull ? alert("Max assets reached") : setIsAddMenuOpen(true)
              }
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
                  />
                  Add To Stream
                </>
              )}
            </button>
          ) : (
            <div
              className={`rounded-xl border p-2 animate-in zoom-in-95 duration-200 ${isDark ? "bg-black/40 border-teal-500/30" : "bg-white border-slate-200 shadow-lg"}`}
            >
              {/* HEADER */}
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

              {/* 2. TYPE SELECTION GRID */}
              {!activeInputMode ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => triggerUpload(nextEmptySlot)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 text-slate-300"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <ImageIcon size={18} />
                    <span className="text-[8px] font-bold uppercase">
                      Image
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveInputMode("video")}
                    className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 text-slate-300"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Video size={18} />
                    <span className="text-[8px] font-bold uppercase">
                      Video
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveInputMode("audio")}
                    className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      isDark
                        ? "bg-white/5 hover:bg-white/10 text-slate-300"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Music size={18} />
                    <span className="text-[8px] font-bold uppercase">
                      Audio
                    </span>
                  </button>
                </div>
              ) : (
                // 3. URL INPUT MODE (No Alerts!)
                <div className="space-y-2">
                  <input
                    autoFocus
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder={
                      activeInputMode === "video"
                        ? "https://youtube.com/..."
                        : "https://spotify.com/..."
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
      </div>

      {/* HIDDEN INPUTS FOR FILE UPLOAD */}
      <div className="hidden">
        {contentSlots.map((key) => (
          <input
            key={key}
            type="file"
            ref={(el) => (fileInputRefs.current[key] = el)}
            onChange={(e) => {
              onUpload(e, key);
              // Reset value to allow re-uploading same file if needed
              e.target.value = null;
            }}
            className="hidden"
          />
        ))}
      </div>
    </div>
  );
}
