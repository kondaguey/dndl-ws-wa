"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Tag, Calendar, Feather, ArrowRight, Clock } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";

export default function BlogIndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      // We fetch '*' so we have the content to calculate read time
      const { data, error } = await supabase
        .from("posts")
        .select("*")
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

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-20 max-w-2xl mx-auto animate-fade-in relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
            <Feather size={12} className="text-teal-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              100% Human-written words
            </span>
          </div>

          <h1 className="text-7xl md:text-8xl font-black pb-6 tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-slate-200 via-teal-600 to-slate-800 drop-shadow-md">
            Blog
          </h1>

          <p className="text-slate-500 text-2xl font-medium max-w-xl mx-auto leading-relaxed">
            Lessons from exploring the alternatives space.
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 md:px-0">
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

// --- THE "NOT BORING" CARD ---
function BlogCard({ post, delay }) {
  // 1. Calculate Read Time on the fly
  const { readTime } = calculateReadingStats(post.content);

  return (
    <div
      className="group relative h-full animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* OUTER CONTAINER */}
        <div className="relative h-full w-full rounded-[2rem] overflow-hidden p-[2px] shadow-lg shadow-slate-200/50 bg-white transition-all duration-300 hover:shadow-2xl hover:shadow-teal-900/10 hover:-translate-y-2">
          {/* THE SNAKE */}
          <div
            className="absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 340deg, #0d9488 360deg)`,
            }}
          />

          {/* INNER CARD */}
          <div className="relative h-full flex flex-col bg-white rounded-[1.9rem] overflow-hidden">
            {/* Image Area */}
            <div className="relative h-60 w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              />

              {/* TAG */}
              <div className="absolute top-4 left-4">
                <span className="bg-teal-50 text-teal-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm border border-teal-100 flex items-center gap-1">
                  <Tag size={10} className="fill-teal-700/20" />
                  {post.tag}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-7 flex flex-col flex-grow bg-white border-t border-slate-100">
              {/* META ROW */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                  <Calendar size={12} className="text-indigo-400" />
                  {post.date}
                </div>
                <div className="h-3 w-[1px] bg-slate-200"></div>

                {/* DYNAMIC READ TIME */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-400">
                  <Clock size={12} className="text-pink-400" />
                  {readTime} min read
                </div>
              </div>

              {/* TITLE */}
              <h3 className="text-2xl font-black leading-[1.1] text-slate-800 group-hover:text-teal-600 transition-colors duration-300 mb-2">
                {post.title}
              </h3>

              {/* DIVIDER */}
              <div className="mt-auto pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest group-hover:text-teal-600 transition-colors">
                    Read Story
                  </span>

                  {/* ARROW BUTTON */}
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight
                      size={14}
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

// --- HELPER FUNCTION (Same as your Post page) ---
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
