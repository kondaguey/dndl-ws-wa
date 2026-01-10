"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ArrowUp, ArrowDown, Trophy } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import BlogCard from "./BlogCard";

export default function PostsWidget({ currentSlug }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    const fetchPosts = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("published", true);

      if (data) setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  // --- SAFE DATE PARSER ---
  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // Filter & Sort
  const getSortedPosts = () => {
    let filtered = posts.filter((post) => post.slug !== currentSlug);

    switch (sortOption) {
      case "oldest":
        return filtered.sort((a, b) => parseDate(a.date) - parseDate(b.date));
      case "popular":
        return filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
      case "newest":
      default:
        return filtered.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    }
  };

  // --- UPDATE: Slice 0, 4 for Tuco ---
  const displayPosts = getSortedPosts().slice(0, 4);

  const isPostNew = (dateString) => {
    const d = parseDate(dateString);
    return d > Date.now() - 12096e5;
  };

  if (loading)
    return (
      <div className="w-full h-96 animate-pulse bg-slate-50 rounded-3xl" />
    );
  if (displayPosts.length === 0) return null;

  return (
    <div className="relative z-10 w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Read More
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              Recommended
            </h3>
            <div className="flex gap-2">
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
        </div>
        <Link
          href="/blog"
          className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-teal-600 transition-colors"
        >
          View Archive <ArrowRight size={14} />
        </Link>
      </div>

      {/* --- UPDATE: 4 Columns Layout --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayPosts.map((post, index) => (
          <BlogCard
            key={post.slug}
            post={post}
            delay={index * 0.1}
            isNew={isPostNew(post.date)}
            priority={index === 0} // <--- FIX IS HERE
          />
        ))}
      </div>
    </div>
  );
}
