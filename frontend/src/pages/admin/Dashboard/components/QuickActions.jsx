import { Link } from "react-router-dom";
import { LuZap, LuPlus, LuShieldCheck, LuChartBar as LuBarChart3 } from "react-icons/lu";

/**
 * QuickActions Component
 * Quick shortcuts for common Super Admin tasks
 * Styled with Primary (#ABD1C6) and Secondary (#FFFFFF / #E5E9E7 border) buttons
 */
function QuickActions({ onAddUser, onCreateCourse, onViewReports }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7]">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#26332F]">
            การดำเนินการด่วน
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            ทางลัดจัดการระบบที่ใช้งานบ่อย
          </p>
        </div>
        <LuZap className="h-4 w-4 text-amber-500" aria-hidden="true" />
      </div>

      {/* Button Grid */}
      <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Primary: + Add User */}
        <Link
          to="/admin/users"
          onClick={onAddUser}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#ABD1C6] px-4 py-3 text-xs sm:text-sm font-bold text-[#26332F] shadow-2xs hover:bg-[#9bc3b7] active:scale-98 transition duration-150 cursor-pointer"
        >
          <LuPlus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span>เพิ่มผู้ใช้งาน</span>
        </Link>

        {/* Primary: + Create Course */}
        <Link
          to="/classrooms"
          onClick={onCreateCourse}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#ABD1C6] px-4 py-3 text-xs sm:text-sm font-bold text-[#26332F] shadow-2xs hover:bg-[#9bc3b7] active:scale-98 transition duration-150 cursor-pointer"
        >
          <LuPlus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span>สร้างคอร์สเรียน</span>
        </Link>

        {/* Secondary: Manage Roles */}
        <Link
          to="/admin/roles"
          className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E9E7] bg-white px-4 py-3 text-xs sm:text-sm font-bold text-[#26332F] shadow-2xs hover:bg-[#ABD1C6]/20 active:scale-98 transition duration-150 cursor-pointer"
        >
          <LuShieldCheck className="h-4 w-4 text-[#004643]" aria-hidden="true" />
          <span>จัดการสิทธิ์ผู้ใช้</span>
        </Link>

        {/* Secondary: View Reports */}
        <a
          href="#reports"
          onClick={onViewReports}
          className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E9E7] bg-white px-4 py-3 text-xs sm:text-sm font-bold text-[#26332F] shadow-2xs hover:bg-[#ABD1C6]/20 active:scale-98 transition duration-150 cursor-pointer"
        >
          <LuBarChart3 className="h-4 w-4 text-[#004643]" aria-hidden="true" />
          <span>ดูรายงานสรุป</span>
        </a>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#E5E9E7] flex items-center justify-between text-xs text-[#6B7773]">
        <span>เข้าถึงฟังก์ชันหลักของผู้ดูแลระบบอย่างรวดเร็ว</span>
        <span className="text-[#26332F] font-semibold">4 รายการ</span>
      </div>
    </div>
  );
}

export default QuickActions;
