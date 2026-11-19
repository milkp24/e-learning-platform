import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuClock, LuArrowRight, LuBookOpen } from "react-icons/lu";
import classroomService from "../../../../services/classroomService";
import CourseCard from "../../../../features/courses/components/CourseCard";

/**
 * LatestCoursesSection Component (คอร์สล่าสุด)
 * - ดึง Course จาก Database จริง 100%
 * - ห้าม Mock คอร์สปลอม
 * - ถ้ามีน้อยกว่า 3 คอร์ส ก็แสดงเท่าที่มีจริงในระบบ
 * - ถ้าไม่มีคอร์ส ให้ใช้ Empty State
 */
function LatestCoursesSection() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestCourses = async () => {
      setLoading(true);
      try {
        const data = await classroomService.getClassrooms();
        const realClassrooms = data.courses || data.classrooms || [];

        // เรียงลำดับตาม created_at ถ้ามี
        const sorted = [...realClassrooms].sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at);
          }
          return 0;
        });

        if (isMounted) {
          setCourses(sorted.slice(0, 4));
        }
      } catch (err) {
        console.error("Failed to fetch latest courses:", err);
        if (isMounted) {
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLatestCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      id="latest-courses"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 border-t border-[#E5E9E7]"
    >
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3.5 py-1 text-xs font-bold text-[#004643]">
            <LuClock className="h-3.5 w-3.5" />
            <span>อัปเดตบทเรียน</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#26332F] tracking-tight">
            คอร์สล่าสุด
          </h2>
          <p className="text-sm sm:text-base text-[#6B7773] leading-relaxed">
            บทเรียนและหลักสูตรที่เปิดให้บริการล่าสุดในระบบ เพื่อให้คุณทันต่อองค์ความรู้ใหม่
          </p>
        </div>

        <Link
          to="/classrooms"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#004643] hover:underline self-start sm:self-auto"
        >
          <span>ดูคอร์สทั้งหมด</span>
          <LuArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 animate-pulse"
            >
              <div className="aspect-video w-full rounded-xl bg-gray-200" />
              <div className="h-4 w-3/4 rounded-md bg-gray-200" />
              <div className="h-3 w-full rounded-md bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* 3. Real Course Cards Grid (แสดงเฉพาะที่มีจริงในฐานข้อมูล) */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <CourseCard
              key={c.id || c.classroom_id || c.course_id}
              course={c}
              role="guest"
            />
          ))}
        </div>
      )}

      {/* 4. Empty State (เมื่อไม่มีคอร์ส) */}
      {!loading && courses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
          <LuBookOpen className="h-10 w-10 text-gray-400 mx-auto" />
          <p className="text-base font-bold text-gray-700">ยังไม่มีคอร์สใหม่ในขณะนี้</p>
        </div>
      )}
    </section>
  );
}

export default LatestCoursesSection;
