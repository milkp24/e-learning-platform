import { LuCircleAlert } from "react-icons/lu";
import { normalizeCourseStatus } from "../../utils/courseStatus";

/**
 * ReviewNote — เหตุผลที่ผู้ดูแลไม่อนุมัติการเผยแพร่ (แสดงเฉพาะผู้ที่จัดการคอร์สได้ และคอร์สเป็นฉบับร่าง)
 */
function ReviewNote({ course, compact = false }) {
  if (!course?.can_manage || !course?.review_note) return null;
  if (normalizeCourseStatus(course.status) !== "draft") return null;
  return (
    <div
      className={`flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 ${
        compact ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs"
      }`}
    >
      <LuCircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className={compact ? "line-clamp-1" : "line-clamp-2"} title={course.review_note}>
        <b>ไม่อนุมัติ:</b> {course.review_note}
      </span>
    </div>
  );
}

export default ReviewNote;
