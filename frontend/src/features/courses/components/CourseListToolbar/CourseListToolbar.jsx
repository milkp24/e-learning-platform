import { LuSearch } from "react-icons/lu";

const selectClass =
  "rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition cursor-pointer";

/**
 * CourseListToolbar — แถบตัวกรองและค้นหาคอร์สเรียน (รูปแบบเดียวกับหน้าจัดการเจ้าหน้าที่)
 * ลำดับ: 1 หมวดหมู่ → 2 คอร์สของฉัน/ที่เป็นเจ้าของ → 3 อาจารย์ → 4 ช่องค้นหา
 * children: ตัวกรองเพิ่มเติมของแต่ละหน้า (เช่น สถานะคอร์สในหน้า Admin)
 */
function CourseListToolbar({
  categories = [],
  category = "",
  onCategoryChange,
  viewOptions = [],
  view = "all",
  onViewChange,
  instructors = [],
  instructor = "",
  onInstructorChange,
  search = "",
  onSearchChange,
  count,
  children,
}) {
  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="หมวดหมู่"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={selectClass}
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        {viewOptions.length > 1 && (
          <select
            aria-label="ขอบเขตคอร์ส"
            value={view}
            onChange={(e) => onViewChange(e.target.value)}
            className={selectClass}
          >
            {viewOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {instructors.length > 0 && (
          <select
            aria-label="อาจารย์ผู้สอน"
            value={instructor}
            onChange={(e) => onInstructorChange(e.target.value)}
            className={selectClass}
          >
            <option value="">อาจารย์ทุกคน</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        )}

        {children}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <LuSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาชื่อคอร์ส คำอธิบาย หรือชื่อผู้สอน..."
            className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
          />
        </div>
        {typeof count === "number" && (
          <span className="text-xs text-[#6B7773] whitespace-nowrap font-medium">
            พบ {count} คอร์ส
          </span>
        )}
      </div>
    </div>
  );
}

export default CourseListToolbar;
