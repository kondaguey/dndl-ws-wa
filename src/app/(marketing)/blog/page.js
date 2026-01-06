import Link from "next/link";
import { Feather } from "lucide-react";
import { createClient } from "@/src/utils/supabase/server";
import BlogCard from "@/src/components/marketing/BlogCard";

export const metadata = {
  title: "Blog | Daniel Lewis",
  description:
    "Lessons from exploring the alternatives space. 100% human-written thoughts on travel, acting, and tech.",
  openGraph: {
    title: "Blog | Daniel Lewis",
    description: "Lessons from exploring the alternatives space.",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("views", { ascending: false });

  return (
    <div className="pt-24 md:pt-40 relative min-h-screen w-full bg-slate-50 pb-24 px-4 overflow-hidden">
      {/* ATMOSPHERE - 🚨 FIX: Reduced blur radius for Mobile Performance */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-100/40 blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[80px] md:blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto">
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
          {posts?.map((post, index) => (
            <BlogCard
              key={post.slug}
              post={post}
              delay={index * 0.1}
              // 🚨 THE FIX: Force the first 6 images to load IMMEDIATELY (Server Side)
              // This prevents the white flash/pop-in on mobile load.
              priority={index < 6}
            />
          ))}
          {!posts?.length && (
            <p className="col-span-full text-center text-slate-400">
              No posts found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
