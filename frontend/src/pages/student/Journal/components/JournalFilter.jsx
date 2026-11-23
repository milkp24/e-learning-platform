import { LuSearch, LuX } from "react-icons/lu";

// ตัวกรองบันทึกการเรียนรู้: คอร์ส → บทเรียน + ช่องค้นหา (ข้อ 27)
const selectClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#6FA99A] focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

function JournalFilter({
  courses,
  courseFilter,
  onCourseChange,
  lessons,
  lessonFilter,
  onLessonChange,
  search,
  onSearchChange,
  onClear,
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
      <div className="space-y-1">
        <label htmlFor="journal-course-filter" className="text-xs font-bold text-gray-700">
          คอร์สเรียน
        </label>
        <select
          id="journal-course-filter"
          value={courseFilter}
          onChange={(e) => onCourseChange(e.target.value)}
          className={selectClass}
        >
          <option value="">ทุกคอร์สเรียน</option>
          {courses.map((c) => (
            <option key={c.classroom_id} value={c.classroom_id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="journal-lesson-filter" className="text-xs font-bold text-gray-700">
          บทเรียน
        </label>
        <select
          id="journal-lesson-filter"
          value={lessonFilter}
          onChange={(e) => onLessonChange(e.target.value)}
          disabled={!courseFilter}
          className={selectClass}
        >
          <option value="">{courseFilter ? "ทุกบทเรียน" : "เลือกคอร์สก่อน"}</option>
          {lessons.map((l) => (
            <option key={l.lesson_id} value={l.lesson_id}>
              {l.title}
              {l.note_count ? ` (${l.note_count})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="journal-search" className="text-xs font-bold text-gray-700">
          ค้นหา
        </label>
        <div className="relative">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            id="journal-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาจากหัวข้อหรือเนื้อหา"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-[#6FA99A] focus:outline-none"
          />
        </div>
      </div>

      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          <LuX className="h-3.5 w-3.5" aria-hidden="true" />
          ล้างตัวกรอง
        </button>
      ) : (
        <span className="hidden sm:block" />
      )}
    </div>
  );
}

export default JournalFilter;
