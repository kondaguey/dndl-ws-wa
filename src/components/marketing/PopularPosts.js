import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../utils/supabase/server"; // Relative path to your server util

export default async function PopularPosts({ currentSlug }) {
  const supabase = await createClient();

  // Fetch 4 posts to ensure we have enough after filtering out the current one
  const { data: posts } = await supabase.from("posts").select("*").limit(4);

  // Filter out the post the user is currently reading
  const relatedPosts = posts
    ? posts.filter((post) => post.slug !== currentSlug).slice(0, 3)
    : [];

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-24 pt-12 border-t border-slate-200">
      <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">
        Read Next
      </h3>

      {/* Mobile: Horizontal Swipe | Desktop: Grid */}
      <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 pb-4 md:pb-0 snap-x">
        {relatedPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group min-w-[280px] md:min-w-0 snap-center block"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-2xl mb-4 border border-slate-100">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">
              {post.tag}
            </div>
            <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors leading-tight">
              {post.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
