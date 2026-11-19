import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuBookOpen,
  LuLayoutGrid,
  LuList,
  LuLayers,
  LuUsers,
  LuListTree,
  LuPencil as LuEdit3,
  LuTrash2,
  LuEye,
} from "react-icons/lu";
import CourseTableRow from "./CourseTableRow";

/**
 * CourseTable Component
 * รองรับทั้งโหมด Table View และ Card View เพื่อความยืดหยุ่นบน Desktop, Tablet และ Mobile
 */
function CourseTable({
  courses,
  isLoading,
  error,
  onRetry,
  onEdit,
  onTogglePublish,
  onDelete,
}) {
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  return (
    <div className="space-y-4">
      {/* ส่วนควบคุมมุมมอง (Table vs Cards) */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[#6B7773]">
          แสดงคอร์สเรียนทั้งหมด {courses.length} รายการ
        </p>
        <div className="flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              viewMode === "table"
                ? "bg-[#ABD1C6] text-[#20302C]"
                : "text-[#6B7773] hover:text-[#26332F]"
            }`}
          >
            <LuList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ตาราง</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              viewMode === "cards"
                ? "bg-[#ABD1C6] text-[#20302C]"
                : "text-[#6B7773] hover:text-[#26332F]"
            }`}
          >
            <LuLayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">การ์ด</span>
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-3 border-[#E5E9E7] border-t-[#ABD1C6]" />
            <p className="text-xs sm:text-sm font-medium text-[#6B7773]">
              กำลังโหลดข้อมูลคอร์สเรียน...
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9bc3b7] transition cursor-pointer"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <LuBookOpen className="mx-auto h-8 w-8 text-[#6B7773]" aria-hidden="true" />
            <h4 className="text-sm font-bold text-[#26332F]">ไม่พบคอร์สเรียน</h4>
            <p className="text-xs text-[#6B7773]">
              ยังไม่มีคอร์สเรียนในระบบ หรือไม่พบข้อมูลตามคำค้นหาที่ระบุ
            </p>
          </div>
        ) : viewMode === "cards" ? (
          /* Card View */
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((c) => {
              const courseId = c.classroom_id || c.id;
              const thumbnail = c.thumbnail_url || c.cover_image;
              const lessonCount = c.lesson_count ?? c.chapter_count ?? 0;
              const studentCount = c.student_count ?? c.member_count ?? 0;
              const isPublished =
                (c.status || "active").toLowerCase() === "active" ||
                (c.status || "").toLowerCase() === "published";

              return (
                <div
                  key={courseId}
                  className="flex flex-col justify-between rounded-2xl border border-[#E5E9E7] bg-white overflow-hidden shadow-2xs hover:shadow-md transition"
                >
                  <div>
                    {/* รูปปก */}
                    <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={c.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#ABD1C6]/30 text-[#004643]">
                          <LuBookOpen className="h-8 w-8" />
                        </div>
                      )}
                      <span
                        className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isPublished
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                      </span>
                    </div>

                    {/* ข้อมูล */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-[#26332F] line-clamp-1">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[#6B7773] line-clamp-2">
                        {c.description || "ไม่มีคำอธิบาย"}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[#6B7773] pt-2 border-t border-[#E5E9E7]">
                        <span className="flex items-center gap-1 font-medium text-[#26332F]">
                          <LuLayers className="h-3.5 w-3.5 text-[#004643]" />
                          {lessonCount} บทเรียน
                        </span>
                        <span className="flex items-center gap-1">
                          <LuUsers className="h-3.5 w-3.5" />
                          {studentCount} ผู้เรียน
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions ด้านล่างการ์ด */}
                  <div className="p-3 bg-[#FAFAFA] border-t border-[#E5E9E7] flex items-center justify-between gap-1.5">
                    <Link
                      to={`/classrooms/${courseId}/manage`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#ABD1C6] px-3 py-1.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition shadow-2xs"
                    >
                      <LuListTree className="h-3.5 w-3.5" />
                      <span>จัดการเนื้อหา</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link
                        to={`/classrooms/${courseId}`}
                        className="rounded-lg p-1.5 text-[#6B7773] hover:bg-gray-200 transition"
                        title="ดูหน้าห้องเรียน"
                      >
                        <LuEye className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="rounded-lg p-1.5 text-[#6B7773] hover:bg-gray-200 transition"
                        title="แก้ไขคอร์ส"
                      >
                        <LuEdit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c)}
                        className="rounded-lg p-1.5 text-[#6B7773] hover:bg-rose-50 hover:text-rose-600 transition"
                        title="ลบคอร์ส"
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#26332F]">
              <thead className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-xs font-bold uppercase tracking-wider text-[#6B7773]">
                <tr>
                  <th className="px-6 py-4">คอร์สเรียน</th>
                  <th className="px-6 py-4">ผู้สอน</th>
                  <th className="px-6 py-4">บทเรียน / ผู้เรียน</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4">แก้ไขล่าสุด</th>
                  <th className="px-6 py-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9E7]">
                {courses.map((c) => {
                  const courseId = c.classroom_id || c.id;
                  return (
                    <CourseTableRow
                      key={courseId}
                      course={c}
                      onEdit={onEdit}
                      onTogglePublish={onTogglePublish}
                      onDelete={onDelete}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseTable;
