import { Link } from "react-router-dom";

/**
 * LessonBreadcrumbHeader Component
 * Breadcrumb navigation trail, episode/lesson badges, title, and action buttons for instructor/admin.
 */
function LessonBreadcrumbHeader({
  classroomId,
  classroom,
  lesson,
  episodeData,
  isOwnerOrAdmin,
  onOpenAddContentModal,
  onOpenEditLessonModal,
  onDeleteLesson,
  previewQuery = "",
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Link to="/classrooms" className="hover:text-gray-600">
          คอร์สเรียนทั้งหมด
        </Link>
        <span>/</span>
        <Link
          to={`/classrooms/${classroomId}${previewQuery}`}
          className="hover:text-gray-600 truncate max-w-xs"
        >
          {classroom?.title || "ห้องเรียน"}
        </Link>
        <span>/</span>
        <span className="text-[#004643]">
          {episodeData
            ? `${episodeData.chapter.title} / ${episodeData.episode.code}`
            : `บทเรียนที่ ${lesson?.sequence_no}`}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[#ABD1C6]/30 px-2.5 py-1 font-mono text-xs font-bold text-[#004643]">
              {episodeData ? episodeData.episode.code : `ลำดับที่ #${lesson?.sequence_no}`}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                lesson?.status === "published"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {lesson?.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
            {lesson?.title}
          </h1>
        </div>

        {/* ปุ่มควบคุมเฉพาะ Instructor หรือ Admin */}
        {isOwnerOrAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddContentModal}
              type="button"
              className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9] shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>+ เพิ่มเนื้อหา (Add Content)</span>
            </button>
            <button
              onClick={onOpenEditLessonModal}
              type="button"
              className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              แก้ไขบทเรียน
            </button>
            <button
              onClick={onDeleteLesson}
              type="button"
              className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
            >
              ลบบทเรียน
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonBreadcrumbHeader;
