"use client";
import Link from "next/link";
import Image from "next/image";
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

  // FETCH DATA ON MOUNT
  useEffect(() => {
    const fetchSearchData = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("posts").select("title, slug, tag");
      if (data) {
        setAllPosts(data);
      }
    };
    fetchSearchData();
  }, []);

  // Handle Scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Search Logic
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

  // Handle Click Outside
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
      <style jsx global>{`
        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-15deg);
          }
          75% {
            transform: rotate(15deg);
          }
        }
        .monoscope-hover:hover .monoscope-icon {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none
        ${scrolled ? "pt-4" : "pt-6 md:pt-10"}`}
      >
        <div
          className={`
            relative flex items-center justify-between pointer-events-auto
            transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${
              scrolled
                ? "w-[95%] md:w-[75%] py-2 px-4 md:px-8 rounded-full shadow-2xl shadow-teal-900/10 backdrop-blur-3xl " +
                  "border border-white/50 ring-1 ring-white/60 " +
                  "bg-gradient-to-br from-white/90 via-teal-50/80 to-teal-200/60"
                : "w-full max-w-[1400px] py-4 px-6 md:px-12 bg-transparent border-transparent"
            }
          `}
        >
          {/* LEFT: LOGO */}
          <Link
            href="/"
            className="relative z-50 flex items-center justify-center shrink-0"
          >
            <div
              className={`relative flex items-center justify-center transition-all duration-500 ${
                scrolled ? "w-14 h-14" : "w-16 h-16 md:w-20 md:h-20"
              }`}
            >
              <Image
                src="/images/dndl-logo.webp"
                alt="Logo"
                fill
                className={`object-contain drop-shadow-md transition-all duration-500 ${
                  scrolled
                    ? "scale-[1.8]" // CHANGED: Was "scale-125" (Made it much bigger)
                    : "scale-[1.8] md:scale-[2.5] origin-top-left md:origin-center"
                }`}
                priority
              />
            </div>
          </Link>

          {/* RIGHT: NAV + SEARCH + MENU */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* DESKTOP NAV */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative group py-2"
                >
                  <span
                    className={`text-sm font-black uppercase tracking-widest transition-colors hover:text-[var(--color-primary)] ${
                      scrolled
                        ? "text-slate-900"
                        : "text-[var(--color-text-main)]"
                    }`}
                  >
                    {link.name}
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--color-primary)] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </nav>

            <div
              className={`hidden md:block h-6 w-[1px] ${
                scrolled ? "bg-teal-900/10" : "bg-black/10"
              }`}
            ></div>

            {/* --- FUNCTIONAL SEARCH BAR --- */}
            <div ref={searchRef} className="relative z-50">
              <form
                onSubmit={handleSearchSubmit}
                className={`monoscope-hover group flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-300 ${
                  scrolled
                    ? "bg-white/40 border border-teal-100/50 hover:bg-white/80"
                    : "bg-white/40 border border-white/20 backdrop-blur-sm hover:bg-white/80"
                } ${isSearchOpen ? "bg-white ring-2 ring-teal-200" : ""}`}
              >
                {/* TELESCOPE TOGGLE */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="focus:outline-none"
                >
                  <Telescope
                    size={18}
                    className={`monoscope-icon transition-colors ${
                      scrolled ? "text-teal-700" : "text-gray-600"
                    }`}
                  />
                </button>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (!isSearchOpen) setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search..."
                  className={`bg-transparent text-xs font-bold uppercase tracking-wider outline-none placeholder:text-gray-500/70 transition-all duration-300 
                    ${
                      isSearchOpen
                        ? "w-32 md:w-40 opacity-100 pl-1"
                        : "w-0 opacity-0 p-0"
                    }
                    ${scrolled ? "text-teal-900" : "text-gray-800"}
                  `}
                />
              </form>

              {/* --- SEARCH RESULTS DROPDOWN --- */}
              {query && isSearchOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 md:w-80 rounded-2xl overflow-hidden border border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl shadow-teal-900/10 flex flex-col animate-fade-in-up">
                  {results.length > 0 ? (
                    results.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/blog/${post.slug}`}
                        onClick={() => {
                          setQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="flex flex-col gap-1 p-4 border-b border-teal-50 last:border-0 hover:bg-teal-50/80 transition-colors group"
                      >
                        <span className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-teal-700">
                          {post.title}
                        </span>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600/70">
                            {post.tag || "Post"}
                          </span>
                          <ArrowRight
                            size={12}
                            className="text-teal-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all"
                          />
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-xs font-bold text-gray-400 text-center uppercase tracking-widest">
                      No results found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MOBILE MENU TOGGLE */}
            <button
              className={`md:hidden p-2 rounded-full transition-transform active:scale-90 ${
                scrolled
                  ? "text-slate-900"
                  : "bg-[var(--color-surface)] shadow-md text-[var(--color-text-main)]"
              }`}
              onClick={() => setIsOpen(true)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE FULLSCREEN MENU */}
      <div
        className={`fixed inset-0 z-[60] bg-[#fdfdfc]/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-10 transition-all duration-500
        ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-10 pointer-events-none"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-8 right-8 p-3 rounded-full bg-white shadow-lg text-slate-800 hover:rotate-90 transition-transform duration-300"
        >
          <X size={32} />
        </button>

        {navLinks.map((link, i) => (
          <Link
            key={link.name}
            href={link.href}
            onClick={() => setIsOpen(false)}
            className="group text-4xl md:text-6xl font-black uppercase tracking-tighter text-slate-800 transition-all hover:scale-105"
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <span className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--color-primary)] group-hover:to-[var(--color-primary-light)] transition-all">
              {link.name}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
