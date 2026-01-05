"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Tag, Calendar, Feather, ArrowRight, Clock, Eye } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import BlogCard from "@/src/components/marketing/BlogCard";

export default function BlogIndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true)
        .order("views", { ascending: false }); // Sorts by popularity
      //.order("created_at", { ascending: false }) // Secondary sort if views are equal

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

        {/* Grid */}
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
