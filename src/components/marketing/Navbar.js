"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  Mic,
  Plane,
  BookOpen,
  Compass,
  Handshake,
  Feather,
  Lightbulb,
  Zap,
  Mountain,
  Target, // Added new icon options
} from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";

// --- GREETINGS ARRAY ---
const greetings = [
  "Welcome, traveler",
  "환영합니다, 여행자여",
  "Benvenuto, viaggiatore",
  "欢迎，旅行者",
  "Bienvenido, viajero",
];

// --- TICKER COMPONENT ---
function GreetingTicker({ scrolled }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % greetings.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 h-10 select-none">
      <div
        className="text-teal-600 block flex-shrink-0"
        style={{ animation: "plane-float 3s ease-in-out infinite" }}
      >
        <Plane size={16} className="fill-teal-600/20 stroke-[2px]" />
      </div>

      <div className="relative h-5 overflow-hidden text-left border-l-2 border-teal-600/30 pl-2 md:pl-3 w-40 xl:w-64 transition-all duration-300">
        <div
          className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateY(-${index * 20}px)` }}
        >
          {greetings.map((text, i) => (
            <div
              key={i}
              className="h-5 flex items-center font-mono font-bold uppercase tracking-widest text-slate-500 text-[10px] md:text-xs whitespace-nowrap overflow-hidden text-ellipsis"
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

// --- ANIMATED MAGNIFYING GLASS ---
const AnimatedMagnifyingGlass = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`hover:scale-110 transition-transform duration-300 ${className || ""}`}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// --- AUDIOBOOK BUTTON (MYSTERY VERSION - ALL DEVICES) ---
const AudiobookButton = ({ mobile = false, onClick }) => (
  <Link
    href="/scheduler"
    onClick={onClick}
    className={`
      relative group overflow-hidden rounded-full 
      transition-all duration-300 
      hover:scale-105 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]
      flex-shrink-0 flex items-center justify-center
      ${
        mobile
          ? "w-40 max-w-xs py-4 mt-6" // Mobile: Wide touch target
          : "hidden md:flex px-4 py-2 gap-1" // Desktop: Compact pill
      }
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-400 via-indigo-500 to-blue-600 bg-[length:200%_auto] animate-gradient-xy" />

    <div className="relative flex items-center justify-center gap-2 text-white z-10">
      {/* MIC ICON */}
      <Mic size={mobile ? 20 : 14} className="fill-white/20" />

      {/* PLUS SIGN */}
      <span
        className={`${mobile ? "text-sm" : "text-[10px]"} text-white/60 font-black`}
      >
        +
      </span>

      {/* BOOK ICON */}
      <BookOpen size={mobile ? 20 : 14} className="fill-white/20" />
    </div>
  </Link>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allContent, setAllContent] = useState([]);
  const searchRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
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
    if (results.length > 0) router.push(results[0].slug);
  };

  // --- UPDATED ICONS ---
  // You can swap 'Compass' with 'Lightbulb', 'Zap', 'Mountain', or 'Target'
  const navLinks = [
    { name: "(voice) actor", href: "/actor", icon: Mic },
    { name: "endeavors", href: "/endeavors", icon: Compass },
    { name: "collab", href: "/collab", icon: Handshake },
    { name: "blog", href: "/blog", icon: Feather },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-in-out pointer-events-none ${scrolled ? "md:pt-4" : "md:pt-8"}`}
      >
        <div
          className={`
            relative flex items-center justify-between pointer-events-auto
            transition-all duration-300 ease-in-out
            w-full px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm
            md:bg-transparent md:border-transparent md:shadow-none
            ${
              scrolled
                ? "md:px-8 md:py-3 md:rounded-full md:shadow-2xl md:shadow-teal-900/10 md:backdrop-blur-3xl md:border md:border-white/50 md:bg-gradient-to-br md:from-white/90 md:via-teal-50/80 md:to-teal-200/60"
                : "md:w-full md:max-w-[1600px] md:px-12 md:py-4"
            }
          `}
        >
          {/* --- LEFT: LOGO & TICKER --- */}
          <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0 h-10">
            <Link
              href={user ? "/admin" : "/"}
              className="relative z-50 flex items-center group cursor-pointer flex-shrink-0"
              target={user ? "_blank" : undefined}
            >
              <h1 className="font-black tracking-tighter leading-tight text-lg md:text-xl lg:text-2xl transition-transform duration-300 group-hover:scale-[1.02] text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-teal-400 to-indigo-500 bg-[length:200%_auto] animate-[gradient-x_10s_ease_infinite] drop-shadow-sm">
                <span className="xl:hidden font-extrabold">D(nD)L</span>
                <span className="hidden xl:inline-block pr-1 whitespace-normal leading-tight text-left">
                  Daniel (not Day) Lewis
                </span>
              </h1>
            </Link>

            <GreetingTicker scrolled={scrolled} />
          </div>

          {/* --- RIGHT: NAV ITEMS --- */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 pl-2 h-10">
            {/* DESKTOP LINKS */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative group py-2"
                >
                  <span className="text-xs font-black uppercase tracking-widest text-slate-800 hover:text-teal-600 transition-colors whitespace-nowrap">
                    {link.name}
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-teal-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            <div className="hidden md:block h-5 w-[1px] bg-slate-400/20"></div>

            {/* SEARCH */}
            <div ref={searchRef} className="relative z-50 hidden md:block">
              <form
                onSubmit={handleSearchSubmit}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300 ${isSearchOpen ? "bg-white ring-2 ring-teal-100 shadow-lg" : "bg-slate-100/50 hover:bg-white/80 border border-transparent hover:border-white/50"}`}
              >
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="focus:outline-none text-slate-500 hover:text-teal-600 transition-colors flex-shrink-0"
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
                  className={`bg-transparent text-xs font-bold uppercase tracking-wider outline-none placeholder:text-slate-400 transition-all duration-300 ${isSearchOpen ? "w-28 lg:w-40 opacity-100 text-slate-800 pl-1" : "w-0 opacity-0"}`}
                />
                {isSearchOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setIsSearchOpen(false);
                    }}
                    className="group ml-1 p-0.5 rounded-full hover:bg-slate-100 transition-all duration-200 flex-shrink-0"
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

            {/* MYSTERY BUTTON (Md/Lg) */}
            <AudiobookButton onClick={() => setIsOpen(false)} />

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-800 flex items-center justify-center"
              aria-label="Open menu"
              onClick={() => setIsOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
      >
        <div className="w-full h-full overflow-y-auto flex flex-col items-center pt-24 pb-12 px-6 gap-6">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 group p-3 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all duration-300 z-50"
          >
            <X
              size={24}
              className="text-slate-400 group-hover:text-teal-500 group-hover:rotate-90 transition-transform duration-300 ease-out"
            />
          </button>

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const IconComponent = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  relative text-3xl font-black uppercase tracking-tighter transition-all duration-300 flex items-center
                  ${
                    isActive
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-500 scale-110 ml-4"
                      : "text-slate-900 hover:text-slate-500"
                  }
                `}
              >
                {isActive && (
                  <IconComponent
                    size={24}
                    className="absolute -left-10 text-teal-500 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] animate-pulse"
                    strokeWidth={2.5}
                  />
                )}
                {link.name}
              </Link>
            );
          })}

          {/* MYSTERY BUTTON (Mobile) */}
          <AudiobookButton mobile={true} onClick={() => setIsOpen(false)} />
        </div>
      </div>
    </>
  );
}
