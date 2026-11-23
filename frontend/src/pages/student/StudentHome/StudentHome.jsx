// นำเข้า React Hooks สำหรับ State
import { useState, useEffect } from "react";
// นำเข้า useAuthStore สำหรับดึงข้อมูลผู้ใช้ที่ล็อกอิน
import useAuthStore from "../../../store/useAuthStore";
import classroomService from "../../../services/classroomService";
// Section Components
import WelcomeSection from "./components/WelcomeSection";
import EnrolledCoursesSection from "./components/EnrolledCoursesSection";
import ToolsPreviewSection from "./components/ToolsPreviewSection";
import LearningFlowSection from "./components/LearningFlowSection";
import DailyQuestsSection from "./components/DailyQuestsSection";

// ======================================================
// StudentHome Component (หน้าหลักของผู้เรียน / Pure Page Content)
// ======================================================
// แสดงผลเป็น Pure Page Content ภายใต้ StudentLayout
// - ไม่ Render Sidebar, Navbar หรือ Footer ภายในตัวเอง
// - มี Welcome Section, Enrolled Courses, Tool Cards, Learning Flow, และ Daily Quests

function StudentHome() {
  const { user } = useAuthStore();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStudentData = async () => {
      try {
        const data = await classroomService.getStudentDashboard();
        if (isMounted && data) {
          setEnrolledCourses(Array.isArray(data.enrolledCourses) ? data.enrolledCourses : []);
          setDailyQuests(Array.isArray(data.dailyQuests) ? data.dailyQuests : []);
        }
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
        // Fallback to my-enrollments if student dashboard endpoint unavailable
        try {
          const enrollData = await classroomService.getMyEnrollments();
          if (isMounted) {
            const list = enrollData?.enrollments || enrollData?.classrooms || [];
            setEnrolledCourses(Array.isArray(list) ? list : []);
            setDailyQuests([]);
          }
        } catch {
          if (isMounted) {
            setEnrolledCourses([]);
            setDailyQuests([]);
          }
        }
      } finally {
        if (isMounted) setLoadingCourses(false);
      }
    };

    fetchStudentData();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "ผู้เรียน";

  const toggleDailyQuest = (id) => {
    setDailyQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: !q.completed } : q))
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. ส่วนต้อนรับผู้เรียน Welcome Section */}
      <WelcomeSection displayName={displayName} user={user} />

      {/* 1.1 คอร์สเรียนที่ลงทะเบียนเรียนไว้ (Enrolled Courses & Continue Learning) */}
      <EnrolledCoursesSection
        courses={enrolledCourses}
        loading={loadingCourses}
      />

      {/* 2. ส่วน Preview Cards 4 หมวดหมู่ */}
      <ToolsPreviewSection />

      {/* 3. ส่วน Learning Flow เส้นทางการเรียนรู้ */}
      <LearningFlowSection />

      {/* 4. ส่วน Daily Quests ตัวอย่าง */}
      <DailyQuestsSection
        dailyQuests={dailyQuests}
        onToggleQuest={toggleDailyQuest}
      />
    </div>
  );
}

export default StudentHome;
