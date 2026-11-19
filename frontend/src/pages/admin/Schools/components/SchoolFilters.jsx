import { LuSearch } from "react-icons/lu";

/**
 * SchoolFilters Component
 * Search input and status filter for School Management
 */
function SchoolFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onSearchSubmit,
}) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
        {/* Search Form */}
        <form onSubmit={onSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <LuSearch className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาด้วยชื่อโรงเรียน หรือ รหัสโรงเรียน..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-white pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773]/70 focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-2xs"
          >
            ค้นหา
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="school-status-filter" className="text-xs font-bold text-[#6B7773] whitespace-nowrap">
              สถานะ:
            </label>
            <select
              id="school-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#E5E9E7] bg-white px-3 py-2 text-xs font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs cursor-pointer"
            >
              <option value="">ทุกสถานะ</option>
              <option value="active">Active (เปิดใช้งาน)</option>
              <option value="inactive">Inactive (ระงับการใช้งาน)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SchoolFilters;
