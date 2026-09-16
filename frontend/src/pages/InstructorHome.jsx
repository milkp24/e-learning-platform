import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SectionHeader from "../components/SectionHeader";
import CourseCard from "../components/CourseCard";
import StatCard from "../components/StatCard";
import ActivityList from "../components/ActivityList";
import Button from "../components/Button";
import { classroomService } from "../services/classroomService";

// ======================================================
// InstructorHome Component (หน้าหลักสำหรับอาจารย์ / ผู้สอน)
// URL: /instructor/home
// ======================================================
// 1. Welcome Section & Instructor Stats
// 2. My Courses: คอร์สที่รับผิดชอบ พร้อมปุ่มจัดการคอร์ส
// 3. Student Progress Overview: สรุปภาพรวมผู้เรียน
// 4. Recent Activity: ประวัติการอัปเดตและนักเรียนใหม่

const DEFAULT_INSTRUCTOR_COURSE = {
  id: 1,
  title: "IoT 101 — ภารกิจปลุกเมืองให้ฉลาด",
  description:
    "เจาะลึกโลก Internet of Things ตั้งแต่เซนเซอร์จนถึงการมอนิเตอร์เมืองอัจฉริยะ",
  instructor_name: "อาจารย์ผู้สอน",
  student_count: 142,
  lesson_count: 12,
  category: "IoT & Smart City",
  level: "Beginner",
};

function InstructorHome() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);

  const displayName =
    user?.profile?.display_name || user?.email || "อาจารย์ผู้สอน";

  useEffect(() => {
    let isMounted = true;
    const fetchInstructorData = async () => {
      try {
        const allClassrooms = await classroomService.getClassrooms();
        if (isMounted && Array.isArray(allClassrooms)) {
          setCourses(allClassrooms);
        }
      } catch {
        if (isMounted) {
          setCourses([DEFAULT_INSTRUCTOR_COURSE]);
        }
      }
    };

    fetchInstructorData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalStudents = courses.reduce(
    (acc, c) => acc + (c.student_count || 0),
    142
  );
  const totalLessons = courses.reduce(
    (acc, c) => acc + (c.lesson_count || 0),
    12
  );

  const instructorActivities = [
    {
      id: 1,
      title: "นักเรียนใหม่ลงทะเบียน: verify.user@example.com",
      description: "คอร์ส IoT 101 — ภารกิจปลุกเมืองให้ฉลาด",
      timestamp: "วันนี้",
      type: "enrollment",
    },
    {
      id: 2,
      title: "อัปเดตเนื้อหา: Chapter 2 Controller & Hardware Basics",
      description: "แก้ไขรายละเอียดบทเรียน ESP32",
      timestamp: "เมื่อวานนี้",
      type: "lesson",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#1F2937]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8 space-y-10">
        {/* 1. Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                Instructor Console
              </span>
              <span className="text-xs text-gray-400">
                • {new Date().toLocaleDateString("th-TH", { dateStyle: "long" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937]">
              ยินดีต้อนรับอาจารย์ <span className="text-[#004643]">{displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              ศูนย์จัดการคอร์สเรียน ติดตามผู้เรียน และปรับปรุงเนื้อหาบทเรียนของคุณ
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button to="/classrooms" variant="primary" size="md">
              + จัดการห้องเรียน
            </Button>
          </div>
        </div>

        {/* 2. สถิติภาพรวมของผู้สอน */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="คอร์สที่รับผิดชอบ"
            value={courses.length > 0 ? courses.length : 1}
            theme="pine"
            description="คอร์สเรียนที่มีอยู่ในระบบ"
            actionLink="/classrooms"
            actionText="ดูคอร์สทั้งหมด"
          />
          <StatCard
            title="จำนวนนักเรียนรวม"
            value={totalStudents}
            theme="jade"
            trend="+12%"
            trendType="up"
            description="ผู้เรียนที่ลงทะเบียนในห้องของคุณ"
          />
          <StatCard
            title="บทเรียนและเนื้อหาทั้งหมด"
            value={totalLessons}
            theme="blue"
            description="ตอนย่อยเนื้อหา 4 ระดับชั้น"
          />
        </div>

        {/* 3. คอร์สเรียนที่สอน (My Courses) & ฟีดกิจกรรม */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* คอลัมน์ซ้าย (7 cols): My Courses */}
          <div className="lg:col-span-7 space-y-6">
            <SectionHeader
              title="คอร์สเรียนที่คุณรับผิดชอบ"
              subtitle="จัดการเนื้อหาบทเรียนและโครงสร้าง 4 ระดับชั้น"
              actionText="ดูห้องเรียนทั้งหมด"
              actionLink="/classrooms"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(courses.length > 0 ? courses : [DEFAULT_INSTRUCTOR_COURSE]).map(
                (c, idx) => (
                  <CourseCard
                    key={c.id || c.classroom_id || idx}
                    course={c}
                    role="instructor"
                  />
                )
              )}
            </div>
          </div>

          {/* คอลัมน์ขวา (5 cols): Activity Feed */}
          <div className="lg:col-span-5 space-y-6">
            <SectionHeader
              title="กิจกรรมล่าสุดของผู้เรียน"
              subtitle="การลงทะเบียนและส่งงานใหม่ในห้องเรียน"
            />
            <ActivityList
              items={instructorActivities}
              title="Instructor Activity"
              maxItems={5}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default InstructorHome;
