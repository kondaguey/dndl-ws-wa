"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Tag, Calendar, Feather, ArrowRight, Clock, Eye } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";

export default function BlogIndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        // FIX 1: Sort by Views first (descending), then by Date
        .order("views", { ascending: false })
        .order("created_at", { ascending: false });

      if (data) setPosts(data);
    };
    fetchPosts();
  }, []);

  return (
    <div className="pt-24 md:pt-40 relative min-h-screen w-full bg-slate-50 pb-24 px-4 overflow-hidden">
      {/* ATMOSPHERE */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-100/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto">
        {/* Header */}
        <header className="text-center mb-16 max-w-2xl mx-auto animate-fade-in relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
            <Feather size={12} className="text-teal-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              100% Human-written words
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black pb-6 tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-slate-200 via-teal-600 to-slate-800 drop-shadow-md">
            Blog
          </h1>

          <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Lessons from exploring the alternatives space.
          </p>
        </header>

        {/* Grid - FIX 2: lg:grid-cols-4 for 4 in a row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 md:px-0">
          {posts.map((post, index) => (
            <BlogCard key={post.slug} post={post} delay={index * 0.1} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes border-spin {
          100% {
            transform: rotate(-360deg);
          }
        }
        .animate-border-spin {
          animation: border-spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

// --- THE COMPACT CARD ---
function BlogCard({ post, delay }) {
  const { readTime } = calculateReadingStats(post.content);

  return (
    <div
      className="group relative h-full animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* OUTER CONTAINER - FIX 3 & 4: Smaller radius, distinctive shadow */}
        <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden p-[2px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] bg-white transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.25)] hover:-translate-y-2">
          {/* THE SNAKE */}
          <div
            className="absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 340deg, #0d9488 360deg)`,
            }}
          />

          {/* INNER CARD */}
          <div className="relative h-full flex flex-col bg-white rounded-[1.4rem] overflow-hidden">
            {/* Image Area - FIX 3: Reduced Height (h-48) */}
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              />

              {/* TAG */}
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur-sm text-teal-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Tag size={9} className="fill-teal-700/20" />
                  {post.tag}
                </span>
              </div>
            </div>

            {/* Content Area - FIX 3: Reduced padding (p-5) */}
            <div className="p-5 flex flex-col flex-grow bg-white border-t border-slate-100">
              {/* META ROW */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-400">
                  <Calendar size={10} className="text-indigo-400" />
                  {post.date}
                </div>
                <div className="h-2 w-[1px] bg-slate-200"></div>
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-400">
                  <Clock size={10} className="text-pink-400" />
                  {readTime} min
                </div>
                <div className="h-2 w-[1px] bg-slate-200"></div>
                {/* View Counter */}
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                  <Eye size={10} className="text-teal-500" />
                  {post.views || 0}
                </div>
              </div>

              {/* TITLE - FIX 3: Smaller font (text-lg) */}
              <h3 className="text-lg font-black leading-snug text-slate-800 group-hover:text-teal-600 transition-colors duration-300 mb-2 line-clamp-3">
                {post.title}
              </h3>

              {/* DIVIDER */}
              <div className="mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-teal-600 transition-colors">
                    Read Post
                  </span>

                  {/* ARROW BUTTON */}
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight
                      size={12}
                      className="-ml-0.5 group-hover:ml-0 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function calculateReadingStats(htmlContent) {
  if (!htmlContent) return { wordCount: 0, readTime: 0 };
  const textWithoutScripts = htmlContent.replace(
    /<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );
  const text = textWithoutScripts.replace(/<[^>]*>/g, " ");
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const wordsPerMinute = 225;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return { wordCount, readTime: readTime < 1 ? 1 : readTime };
}
