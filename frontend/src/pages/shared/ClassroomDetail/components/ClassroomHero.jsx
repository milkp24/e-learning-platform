import { getCourseStatus } from "../../../../features/courses/utils/courseStatus";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuCheck,
  LuBookOpen,
  LuBookMarked,
  LuUsers,
  LuListTree,
  LuEye,
} from "react-icons/lu";
import CourseManageActions from "../../../../features/courses/components/CourseManageActions";
import ReviewNote from "../../../../features/courses/components/ReviewNote";
import { getStatusActions } from "../../../../features/courses/utils/courseStatus";

/**
 * ClassroomHero Component
 * ส่วนหัวของหน้าห้องเรียน ออกแบบตามมาตรฐาน Student View:
 * - แสดงป้ายหมวดหมู่, ระดับ, สถานะพรีวิว/สมาชิก
 * - แสดงชื่อคอร์ส, คำอธิบาย, ผู้สอนพร้อมรูป/อักษรย่อ, สถิติบทเรียนและผู้เรียน
 * - แสดงการ์ดรูปภาพหน้าปกคอร์ส (Course Cover)
 * - ปุ่ม Action ปรับเปลี่ยนตามบทบาท:
 *   - Guest: ปุ่ม "เริ่มเรียน" (เรียก Lock Modal) และ "สมัครสมาชิกฟรี"
 *   - Student / Instructor Preview: ปุ่ม "เริ่มเรียน / เรียนต่อ" หรือ "เข้าร่วมห้องเรียน"
 *   - Instructor / Admin: ปุ่ม "ดูในมุมมองนักเรียน", "จัดการเนื้อหา", "แก้ไขคอร์ส", "ลบคอร์ส"
 */
function ClassroomHero({
  classroom,
  isIoT101,
  isEnrolled,
  isOwnerOrAdmin,
  hasRole,
  isGuest = false,
  isInstructorPreview = false,
  firstLessonId,
  onJoin,
  onOpenLockModal,
  onOpenEditModal,
  onDeleteClassroom,
  onCourseStatusAction,
  isStatusBusy = false,
  lessonsCount,
  membersCount,
}) {
  // ปุ่มสถานะชุดเดียวกับการ์ด/ตาราง ("ไม่อนุมัติ" ต้องกรอกเหตุผล จึงทำจากหน้าตรวจคอร์สก่อนเผยแพร่)
  const statusActions = getStatusActions(classroom).filter((a) => a.key !== "reject");
  const courseId = classroom.classroom_id || classroom.id;
  const [imageError, setImageError] = useState(false);
  const rawCover = classroom.cover_image || classroom.thumbnail_url;
  const showFallback = !rawCover || imageError;

  const firstLessonPath = isIoT101
    ? "/classrooms/iot-101/lessons/ep-0-1"
    : firstLessonId
    ? `/classrooms/${courseId}/lessons/${firstLessonId}`
    : "#";

  return (
    <div className="rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* 1. คอลัมน์ซ้าย: ข้อมูลรายละเอียดคอร์ส (8 ส่วนบนจอใหญ่) */}
        <div className="lg:col-span-8 space-y-4">
          {/* ป้ายสถานะ & หมวดหมู่ */}
          <div className="flex flex-wrap items-center gap-2">
            {(isIoT101 || classroom.category_name) && (
              <span className="rounded-lg bg-[#ABD1C6]/30 px-2.5 py-0.5 text-xs font-bold text-[#004643]">
                {isIoT101 ? "IoT & Smart City" : classroom.category_name}
              </span>
            )}

            {/* สถานะคอร์ส: แสดงให้ผู้ที่จัดการคอร์สได้ เหมือนการ์ดและตาราง */}
            {isOwnerOrAdmin && !isIoT101 && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${getCourseStatus(classroom.status).className}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${getCourseStatus(classroom.status).dot}`} />
                {getCourseStatus(classroom.status).label}
              </span>
            )}

            <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              {classroom.level || "ระดับ Beginner"}
            </span>

            {isGuest ? (
              <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                เปิดให้พรีวิวเนื้อหา
              </span>
            ) : isInstructorPreview ? (
              <span className="rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800 inline-flex items-center gap-1">
                <LuEye className="h-3 w-3" />
                <span>มุมมองนักเรียน</span>
              </span>
            ) : isEnrolled || isIoT101 ? (
              <span className="rounded-lg bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800 inline-flex items-center gap-1">
                <LuCheck className="h-3 w-3" aria-hidden="true" />
                <span>คุณเป็นสมาชิกห้องนี้แล้ว</span>
              </span>
            ) : null}
          </div>

          {/* ชื่อคอร์สเรียน */}
          <h1 className="text-2xl sm:text-3xl font-black text-[#26332F] tracking-tight leading-snug">
            {classroom.title}
          </h1>

          {/* คำอธิบายคอร์ส */}
          <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed whitespace-pre-wrap max-w-3xl">
            {classroom.description || "ไม่มีคำอธิบายสำหรับคอร์สนี้"}
          </p>

          {/* ข้อมูลผู้สอนและสถิติหลักสูตร */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 border-t border-gray-100 pt-4 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ABD1C6]/40 text-xs font-bold text-[#004643]">
                {classroom.instructor_name
                  ? classroom.instructor_name.charAt(0).toUpperCase()
                  : "T"}
              </div>
              <span>
                ผู้สอน: <b className="text-gray-800">{classroom.instructor_name || "ไม่ระบุ"}</b>
              </span>
            </div>

            {isIoT101 ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <LuBookOpen className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>8 บทเรียน</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <LuBookMarked className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>27 ตอนย่อย</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <LuUsers className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>142 ผู้เรียน</span>
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1">
                  <LuBookMarked className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>{lessonsCount} บทเรียน</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <LuUsers className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>{membersCount} สมาชิก</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 2. คอลัมน์ขวา: การ์ดรูปภาพหน้าปกคอร์ส (Course Cover) และปุ่ม Action (4 ส่วนบนจอใหญ่) */}
        <div className="lg:col-span-4 flex flex-col gap-4 w-full">
          {/* รูปหน้าปกคอร์สเรียน (Course Cover) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#004643] to-[#26332F] shadow-xs">
            {showFallback ? (
              <img
                src="/images/classroom-default.svg"
                alt={classroom.title || "Course Cover"}
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
            ) : (
              <img
                src={rawCover}
                alt={classroom.title || "Course Cover"}
                className="h-full w-full object-cover object-center"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}
            <div className="absolute bottom-2.5 right-2.5">
              <span className="rounded-lg bg-[#ABD1C6] px-2.5 py-1 text-xs font-black text-[#20302C] shadow-sm">
                เรียนฟรี
              </span>
            </div>
          </div>

          {/* ปุ่ม Action ด้านล่างรูปภาพ */}
          <div className="space-y-2">
            {/* สำหรับ Guest: ปุ่มเริ่มเรียน (เปิด Lock Modal) + ลิงก์สมัครสมาชิก */}
            {isGuest && (
              <div className="space-y-2">
                <button
                  onClick={() => onOpenLockModal?.(classroom.title)}
                  type="button"
                  className="w-full rounded-xl bg-[#004643] py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-[#003835] active:scale-98 transition cursor-pointer text-center"
                >
                  เริ่มเรียน
                </button>
                <Link
                  to="/register"
                  className="block w-full rounded-xl border border-gray-300 py-2.5 px-4 text-xs font-bold text-gray-700 hover:bg-gray-50 transition text-center"
                >
                  สมัครสมาชิกฟรีเพื่อเข้าเรียน
                </Link>
              </div>
            )}

            {/* สำหรับ Student หรือ Instructor ในโหมด Preview */}
            {(hasRole("student") || isInstructorPreview) &&
              !isOwnerOrAdmin && (
                isEnrolled || isIoT101 || isInstructorPreview ? (
                  <Link
                    to={firstLessonPath}
                    className="block w-full rounded-xl bg-[#004643] py-3 px-4 text-sm font-bold text-white shadow-xs hover:bg-[#003835] active:scale-98 transition cursor-pointer text-center"
                  >
                    เริ่มเรียน / เรียนต่อ
                  </Link>
                ) : (
                  <button
                    onClick={onJoin}
                    type="button"
                    className="w-full rounded-xl bg-[#ABD1C6] py-3 px-4 text-sm font-bold text-[#20302C] shadow-xs hover:bg-[#9CC5B9] active:scale-98 transition cursor-pointer text-center"
                  >
                    + เข้าร่วมห้องเรียนนี้
                  </button>
                )
              )}

            {/* สำหรับ Instructor / Admin ในโหมดจัดการปกติ (Normal Mode) */}
            {isOwnerOrAdmin && !isInstructorPreview && (
              <div className="space-y-2">
                {/* ปุ่มดูในมุมมองนักเรียน (Preview as Student) */}
                <Link
                  to={`/classrooms/${courseId}?preview=student`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl border-2 border-[#004643] bg-white py-2.5 px-4 text-xs font-bold text-[#004643] hover:bg-[#004643]/5 transition shadow-2xs"
                  title="ดูตัวอย่างคอร์สเรียนในมุมมองที่นักเรียนเห็นจริง"
                >
                  <LuEye className="h-4 w-4" />
                  <span>ดูในมุมมองนักเรียน</span>
                </Link>

                {/* ปุ่มจัดการเนื้อหา */}
                <Link
                  to={`/classrooms/${courseId}/manage`}
                  className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#ABD1C6] py-2.5 px-4 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition shadow-2xs"
                >
                  <LuListTree className="h-4 w-4" />
                  <span>จัดการเนื้อหา</span>
                </Link>

                {/* ปุ่มสถานะ / แก้ไข / ลบ ชุดเดียวกับการ์ดคอร์สทุกหน้า */}
                <ReviewNote course={classroom} />
                <CourseManageActions
                  course={classroom}
                  actions={statusActions}
                  onStatusAction={(_, action) => onCourseStatusAction?.(action)}
                  onEdit={onOpenEditModal ? () => onOpenEditModal() : undefined}
                  onDelete={onDeleteClassroom ? () => onDeleteClassroom() : undefined}
                  busy={isStatusBusy}
                  variant="card"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassroomHero;
