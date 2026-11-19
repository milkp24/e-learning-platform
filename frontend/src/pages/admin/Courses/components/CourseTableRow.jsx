import { Link } from "react-router-dom";
import {
  LuBookOpen,
  LuLayers,
  LuUsers,
  LuEye,
  LuPencil as LuEdit3,
  LuListTree,
  LuGlobe,
  LuEyeOff,
  LuTrash2,
} from "react-icons/lu";

/**
 * CourseTableRow Component
 * แถวแสดงข้อมูลคอร์สเรียน พร้อมข้อมูลและ Actions ครบถ้วนตามข้อกำหนด 1:
 * - ชื่อคอร์ส, คำอธิบาย, รูปปก, ผู้สอน, จำนวนบทเรียน, จำนวนผู้เรียน, สถานะ, วันที่แก้ไขล่าสุด
 * - Actions: ดู, แก้ไข, จัดการเนื้อหา, เผยแพร่, ยกเลิกการเผยแพร่, ลบ
 */
function CourseTableRow({
  course,
  onEdit,
  onTogglePublish,
  onDelete,
}) {
  const courseId = course.classroom_id || course.id;
  const ownerName =
    course.instructor_name ||
    course.owner?.profile?.display_name ||
    course.owner?.email ||
    "ผู้ดูแลระบบ";

  const thumbnail = course.thumbnail_url || course.cover_image;
  const lessonCount = course.lesson_count ?? course.chapter_count ?? 0;
  const studentCount = course.student_count ?? course.member_count ?? 0;

  // แปลงวันที่แก้ไขล่าสุด
  const formattedDate = course.updated_at
    ? new Date(course.updated_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

  // Map สถานะ: ฉบับร่าง, รอตรวจสอบ, เผยแพร่แล้ว, ปิดการเผยแพร่
  const renderStatusBadge = () => {
    const s = (course.status || "active").toLowerCase();
    if (s === "active" || s === "published") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          เผยแพร่แล้ว
        </span>
      );
    }
    if (s === "pending" || s === "under_review") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          รอตรวจสอบ
        </span>
      );
    }
    if (s === "draft") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-300 px-2.5 py-0.5 text-xs font-bold text-gray-700">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
          ฉบับร่าง
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
        ปิดการเผยแพร่
      </span>
    );
  };

  const isPublished =
    (course.status || "active").toLowerCase() === "active" ||
    (course.status || "").toLowerCase() === "published";

  return (
    <tr className="hover:bg-[#FAFAFA] transition duration-150 border-b border-[#E5E9E7]">
      {/* 1. ข้อมูลคอร์ส (รูปปก + ชื่อ + คำอธิบาย) */}
      <td className="px-6 py-4 max-w-sm">
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E5E9E7] bg-gray-100">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={course.title}
                className="h-full w-full object-cover object-center"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/classroom-default.svg";
                  e.target.className = "h-full w-full object-contain object-center p-1";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#ABD1C6]/30 text-[#004643]">
                <LuBookOpen className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="space-y-0.5 min-w-0">
            <Link
              to={`/classrooms/${courseId}`}
              className="font-bold text-[#26332F] hover:text-[#004643] transition truncate block text-sm"
              title={course.title}
            >
              {course.title}
            </Link>
            <p className="text-xs text-[#6B7773] line-clamp-1">
              {course.description || "ไม่มีคำอธิบาย"}
            </p>
          </div>
        </div>
      </td>

      {/* 2. ผู้สอน */}
      <td className="px-6 py-4 text-xs font-medium text-[#26332F] whitespace-nowrap">
        {ownerName}
      </td>

      {/* 3. จำนวนบทเรียน และ ผู้เรียน */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1 text-xs text-[#6B7773]">
          <span className="flex items-center gap-1.5 font-medium text-[#26332F]">
            <LuLayers className="h-3.5 w-3.5 text-[#004643]" />
            {lessonCount} บทเรียน
          </span>
          <span className="flex items-center gap-1.5">
            <LuUsers className="h-3.5 w-3.5" />
            {studentCount} ผู้เรียน
          </span>
        </div>
      </td>

      {/* 4. สถานะ */}
      <td className="px-6 py-4 whitespace-nowrap">
        {renderStatusBadge()}
      </td>

      {/* 5. วันที่แก้ไขล่าสุด */}
      <td className="px-6 py-4 text-xs text-[#6B7773] whitespace-nowrap">
        {formattedDate}
      </td>

      {/* 6. การจัดการ (Actions) */}
      <td className="px-6 py-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {/* จัดการเนื้อหา */}
          <Link
            to={`/classrooms/${courseId}/manage`}
            className="inline-flex items-center gap-1 rounded-xl bg-[#ABD1C6] px-2.5 py-1.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition shadow-2xs cursor-pointer"
            title="จัดการเนื้อหาบทเรียนและตอนย่อย"
          >
            <LuListTree className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">จัดการเนื้อหา</span>
          </Link>

          {/* ดูตัวอย่างหน้าห้องเรียน */}
          <Link
            to={`/classrooms/${courseId}`}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-100 transition cursor-pointer"
            title="ดูหน้าห้องเรียน"
          >
            <LuEye className="h-3.5 w-3.5 text-[#6B7773]" />
            <span className="hidden sm:inline">ดู</span>
          </Link>

          {/* แก้ไขข้อมูลคอร์ส */}
          <button
            type="button"
            onClick={() => onEdit(course)}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-100 transition cursor-pointer"
            title="แก้ไขรายละเอียดคอร์ส"
          >
            <LuEdit3 className="h-3.5 w-3.5 text-[#6B7773]" />
            <span className="hidden sm:inline">แก้ไข</span>
          </button>

          {/* เผยแพร่ / ยกเลิกการเผยแพร่ */}
          {isPublished ? (
            <button
              type="button"
              onClick={() => onTogglePublish(course, "draft")}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
              title="ยกเลิกการเผยแพร่"
            >
              <LuEyeOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ปิด</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onTogglePublish(course, "active")}
              className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
              title="เผยแพร่คอร์สเรียน"
            >
              <LuGlobe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">เผยแพร่</span>
            </button>
          )}

          {/* ลบ */}
          <button
            type="button"
            onClick={() => onDelete(course)}
            className="inline-flex items-center justify-center rounded-xl p-1.5 text-[#6B7773] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
            title="ลบคอร์สเรียน"
          >
            <LuTrash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default CourseTableRow;
