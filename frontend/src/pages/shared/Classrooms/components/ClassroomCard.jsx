import { useState } from "react";
import { Link } from "react-router-dom";
import { LuBookMarked, LuUsers, LuListTree } from "react-icons/lu";
import { getCourseStatus } from "../../../../features/courses/utils/courseStatus";

/**
 * ClassroomCard Component
 * แสดงการ์ดคอร์สเรียน พร้อมข้อมูลผู้สอน จำนวนบทเรียน ผู้เรียน และปุ่มจัดการเนื้อหา
 */
function ClassroomCard({
  classroom,
  isOwner,
  isStudent,
  onJoin,
  isJoining,
}) {
  const [imageError, setImageError] = useState(false);
  const courseId = classroom.classroom_id || classroom.id;
  const rawThumbnail = classroom.thumbnail_url || classroom.cover_image;
  const showFallback = !rawThumbnail || imageError;
  const status = getCourseStatus(classroom.status);

  return (
    <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div>
        {/* ภาพหน้าปกห้องเรียน */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFAFA]">
          {showFallback ? (
            <img
              src="/images/classroom-default.svg"
              alt={classroom.title || "Classroom Thumbnail"}
              className="h-32 w-full object-cover object-center"
              loading="lazy"
            />
          ) : (
            <img
              src={rawThumbnail}
              alt={classroom.title || "Classroom Thumbnail"}
              className="h-32 w-full object-cover object-center"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.className}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {isOwner && (
            <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              คอร์สที่คุณสอน
            </span>
          )}
        </div>

        {/* ชื่อห้องเรียน ลิงก์เข้าไปดูรายละเอียด */}
        <Link
          to={`/classrooms/${courseId}`}
          className="mt-3 block text-lg font-bold text-gray-900 hover:text-[#456F65]"
        >
          {classroom.title}
        </Link>

        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
          {classroom.description || "ไม่มีคำอธิบายคอร์สเรียน"}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>ผู้สอน: <b className="text-gray-700">{classroom.instructor_name || "ไม่ระบุ"}</b></span>
          <span className="inline-flex items-center gap-1">
            <LuBookMarked className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
            <span>{classroom.lesson_count || 0} บทเรียน</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <LuUsers className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
            <span>{classroom.member_count || 0} คน</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* ปุ่มจัดการเนื้อหาสำหรับเจ้าของหรือผู้สอน */}
          {isOwner && (
            <Link
              to={`/classrooms/${courseId}/manage`}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#ABD1C6] py-2 px-3 text-center text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition shadow-2xs"
            >
              <LuListTree className="h-3.5 w-3.5" />
              <span>จัดการเนื้อหา</span>
            </Link>
          )}

          <Link
            to={`/classrooms/${courseId}`}
            className="flex-1 rounded-xl border border-gray-300 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            ดูรายละเอียด
          </Link>

          {/* ปุ่ม Join สำหรับ Student เท่านั้น */}
          {isStudent && (
            <button
              onClick={() => onJoin(courseId)}
              disabled={isJoining}
              className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9] transition disabled:opacity-50 cursor-pointer"
            >
              {isJoining ? "กำลังเข้า..." : "เข้าร่วมห้องเรียน"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClassroomCard;
