import { useState, useEffect } from "react";
import useAuthStore from "../../../store/useAuthStore";
import { classroomService } from "../../../services/classroomService";
import InstructorWelcomeSection from "./components/InstructorWelcomeSection";
import InstructorStatsSection from "./components/InstructorStatsSection";
import InstructorCoursesSection from "./components/InstructorCoursesSection";
import InstructorActivitySection from "./components/InstructorActivitySection";

// ======================================================
// InstructorHome Component (หน้าหลักสำหรับอาจารย์ / Pure Page Content)
// URL: /instructor/home
// ======================================================
// แสดงผลเป็น Pure Page Content ภายใต้ InstructorLayout
// - ไม่ Render Navbar, Sidebar หรือ Footer ภายในตัวเอง
// - 1. Welcome Section & Instructor Stats
// - 2. My Courses: คอร์สที่รับผิดชอบ พร้อมปุ่มจัดการคอร์ส
// - 3. Student Progress Overview: สรุปภาพรวมผู้เรียน
// - 4. Recent Activity: ประวัติการอัปเดตและนักเรียนใหม่

function InstructorHome() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const displayName =
    user?.profile?.display_name || user?.email || "อาจารย์ผู้สอน";

  useEffect(() => {
    let isMounted = true;
    const fetchInstructorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await classroomService.getInstructorDashboard();
        if (isMounted && data) {
          setCourses(data.courses || []);
          setTotalStudents(data.totalStudents || 0);
          setTotalLessons(data.totalLessons || 0);
          setActivities(data.recentActivities || []);
        }
      } catch (err) {
        console.error("Failed to fetch instructor dashboard data:", err);
        if (isMounted) {
          setError("ไม่สามารถโหลดข้อมูลผู้สอนได้ในขณะนี้");
          setCourses([]);
          setTotalStudents(0);
          setTotalLessons(0);
          setActivities([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInstructorData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* 1. Welcome Section */}
      <InstructorWelcomeSection displayName={displayName} />

      {/* Error alert if any */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {loading && !error && (
        <div className="rounded-xl border border-[#ABD1C6]/30 bg-white p-4 text-xs text-[#6B7773] animate-pulse">
          กำลังโหลดข้อมูลภาพรวมผู้สอน...
        </div>
      )}

      {/* 2. สถิติภาพรวมของผู้สอน */}
      <InstructorStatsSection
        coursesCount={courses.length}
        totalStudents={totalStudents}
        totalLessons={totalLessons}
      />

      {/* 3. คอร์สเรียนที่สอน (My Courses) & ฟีดกิจกรรม */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* คอลัมน์ซ้าย (7 cols): My Courses */}
        <div className="lg:col-span-7">
          <InstructorCoursesSection courses={courses} />
        </div>

        {/* คอลัมน์ขวา (5 cols): Activity Feed */}
        <div className="lg:col-span-5">
          <InstructorActivitySection activities={activities} />
        </div>
      </div>
    </div>
  );
}

export default InstructorHome;
