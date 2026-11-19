import SectionHeader from "../../../../components/layout/SectionHeader";
import CourseCard from "../../../../features/courses/components/CourseCard";
import { LuBookOpen } from "react-icons/lu";

export default function EnrolledCoursesSection({ courses = [], loading = false }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-[#E5E9E7] bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-44 bg-gray-100 rounded-2xl"></div>
          <div className="h-44 bg-gray-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionHeader
        title="คอร์สเรียนที่คุณกำลังเรียน"
        subtitle="เข้าสู่บทเรียนและเรียนรู้อย่างต่อเนื่อง"
        actionText="ดูคอร์สทั้งหมด"
        actionLink="/classrooms"
        icon={LuBookOpen}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id || course.classroom_id}
            course={{ ...course, is_enrolled: true }}
            role="student"
          />
        ))}
      </div>
    </section>
  );
}
