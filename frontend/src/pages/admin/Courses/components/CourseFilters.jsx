import { LuSearch } from "react-icons/lu";

/**
 * CourseFilters Component
 * ค้นหาคอร์สเรียนและกรองตามสถานะ
 */
function CourseFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  count,
}) {
  const statusOptions = [
    { value: "all", label: "สถานะทั้งหมด" },
    { value: "published", label: "เผยแพร่แล้ว" },
    { value: "draft", label: "ฉบับร่าง" },
    { value: "pending", label: "รอตรวจสอบ" },
    { value: "inactive", label: "ปิดการเผยแพร่" },
  ];

  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <LuSearch className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่อคอร์สเรียน คำอธิบาย หรือผู้สอน..."
          className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773]/70 focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
        />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-[#6B7773] whitespace-nowrap font-medium">
          พบ {count} คอร์ส
        </span>
      </div>
    </div>
  );
}

export default CourseFilters;
