import { LuUser, LuBookOpen, LuFileText } from "react-icons/lu";

/**
 * SystemOverview Component
 * Displays system metrics including active users, published/draft courses,
 * and course completion progress bar styled in Jade (#ABD1C6)
 */
function SystemOverview({ activeUsers = 864, publishedCourses = 28, draftCourses = 8, completionRate = 72 }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7]">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#26332F]">
            ภาพรวมระบบ
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            สถานะและภาพรวมความคืบหน้าระบบ
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3 py-1 text-xs font-bold text-[#26332F]">
          <span className="h-2 w-2 rounded-full bg-[#26332F]" />
          ทำงานปกติ
        </span>
      </div>

      {/* Metrics List */}
      <div className="py-4 space-y-4">
        {/* Active Users */}
        <div className="flex items-center justify-between py-1 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ABD1C6]/25 text-[#004643]">
              <LuUser className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-[#6B7773]">ผู้ใช้งานที่เข้าสู่ระบบได้</span>
          </div>
          <span className="text-base font-black text-[#26332F]">{activeUsers.toLocaleString()}</span>
        </div>

        {/* Published Courses */}
        <div className="flex items-center justify-between py-1 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ABD1C6]/25 text-[#004643]">
              <LuBookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-[#6B7773]">คอร์สที่เผยแพร่แล้ว</span>
          </div>
          <span className="text-base font-black text-[#26332F]">{publishedCourses}</span>
        </div>

        {/* Draft Courses */}
        <div className="flex items-center justify-between py-1 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-[#6B7773]">
              <LuFileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-[#6B7773]">คอร์สฉบับร่าง</span>
          </div>
          <span className="text-base font-black text-[#6B7773]">{draftCourses}</span>
        </div>

        {/* Course Completion Progress Bar */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-[#26332F]">อัตราการเรียนจบเฉลี่ย</span>
            <span className="font-black text-[#26332F]">{completionRate}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-[#E5E9E7] overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-[#ABD1C6] transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[#E5E9E7] flex items-center justify-between text-xs text-[#6B7773]">
        <span>ห้องเรียนทั้งหมด: <strong className="text-[#26332F]">{publishedCourses + draftCourses}</strong></span>
        <span>เฉลี่ย: <strong className="text-[#26332F]">{completionRate}%</strong></span>
      </div>
    </div>
  );
}

export default SystemOverview;
