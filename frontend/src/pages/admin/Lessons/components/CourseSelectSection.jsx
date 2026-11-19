
/**
 * CourseSelectSection Component
 * Dropdown selector for choosing which course's curriculum to manage.
 */
function CourseSelectSection({
  courses,
  selectedCourseId,
  onSelectCourse,
  loadingCourses,
  lessonCount,
  selectedCourse,
}) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 shadow-2xs space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
        เลือกหลักสูตรที่ต้องการจัดการ (Select Course):
      </label>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {loadingCourses ? (
          <div className="text-xs text-[#6B7773]">กำลังโหลดหลักสูตร...</div>
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="w-full sm:max-w-md rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:outline-none transition cursor-pointer shadow-2xs"
          >
            {courses.map((c) => {
              const cId = c.classroom_id || c.id;
              return (
                <option key={cId} value={cId}>
                  {c.title}
                </option>
              );
            })}
          </select>
        )}

        {selectedCourse && (
          <div className="text-xs text-[#6B7773] self-start sm:self-auto font-medium">
            มีทั้งหมด <strong className="text-[#26332F]">{lessonCount}</strong> บทเรียนในคอร์สนี้
          </div>
        )}
      </div>
    </div>
  );
}


export default CourseSelectSection;
