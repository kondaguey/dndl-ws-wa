"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Facebook, Instagram, Youtube } from "lucide-react"; // Removed Twitter

export default function Footer() {
  const year = new Date().getFullYear();
  const [showToast, setShowToast] = useState(false);

  // Auto-hide the toast after 2 seconds
  useEffect(() => {
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
    <footer className="relative w-full bg-[#111] text-[#f8f8f5] pt-20 pb-8 px-6 mt-auto rounded-t-[3rem] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* TOP SECTION: CALL TO ACTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-12 mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-light)] via-[var(--color-primary)] to-[var(--color-primary-dark)]">
              Let's Create.
            </h2>
            <p className="text-gray-400 max-w-md text-lg">
              Together, we can make cool sh*t happen.
            </p>
          </div>

          <div className="mt-8 md:mt-0">
            <a
              href="mailto:dm@danielnotdaylewis.com"
              className="inline-block px-8 py-4 border border-white/20 rounded-full hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-all duration-300 font-bold uppercase tracking-wider"
            >
              Get in Touch
            </a>
          </div>
        </div>

        {/* MIDDLE: LINKS & SOCIALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="relative w-32 h-32 opacity-90">
              <Image
                src="/images/dndl-logo.webp"
                alt="Site Logo"
                fill
                className="object-contain invert"
              />
            </div>
            <p className="text-sm text-gray-500">
              Artist by nature.
              <br />
              Entrepreneur by nurture.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-2">
            <h4 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-2">
              Explore
            </h4>
            <Link
              href="/actor"
              className="hover:text-[var(--color-primary-light)] transition-colors w-fit"
            >
              Voice Actor
            </Link>
            <Link
              href="/endeavors"
              className="hover:text-[var(--color-primary-light)] transition-colors w-fit"
            >
              Endeavors
            </Link>
            <Link
              href="/blog"
              className="hover:text-[var(--color-primary-light)] transition-colors w-fit"
            >
              Blog
            </Link>
          </div>

          {/* Socials */}
          <div className="flex gap-4 items-start flex-wrap">
            {/* ACTIVE LINK */}
            <SocialButton
              href="https://www.facebook.com/danlewisaudiobookactor"
              icon={<Facebook size={20} />}
              label="Facebook"
            />

            {/* INACTIVE LINKS (Trigger Popup) */}
            <SocialButton
              onClick={handleInactiveClick}
              icon={<Instagram size={20} />}
              label="Instagram"
            />
            {/* REPLACED TWITTER WITH X */}
            <SocialButton
              onClick={handleInactiveClick}
              icon={<XIcon size={16} />} // Size 16 usually balances better for X
              label="X"
            />
            <SocialButton
              onClick={handleInactiveClick}
              icon={<Youtube size={20} />}
              label="YouTube"
            />
            <SocialButton
              onClick={handleInactiveClick}
              icon={<TikTokIcon size={20} />}
              label="TikTok"
            />
          </div>
        </div>

        {/* BOTTOM: LEGAL */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 pt-8 border-t border-gray-900">
          <p>© {year} Daniel Lewis. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
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

      {/* --- THE TOAST NOTIFICATION --- */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full shadow-2xl font-bold uppercase tracking-widest text-xs z-50 transition-all duration-300 transform ${
          showToast
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        Coming Soon 🚀
      </div>
    </footer>
  );
}

// --- HELPER COMPONENTS ---

function SocialButton({ href, onClick, icon, label }) {
  const commonClasses =
    "w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-all duration-300 group bg-[#1a1a1a]";

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
      className={`${commonClasses} cursor-pointer active:scale-90`}
    >
      {icon}
    </button>
  );
}

// Custom TikTok SVG
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

// Custom X (formerly Twitter) SVG
function XIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor" /* X logo uses fill, not stroke */
      stroke="none"
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}
