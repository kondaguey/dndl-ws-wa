"use client";
import Link from "next/link";
import Image from "next/image";
import { Tag, Calendar, Feather, ArrowRight } from "lucide-react";

// --- THE DATA SOURCE ---
export const BLOG_POSTS = [
  {
    image: "/images/blog-darts.webp",
    title: "Darts improve focus",
    slug: "darts-improve-focus",
    tag: "Acting",
    date: "Dec. 2nd, 2024",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#FDFBF7] via-[#E8F3F1] to-[#E0E7FF] pt-24 pb-24 px-4 selection:bg-teal-200 selection:text-teal-900 overflow-hidden">
      {/* --- BACKGROUND BLOBS (Atmosphere) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-300/30 blur-[120px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[10%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-300/30 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-purple-300/30 blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-20 max-w-2xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-xl border border-white/60 shadow-sm mb-6 hover:scale-105 transition-transform cursor-default">
            <Feather size={12} className="text-teal-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              100% Human-written words
            </span>
          </div>

          <h1 className="text-7xl text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500 animate-gradient-x pb-4 drop-shadow-sm">
            Thoughts
          </h1>

          <p className="text-slate-600 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Lessons from exploring the alternatives space.
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2 md:px-0">
          {BLOG_POSTS.map((post, index) => (
            <BlogCard key={post.slug} post={post} delay={index * 0.1} />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }

        /* Background Blob Animations */
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
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* THE SNAKE ROTATION ANIMATION */
        @keyframes border-spin {
          100% {
            transform: rotate(-360deg);
          }
        }
        .animate-border-spin {
          animation: border-spin 4s linear infinite;
        }
      `}</style>
    </div>
  );
}

// --- Component ---
function BlogCard({ post, delay }) {
  return (
    // 1. OUTER WRAPPER: Handles the fade-in and hover group state
    <div
      className="group relative h-full flex flex-col animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <Link href={`/blog/${post.slug}`} className="relative h-full block">
        {/* 2. THE SNAKE CONTAINER 
            p-[2px] creates the gap for the snake to be seen. 
            overflow-hidden keeps the snake inside the rounded corners.
        */}
        <div className="relative h-full w-full rounded-[2rem] overflow-hidden p-[2px] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-500/20">
          {/* 3. THE SNAKE ITSELF (Spinning Gradient Background)
                - This layer is huge (inset-[-100%]) and spins behind the content.
                - The 'conic-gradient' has a sharp transparent section and a colored section.
                - We hide it (opacity-0) until hover.
             */}
          <div
            className="absolute inset-[-100%] animate-border-spin opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `conic-gradient(from 0deg, transparent 0 340deg, #14b8a6 360deg)`,
            }}
          />

          {/* 4. THE CARD CONTENT (Inner White Box)
                - This sits ON TOP of the spinning snake.
                - background-clip ensures it covers the center.
            */}
          <div className="relative h-full flex flex-col bg-white/80 backdrop-blur-xl rounded-[1.9rem] overflow-hidden">
            {/* Image Area */}
            <div className="relative h-64 w-full overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Tag Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 border border-white/20">
                  <Tag size={10} className="text-teal-500" />
                  {post.tag}
                </span>
              </div>
            </div>

            {/* Text Area */}
            <div className="p-8 flex flex-col flex-grow">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">
                <Calendar size={12} />
                {post.date}
              </div>

              <h3 className="text-2xl font-black leading-tight mb-4 text-slate-900 group-hover:text-teal-600 transition-colors">
                {post.title}
              </h3>

              <div className="mt-auto pt-6 flex items-center text-teal-600 text-xs font-black uppercase tracking-widest opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Read Article <ArrowRight size={14} className="ml-2" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
