"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

export default function GalleryCarousel({ images, caption }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Calculate indices for the "stack" effect
  const nextIndex = (activeIndex + 1) % images.length;
  const nextNextIndex = (activeIndex + 2) % images.length;

  return (
    <figure className="my-12 w-full max-w-2xl mx-auto clear-both block select-none">
      {/* STACK CONTAINER */}
      <div className="relative w-full aspect-[4/5] md:aspect-video perspective-1000">
        {/* --- CARD 3 (Bottom of pile) --- */}
        {images.length > 2 && (
          <div
            className="absolute inset-0 w-full h-full transition-all duration-500 ease-out"
            style={{
              transform:
                "translateX(12px) translateY(12px) rotate(4deg) scale(0.9)",
              opacity: 0.6,
              zIndex: 0,
            }}
          >
            <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-lg bg-gray-200 border-4 border-white">
              <img
                src={images[nextNextIndex]}
                alt="gallery-stack-3"
                className="w-full h-full object-cover"
                loading="lazy"
                width="800" // Helps CLS
                height="600" // Helps CLS
              />
            </div>
          </div>
        )}

        {/* --- CARD 2 (Middle of pile) --- */}
        {images.length > 1 && (
          <div
            className="absolute inset-0 w-full h-full transition-all duration-500 ease-out"
            style={{
              transform:
                "translateX(-10px) translateY(6px) rotate(-3deg) scale(0.95)",
              opacity: 0.8,
              zIndex: 10,
            }}
          >
            <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-xl bg-gray-200 border-4 border-white">
              <img
                src={images[nextIndex]}
                alt="gallery-stack-2"
                className="w-full h-full object-cover"
                loading="lazy"
                width="800" // Helps CLS
                height="600" // Helps CLS
              />
            </div>
          </div>
        )}

        {/* --- CARD 1 (Active / Top) --- */}
        <div
          className="absolute inset-0 w-full h-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
          style={{
            transform: isTransitioning
              ? "scale(1.05)"
              : "scale(1) rotate(0deg)",
            zIndex: 20,
          }}
        >
          <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 bg-gray-100 border-4 border-white group">
            <img
              src={images[activeIndex]}
              alt="gallery-active"
              className="w-full h-full object-cover"
              width="800" // Helps CLS
              height="600" // Helps CLS
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          </div>
        </div>

        {/* --- CONTROLS --- */}
        <div className="absolute inset-0 z-30 flex items-center justify-between px-4 pointer-events-none">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide" // ✅ Accessibility Fix
            className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-white/50 text-slate-700 flex items-center justify-center hover:scale-110 hover:bg-white transition-all active:scale-95"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide" // ✅ Accessibility Fix
            className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg border border-white/50 text-slate-700 flex items-center justify-center hover:scale-110 hover:bg-white transition-all active:scale-95"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Counter Pill */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 shadow-lg">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* CAPTION */}
      {caption && (
        <figcaption className="mt-8 text-center text-xs text-slate-500 font-mono tracking-widest uppercase animate-fade-in">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
