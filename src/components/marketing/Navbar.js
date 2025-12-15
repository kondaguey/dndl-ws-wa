"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Telescope, ArrowRight, Mic, Plane } from "lucide-react";
import { createClient } from "../../utils/supabase/client";

// --- TICKER COMPONENT (Moved from Home) ---
function GreetingTicker() {
  const greetings = [
    "Welcome",
    "환영합니다",
    "Benvenuto",
    "欢迎",
    "Bienvenido",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % greetings.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [greetings.length]);

  return (
    <div className="flex items-center gap-2 h-full">
      {/* Plane Icon Animation */}
      <div
        className="text-[var(--color-primary)] hidden xs:block"
        style={{ animation: "plane-float 3s ease-in-out infinite" }}
      >
        <Plane
          size={16}
          className="fill-[var(--color-primary)]/20 stroke-[2px]"
        />
      </div>

      <div className="relative h-5 overflow-hidden w-24 md:w-32 text-left border-l-2 border-[var(--color-primary)]/30 pl-2">
        <div
          className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateY(-${index * 20}px)` }}
        >
          {greetings.map((text, i) => (
            <div
              key={i}
              className="h-5 flex items-center text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-text-muted)]"
            >
              {text}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes plane-float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-2px) rotate(-5deg);
          }
        }
      `}</style>
    </div>
  );
}
// --- REPLACE THE PREVIOUS SVG COMPONENT WITH THIS ---
const AnimatedMagnifyingGlass = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20" // Matches previous button size
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2" // Matches Lucide style
    strokeLinecap="round"
    strokeLinejoin="round"
    // Apply the animation class here. It also accepts external classes like w-5 h-5
    className={`animate-magnify ${className || ""}`}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
// --- AUDIOBOOK COMPONENT ---
const AudiobookButton = ({ mobile = false, onClick }) => (
  <Link
    href="/schedule"
    onClick={onClick}
    className={`
      relative group overflow-hidden rounded-full 
      transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]
      ${
        mobile
          ? "w-full max-w-xs py-4 text-center mt-4"
          : "px-5 py-2 hidden lg:block"
      }
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-400 via-indigo-500 to-blue-600 bg-[length:200%_auto] animate-gradient-xy" />
    <div className="relative flex items-center justify-center gap-2 text-white font-black uppercase tracking-widest text-[10px] md:text-xs">
      <span>Make an Audiobook</span>
      <Mic size={mobile ? 16 : 12} className="fill-white/20" />
    </div>
  </Link>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // --- SEARCH STATE ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allContent, setAllContent] = useState([]);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchSearchData = async () => {
      const staticPages = [
        { title: "Home", slug: "/", tag: "Main" },
        { title: "(Voice) Actor", slug: "/actor", tag: "Portfolio" },
        { title: "Endeavors", slug: "/endeavors", tag: "Projects" },
        { title: "Collab", slug: "/collab", tag: "Contact" },
        { title: "Schedule / Audiobook", slug: "/schedule", tag: "Booking" },
      ];

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("posts")
          .select("title, slug, tag");
        const formattedBlogs = data
          ? data.map((post) => ({
              ...post,
              slug: `/blog/${post.slug}`,
              tag: post.tag || "Blog",
            }))
          : [];
        setAllContent([...staticPages, ...formattedBlogs]);
      } catch (error) {
        console.error("Supabase error:", error);
      }
    };
    fetchSearchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (query.length > 0 && allContent.length > 0) {
      const lowerQuery = query.toLowerCase();
      const filtered = allContent.filter(
        (item) =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.tag?.toLowerCase().includes(lowerQuery)
      );
      setResults(filtered.slice(0, 5));
    } else {
      setResults([]);
    }
  }, [query, allContent]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (results.length > 0) {
      router.push(results[0].slug);
      setQuery("");
      setResults([]);
      setIsSearchOpen(false);
      setIsOpen(false); // Close mobile menu if open
    }
  };

  const navLinks = [
    { name: "(voice) actor", href: "/actor" },
    { name: "endeavors", href: "/endeavors" },
    { name: "collab", href: "/collab" },
    { name: "blog", href: "/blog" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-in-out pointer-events-none
        ${scrolled ? "md:pt-4" : "md:pt-8"}`}
      >
        <div
          className={`
            relative flex items-center justify-between pointer-events-auto
            transition-all duration-300 ease-in-out
            w-full px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm
            md:bg-transparent md:border-transparent md:shadow-none
            ${
              scrolled
                ? "md:w-[90%] lg:w-[85%] md:px-8 md:py-3 md:rounded-full md:shadow-2xl md:shadow-teal-900/10 md:backdrop-blur-3xl md:border md:border-white/50 md:bg-gradient-to-br md:from-white/90 md:via-teal-50/80 md:to-teal-200/60"
                : "md:w-full md:max-w-[1400px] md:px-12 md:py-4"
            }
          `}
        >
          {/* --- LEFT: LOGO & TICKER --- */}
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="relative z-50 flex items-center group">
              <h1
                className="
                font-black tracking-tighter leading-none
                text-lg md:text-2xl lg:text-3xl
                text-transparent bg-clip-text
                bg-gradient-to-r from-blue-500 to-teal-400
                transition-transform duration-300 group-hover:scale-[1.02] font-medium
              "
              >
                <span className="md:hidden font-extrabold">D(nD)L</span>
                <span className="hidden md:inline pr-1">
                  Daniel (not Day) Lewis
                </span>
              </h1>
            </Link>

            {/* TICKER: VISIBLE ON BOTH MOBILE AND DESKTOP */}
            <GreetingTicker />
          </div>

          {/* --- RIGHT: NAV ITEMS --- */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* DESKTOP LINKS */}
            <nav className="hidden md:flex items-center gap-4 xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative group py-2"
                >
                  <span className="text-xs font-black uppercase tracking-widest text-slate-800 hover:text-teal-600 transition-colors">
                    {link.name}
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-teal-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            <div className="hidden md:block h-5 w-[1px] bg-slate-400/20"></div>

            {/* DESKTOP SEARCH BAR (Hidden on Mobile) */}
            <div ref={searchRef} className="relative z-50 hidden md:block">
              <form
                onSubmit={handleSearchSubmit}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300 ${
                  isSearchOpen
                    ? "bg-white ring-2 ring-teal-100 w-full shadow-lg"
                    : "bg-slate-100/50 hover:bg-white/80 border border-transparent hover:border-white/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="focus:outline-none text-slate-500 hover:text-teal-600 transition-colors"
                >
                  <AnimatedMagnifyingGlass />
                </button>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="SEARCH"
                  className={`bg-transparent text-xs font-bold uppercase tracking-wider outline-none placeholder:text-slate-400 transition-all duration-300 
                    ${
                      isSearchOpen
                        ? "w-32 md:w-40 opacity-100 text-slate-800 pl-1"
                        : "w-0 opacity-0"
                    }`}
                />

                {isSearchOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setIsSearchOpen(false);
                    }}
                    className="group ml-1 p-0.5 rounded-full hover:bg-slate-100 transition-all duration-200"
                  >
                    <X
                      size={14}
                      className="text-slate-400 group-hover:text-teal-600"
                    />
                  </button>
                )}
              </form>

              {query && isSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 rounded-xl border border-gray-100 bg-white/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
                  {results.length > 0 ? (
                    results.map((item) => (
                      <Link
                        key={item.slug}
                        href={item.slug}
                        onClick={() => {
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="p-4 border-b border-gray-50 hover:bg-teal-50 flex justify-between items-center group"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-700 group-hover:text-teal-700 line-clamp-1">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {item.tag}
                          </span>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-xs font-bold text-gray-400 text-center uppercase">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DESKTOP AUDIOBOOK BUTTON */}
            <AudiobookButton onClick={() => setIsOpen(false)} />

            {/* MOBILE HAMBURGER (Search Removed from Top Bar) */}
            <button
              className="md:hidden p-2 text-slate-800"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE FULLSCREEN MENU --- */}
      <div
        className={`fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl transition-all duration-300
        ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="w-full h-full overflow-y-auto flex flex-col items-center pt-24 pb-12 px-6 gap-8">
          {/* MOBILE EXIT BUTTON */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 group p-3 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-300 z-50"
          >
            <X
              size={24}
              className="text-slate-400 group-hover:text-teal-500 group-hover:rotate-90 transition-transform duration-300 ease-out"
            />
          </button>

          {/* MOBILE SEARCH BAR (NEW LOCATION) */}
          <div className="w-full max-w-xs relative">
            <div className="flex items-center gap-2 bg-slate-100/50 rounded-full px-4 py-3 border border-slate-200 focus-within:border-teal-400 focus-within:bg-white transition-all">
              <AnimatedMagnifyingGlass size={20} className="text-slate-400" />
              <input
                type="text"
                placeholder="SEARCH SITE..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent w-full text-sm font-bold uppercase tracking-wide outline-none text-slate-800 placeholder:text-slate-400"
              />
              {query && (
                <button onClick={() => setQuery("")}>
                  <X size={16} className="text-slate-400" />
                </button>
              )}
            </div>

            {/* Mobile Search Results */}
            {query && (
              <div className="mt-4 w-full rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden flex flex-col max-h-[40vh] overflow-y-auto">
                {results.length > 0 ? (
                  results.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.slug}
                      onClick={() => {
                        setQuery("");
                        setIsOpen(false);
                      }}
                      className="p-4 border-b border-gray-50 hover:bg-teal-50 flex justify-between items-center group text-left"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-700">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {item.tag}
                        </span>
                      </div>
                      <ArrowRight size={14} className="text-teal-400" />
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-xs font-bold text-gray-400 text-center uppercase">
                    No results found
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-16 h-[1px] bg-slate-200"></div>

          {/* LINKS */}
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-3xl font-black uppercase tracking-tighter text-slate-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-teal-400 hover:to-indigo-500 transition-all"
            >
              {link.name}
            </Link>
          ))}

          {/* MOBILE AUDIOBOOK BUTTON */}
          <AudiobookButton mobile={true} onClick={() => setIsOpen(false)} />
        </div>
      </div>
    </>
  );
}
