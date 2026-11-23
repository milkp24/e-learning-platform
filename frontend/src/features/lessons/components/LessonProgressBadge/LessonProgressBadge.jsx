import { LuCircle, LuCircleCheck, LuCircleDot } from "react-icons/lu";
import { getLessonProgress } from "../../utils/lessonProgress";

// ป้ายสถานะการเรียน: ยังไม่เรียน / กำลังเรียน / เรียนจบแล้ว (ข้อ 24)
const ICONS = { not_started: LuCircle, in_progress: LuCircleDot, completed: LuCircleCheck };

function LessonProgressBadge({ status, className = "" }) {
  const info = getLessonProgress(status);
  if (!info) return null;
  const Icon = ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${info.className} ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {info.label}
    </span>
  );
}

export default LessonProgressBadge;
