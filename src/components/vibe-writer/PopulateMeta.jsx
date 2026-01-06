"use client";

import React, { useRef } from "react";
import {
  Calendar,
  User,
  Globe,
  Type,
  Image as ImageIcon,
  Upload,
  Loader2,
  Settings2,
} from "lucide-react";

const CATEGORIES = [
  "Life",
  "Esotericism",
  "Acting",
  "Audiobook Acting",
  "Entrepreneurship",
  "Production",
];

export default function PopulateMeta({
  date,
  setDate,
  author,
  setAuthor,
  urlPath,
  setUrlPath,
  tag,
  setTag,
  imageCaption,
  setImageCaption,
  heroImage,
  onUpload,
  onOpenStudio,
  uploadingSlot,
  isDark,
  themeBorderClass,
}) {
  const heroInputRef = useRef(null);

  return (
    <div
      className={`p-5 md:p-8 rounded-[2.5rem] border-2 mb-8 ${
        isDark
          ? `bg-black/20 backdrop-blur-md ${themeBorderClass} border-opacity-60`
          : "bg-white border-slate-200"
      }`}
    >
      <div className="space-y-6">
        {/* ROW 1: Date & Author */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-2 w-full">
          {/* 🚨 FIX: Added 'w-full' and 'min-w-0'.
             'min-w-0' is critical here. It allows the flex item to shrink smaller 
             than the native iOS date picker's intrinsic width, preventing overflow.
          */}
          <div className="relative w-full md:flex-1 min-w-0">
            <Calendar
              size={14}
              className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full min-w-0 p-3 pl-10 rounded-xl text-xs font-bold uppercase bg-transparent border-2 outline-none ${
                isDark
                  ? "border-white/10 text-slate-300"
                  : "border-slate-200 text-slate-700"
              }`}
            />
          </div>

          <div className="relative w-full md:flex-1 min-w-0">
            <User
              size={14}
              className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author"
              className={`w-full min-w-0 p-3 pl-10 rounded-xl text-xs font-bold uppercase bg-transparent border-2 outline-none ${
                isDark
                  ? "border-white/10 text-slate-300 placeholder-slate-600"
                  : "border-slate-200 text-slate-700 placeholder-slate-400"
              }`}
            />
          </div>
        </div>

        {/* ROW 2: URL Slug */}
        <div className="relative w-full">
          <Globe
            size={14}
            className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            placeholder="URL Slug"
            className={`w-full min-w-0 p-3 pl-10 rounded-xl text-xs font-bold bg-transparent border-2 outline-none ${
              isDark
                ? "border-white/10 focus:border-teal-500 text-white placeholder-slate-600"
                : "border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>

        {/* ROW 3: Category Tag */}
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className={`w-full p-3 rounded-xl bg-transparent border-2 outline-none text-xs font-bold ${
            isDark
              ? "border-white/10 text-white"
              : "border-slate-200 text-slate-800"
          }`}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-black text-white">
              {c}
            </option>
          ))}
        </select>

        {/* ROW 4: HERO IMAGE CONTROL */}
        <div className="space-y-2 pt-4 border-t border-dashed border-white/10">
          <label
            className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Hero Image
          </label>

          <div className="relative w-full">
            <ImageIcon
              size={14}
              className={`absolute left-4 top-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            />
            <input
              value={heroImage || ""}
              readOnly
              placeholder="No Hero Image Uploaded"
              className={`w-full min-w-0 p-3 pl-10 bg-transparent border-2 rounded-xl outline-none text-[10px] font-mono ${
                isDark
                  ? "border-white/10 text-white placeholder-slate-600"
                  : "border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onOpenStudio(heroImage)}
              disabled={!heroImage}
              className={`flex-1 p-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                !heroImage
                  ? "opacity-50 cursor-not-allowed"
                  : isDark
                    ? "border-white/10 hover:bg-white/5 text-teal-400"
                    : "border-slate-200 hover:bg-slate-50 text-teal-600"
              }`}
            >
              <Settings2 size={14} /> Studio
            </button>

            <button
              onClick={() => heroInputRef.current.click()}
              className={`flex-1 p-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                isDark
                  ? "border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              {uploadingSlot === "main" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {heroImage ? "Replace" : "Upload"}
            </button>

            {/* Hidden Input for Main Image */}
            <input
              type="file"
              ref={heroInputRef}
              onChange={(e) => onUpload(e, "main")}
              className="hidden"
            />
          </div>
        </div>

        {/* ROW 5: Hero Caption */}
        <div className="relative w-full">
          <Type
            size={14}
            className={`absolute left-4 top-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          />
          <input
            value={imageCaption}
            onChange={(e) => setImageCaption(e.target.value)}
            placeholder="Hero Image Caption"
            className={`w-full min-w-0 p-3 pl-10 bg-transparent border-2 rounded-xl outline-none text-xs font-bold ${
              isDark
                ? "border-white/10 text-white placeholder-slate-600"
                : "border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
