import { Link } from "react-router-dom";
import {
  LuArrowLeft,
  LuCheck,
  LuCircleAlert as LuAlertCircle,
  LuLayers,
  LuFileText,
  LuEye,
} from "react-icons/lu";

/**
 * CourseContentHeader Component
 * Presentational component for CourseContentManager header section:
 * - Back button with unsaved changes trigger
 * - Course Title & Status / IoT-101 Badges
 * - "ดูในมุมมองนักเรียน" (Student Preview) Link
 * - Mobile Tab Switcher ('tree' vs 'builder')
 * - Toast Notification Alert Banner
 */
function CourseContentHeader({
  courseTitle = "กำลังโหลดคอร์สเรียน...",
  isIoT101 = false,
  classroomId,
  mobileTab = "builder",
  onTabChange,
  onBack,
  toastMessage,
}) {
  return (
    <>
      {/* 1. แถบ Navigation ด้านบนสุด */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#26332F] hover:bg-gray-100 transition cursor-pointer shadow-2xs"
            title="กลับสู่หน้ารายการคอร์ส"
          >
            <LuArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#004643] px-2 py-0.5 text-[10px] font-bold text-[#ABD1C6] uppercase">
                ระบบจัดการเนื้อหาคอร์ส
              </span>
              {isIoT101 && (
                <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  หลักสูตร IoT 101
                </span>
              )}
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[#26332F] mt-0.5">
              {courseTitle || "กำลังโหลดคอร์สเรียน..."}
            </h1>
          </div>
        </div>

        {/* ปุ่มดูในมุมมองนักเรียน (Preview as Student) */}
        <div className="flex items-center gap-2">
          <Link
            to={`/classrooms/${classroomId}?preview=student`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#004643] bg-white px-3.5 py-2 text-xs font-bold text-[#004643] hover:bg-[#004643]/10 transition shadow-2xs"
            title="ดูตัวอย่างคอร์สเรียนในมุมมองที่นักเรียนเห็นจริง"
          >
            <LuEye className="h-4 w-4" />
            <span>ดูในมุมมองนักเรียน</span>
          </Link>
        </div>

        {/* ปุ่มสลับแท็บบนหน้าจอมือถือ */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 sm:hidden">
          <button
            type="button"
            onClick={() => onTabChange?.("tree")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
              mobileTab === "tree"
                ? "bg-white text-[#26332F] shadow-xs"
                : "text-[#6B7773]"
            }`}
          >
            <LuLayers className="h-4 w-4" />
            <span>โครงสร้างบทเรียน</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange?.("builder")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition ${
              mobileTab === "builder"
                ? "bg-white text-[#26332F] shadow-xs"
                : "text-[#6B7773]"
            }`}
          >
            <LuFileText className="h-4 w-4" />
            <span>สร้างเนื้อหา</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`rounded-2xl p-4 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm transition-all animate-fadeIn ${
            toastMessage.type === "success"
              ? "bg-[#ABD1C6]/30 border border-[#ABD1C6] text-[#004643]"
              : "bg-rose-50 border border-rose-200 text-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <LuCheck className="h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <LuAlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </>
  );
}

export default CourseContentHeader;
