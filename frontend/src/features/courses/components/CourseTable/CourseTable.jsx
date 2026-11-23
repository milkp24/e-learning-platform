import { useState } from "react";
import { Link } from "react-router-dom";
import { LuBookOpen, LuLayers, LuUsers, LuEye, LuListTree } from "react-icons/lu";
import { getCourseStatus } from "../../utils/courseStatus";
import CourseManageActions from "../CourseManageActions";
import ReviewNote from "../ReviewNote";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import CourseVisibilityBadge from "../CourseVisibilityBadge";

// ======================================================
// CourseTable — มุมมองตารางของรายการคอร์ส (คู่กับมุมมองการ์ด CourseCard)
// ข้อมูลและปุ่มเหมือนการ์ดทุกอย่าง แค่จัดเป็นแถว ใช้ทุกหน้า ทุกบทบาท
// - คอลัมน์สถานะแสดงเมื่อ showStatus (ผู้สอน / แอดมิน)
// - ปุ่มจัดการแสดงเฉพาะคอร์สที่ canManage(course) เป็นจริง
// - ปุ่มในคอลัมน์การจัดการอยู่บรรทัดเดียวเสมอ ลำดับ: จัดการเนื้อหา → ดู → ปุ่มสถานะ → แก้ไข → ลบ
// ======================================================

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function Thumbnail({ src: rawSrc, title }) {
  const src = resolveMediaUrl(rawSrc);
  const [failedSrc, setFailedSrc] = useState(null);
  return (
    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E5E9E7] bg-gray-100">
      {src && failedSrc !== src ? (
        <img src={src} alt={title} className="h-full w-full object-cover" onError={() => setFailedSrc(src)} loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#ABD1C6]/30 text-[#004643]">
          <LuBookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

const linkBtn =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition cursor-pointer";
const iconLink =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition";

function CourseTableRow({ course, showStatus, canManage, isStudent, onJoin, isJoining, onEdit, onStatusAction, onDelete, isBusy }) {
  const courseId = course.classroom_id || course.id;
  const status = getCourseStatus(course.status);
  const lessonCount = course.lesson_count ?? course.chapter_count ?? 0;
  const memberCount = course.member_count ?? course.student_count ?? 0;

  return (
    <tr className="hover:bg-[#FAFAFA] transition">
      <td className="px-5 py-4 max-w-[300px]">
        <div className="flex items-start gap-3.5">
          <Thumbnail src={course.thumbnail_url || course.cover_image} title={course.title} />
          <div className="min-w-0 space-y-0.5">
            <Link
              to={`/classrooms/${courseId}`}
              className="block truncate text-sm font-bold text-[#26332F] hover:text-[#004643]"
              title={course.title}
            >
              {course.title}
            </Link>
            <p className="line-clamp-1 text-xs text-[#6B7773]">{course.description || "ไม่มีคำอธิบาย"}</p>
            {course.category_name && (
              <span className="inline-block rounded-md bg-[#ABD1C6]/25 px-1.5 py-0.5 text-[10px] font-bold text-[#004643]">
                {course.category_name}
              </span>
            )}
            <ReviewNote course={course} compact />
          </div>
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-xs font-medium text-[#26332F]">
        {course.instructor_name || "ไม่ระบุ"}
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1 text-xs text-[#6B7773]">
          <span className="flex items-center gap-1.5 font-medium text-[#26332F]">
            <LuLayers className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
            {lessonCount} บทเรียน
          </span>
          <span className="flex items-center gap-1.5">
            <LuUsers className="h-3.5 w-3.5" aria-hidden="true" />
            {memberCount} ผู้เรียน
          </span>
        </div>
      </td>
      {showStatus && (
        <td className="px-5 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${status.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <CourseVisibilityBadge visibility={course.visibility} className="ml-1" />
          <p className="mt-1 text-[11px] text-[#6B7773]">แก้ไข {formatDate(course.updated_at)}</p>
        </td>
      )}
      <td className="px-5 py-4 w-px">
        <div className="flex flex-nowrap items-center justify-end gap-1.5">
          {canManage && (
            <Link
              to={`/classrooms/${courseId}/manage`}
              className={`${linkBtn} bg-[#ABD1C6] text-[#20302C] hover:bg-[#9bc3b7] shadow-2xs`}
            >
              <LuListTree className="h-3.5 w-3.5" aria-hidden="true" />
              <span>จัดการเนื้อหา</span>
            </Link>
          )}
          {isStudent && course.is_enrolled ? (
            <Link
              to={`/classrooms/${courseId}`}
              className={`${linkBtn} bg-[#004643] text-white hover:bg-[#00332f]`}
            >
              เรียนต่อ
            </Link>
          ) : (
            <Link
              to={`/classrooms/${courseId}`}
              className={iconLink}
              title="ดูหน้าคอร์ส"
              aria-label={`ดูคอร์ส ${course.title}`}
            >
              <LuEye className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
          {isStudent && !course.is_enrolled && onJoin && (
            <button
              type="button"
              onClick={() => onJoin(courseId)}
              disabled={isJoining}
              className={`${linkBtn} bg-[#004643] text-white hover:bg-[#00332f] disabled:opacity-50`}
            >
              {isJoining ? "กำลังลงทะเบียน..." : "ลงทะเบียนเรียน"}
            </button>
          )}
          {canManage && (
            <CourseManageActions
              course={course}
              onEdit={onEdit}
              onStatusAction={onStatusAction}
              onDelete={onDelete}
              busy={isBusy}
              variant="row"
            />
          )}
        </div>
      </td>
    </tr>
  );
}

function CourseTable({
  courses = [],
  showStatus = false,
  canManage = () => false,
  isStudent = false,
  onJoin,
  joiningId,
  onEdit,
  onStatusAction,
  onDelete,
  busyId,
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-[#E5E9E7] bg-white shadow-2xs">
      <table className="w-full text-left text-sm text-[#26332F]">
        <thead className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-xs font-bold text-[#6B7773] whitespace-nowrap">
          <tr>
            <th scope="col" className="px-5 py-3.5">คอร์สเรียน</th>
            <th scope="col" className="px-5 py-3.5">ผู้สอน</th>
            <th scope="col" className="px-5 py-3.5">บทเรียน / ผู้เรียน</th>
            {showStatus && <th scope="col" className="px-5 py-3.5">สถานะ</th>}
            <th scope="col" className="px-5 py-3.5 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E9E7]">
          {courses.map((c) => {
            const id = c.classroom_id || c.id;
            return (
              <CourseTableRow
                key={id}
                course={c}
                showStatus={showStatus}
                canManage={canManage(c)}
                isStudent={isStudent}
                onJoin={onJoin}
                isJoining={joiningId === id}
                onEdit={onEdit}
                onStatusAction={onStatusAction}
                onDelete={onDelete}
                isBusy={busyId === id}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CourseTable;
