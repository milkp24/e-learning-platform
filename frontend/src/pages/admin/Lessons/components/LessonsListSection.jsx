import { LuBookOpen } from "react-icons/lu";
import LessonItem from "./LessonItem";

/**
 * LessonsListSection Component
 * Curriculum outline container displaying chapter count and list of LessonItem cards,
 * with loading, error, and empty states.
 */
function LessonsListSection({
  lessons,
  loadingLessons,
  error,
  selectedCourse,
}) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#26332F]">
            โครงสร้างบทเรียน (Curriculum Outline)
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            {selectedCourse ? selectedCourse.title : "กรุณาเลือกหลักสูตร"}
          </p>
        </div>
        <span className="rounded-full bg-[#FAFAFA] border border-[#E5E9E7] px-3 py-1 font-mono text-xs font-bold text-[#26332F]">
          {lessons.length} Chapters
        </span>
      </div>

      {loadingLessons ? (
        <div className="py-14 text-center space-y-2">
          <div className="inline-flex h-7 w-7 animate-spin rounded-full border-3 border-[#E5E9E7] border-t-[#ABD1C6]" />
          <p className="text-xs text-[#6B7773]">กำลังโหลดข้อมูลบทเรียน...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-rose-600 text-xs font-bold">
          {error}
        </div>
      ) : lessons.length === 0 ? (
        <div className="py-16 text-center space-y-2">
          <LuBookOpen className="mx-auto h-8 w-8 text-[#6B7773]" aria-hidden="true" />
          <h4 className="text-sm font-bold text-[#26332F]">ยังไม่มีบทเรียนในหลักสูตรนี้</h4>
          <p className="text-xs text-[#6B7773]">
            สามารถเพิ่มบทเรียนและตอนย่อยใหม่ในหน้ารายละเอียดคอร์ส
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, idx) => (
            <LessonItem
              key={lesson.lesson_id || lesson.id || idx}
              lesson={lesson}
              index={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}


export default LessonsListSection;
