import { Link } from "react-router-dom";
import Button from "./Button";

// ======================================================
// CourseCard Component (การ์ดแสดงคอร์สเรียน)
// ======================================================
// ใช้งานร่วมกันได้ทุกหน้าและทุก Role:
// - Guest: แสดงรายละเอียด, ผู้สอน, Badge ฟรี, ปุ่ม "ดูตัวอย่าง"
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

  const {
    id,
    title = "คอร์สเรียนไม่มีชื่อ",
    description = "",
    instructor_name = "ผู้สอนระบบ",
    student_count = 0,
    lesson_count = 0,
    chapter_count = 0,
    progressPercent = null,
    cover_image,
    thumbnail_url,
    is_enrolled = false,
    category = "IoT & Smart City",
  } = course;

  const imageSrc = cover_image || thumbnail_url;

  // เส้นทางเริ่มต้นตาม Role
  const classroomPath = `/classrooms/${id}`;
  const targetContinueLink = continueLink || classroomPath;
  const targetManageLink = manageLink || `/classrooms/${id}`;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${className}`}
    >
      {/* 1. ส่วนรูปภาพหน้าปก / Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#004643] to-[#26332F]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = "none";
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
          <span className="rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
            {category}
          </span>
          {is_enrolled && (
            <span className="rounded-lg bg-[#004643] px-2.5 py-1 text-[11px] font-bold text-[#ABD1C6] shadow-sm">
              ✓ ลงทะเบียนแล้ว
            </span>
          )}
        </div>

        {/* Badge "ฟรี" หรือจำนวนบทเรียน */}
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
          {role === "guest" ? (
            <a href="#course-overview">{title}</a>
          ) : (
            <Link to={classroomPath}>{title}</Link>
          )}
        </h3>

        {/* คำอธิบายสั้น */}
        {description && (
          <p className="mt-2 line-clamp-2 text-xs text-gray-500 leading-relaxed">
            {description}
          </p>
        )}

        {/* ระดับของคอร์ส (Level) และผู้สอน */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ABD1C6]/30 text-xs font-bold text-[#004643]">
              {instructor_name ? instructor_name.charAt(0).toUpperCase() : "T"}
            </div>
            <span className="truncate text-xs font-medium text-gray-600">
              {instructor_name}
            </span>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            {course.level || "ระดับ Beginner"}
          </span>
        </div>

        {/* สถิติย่อย: จำนวน Chapter, ตอนย่อย (Episode), และนักเรียน */}
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-y-1">
          <div className="flex items-center gap-3">
            {chapter_count > 0 && (
              <span className="font-semibold text-gray-700">
                📚 {chapter_count} บท
              </span>
            )}
            <span className="flex items-center gap-1">
              <span>📖</span>
              {lesson_count > 0 ? `${lesson_count} ตอน` : "มีบทเรียนย่อย"}
            </span>
          </div>

          <span className="flex items-center gap-1">
            <span>👥</span>
            {student_count} ผู้เรียน
          </span>
        </div>

        {/* แถบ Progress Bar เมื่อลงทะเบียนแล้ว */}
        {is_enrolled && progressPercent !== null && (
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
            <div className="grid grid-cols-2 gap-2">
              <Button
                href="#course-overview"
                variant="outline"
                size="sm"
                fullWidth
              >
                ดูภาพรวมคอร์ส
              </Button>
              <Button
                to="/register"
                variant="primary"
                size="sm"
                fullWidth
              >
                เริ่มเรียนฟรี
              </Button>
            </div>
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
                  onClick={() => onEnroll(id)}
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
                to={targetManageLink}
                variant="outlineDark"
                size="sm"
                fullWidth
              >
                ดูห้องเรียน
              </Button>
              <Button
                to={`/classrooms/${id}`}
                variant="secondary"
                size="sm"
                fullWidth
              >
                จัดการคอร์ส
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
