"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, ArrowRight, Tag, Clock, Eye } from "lucide-react";

export default function BlogCard({ post, delay = 0 }) {
  const readTime = post.content
    ? Math.ceil(post.content.split(/\s+/).length / 225)
    : 1;

  const viewCount = post.views ? post.views.toLocaleString() : "0";

  return (
    <div
      className="group relative h-full animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* OUTER CONTAINER */}
        <div className="relative h-full w-full rounded-[1.5rem] overflow-hidden p-[2px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] bg-white transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(13,148,136,0.25)] hover:-translate-y-2">
          {/* SNAKE BORDER (Hidden on Mobile) */}
          <div
            className="hidden md:block absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 340deg, #0d9488 360deg)`,
            }}
          />

          {/* INNER CARD */}
          <div className="relative h-full flex flex-col bg-white rounded-[1.4rem] overflow-hidden">
            {/* IMAGE AREA */}
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                decoding="async"
                quality={75}
                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105"
              />

              {/* TAG BADGE */}
              <div className="absolute top-3 left-3">
                <span className="bg-white/95 backdrop-blur-sm text-teal-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 border border-teal-100">
                  <Tag size={9} className="text-teal-600" />
                  {post.tag}
                </span>
              </div>
            </div>

            {/* CONTENT AREA */}
            <div className="p-5 flex flex-col flex-grow bg-white border-t border-slate-100">
              {/* META ROW - Fixed Contrast: Changed slate-400 to slate-500/600 */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                  <Calendar size={10} className="text-indigo-500" />
                  {post.date}
                </div>

                <div className="h-2 w-[1px] bg-slate-200"></div>

                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                  <Clock size={10} className="text-pink-500" />
                  {readTime} min
                </div>

                <div className="h-2 w-[1px] bg-slate-200"></div>

                <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-md">
                  <Eye size={10} className="text-teal-600" />
                  {viewCount}
                </div>
              </div>

              {/* TITLE */}
              <h3 className="text-lg font-black leading-snug text-slate-800 group-hover:text-teal-600 transition-colors duration-300 mb-2 line-clamp-2">
                {post.title}
              </h3>

              {/* FOOTER - Fixed Contrast: Changed slate-300 to slate-400 */}
              <div className="mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-teal-600 transition-colors">
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
