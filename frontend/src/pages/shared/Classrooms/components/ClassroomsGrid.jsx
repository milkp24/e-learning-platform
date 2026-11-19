import { LuBookOpen } from "react-icons/lu";
import ClassroomCard from "./ClassroomCard";

/**
 * ClassroomsGrid Component
 * Grid displaying real classrooms from database with loading, error, and empty states.
 * 100% Real Database Data without mock or hardcoded courses.
 */
function ClassroomsGrid({
  classrooms,
  loading,
  error,
  onRetry,
  user,
  hasRole,
  onJoin,
  joiningId,
  hasAnyCourse = false,
}) {
  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#ABD1C6] border-r-transparent mb-2"></div>
        <p className="text-sm">กำลังโหลดข้อมูลห้องเรียน...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center text-red-700">
        <p className="font-semibold">{error}</p>
        <button
          onClick={onRetry}
          className="mt-3 text-xs underline hover:text-red-900 font-medium cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // มีคอร์สในระบบ แต่ไม่ตรงกับตัวกรอง
  if (hasAnyCourse && (!classrooms || classrooms.length === 0)) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5E9E7] bg-white p-10 text-center text-sm text-[#6B7773]">
        ไม่พบคอร์สที่ตรงกับตัวกรอง ลองเปลี่ยนหมวดหมู่หรือคำค้นหา
      </div>
    );
  }

  if (!classrooms || classrooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ABD1C6] bg-white p-12 text-center space-y-4 shadow-xs">
        <div className="h-12 w-12 rounded-2xl bg-[#ABD1C6]/20 text-[#004643] flex items-center justify-center mx-auto">
          <LuBookOpen className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#26332F]">
            ยังไม่มีคอร์สที่เปิดให้เรียนในขณะนี้
          </h3>
          <p className="text-xs text-[#6B7773] max-w-sm mx-auto leading-relaxed">
            บทเรียนใหม่กำลังอยู่ระหว่างการจัดเตรียมจากผู้สอน กรุณากลับมาตรวจสอบอีกครั้ง
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classrooms.map((c) => {
        const isOwner = user && String(c.instructor_id) === String(user.user_id);
        const isStudent = hasRole("student") && !hasRole("instructor") && !hasRole("admin");

        return (
          <ClassroomCard
            key={c.classroom_id || c.id}
            classroom={c}
            isOwner={isOwner}
            isStudent={isStudent}
            onJoin={onJoin}
            isJoining={joiningId === (c.classroom_id || c.id)}
          />
        );
      })}
    </div>
  );
}

export default ClassroomsGrid;
