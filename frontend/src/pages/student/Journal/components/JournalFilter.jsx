function JournalFilter({ selectedCourseFilter, onFilterChange, courses }) {
  return (
    <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <label htmlFor="course-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
        กรองตามคอร์สเรียน:
      </label>
      <select
        id="course-filter"
        value={selectedCourseFilter}
        onChange={onFilterChange}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#6FA99A] focus:outline-none cursor-pointer"
      >
        <option value="">ทั้งหมด (ทุกคอร์สเรียน)</option>
        {courses.map((c) => (
          <option key={c.classroom_id} value={c.classroom_id}>
            {c.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export default JournalFilter;
