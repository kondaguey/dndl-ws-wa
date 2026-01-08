{
  /* META ROW - Locate approx line 74 inside the Content Area div */
}
<div className="flex flex-wrap items-center gap-1.5 mb-3">
  {/* Date */}
  <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-500 whitespace-nowrap">
    <Calendar size={9} className="text-indigo-500" />
    {post.date}
  </div>

  <div className="h-2 w-[1px] bg-slate-200"></div>

  {/* Word Count & Read Time */}
  <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-500 whitespace-nowrap">
    <Clock size={9} className="text-rose-500" />
    <span>
      {wordCount} words | ~{readTime} min
    </span>
  </div>
</div>;
