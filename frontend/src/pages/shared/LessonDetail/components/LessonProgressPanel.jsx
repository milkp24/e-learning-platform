import { Link } from "react-router-dom";
import { LuCircleCheck, LuArrowRight, LuLoader, LuVideo } from "react-icons/lu";
import LessonProgressBadge from "../../../../features/lessons/components/LessonProgressBadge";

// ======================================================
// LessonProgressPanel — ปุ่ม "เรียนจบแล้ว" และสถานะการเรียนของบทนี้ (ข้อ 24)
// แสดงเฉพาะผู้เรียนที่ลงทะเบียน (เจ้าของคอร์สและ Admin ไม่มีสถานะการเรียน)
// ======================================================

function LessonProgressPanel({ lessonProgress, classroomId, nextLessonId }) {
  const {
    progress,
    isCompleted,
    canComplete,
    isCompleting,
    requiredPercent,
    videos,
    videosDone,
    completeLesson,
  } = lessonProgress;
  if (!progress) return null;

  const remaining = videos.length - videosDone;

  return (
    <section
      aria-label="สถานะการเรียนบทนี้"
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 ${
        isCompleted ? "border-emerald-200 bg-emerald-50/60" : "border-[#E5E9E7] bg-white"
      }`}
    >
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[#26332F]">สถานะบทนี้</span>
          <LessonProgressBadge status={progress.status} />
        </div>
        {videos.length > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-[#6B7773]">
            <LuVideo className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
            ดูวิดีโอครบ {requiredPercent}% แล้ว {videosDone}/{videos.length} คลิป
          </p>
        )}
        {!isCompleted && remaining > 0 && (
          <p className="text-xs font-semibold text-amber-700">
            ดูวิดีโออีก {remaining} คลิปให้ถึง {requiredPercent}% แล้วจึงกด "เรียนจบแล้ว" ได้
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {isCompleted ? (
          nextLessonId && (
            <Link
              to={`/classrooms/${classroomId}/lessons/${nextLessonId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#003835] transition"
            >
              ไปบทถัดไป
              <LuArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={completeLesson}
            disabled={!canComplete || isCompleting}
            title={canComplete ? "" : `ต้องดูวิดีโอทุกคลิปให้ถึง ${requiredPercent}% ก่อน`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            {isCompleting ? (
              <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <LuCircleCheck className="h-4 w-4" aria-hidden="true" />
            )}
            เรียนจบแล้ว
          </button>
        )}
      </div>
    </section>
  );
}

export default LessonProgressPanel;
