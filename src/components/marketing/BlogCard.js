"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Tag, Clock, Eye } from "lucide-react";

export default function BlogCard({ post, delay = 0 }) {
  // 1. Calculate Read Time
  const readTime = post.content
    ? Math.ceil(post.content.split(/\s+/).length / 225)
    : 1;

  // 2. Format Views with Commas (e.g. "1,200")
  // We use "0" if post.views is null/undefined
  const viewCount = post.views ? post.views.toLocaleString() : "0";

  return (
    <div
      className="group relative h-full animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* OUTER CONTAINER: bg-white blocks the background blobs */}
        <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden p-[2px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] bg-white transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.25)] hover:-translate-y-2">
          {/* THE SNAKE BORDER */}
          <div
            className="absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 340deg, #0d9488 360deg)`,
            }}
          />

          {/* INNER CARD */}
          <div className="relative h-full flex flex-col bg-white rounded-[1.4rem] overflow-hidden">
            {/* Image Area */}
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="bg-white/90 backdrop-blur-sm text-teal-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Tag size={9} className="fill-teal-700/20" />
                  {post.tag}
                </span>
              </div>
            </div>

            {/* Content Area */}
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

                {/* VIEW COUNTER */}
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                  <Eye size={10} className="text-teal-500" />
                  {viewCount}
                </div>
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-black leading-snug text-slate-800 group-hover:text-teal-600 transition-colors duration-300 mb-2 line-clamp-2">
                {post.title}
              </h3>

              {/* FOOTER */}
              <div className="mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-teal-600 transition-colors">
                    Read Post
                  </span>
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

      {/* Styles for this specific card's animation */}
      <style jsx>{`
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
