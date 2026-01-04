"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Facebook, Instagram, Youtube } from "lucide-react";

// --- HELPER COMPONENTS (Defined first to avoid "not defined" errors) ---

function SocialButton({ href, onClick, icon, label }) {
  const commonClasses =
    "w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-all duration-300 group bg-[#1a1a1a]";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={commonClasses}
      >
        {icon}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      type="button"
      className={`${commonClasses} cursor-pointer active:scale-90`}
    >
      {icon}
    </button>
  );
}

function TikTokIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function XIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

// --- MAIN FOOTER COMPONENT ---

export default function Footer() {
  const [dateString, setDateString] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Generate: "January 2026"
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(now);

    setDateString(formattedDate);

    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleInactiveClick = (e) => {
    e.preventDefault();
    setShowToast(true);
  };

  return (
    <footer className="relative w-full bg-[#111] text-[#f8f8f5] pt-10 pb-6 px-6 mt-auto overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* TOP SECTION: CALL TO ACTION */}
        <div className="flex flex-col items-center text-center border-b border-gray-800 pb-10 mb-10">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-light)] via-[var(--color-primary)] to-[var(--color-primary-dark)] mb-4">
            Let's Create.
          </h2>

          <a
            href="mailto:dm@danielnotdaylewis.com"
            className="inline-block px-8 py-3 border border-white/20 rounded-full hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-all duration-300 font-bold uppercase tracking-wider text-xs md:text-sm"
          >
            Email's open
          </a>
        </div>

        {/* MIDDLE: LINKS & SOCIALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 w-full">
          {/* 1. Brand */}
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <Link href="/" className="group inline-block">
              <h3
                className="font-black tracking-tighter leading-none text-2xl md:text-3xl pr-5 
  transition-transform duration-300 group-hover:scale-[1.02]
  text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-400 to-indigo-500 
  animate-gradient-x drop-shadow-sm"
              >
                Daniel (not Day) Lewis
              </h3>
            </Link>
            <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed">
              Artist by nature. <br className="hidden md:block" />
              Entrepreneur by nurture.
            </p>
          </div>

          {/* 2. Navigation */}
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex gap-4 text-sm md:text-base font-bold uppercase tracking-widest text-[10px]">
              <Link
                href="/actor"
                className="hover:text-[var(--color-primary-light)] transition-colors"
              >
                Voice Actor
              </Link>
              <span className="text-gray-700">|</span>
              <Link
                href="/endeavors"
                className="hover:text-[var(--color-primary-light)] transition-colors"
              >
                Endeavors
              </Link>
              <span className="text-gray-700">|</span>
              <Link
                href="/blog"
                className="hover:text-[var(--color-primary-light)] transition-colors"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* 3. Socials */}
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="flex gap-3 justify-center">
              <SocialButton
                href="https://www.facebook.com/danlewisaudiobookactor"
                icon={<Facebook size={16} />}
                label="Facebook"
              />
              <SocialButton
                onClick={handleInactiveClick}
                icon={<Instagram size={16} />}
                label="Instagram"
              />
              <SocialButton
                onClick={handleInactiveClick}
                icon={<XIcon size={12} />}
                label="X"
              />
              <SocialButton
                onClick={handleInactiveClick}
                icon={<Youtube size={16} />}
                label="YouTube"
              />
              <SocialButton
                onClick={handleInactiveClick}
                icon={<TikTokIcon size={16} />}
                label="TikTok"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM: LEGAL */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 pt-4 border-t border-gray-900 gap-2 md:gap-0">
          <p>© {dateString || new Date().getFullYear()} by Daniel Lewis.</p>
          <div className="flex gap-4">
            <Link
              href="/legal/terms-of-use"
              className="hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>

      {/* --- TOAST --- */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full shadow-2xl font-bold uppercase tracking-widest z-50 transition-all duration-300 transform text-center whitespace-nowrap md:whitespace-normal
    ${/* Responsive Font Sizes: Tiny on mobile, standard on MD+ */ ""}
    text-[9px] leading-tight md:text-xs 
    ${
      showToast
        ? "opacity-100 translate-y-0 scale-100"
        : "opacity-0 translate-y-4 scale-95 pointer-events-none"
    }`}
      >
        Coming Soon{" "}
        <span className="opacity-80 font-medium block md:inline">
          {" "}
          (social media not a top priority at the moment)
        </span>
      </div>
    </footer>
  );
}
