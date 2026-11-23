import { getCourseVisibility } from "../../utils/courseVisibility";

// ป้ายการมองเห็นคอร์ส (ข้อ 1) แสดงให้ผู้จัดการคอร์สเห็น
// คอร์สสาธารณะเป็นค่าปกติ จึงไม่แสดงป้าย เว้นแต่ส่ง showPublic
function CourseVisibilityBadge({ visibility, showPublic = false, className = "" }) {
  if (!showPublic && (!visibility || visibility === "public")) return null;
  const info = getCourseVisibility(visibility);
  const Icon = info.icon;
  return (
    <span
      title={info.hint}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold ${info.className} ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {info.label}
    </span>
  );
}

export default CourseVisibilityBadge;
