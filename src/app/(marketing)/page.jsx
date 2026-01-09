"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowUp, ArrowDown, Trophy } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import BlogCard from "@/src/components/marketing/BlogCard";

const WavyLink = ({ href, text }) => {
  return (
    <Link
      href={href}
      className="wavy-link inline-block whitespace-nowrap cursor-pointer relative z-10"
    >
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="wave-char"
          style={{
            animationDelay: `${index * 0.15}s`,
            marginRight: char === " " ? "0.3em" : "0",
          }}
        >
          {char}
        </span>
      ))}
    </Link>
  );
};

export default function Home() {
  const [allPosts, setAllPosts] = useState([]);
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true);
      if (data) setAllPosts(data);
    };
    fetchPosts();
  }, []);

  // --- SAFE DATE PARSER ---
  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // Sort
  const getSortedPosts = () => {
    const sorted = [...allPosts];
    if (sortOption === "newest")
      return sorted.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    if (sortOption === "oldest")
      return sorted.sort((a, b) => parseDate(a.date) - parseDate(b.date));
    if (sortOption === "popular")
      return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
    return sorted;
  };

  const displayPosts = getSortedPosts().slice(0, 4);
  const isPostNew = (dateString) => {
    const d = parseDate(dateString);
    return d > Date.now() - 12096e5;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 selection:bg-teal-200 selection:text-teal-900">
      {/* BACKGROUND */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <div className="absolute inset-0 bg-slate-50/80" />
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] md:w-[40rem] md:h-[40rem] bg-teal-300/30 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[128px] animate-blob opacity-70" />
        <div className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] md:w-[40rem] md:h-[40rem] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[128px] animate-blob animation-delay-2000 opacity-70" />
        <div className="absolute -bottom-32 left-[20%] w-[70vw] h-[70vw] md:w-[50rem] md:h-[50rem] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-[80px] md:blur-[128px] animate-blob animation-delay-4000 opacity-70" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center pt-20 md:pt-40">
        <div className="w-full max-w-[1400px] px-6 pb-20">
          {/* HERO */}
          <header className="relative flex flex-col justify-center items-center min-h-[70vh] pb-24 w-full max-w-4xl mx-auto space-y-8 animate-fade-in text-center">
            <h1 className="text-3xl md:text-5xl font-black leading-[0.95] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-200 via-teal-700 to-slate-700 pb-2 font-normal">
              Artist by nature, <br /> Entrepreneur by nurture...
            </h1>
            <p className="text-sm md:text-2xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
              becoming lucid in this{" "}
              <WavyLink href="/blog" text="liminal dreamworld" />.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-8">
              <Link
                href="/actor#audiobooks"
                className="relative group overflow-hidden rounded-full px-10 py-4 font-black uppercase tracking-wider text-white shadow-xl shadow-teal-500/20 transition-all duration-300 hover:shadow-teal-500/50 hover:-translate-y-1 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600 bg-[length:200%_auto] transition-all duration-500 group-hover:bg-right"></div>
                <span className="relative z-10">Audiobook Actor</span>
              </Link>
              <Link
                href="/endeavors"
                className="group relative overflow-hidden rounded-full border border-teal-500/30 bg-white/40 px-10 py-4 font-black uppercase tracking-wider text-teal-800 backdrop-blur-sm transition-all duration-300 hover:border-teal-500 hover:bg-teal-50/50 hover:shadow-lg hover:shadow-teal-900/10 hover:-translate-y-1"
              >
                <span className="relative z-10 transition-colors duration-300 group-hover:text-teal-600">
                  See Projects
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
              </Link>
            </div>
          </header>

          <section className="space-y-12 w-full pt-4">
            {/* HEADER: Centered on mobile, Flex Row on Desktop */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 border-b border-slate-200/60 pb-6">
              {/* TITLE & BUTTONS WRAPPER: Centered text on mobile, Left on desktop */}
              <div className="space-y-4 text-center md:text-left">
                <h2 className="text-teal-600 font-bold text-3xl md:text-5xl font-light uppercase tracking-tight text-slate-900">
                  Insights
                </h2>

                {/* SORT PILLS: Justify Center on mobile, Start on desktop */}
                <div className="flex gap-2 justify-center md:justify-start">
                  {[
                    { label: "Newest", value: "newest", icon: ArrowUp },
                    { label: "Oldest", value: "oldest", icon: ArrowDown },
                    { label: "Popular", value: "popular", icon: Trophy },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortOption(opt.value)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                        ${sortOption === opt.value ? "bg-slate-900 text-white shadow-md scale-105" : "bg-white border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"}
                      `}
                    >
                      <opt.icon size={10} /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Link
                href="/blog"
                className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-teal-600 transition-colors group"
              >
                See all blogs{" "}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayPosts.map((post, index) => (
                <BlogCard
                  key={post.slug}
                  post={post}
                  delay={index * 0.1}
                  isNew={isPostNew(post.date)}
                />
              ))}
            </div>

            <div className="md:hidden flex justify-center pt-8">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-slate-100 text-slate-700 font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
              >
                <span>Read All Blogs</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
