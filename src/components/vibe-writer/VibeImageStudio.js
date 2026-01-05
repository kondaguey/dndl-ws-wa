"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Settings2,
  Video,
  Music,
  Image as ImageIcon,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

export default function VibeImageStudio({
  isOpen,
  onClose,
  imageUrl,
  availableImages = [],
  onGenerateCode,
  initialTab = "layout",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Auto-detect content type to switch tabs automatically
  useEffect(() => {
    if (isOpen && imageUrl) {
      if (imageUrl.includes("youtube") || imageUrl.includes("vimeo")) {
        setActiveTab("video");
        setVideoUrl(imageUrl);
      } else if (imageUrl.includes("spotify")) {
        setActiveTab("audio");
        setAudioUrl(imageUrl);
      } else {
        // It's an image, default to layout or what was passed
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, imageUrl, initialTab]);

  const [layout, setLayout] = useState({
    size: "large",
    align: "center",
    caption: "",
  });

  const [selectedGalleryImages, setSelectedGalleryImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  // When opening in gallery mode, try to use the current image as first selection
  useEffect(() => {
    if (
      isOpen &&
      imageUrl &&
      !imageUrl.includes("youtube") &&
      !imageUrl.includes("spotify")
    ) {
      setSelectedGalleryImages([imageUrl]);
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  // --- HELPERS ---
  const getEmbedUrl = (url) => {
    if (!url) return "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const v = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
      return `https://www.youtube.com/embed/${v}`;
    }
    if (url.includes("vimeo.com")) {
      const v = url.split("/").pop();
      return `https://player.vimeo.com/video/${v}`;
    }
    return url;
  };

  const getSpotifyEmbed = (url) => {
    if (url.includes("/embed")) return url;
    if (url.includes("open.spotify.com")) {
      const parts = url.split(".com/");
      return `https://open.spotify.com/embed/${parts[1]}`;
    }
    return url;
  };

  const toggleGalleryImage = (url) => {
    if (selectedGalleryImages.includes(url)) {
      if (selectedGalleryImages.length > 1) {
        setSelectedGalleryImages((prev) => prev.filter((i) => i !== url));
      }
    } else {
      if (selectedGalleryImages.length < 3) {
        setSelectedGalleryImages((prev) => [...prev, url]);
      } else {
        alert("Max 3 images for a gallery row.");
      }
    }
  };

  const generateCode = () => {
    if (activeTab === "audio") {
      if (!audioUrl) return alert("Please enter an audio URL");
      return onGenerateCode(`[[audio:${audioUrl}]]`);
    }

    if (activeTab === "video") {
      if (!videoUrl) return alert("Please enter a video URL");
      return onGenerateCode(`[[video:${videoUrl}]]`);
    }

    if (activeTab === "gallery") {
      const count = selectedGalleryImages.length;
      if (count < 2) return alert("Select at least 2 images for a gallery.");
      const type = count === 2 ? "duo" : "trio";
      let code = `[[${type}:${selectedGalleryImages.join("|")}`;
      if (layout.caption) code += `|caption=${layout.caption}`;
      code += "]]";
      return onGenerateCode(code);
    } else {
      let code = `[[image:${imageUrl}`;
      code += `|size=${layout.size}`;
      code += `|align=${layout.align}`;
      if (layout.caption) code += `|caption=${layout.caption}`;
      code += "]]";
      return onGenerateCode(code);
    }
  };

  const isMedia =
    imageUrl &&
    (imageUrl.includes("youtube") ||
      imageUrl.includes("vimeo") ||
      imageUrl.includes("spotify"));

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="w-[800px] h-[90vh] max-h-[900px] bg-[#0f172a] border border-teal-500/30 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 pointer-events-auto">
            <h3 className="font-black uppercase tracking-widest text-teal-400 text-xs flex items-center gap-2">
              <Settings2 size={14} /> Vibe Studio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-slate-400 hover:text-white pointer-events-auto transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[60%] bg-[#02020a] relative flex items-center justify-center p-8 overflow-hidden border-b border-white/10">
          <div
            className={`transition-all duration-500 flex gap-4 ${activeTab === "layout" && layout.size === "small" ? "w-1/3" : activeTab === "layout" && layout.size === "medium" ? "w-1/2" : activeTab === "layout" && layout.size === "large" ? "w-2/3" : "w-full max-w-3xl"}`}
          >
            {activeTab === "layout" && imageUrl && !isMedia && (
              <img
                src={imageUrl}
                className="w-full h-auto max-h-[50vh] object-cover rounded-lg shadow-2xl border border-white/10"
                alt="Preview"
              />
            )}

            {activeTab === "layout" && (!imageUrl || isMedia) && (
              <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 border border-white/10 rounded-lg bg-white/5">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <span className="text-xs uppercase font-bold tracking-widest">
                  {isMedia ? "Switch to Video/Audio Tab" : "No Image Selected"}
                </span>
              </div>
            )}

            {activeTab === "gallery" && (
              <div className="flex gap-4 w-full justify-center h-[50vh]">
                {selectedGalleryImages.map((url, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden shadow-2xl border border-white/10 flex-1 aspect-[2/3] bg-black"
                  >
                    <img
                      src={url}
                      className="w-full h-full object-cover"
                      alt={`Gallery ${i}`}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 rounded-full border border-white/20">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "video" && (
              <div className="w-full aspect-video bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl relative flex items-center justify-center">
                {videoUrl ? (
                  <iframe
                    src={getEmbedUrl(videoUrl)}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center gap-2">
                    <Video size={48} className="opacity-20" />
                    <span className="text-xs uppercase font-bold tracking-widest opacity-50">
                      Video Preview
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "audio" && (
              <div className="w-full max-w-xl bg-black/50 rounded-xl border border-white/10 p-8 shadow-2xl flex flex-col items-center justify-center gap-4">
                {audioUrl ? (
                  audioUrl.includes("spotify.com") ? (
                    <iframe
                      style={{ borderRadius: "12px" }}
                      src={getSpotifyEmbed(audioUrl)}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allowFullScreen=""
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    ></iframe>
                  ) : (
                    <audio controls className="w-full" src={audioUrl}>
                      Your browser does not support audio.
                    </audio>
                  )
                ) : (
                  <div className="text-slate-600 flex flex-col items-center gap-2">
                    <Music size={48} className="opacity-20" />
                    <span className="text-xs uppercase font-bold tracking-widest opacity-50">
                      Audio Preview
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {layout.caption && activeTab === "layout" && (
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
              <span className="bg-black/80 backdrop-blur text-slate-300 px-4 py-2 rounded-full text-[10px] font-mono border border-white/10 shadow-xl">
                {layout.caption}
              </span>
            </div>
          )}
        </div>

        <div className="h-[40%] bg-[#0f172a] flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                    Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-black/30 rounded-lg p-1 border border-white/10">
                    {["layout", "gallery", "video", "audio"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setActiveTab(mode)}
                        className={`py-2 text-[10px] font-bold uppercase rounded transition-all ${activeTab === mode ? "bg-teal-500 text-black shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        {mode === "layout"
                          ? "Single"
                          : mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {activeTab === "layout" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                      Caption
                    </label>
                    <input
                      value={layout.caption}
                      onChange={(e) =>
                        setLayout({ ...layout, caption: e.target.value })
                      }
                      placeholder="Type caption here..."
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-teal-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {activeTab === "layout" && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                        Size
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["small", "medium", "large", "full"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setLayout({ ...layout, size: s })}
                            className={`py-2 rounded text-[10px] font-bold uppercase border transition-all ${layout.size === s ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-black/30 border-transparent text-slate-500 hover:bg-black/50"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                        Alignment
                      </label>
                      <div className="flex gap-2">
                        {["left", "center", "right"].map((a) => (
                          <button
                            key={a}
                            onClick={() => setLayout({ ...layout, align: a })}
                            className={`flex-1 py-2 rounded flex justify-center border transition-all ${layout.align === a ? "bg-slate-700 border-slate-600 text-white" : "bg-black/30 border-transparent text-slate-500 hover:bg-black/50"}`}
                          >
                            {a === "left" && <AlignLeft size={16} />}
                            {a === "center" && <AlignCenter size={16} />}
                            {a === "right" && <AlignRight size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "gallery" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                      Select Images (2-3)
                    </label>
                    <div className="grid grid-cols-4 gap-2 h-32 overflow-y-auto custom-scrollbar pr-2">
                      {availableImages
                        .filter(Boolean)
                        .filter(
                          (u) =>
                            !u.includes("youtube") &&
                            !u.includes("vimeo") &&
                            !u.includes("spotify")
                        )
                        .map((url, i) => (
                          <button
                            key={i}
                            onClick={() => toggleGalleryImage(url)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square group ${selectedGalleryImages.includes(url) ? "border-teal-500 opacity-100 ring-2 ring-teal-500/50" : "border-white/5 opacity-50 hover:opacity-100"}`}
                          >
                            <img
                              src={url}
                              className="w-full h-full object-cover"
                            />
                            {selectedGalleryImages.includes(url) && (
                              <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                                <Check
                                  size={16}
                                  className="text-white drop-shadow-md"
                                />
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {activeTab === "video" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                      Video URL
                    </label>
                    <input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-teal-500 outline-none transition-colors"
                    />
                  </div>
                )}

                {activeTab === "audio" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block tracking-widest">
                      Audio URL (Spotify or File)
                    </label>
                    <input
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://open.spotify.com/track/..."
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-teal-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur">
            <button
              onClick={generateCode}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 text-sm"
            >
              <Check size={18} /> Insert Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
