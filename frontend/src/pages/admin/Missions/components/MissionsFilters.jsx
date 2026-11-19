
import { LuSearch } from "react-icons/lu";

/**
 * MissionsFilters Component
 * Search bar for missions by title or category.
 */
function MissionsFilters({ search, onSearchChange }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4 sm:p-5 shadow-2xs">
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <LuSearch className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาชื่อภารกิจ หรือ หมวดหมู่..."
          className="w-full rounded-xl border border-[#E5E9E7] bg-white pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773]/70 focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs"
        />
      </div>
    </div>
  );
}


export default MissionsFilters;
