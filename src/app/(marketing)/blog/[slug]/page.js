import { createClient } from "../../../../utils/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Tag,
  ChevronLeft,
  ArrowRight,
  Clock,
  AlignLeft,
} from "lucide-react";
import PopularPosts from "../../../../components/marketing/PopularPosts"; // Ensure this path matches where you put the file

// 1. STATIC PARAMS (Builds the routes without crashing on cookies)
export async function generateStaticParams() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: posts } = await supabase.from("posts").select("slug");
  return posts?.map(({ slug }) => ({ slug })) || [];
}

// ... existing imports ...

// --- NEW: DYNAMIC METADATA GENERATOR ---
export async function generateMetadata({ params }) {
  // 1. Get the slug
  const { slug } = await params;

  // 2. Fetch the post title (We use the basic client for speed here)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: post } = await supabase
    .from("posts")
    .select("title, tag")
    .eq("slug", slug)
    .single();

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  // 3. Return the metadata object
  return {
    title: post.title, // This replaces the %s in layout.js
    description: `Read about ${post.tag} and more on Dan Lewis's blog.`,
    openGraph: {
      title: post.title,
      description: `A new post by Dan Lewis about ${post.tag}.`,
      type: "article",
    },
  };
}

// 2. BLOG POST COMPONENT
export default async function BlogPost({ params }) {
  const { slug } = await params;

  // Connect to DB
  const supabase = await createClient();

  // Fetch Post
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!post) {
    notFound();
  }

  // Calculate Reading Stats
  const { wordCount, readTime } = calculateReadingStats(post.content);

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] selection:bg-teal-200 selection:text-teal-900">
      {/* HERO SECTION */}
      <div className="relative bg-slate-900 text-white pt-24 pb-20 px-4 md:px-6 rounded-b-[2.5rem] md:rounded-b-[3.5rem] shadow-2xl overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-teal-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-indigo-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in-up">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-[10px] md:text-xs font-black uppercase tracking-widest group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <ChevronLeft size={14} />
            </div>
            All posts
          </Link>

          {/* MAIN IMAGE WITH CAPTION */}
          <figure className="relative w-full mb-8 group">
            <div className="relative w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 md:border-4 border-white/10">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Conditional Caption */}
            {post.image_caption && (
              <figcaption className="mt-3 text-center text-[10px] md:text-xs font-medium text-slate-400 uppercase tracking-widest opacity-80">
                {post.image_caption}
              </figcaption>
            )}
          </figure>

          {/* META DATA ROW */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-4">
            {/* Date */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10">
              <Calendar size={12} className="text-teal-400" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-200">
                {post.date}
              </span>
            </div>

            {/* Tag */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10">
              <Tag size={12} className="text-indigo-400" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-200">
                {post.tag}
              </span>
            </div>

            {/* Read Time */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10">
              <Clock size={12} className="text-amber-400" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-200">
                {readTime} min read
              </span>
            </div>

            {/* Word Count */}
            <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10">
              <AlignLeft size={12} className="text-pink-400" />
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-200">
                {wordCount} words
              </span>
            </div>
          </div>

          {/* TITLE */}
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight text-white drop-shadow-lg px-2">
            {post.title}
          </h1>
        </div>
      </div>

      {/* CONTENT */}
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20 animate-fade-in">
        <div
          className="blog-content mx-auto max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* WIDGET */}
        <PopularPosts currentSlug={slug} />
      </article>

      {/* FOOTER CTA */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 pb-20">
        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-14 text-center shadow-xl border border-slate-100 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <h3 className="relative z-10 text-xl md:text-2xl font-black uppercase text-slate-900 mb-2">
            Enjoyed this read?
          </h3>
          <p className="relative z-10 text-slate-500 mb-8 font-medium text-sm md:text-base">
            Dive into the archive for more stories.
          </p>

          <Link
            href="/blog"
            className="relative z-10 inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-teal-600 hover:scale-105 transition-all shadow-lg"
          >
            Read Another <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- HELPER FUNCTION ---
function calculateReadingStats(htmlContent) {
  if (!htmlContent) return { wordCount: 0, readTime: 0 };
  const text = htmlContent.replace(/<[^>]*>/g, " ");
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const wordsPerMinute = 225;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return { wordCount, readTime };
}
