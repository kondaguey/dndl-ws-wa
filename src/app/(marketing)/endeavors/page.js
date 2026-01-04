"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Lock,
  Sparkles,
  MoveRight,
  Clock,
  Lightbulb,
} from "lucide-react";

// --- ENDEAVORS DATA ---
const ENDEAVORS = [
  {
    title: "CineSonic™",
    role: "Founder & CEO",
    subtitle: "See stories in sound",
    expanded: "100% human art",
    image: "/images/cinesonic-new-logo-see-stories-in-sound.webp",
    href: "#", // Link disabled
    external: true,
    status: "Launching Soon", // <--- NEW STATUS
    imgContainerClass: "bg-[#020014] relative overflow-hidden",
    imgClass: "object-cover w-full h-full relative z-10",
  },
  {
    title: "Travel & Language",
    role: "Author",
    subtitle: "Book / Website / Travel Socials",
    image: "/images/travel-languages.webp",
    href: "#",
    external: false,
    status: "In Development",
    imgContainerClass: "bg-gray-100",
    imgClass: "object-cover grayscale",
  },
  {
    title: "Training",
    role: "Coach",
    subtitle: "The Reveal: May '26",
    image: "/images/training.webp",
    href: "#",
    external: false,
    status: "In Development",
    imgContainerClass: "bg-gray-100",
    imgClass: "object-cover grayscale",
  },
];

export default function EndeavorsPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FDFBF7] via-[#E8F3F1] to-[#E0E7FF] pt-24 md:pt-40 pb-24 px-4 selection:bg-teal-200 selection:text-teal-900">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <header className="relative text-center mb-16 max-w-3xl mx-auto animate-fade-in z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/60 shadow-sm mb-6 hover:scale-105 transition-transform cursor-default">
            <Lightbulb size={12} className="text-teal-500 fill-teal-500/10" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Restless
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase text-slate-900 tracking-normal mb-4 drop-shadow-sm leading-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 animate-gradient-x">
            Ventures
          </h1>

          <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            An evolving portfolio bridging the gap between art and industry,
            alongside the personal milestones that fuel them.
          </p>
        </header>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ENDEAVORS.map((item, index) => (
            <EndeavorCard key={item.title} item={item} delay={index * 0.1} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}</style>
    </div>
  );
}

// --- CARD COMPONENT ---
function EndeavorCard({ item, delay }) {
  const isExternal = item.external;
  // Define states
  const isActive = item.status === "Active";
  const isLaunching = item.status === "Launching Soon";

  // Disable link if not purely active
  const linkProps =
    isActive && isExternal
      ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
      : {
          href: isActive ? item.href : "#",
          onClick: (e) => !isActive && e.preventDefault(),
        };

  return (
    <div
      className={`group relative h-[280px] w-full perspective-1000 animate-fade-in-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <Link
        {...linkProps}
        className={`relative w-full h-full block rounded-[1.5rem] overflow-hidden transition-all duration-500 shadow-lg border 
        ${
          isActive
            ? "bg-white border-white/60 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
            : isLaunching
            ? "bg-[#020014] border-[#bf953f]/30 cursor-default hover:border-[#bf953f]/60" // Launching style (Dark & Gold)
            : "bg-slate-50 border-slate-200/50 cursor-not-allowed grayscale opacity-90 hover:opacity-100" // Dev style (Gray)
        }`}
      >
        {/* --- IMAGE AREA --- */}
        <div
          className={`absolute inset-0 h-full w-full ${item.imgContainerClass}`}
        >
          {item.title === "CineSonic Audiobooks" && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-black z-0" />
          )}

          <Image
            src={item.image}
            alt={item.title}
            fill
            className={`${item.imgClass} transition-transform duration-700 ease-out group-hover:scale-105`}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-80 group-hover:opacity-70 transition-opacity duration-500" />
        </div>

        {/* --- CONTENT OVERLAY --- */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between z-20">
          {/* Top Bar: STATUS & ICON */}
          <div className="flex justify-between items-start">
            {/* STATUS BADGE */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border shadow-lg ${
                isActive
                  ? "bg-white/95 text-teal-800 border-white/20"
                  : isLaunching
                  ? "bg-[#bf953f]/20 text-[#bf953f] border-[#bf953f]/40 shadow-[0_0_15px_rgba(191,149,63,0.2)] animate-pulse" // GLOWING GOLD
                  : "bg-slate-900/80 text-amber-500 border-white/10"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive
                    ? "bg-teal-500 animate-pulse"
                    : isLaunching
                    ? "bg-[#bf953f] shadow-[0_0_8px_#bf953f]" // Gold Dot
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              {item.status}
            </div>

            {/* LOCK / ARROW ICON */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all duration-300 ${
                isActive
                  ? "bg-white/20 text-white group-hover:bg-white group-hover:text-slate-900 group-hover:scale-110"
                  : isLaunching
                  ? "bg-black/50 text-[#bf953f] border-[#bf953f]/30" // Gold Lock
                  : "bg-slate-900/60 text-slate-500"
              }`}
            >
              {isActive ? (
                isExternal ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <MoveRight size={16} />
                )
              ) : isLaunching ? (
                <Sparkles size={14} className="animate-pulse" /> // Sparkles for Launching
              ) : (
                <Lock size={14} />
              )}
            </div>
          </div>

          {/* Bottom Text */}
          <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            {/* Founder/Role Label */}
            {item.role && (isActive || isLaunching) && (
              <p
                className={`font-bold text-[10px] uppercase tracking-widest mb-1 ${
                  isLaunching ? "text-[#bf953f]" : "text-teal-400"
                }`}
              >
                {item.role}
              </p>
            )}

            <h3 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight mb-1 drop-shadow-md">
              {item.title}
            </h3>

            {/* Subtitle Logic */}
            {isActive || isLaunching ? (
              <>
                {/* Expanded Subtitle (Shows on Hover) */}
                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <p className="text-slate-200 font-medium text-xs mt-1 pb-1 border-t border-white/20 pt-2">
                    {item.expanded}
                  </p>
                </div>
                {/* Preview Subtitle (Hides on Hover) */}
                <div className="block group-hover:hidden text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {item.subtitle}
                </div>
              </>
            ) : (
              // Static Subtitle for Inactive/Dev Cards
              <div className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 border-t border-white/10 pt-2">
                {item.subtitle}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
