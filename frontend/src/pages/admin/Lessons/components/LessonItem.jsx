
/**
 * LessonItem Component
 * Single lesson item preview card showing index, title, description, episodes count, and status badge.
 */
function LessonItem({ lesson, index }) {
  const epCount = lesson.episodes?.length || 0;

  return (
    <div className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-4.5 transition hover:bg-white hover:shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xs font-black text-[#26332F]">
          {index + 1}
        </span>
        <div>
          <h4 className="text-sm font-bold text-[#26332F]">
            {lesson.title}
          </h4>
          <p className="text-xs text-[#6B7773] mt-0.5 line-clamp-1">
            {lesson.description || "ไม่มีคำอธิบายบทเรียน"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className="rounded-lg bg-white border border-[#E5E9E7] px-2.5 py-1 text-[11px] font-bold text-[#6B7773]">
          {epCount} Episodes
        </span>
        <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-800">
          Published
        </span>
      </div>
    </div>
  );
}
export default LessonItem;
