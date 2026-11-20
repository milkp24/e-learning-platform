import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { LuRefreshCw, LuArrowRight, LuBookOpen } from "react-icons/lu";
import classroomService from "../../../../services/classroomService";
import CourseCard from "../../../../features/courses/components/CourseCard";
import { isPublishedStatus } from "../../../../features/courses/utils/courseStatus";
import useAuthStore from "../../../../store/useAuthStore";

// หน้าแรกแสดงตัวอย่างคอร์ส 3 คอร์สล่าสุดที่เผยแพร่แล้ว ที่เหลือดูได้จาก "ดูคอร์สทั้งหมด"
const SHOWCASE_LIMIT = 3;

/**
 * RecommendedCoursesSection Component (Course Preview)
 * - Section Transition: เข้าสู่โซนคอร์สด้วย Soft Jade Background (#F4F8F6) และชิป "EXPLORE COURSES"
 * - Header: "เริ่มต้นการเรียนรู้จากคอร์สของเรา" (ไม่ใช้ "คอร์สล่าสุด" หรือ "Latest Courses")
 * - Subtitle: "เลือกคอร์สที่สนใจและเริ่มต้นพัฒนาทักษะผ่านการลงมือทำจริง"
 * - ข้อมูลจริงจาก Course API / Database 100% (ห้าม Mock หรือ Hardcode)
 * - แสดงเฉพาะคอร์สที่เผยแพร่แล้ว 3 คอร์สล่าสุด (API เรียงจากใหม่ไปเก่าอยู่แล้ว)
 *   แม้ผู้สอน/แอดมินที่ล็อกอินจะได้รายการที่มีฉบับร่างของตัวเองมาด้วย ก็ไม่แสดงที่หน้านี้
 * - การ์ดปรับตามบทบาทของผู้ที่ล็อกอิน (Guest / ผู้เรียน / ผู้สอน / แอดมิน)
 * - Layout ปรับตามจำนวนคอร์สจริง:
 *   * 1 Course -> ขนาดพอดี (max-w-md) ไม่ขยายเต็มจอ เหลือพื้นที่หายใจอย่างตั้งใจ
 *   * 2 Courses -> จัด 2 Cards สมดุล
 *   * 3+ Courses -> Grid 3 คอลัมน์
 *   * 0 Courses -> แสดง Empty State
 */
function RecommendedCoursesSection() {
  const { isAuthenticated, hasRole } = useAuthStore();
  const role = !isAuthenticated
    ? "guest"
    : hasRole("admin") || hasRole("super_admin")
    ? "admin"
    : hasRole("instructor")
    ? "instructor"
    : "student";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classroomService.getClassrooms();
      const realClassrooms = data.courses || data.classrooms || [];
      // แสดงเฉพาะข้อมูลที่มีอยู่จริงในระบบเท่านั้น (ห้าม Mock เพิ่มเติม)
      setCourses(realClassrooms.filter((c) => isPublishedStatus(c.status)).slice(0, SHOWCASE_LIMIT));
    } catch (err) {
      console.error("Failed to fetch real courses from database:", err);
      setError("ไม่สามารถโหลดคอร์สได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="relative bg-[#F4F8F6] border-b border-[#E5E9E7]">
      {/* ======================================================== */}
      {/* 12. Section Transition: Hero -> Explore Learning Divider  */}
      {/* ======================================================== */}
      <div className="relative flex items-center justify-center -top-3.5 z-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ABD1C6] bg-white px-4 py-1 text-[11px] font-semibold tracking-wider uppercase text-[#004643] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#004643]" aria-hidden="true" />
          <span>EXPLORE COURSES</span>
        </div>
      </div>

      <section
        id="recommended-courses"
        className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 scroll-mt-20"
      >
        {/* Anchor compatibility */}
        <span id="course-preview" className="sr-only" aria-hidden="true" />
        <span id="courses-discovery" className="sr-only" aria-hidden="true" />

        {/* ======================================================== */}
        {/* 11. Section Header: "เริ่มต้นการเรียนรู้จากคอร์สของเรา"   */}
        {/* ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5E9E7] pb-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#26332F] tracking-tight">
              เริ่มต้นการเรียนรู้จากคอร์สของเรา
            </h2>
            <p className="text-sm sm:text-base text-[#6B7773] leading-relaxed">
              เลือกคอร์สที่สนใจและเริ่มต้นพัฒนาทักษะผ่านการลงมือทำจริง
            </p>
          </div>

          <Link
            to="/classrooms"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#004643] hover:text-[#003835] group self-start sm:self-auto transition duration-200"
          >
            <span>ดูคอร์สทั้งหมด</span>
            <LuArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        {/* 2. Loading State (Skeletons) */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-[#E5E9E7] bg-white p-5 space-y-4 animate-pulse shadow-xs"
              >
                <div className="aspect-video w-full rounded-xl bg-gray-200" />
                <div className="h-4 w-3/4 rounded-md bg-gray-200" />
                <div className="h-3 w-full rounded-md bg-gray-100" />
                <div className="h-3 w-5/6 rounded-md bg-gray-100" />
                <div className="pt-4 border-t border-gray-100 flex justify-between">
                  <div className="h-8 w-24 rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Error Alert (พร้อมปุ่ม Retry) */}
        {!loading && error && (
          <div className="flex items-center justify-between rounded-2xl bg-white border border-[#E5E9E7] p-5 text-xs sm:text-sm text-[#26332F] shadow-xs">
            <span className="text-[#6B7773]">{error}</span>
            <button
              type="button"
              onClick={fetchCourses}
              className="inline-flex items-center gap-1.5 font-semibold text-[#004643] underline hover:no-underline cursor-pointer"
            >
              <LuRefreshCw className="h-3.5 w-3.5" />
              <span>ลองใหม่อีกครั้ง</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 10. Course Preview Layout: Dynamic ตามจำนวนคอร์สจริง     */}
        {/* ======================================================== */}
        {!loading && !error && courses.length > 0 && (
          <div>
            {courses.length === 1 ? (
              // 1 Course -> ขนาดพอดี (max-w-sm sm:max-w-md) ไม่ขยายเต็มหน้าจอ
              <div className="max-w-sm sm:max-w-md mx-auto lg:mx-0">
                <CourseCard
                  course={courses[0]}
                  role={role}
                  canManage={Boolean(courses[0].can_manage)}
                />
              </div>
            ) : courses.length === 2 ? (
              // 2 Courses -> จัด 2 Cards อย่างสมดุล
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {courses.map((c) => (
                  <CourseCard
                    key={c.id || c.classroom_id || c.course_id}
                    course={c}
                    role={role}
                    canManage={Boolean(c.can_manage)}
                  />
                ))}
              </div>
            ) : (
              // 3+ Courses -> จัด Grid 3 คอลัมน์
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <CourseCard
                    key={c.id || c.classroom_id || c.course_id}
                    course={c}
                    role={role}
                    canManage={Boolean(c.can_manage)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Empty State (เมื่อไม่มีคอร์สในระบบ) */}
        {!loading && !error && courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#ABD1C6] bg-white p-12 text-center space-y-4 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#ABD1C6]/20 text-[#004643] flex items-center justify-center mx-auto">
              <LuBookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#26332F]">
                ยังไม่มีคอร์สที่เปิดให้เรียนในขณะนี้
              </h3>
              <p className="text-xs text-[#6B7773] max-w-sm mx-auto leading-relaxed">
                บทเรียนใหม่กำลังอยู่ระหว่างการจัดเตรียม คุณสามารถสำรวจห้องเรียนทั้งหมดเพื่อตรวจสอบเพิ่มเติม
              </p>
            </div>
            <div>
              <Link
                to="/classrooms"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004643] hover:underline"
              >
                <span>ดูคอร์สทั้งหมด</span>
                <LuArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default RecommendedCoursesSection;
