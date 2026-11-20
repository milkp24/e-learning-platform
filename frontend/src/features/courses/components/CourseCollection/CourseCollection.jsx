import { LuBookOpen } from "react-icons/lu";
import CourseCard from "../CourseCard";
import CourseTable from "../CourseTable";
import CourseViewToggle from "../CourseViewToggle";

// ======================================================
// CourseCollection — แสดงรายการคอร์สแบบการ์ดหรือตาราง พร้อมปุ่มสลับมุมมอง
// ใช้ร่วมกันทุกหน้าที่เป็นรายการคอร์ส และทุกบทบาท
// role: "guest" | "student" | "instructor" | "admin" (ส่งต่อให้ CourseCard)
// canManage(course): ผู้ใช้จัดการคอร์สนี้ได้หรือไม่ (เจ้าของคอร์ส หรือ Admin)
// ======================================================

function CourseCollection({
  courses = [],
  totalCount,
  layout = "cards",
  onLayoutChange,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = "ไม่พบคอร์สเรียน",
  emptyText = "ลองเปลี่ยนหมวดหมู่ ตัวกรอง หรือคำค้นหา",
  role = "guest",
  canManage = () => false,
  onJoin,
  joiningId,
  onEdit,
  onStatusAction,
  onDelete,
  busyId,
}) {
  const isStudent = role === "student";
  const showStatus = role === "instructor" || role === "admin";

  let body;
  if (isLoading) {
    body = (
      <div className="rounded-3xl border border-[#E5E9E7] bg-white py-16 text-center space-y-3">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-[#E5E9E7] border-t-[#ABD1C6]" />
        <p className="text-sm text-[#6B7773]">กำลังโหลดคอร์สเรียน...</p>
      </div>
    );
  } else if (error) {
    body = (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 py-12 px-4 text-center space-y-3">
        <p className="text-sm font-bold text-rose-700">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition cursor-pointer"
          >
            ลองใหม่อีกครั้ง
          </button>
        )}
      </div>
    );
  } else if (courses.length === 0) {
    body = (
      <div className="rounded-3xl border border-dashed border-[#ABD1C6] bg-white py-14 px-4 text-center space-y-2">
        <LuBookOpen className="mx-auto h-8 w-8 text-[#6B7773]" aria-hidden="true" />
        <h3 className="text-sm font-bold text-[#26332F]">{emptyTitle}</h3>
        <p className="text-xs text-[#6B7773] max-w-md mx-auto">{emptyText}</p>
      </div>
    );
  } else if (layout === "table") {
    body = (
      <CourseTable
        courses={courses}
        showStatus={showStatus}
        canManage={canManage}
        isStudent={isStudent}
        onJoin={onJoin}
        joiningId={joiningId}
        onEdit={onEdit}
        onStatusAction={onStatusAction}
        onDelete={onDelete}
        busyId={busyId}
      />
    );
  } else {
    body = (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => {
          const id = c.classroom_id || c.id;
          const manageable = canManage(c);
          return (
            <CourseCard
              key={id}
              course={c}
              role={role}
              canManage={manageable}
              onEnroll={isStudent ? onJoin : undefined}
              isEnrolling={joiningId === id}
              onEdit={manageable ? onEdit : undefined}
              onStatusAction={manageable ? onStatusAction : undefined}
              onDelete={manageable ? onDelete : undefined}
              isBusy={busyId === id}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-[#6B7773]">
          {isLoading ? " " : `แสดง ${courses.length} จาก ${totalCount ?? courses.length} คอร์ส`}
        </p>
        <CourseViewToggle value={layout} onChange={onLayoutChange} />
      </div>
      {body}
    </div>
  );
}

export default CourseCollection;
