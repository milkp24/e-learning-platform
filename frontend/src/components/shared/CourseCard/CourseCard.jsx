import { Link } from "react-router-dom";
import { LuCheck, LuBookOpen, LuBookMarked, LuArrowRight } from "react-icons/lu";
import Button from "../Button";

// ======================================================
// CourseCard Component (การ์ดแสดงคอร์สเรียน)
// ======================================================
// ใช้งานร่วมกันได้ทุกหน้าและทุก Role:
// - Guest: แสดงรายละเอียด, ผู้สอน, Badge ฟรี, ปุ่ม "ดูรายละเอียด"
// - Student: แสดงสถานะการลงทะเบียน, ปุ่ม "เข้าสู่ห้องเรียน" หรือ "ลงทะเบียนเรียน"
// - Instructor: แสดงจำนวนนักเรียน, ปุ่ม "จัดการคอร์ส"
// - Admin: แสดงสถานะคอร์ส, ปุ่มตรวจสอบรายละเอียด

function CourseCard({
  course,
  role = "guest",
  onEnroll,
  isEnrolling = false,
  continueLink,
  manageLink,
  className = "",
}) {
  if (!course) return null;

  const courseId = course.id || course.classroom_id;
  const rawProgress = course.progressPercent ?? course.progress_percent;
  const progressPercent =
    rawProgress !== undefined && rawProgress !== null && !isNaN(Number(rawProgress))
      ? Number(rawProgress)
      : null;

  const {
    title = "คอร์สเรียนไม่มีชื่อ",
    description = "",
    instructor_name = "ผู้สอนระบบ",
    lesson_count = 0,
    chapter_count = 0,
    cover_image,
    thumbnail_url,
    is_enrolled = false,
    category = "IoT & Smart City",
  } = course;

  const imageSrc = cover_image || thumbnail_url;
  const isEnrolledEffective = role === "guest" ? false : is_enrolled;

  // เส้นทางเริ่มต้นตาม Role
  const classroomPath = `/classrooms/${courseId}`;
  const targetContinueLink = continueLink || classroomPath;
  const targetManageLink = manageLink || `/classrooms/${courseId}/manage`;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#E5E9E7] bg-white shadow-xs transition-colors duration-200 hover:border-[#ABD1C6] hover:shadow-md ${className}`}
    >
      {/* 1. ส่วนรูปภาพหน้าปก / Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#004643] to-[#26332F]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/classroom-default.svg";
              e.target.className = "h-full w-full object-contain object-center p-4 transition duration-300";
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-white">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-xs">
              <svg
                className="h-10 w-10 text-[#ABD1C6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="mt-2 text-xs font-bold tracking-wider text-[#ABD1C6] uppercase">
              Smart Platform
            </span>
          </div>
        )}

        {/* Badge หมวดหมู่ / สถานะบนรูปภาพ */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {category && (
            <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
              {category}
            </span>
          )}
          {isEnrolledEffective && (
            <span className="rounded-lg bg-[#004643] px-2.5 py-1 text-[11px] font-bold text-[#ABD1C6] shadow-sm flex items-center gap-1">
              <LuCheck className="h-3 w-3" aria-hidden="true" />
              <span>ลงทะเบียนแล้ว</span>
            </span>
          )}
        </div>

        {/* Badge "เรียนฟรี" เมื่อเป็นคอร์สสาธารณะ */}
        <div className="absolute bottom-3 right-3">
          <span className="rounded-lg bg-[#ABD1C6] px-2.5 py-1 text-xs font-black text-[#20302C] shadow-sm">
            เรียนฟรี
          </span>
        </div>
      </div>

      {/* 2. เนื้อหาของการ์ด */}
      <div className="flex flex-1 flex-col p-5">
        {/* ชื่อคอร์ส */}
        <h3 className="line-clamp-2 text-base sm:text-lg font-black text-[#1F2937] group-hover:text-[#004643] transition">
          <Link to={classroomPath}>{title}</Link>
        </h3>

        {/* คำอธิบายสั้น */}
        {description && (
          <p className="mt-2 line-clamp-2 text-xs text-gray-500 leading-relaxed">
            {description}
          </p>
        )}

        {/* ระดับของคอร์ส (Level) ถ้ามี และผู้สอน */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ABD1C6]/30 text-xs font-bold text-[#004643]">
              {instructor_name ? instructor_name.charAt(0).toUpperCase() : "T"}
            </div>
            <span className="truncate text-xs font-medium text-gray-600">
              {instructor_name}
            </span>
          </div>
          {course.level && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {course.level}
            </span>
          )}
        </div>

        {/* สถิติบทเรียนที่มีอยู่จริง */}
        {(chapter_count > 0 || lesson_count > 0) && (
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-y-1">
            <div className="flex items-center gap-3">
              {chapter_count > 0 && (
                <span className="font-semibold text-gray-700 flex items-center gap-1">
                  <LuBookOpen className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>{chapter_count} บท</span>
                </span>
              )}
              {lesson_count > 0 && (
                <span className="flex items-center gap-1">
                  <LuBookMarked className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
                  <span>{lesson_count} ตอน</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* แถบ Progress Bar เมื่อลงทะเบียนแล้ว */}
        {isEnrolledEffective && progressPercent !== null && (
          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-medium text-gray-500">ความคืบหน้า</span>
              <span className="font-bold text-[#004643]">{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6FA99A] to-[#004643] transition-all duration-300"
                style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. ปุ่ม Action ด้านล่าง ปรับตามบทบาท (Role) */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          {role === "guest" && (
            <Link
              to={classroomPath}
              className="inline-flex items-center justify-between w-full rounded-xl border border-[#ABD1C6] bg-white py-2.5 px-4 text-xs sm:text-sm font-semibold text-[#004643] hover:bg-[#004643] hover:text-white transition-colors duration-200 group/btn shadow-2xs"
            >
              <span>ดูรายละเอียด</span>
              <LuArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" aria-hidden="true" />
            </Link>
          )}

          {role === "student" && (
            <div>
              {is_enrolled ? (
                <Button
                  to={targetContinueLink}
                  variant="secondary"
                  size="sm"
                  fullWidth
                >
                  เรียนต่อ
                </Button>
              ) : onEnroll ? (
                <Button
                  onClick={() => onEnroll(courseId)}
                  loading={isEnrolling}
                  variant="primary"
                  size="sm"
                  fullWidth
                >
                  ลงทะเบียนเรียน
                </Button>
              ) : (
                <Button
                  to={classroomPath}
                  variant="primary"
                  size="sm"
                  fullWidth
                >
                  ดูรายละเอียดคอร์ส
                </Button>
              )}
            </div>
          )}

          {role === "instructor" && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                to={classroomPath}
                variant="outlineDark"
                size="sm"
                fullWidth
              >
                ดูห้องเรียน
              </Button>
              <Button
                to={targetManageLink}
                variant="primary"
                size="sm"
                fullWidth
              >
                จัดการเนื้อหา
              </Button>
            </div>
          )}

          {role === "admin" && (
            <Button
              to={classroomPath}
              variant="outlineDark"
              size="sm"
              fullWidth
            >
              ตรวจสอบห้องเรียน
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
