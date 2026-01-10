"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Trophy } from "lucide-react";
import BlogCard from "./BlogCard";

export default function BlogGrid({ initialPosts }) {
  const [sortOption, setSortOption] = useState("newest");

  // --- SAFE DATE PARSER ---
  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    // If invalid date, return 0 (Epoch) so it drops to bottom/top safely
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  // --- SORTING ENGINE ---
  const sortedPosts = [...initialPosts].sort((a, b) => {
    // 1. Newest First (Desc Date)
    if (sortOption === "newest") {
      return parseDate(b.date) - parseDate(a.date);
    }
    // 2. Oldest First (Asc Date)
    if (sortOption === "oldest") {
      return parseDate(a.date) - parseDate(b.date);
    }
    // 3. Most Popular (Desc Views)
    if (sortOption === "popular") {
      const viewsA = a.views ?? 0;
      const viewsB = b.views ?? 0;
      return viewsB - viewsA;
    }
    return 0;
  });

  const isPostNew = (dateString) => {
    const d = parseDate(dateString);
    // 12096e5 = 14 days in milliseconds
    return d > Date.now() - 12096e5;
  };

  return (
    <div>
      {/* SORT CONTROLS */}
      <div className="flex justify-center mb-12 animate-fade-in">
        <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm">
          {[
            { label: "Newest", value: "newest", icon: ArrowUp },
            { label: "Oldest", value: "oldest", icon: ArrowDown },
            { label: "Most Viewed", value: "popular", icon: Trophy },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortOption(opt.value)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                ${
                  sortOption === opt.value
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              <opt.icon size={12} /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 md:px-0">
        {sortedPosts.map((post, index) => (
          <BlogCard
            key={post.slug}
            post={post}
            delay={index * 0.05}
            isNew={isPostNew(post.date)}
            priority={index === 0} // <--- FIX 1: Prioritize the first image
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 25vw" // <--- FIX 2: Optimized sizing
          />
        ))}
        {!sortedPosts.length && (
          <p className="col-span-full text-center text-slate-400">
            No posts found.
          </p>
        )}
      </div>
    </div>
  );
}
