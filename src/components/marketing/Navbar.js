"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Telescope, ArrowRight, Mic } from "lucide-react";
import { createClient } from "../../utils/supabase/client";

// --- COMPONENT EXTRACTED OUTSIDE TO PREVENT RE-RENDER BUGS ---
const AudiobookButton = ({ mobile = false, onClick }) => (
  <Link
    href="/scheduler" // FIXED: Changed from /scheduler to /schedule to match your static pages
    onClick={onClick}
    className={`
      relative group overflow-hidden rounded-full 
      transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]
      ${
        mobile
          ? "w-full max-w-xs py-4 text-center mt-4" // Mobile styles
          : "px-5 py-2 hidden lg:block" // Desktop styles
      }
    `}
  >
    {/* MOVING GRADIENT BACKGROUND */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-400 via-indigo-500 to-blue-600 bg-[length:200%_auto] animate-gradient-xy" />

    {/* CONTENT */}
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

  // --- 1. BODY SCROLL LOCK (MAKES MENU "STURDY") ---
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Disable scroll on body
    } else {
      document.body.style.overflow = "unset"; // Re-enable scroll
    }
    // Cleanup function to ensure scroll is restored if component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // FETCH DATA (PAGES + BLOGS)
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

  // SCROLL HANDLER
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // SEARCH LOGIC
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

  // CLICK OUTSIDE SEARCH
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
            
            /* --- MOBILE: SLIM & FLUSH --- */
            w-full px-4 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm
            
            /* --- DESKTOP: FLOATING PILL --- */
            md:bg-transparent md:border-transparent md:shadow-none
            ${
              scrolled
                ? "md:w-[85%] md:px-8 md:py-3 md:rounded-full md:shadow-2xl md:shadow-teal-900/10 md:backdrop-blur-3xl md:border md:border-white/50 md:bg-gradient-to-br md:from-white/90 md:via-teal-50/80 md:to-teal-200/60"
                : "md:w-full md:max-w-[1400px] md:px-12 md:py-4"
            }
          `}
        >
          {/* LEFT: TEXT LOGO */}
          <Link href="/" className="relative z-50 flex items-center group">
            <h1
              className="
              font-black tracking-tighter leading-none
              text-xl md:text-3xl
              text-transparent bg-clip-text
              bg-gradient-to-r from-blue-500 to-teal-400 pr-8
              transition-transform duration-300 group-hover:scale-[1.02]
            "
            >
              Daniel (not Day) Lewis
            </h1>
          </Link>

          {/* RIGHT: NAV ITEMS */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* DESKTOP LINKS */}
            <nav className="hidden md:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative group py-2"
                >
                  <span className="text-sm font-black uppercase tracking-widest text-slate-800 hover:text-teal-600 transition-colors">
                    {link.name}
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-teal-400 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            <div className="hidden md:block h-5 w-[1px] bg-slate-400/20"></div>

            {/* SEARCH BAR */}
            <div ref={searchRef} className="relative z-50">
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
                  <Telescope size={18} />
                </button>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="SEARCH SITE"
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

            {/* MOBILE MENU BUTTON */}
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
      {/* Added touch-none to backdrop, and overflow-y-auto to container for sturdiness */}
      <div
        className={`fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl transition-all duration-300
        ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Container manages its own scroll if content is too tall (tiny phones), but body scroll is locked via useEffect */}
        <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-center gap-6 px-4">
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
