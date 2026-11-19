import { LuTarget, LuTriangleAlert as LuAlertTriangle, LuSearch, LuWrench, LuCheck, LuClock } from "react-icons/lu";

/**
 * MissionCard Component
 * การ์ดภารกิจประจำตอน มีดีไซน์แตกต่างจากการ์ดเนื้อหาปกติ
 * แสดง 5 องค์ประกอบ: เป้าหมาย, ปัญหา, สิ่งที่ต้องค้นหา, สิ่งที่ต้องทำ, และสถานะภารกิจ
 */
function MissionCard({
  title = "ภารกิจประจำบทเรียน",
  target = "ทำความเข้าใจและติดตั้งอุปกรณ์",
  problem = "ยังไม่มีการตรวจวัดค่าในจุดสำคัญ",
  searchFor = "เซนเซอร์ที่เหมาะสมสำหรับการใช้งาน",
  actions = "เลือก ติดตั้ง และทดสอบการทำงานของระบบ",
  status = "in_progress", // 'not_started' | 'in_progress' | 'completed'
  className = "",
}) {
  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
            <LuCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>สำเร็จ</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#004643] px-3.5 py-1 text-xs font-bold text-[#ABD1C6] shadow-2xs">
            <LuClock className="h-4 w-4 animate-spin text-[#ABD1C6]" aria-hidden="true" />
            <span>กำลังดำเนินการ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3.5 py-1 text-xs font-semibold text-gray-600 shadow-2xs">
            <span>ยังไม่เริ่ม</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-2 border-[#004643] bg-white p-6 sm:p-7 shadow-md transition-all hover:shadow-lg ${className}`}
    >
      {/* Accent Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#004643] via-[#ABD1C6] to-[#004643]" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#004643] text-white shadow-sm ring-4 ring-[#ABD1C6]/30">
            <LuTarget className="h-6 w-6 text-[#ABD1C6]" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#004643]">
              ภารกิจปฏิบัติการ (Mission Objective)
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#26332F]">{title}</h3>
          </div>
        </div>

        <div className="self-start sm:self-auto">{getStatusBadge()}</div>
      </div>

      {/* Grid of 4 Dimensions */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. เป้าหมาย */}
        <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 transition hover:border-[#ABD1C6] hover:bg-white">
          <div className="flex items-center gap-2 text-xs font-bold text-[#004643] mb-1.5">
            <LuTarget className="h-4 w-4" aria-hidden="true" />
            <span>เป้าหมาย (Objective)</span>
          </div>
          <p className="text-xs sm:text-sm text-[#26332F] leading-relaxed">{target}</p>
        </div>

        {/* 2. ปัญหา */}
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 transition hover:border-rose-200 hover:bg-rose-50/80">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-700 mb-1.5">
            <LuAlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>ปัญหาที่พบ (Problem)</span>
          </div>
          <p className="text-xs sm:text-sm text-rose-900 leading-relaxed">{problem}</p>
        </div>

        {/* 3. สิ่งที่ต้องค้นหา */}
        <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 transition hover:border-[#ABD1C6] hover:bg-white">
          <div className="flex items-center gap-2 text-xs font-bold text-[#004643] mb-1.5">
            <LuSearch className="h-4 w-4" aria-hidden="true" />
            <span>สิ่งที่ต้องค้นหา (What to Find)</span>
          </div>
          <p className="text-xs sm:text-sm text-[#26332F] leading-relaxed">{searchFor}</p>
        </div>

        {/* 4. สิ่งที่ผู้เรียนต้องทำ */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/80">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1.5">
            <LuWrench className="h-4 w-4" aria-hidden="true" />
            <span>สิ่งที่ต้องลงมือทำ (Actions)</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">{actions}</p>
        </div>
      </div>
    </div>
  );
}

export default MissionCard;
