import { LuBookMarked, LuUsers } from "react-icons/lu";

/**
 * ClassroomTabs Component
 * Tab switcher between Lessons and Members.
 */
function ClassroomTabs({ activeTab, onTabChange, lessonsCount, membersCount }) {
  return (
    <div className="flex border-b border-gray-200 gap-8 text-sm font-semibold">
      <button
        onClick={() => onTabChange("lessons")}
        type="button"
        className={`pb-3 transition cursor-pointer inline-flex items-center gap-1.5 ${
          activeTab === "lessons"
            ? "border-b-2 border-[#456F65] text-[#20302C]"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <LuBookMarked className="h-4 w-4" aria-hidden="true" />
        <span>บทเรียนทั้งหมด ({lessonsCount})</span>
      </button>
      <button
        onClick={() => onTabChange("members")}
        type="button"
        className={`pb-3 transition cursor-pointer inline-flex items-center gap-1.5 ${
          activeTab === "members"
            ? "border-b-2 border-[#456F65] text-[#20302C]"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        <LuUsers className="h-4 w-4" aria-hidden="true" />
        <span>สมาชิกในห้องเรียน ({membersCount})</span>
      </button>
    </div>
  );
}

export default ClassroomTabs;
