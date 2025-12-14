"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Calendar, ArrowRight, Plane } from "lucide-react";
import { createClient } from "../../utils/supabase/client";

export default function Home() {
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) {
        setLatestPosts(data);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden flex flex-col items-center bg-slate-50">
      <div className="w-full max-w-[1400px] px-6 pb-20">
        {/* --- 1. HERO SECTION --- */}
        <header className="relative flex flex-col justify-center items-center min-h-[75vh] md:min-h-[80vh] pb-24 w-full max-w-4xl mx-auto space-y-8 animate-fade-in text-center">
          {/* Glow Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-[var(--color-primary)]/10 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none"></div>

          {/* --- 2D FLYING TICKER --- */}
          <GreetingTicker />

          {/* H1: Teal Shiny Gradient */}
          <h1 className="text-4xl md:text-7xl font-black leading-[0.95] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-primary-dark)] via-[var(--color-primary-light)] to-[var(--color-primary)] pb-2">
            Artist by nature. <br />
            Entrepreneur by nurture.
          </h1>

          <p className="text-lg md:text-2xl text-[var(--color-text-muted)] max-w-2xl mx-auto font-light leading-relaxed">
            Just an indecisively decisive guy trying to become lucid in this
            weird{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              liminal dreamworld
            </span>
            .
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-8">
            {/* BUTTON 1: THE TEAL GEM */}
            <Link
              href="/actor#audiobooks"
              className="relative group overflow-hidden rounded-full px-10 py-4 font-black uppercase tracking-wider text-white shadow-xl shadow-teal-500/20 transition-all duration-300 hover:shadow-teal-500/50 hover:-translate-y-1 hover:scale-105"
            >
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-teal-400 to-teal-600 bg-[length:200%_auto] transition-all duration-500 group-hover:bg-right"></div>
              <span className="relative z-10">Audiobook Actor</span>
            </Link>

            {/* BUTTON 2: THE FROSTED CRYSTAL */}
            <Link
              href="/endeavors"
              className="group relative overflow-hidden rounded-full border border-teal-500/30 bg-white/40 px-10 py-4 font-black uppercase tracking-wider text-teal-800 backdrop-blur-sm transition-all duration-300 hover:border-teal-500 hover:bg-teal-50/50 hover:shadow-lg hover:shadow-teal-900/10 hover:-translate-y-1"
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-teal-600">
                See Projects
              </span>
              {/* Subtle sweep effect on hover */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
            </Link>
          </div>
        </header>

        {/* --- 2. LATEST BLOGS --- */}
        <section className="space-y-12 w-full pt-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[var(--color-text-muted)]/20 pb-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
                Latest{" "}
                <span className="text-[var(--color-primary)]">Insights</span>
              </h2>
              <p className="text-[var(--color-text-muted)] mt-2 text-xs md:text-lg">
                Thoughts on life, haughty esoteric topics, travel & languages,
                and being an entrepreneurial creative.
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors group"
            >
              See all blogz{" "}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestPosts.map((post, index) => (
              <BlogCard
                key={post.slug}
                title={post.title}
                image={post.image}
                tag={post.tag}
                date={post.date}
                href={`/blog/${post.slug}`}
                delay={index * 0.1}
              />
            ))}
          </div>

          <div className="md:hidden flex justify-center pt-8">
            <Link href="/blog" className="btn-primary w-full">
              <span>Read All Blogs</span>
            </Link>
          </div>
        </section>
      </div>

      {/* GLOBAL STYLES FOR ANIMATIONS */}
      <style jsx global>{`
        /* 1. Ticker Animation */
        @keyframes plane-float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(-5deg);
          }
        }

        /* 2. Snake Border Spin Animation */
        @keyframes border-spin {
          100% {
            transform: rotate(-360deg);
          }
        }
        /* UPDATED SPEED: 1.5s for faster spin */
        .animate-border-spin {
          animation: border-spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}

// --- TICKER COMPONENT ---
function GreetingTicker() {
  const greetings = [
    "Welcome, traveler",
    "환영합니다, 여행자여",
    "Benvenuto, viaggiatore",
    "欢迎，旅行者",
    "Bienvenido, viajero",
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % greetings.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [greetings.length]);

  return (
    <div className="flex items-center justify-center gap-4 opacity-90 mb-4 h-12">
      <div
        className="text-[var(--color-primary)]"
        style={{ animation: "plane-float 3s ease-in-out infinite" }}
      >
        <Plane
          size={24}
          className="fill-[var(--color-primary)]/20 stroke-[2px]"
        />
      </div>

      <div className="relative h-5 overflow-hidden w-64 md:w-auto text-left border-l-2 border-[var(--color-primary)]/30 pl-3">
        <div
          className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateY(-${index * 20}px)` }}
        >
          {greetings.map((text, i) => (
            <div
              key={i}
              className="h-5 flex items-center text-sm font-mono font-bold uppercase tracking-widest text-[var(--color-text-muted)]"
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- PIZAZZ BLOG CARD COMPONENT ---
function BlogCard({ title, image, tag, date, href, delay }) {
  return (
    <div
      className="group relative h-full flex flex-col animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={href} className="relative h-full block">
        {/* 1. SNAKE CONTAINER 
            ADDED: 'shadow-xl shadow-indigo-900/5' gives it depth when NOT hovered.
            ON HOVER: It switches to a stronger teal glow.
        */}
        <div className="relative h-full w-full rounded-[2rem] overflow-hidden p-[2px] transition-all duration-500 shadow-xl shadow-indigo-900/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-500/20">
          {/* 2. THE SNAKE: Brighter Teal & Faster Spin */}
          <div
            className="absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 300deg, #2dd4bf 360deg)`,
            }}
          />

          {/* 3. INNER CARD: Solid Gradient Background */}
          <div className="relative h-full flex flex-col bg-gradient-to-br from-white via-slate-50 to-teal-50 rounded-[1.9rem] overflow-hidden border border-white/60">
            {/* Image Section */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-110"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-teal-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg border border-white/50">
                  {tag}
                </span>
              </div>
            </div>

            {/* Text Section */}
            <div className="relative p-6 flex flex-col flex-grow justify-between gap-4">
              <h3 className="text-xl md:text-2xl font-bold leading-tight text-slate-900 transition-colors duration-300 group-hover:text-teal-800 line-clamp-2">
                {title}
              </h3>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 group-hover:border-teal-100/50 transition-colors">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 group-hover:text-teal-700/80 transition-colors">
                  <Calendar size={14} />
                  {date}
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-50/80 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                  <ArrowRight
                    size={14}
                    className="text-slate-400 group-hover:text-teal-600 -translate-x-0.5 group-hover:translate-x-0 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
