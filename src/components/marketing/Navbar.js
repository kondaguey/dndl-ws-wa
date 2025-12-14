"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Telescope, ArrowRight } from "lucide-react";
import { createClient } from "../../utils/supabase/client";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // --- SEARCH STATE ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allPosts, setAllPosts] = useState([]);
  const searchRef = useRef(null);
  const router = useRouter();

  // FETCH DATA
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("posts")
          .select("title, slug, tag");
        if (data) setAllPosts(data);
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
    if (query.length > 0 && allPosts.length > 0) {
      const filtered = allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.tag?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered.slice(0, 5));
    } else {
      setResults([]);
    }
  }, [query, allPosts]);

  // CLICK OUTSIDE
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
      router.push(`/blog/${results[0].slug}`);
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
                ? /* 👇 HERE IS THE MAGIC GRADIENT TINT RESTORED 👇 */
                  "md:w-[85%] md:px-8 md:py-3 md:rounded-full md:shadow-2xl md:shadow-teal-900/10 md:backdrop-blur-3xl md:border md:border-white/50 md:bg-gradient-to-br md:from-white/90 md:via-teal-50/80 md:to-teal-200/60"
                : "md:w-full md:max-w-[1400px] md:px-12 md:py-4"
            }
          `}
        >
          {/* LEFT: TEXT LOGO (LARGE & GRADIENT) */}
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
          <div className="flex items-center gap-3 md:gap-6">
            {/* DESKTOP LINKS */}
            <nav className="hidden md:flex items-center gap-8">
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

            {/* DIVIDER */}
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
                  placeholder="SEARCH"
                  className={`bg-transparent text-xs font-bold uppercase tracking-wider outline-none placeholder:text-slate-400 transition-all duration-300 
                    ${
                      isSearchOpen
                        ? "w-32 md:w-40 opacity-100 text-slate-800 pl-1"
                        : "w-0 opacity-0"
                    }`}
                />
              </form>

              {/* SEARCH DROPDOWN */}
              {query && isSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 rounded-xl border border-gray-100 bg-white/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
                  {results.length > 0 ? (
                    results.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        onClick={() => {
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="p-4 border-b border-gray-50 hover:bg-teal-50 flex justify-between items-center group"
                      >
                        <span className="font-bold text-sm text-slate-700 group-hover:text-teal-700 line-clamp-1">
                          {post.title}
                        </span>
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

      {/* MOBILE FULLSCREEN MENU */}
      <div
        className={`fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 transition-all duration-300
        ${
          isOpen
            ? "opacity-100 visible"
            : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-800"
        >
          <X size={32} />
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
      </div>
    </>
  );
}
