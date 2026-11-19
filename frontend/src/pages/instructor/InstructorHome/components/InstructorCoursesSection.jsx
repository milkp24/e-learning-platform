import SectionHeader from "../../../../components/layout/SectionHeader";
import CourseCard from "../../../../features/courses/components/CourseCard";

function InstructorCoursesSection({ courses = [] }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="คอร์สเรียนที่คุณรับผิดชอบ"
        subtitle="จัดการเนื้อหาบทเรียนและโครงสร้าง 4 ระดับชั้น"
        actionText="ดูห้องเรียนทั้งหมด"
        actionLink="/classrooms"
      />
      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E9E7] bg-white p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-[#26332F]">
            ยังไม่มีคอร์สเรียนที่รับผิดชอบ
          </p>
          <p className="text-xs text-[#6B7773]">
            เริ่มต้นสร้างคอร์สแรกของคุณเพื่อเริ่มจัดการเรียนการสอน
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c, idx) => (
            <CourseCard
              key={c.id || c.classroom_id || idx}
              course={c}
              role="instructor"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default InstructorCoursesSection;
