import { LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";
import ReportsHeader from "./components/ReportsHeader";
import ReportsMetricsSection from "./components/ReportsMetricsSection";
import PopularCoursesSection from "./components/PopularCoursesSection";

/**
 * Reports Page Component (Admin Analytics & Reports)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * 
 * สถานะทางสถาปัตยกรรม (Architecture Status): LIMITATION
 * ข้อจำกัดของระบบ: ปัจจุบันระบบ Backend ยังไม่มี API Endpoint และ Database Schema สำหรับจัดทำรายงานสถิติขั้นสูงและการ Export
 * ข้อมูลที่แสดงในหน้านี้เป็น Mock Data สำหรับการแสดงผลเลย์เอาต์ UI เท่านั้น ไม่มีการบันทึกลงฐานข้อมูลจริง
 */
function Reports() {
  const popularCourses = [
    {
      title: "Python Programming Masterclass",
      enrollments: 450,
      completionRate: 82,
      hours: 1240,
    },
    {
      title: "Full-Stack Web Development (React & Node)",
      enrollments: 380,
      completionRate: 75,
      hours: 980,
    },
    {
      title: "Cloud Architecture & DevOps Basics",
      enrollments: 290,
      completionRate: 68,
      hours: 740,
    },
    {
      title: "Cybersecurity & Network Defense",
      enrollments: 210,
      completionRate: 64,
      hours: 520,
    },
  ];

  const handleExport = (format) => {
    alert(`ข้อจำกัดระบบ (LIMITATION): ฟีเจอร์ส่งออกรายงาน (${format}) ยังไม่มี Backend API และระบบประมวลผลรองรับในปัจจุบัน`);
  };

  return (
    <div className="space-y-6">
      {/* แจ้งเตือนข้อจำกัดทางสถาปัตยกรรม (LIMITATION Alert) */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <LuAlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              สถานะฟีเจอร์: ข้อจำกัดของระบบ (LIMITATION)
            </h4>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              ฟีเจอร์รายงานสถิติขั้นสูงและการส่งออกข้อมูล (Reports & Analytics) ยังไม่มี Backend API และ Database Schema รองรับในเวอร์ชันปัจจุบัน ข้อมูลที่แสดงผลด้านล่างเป็นข้อมูลตัวอย่าง (Mock Data) สำหรับการพรีวิวเลย์เอาต์หน้าจอเท่านั้น และไม่สามารถส่งออกเป็นไฟล์จริงได้
            </p>
          </div>
        </div>
      </div>

      {/* 1. Page Header */}
      <ReportsHeader onExport={handleExport} />

      {/* 2. Overview Metrics */}
      <ReportsMetricsSection />

      {/* 3. Popular Courses Performance */}
      <PopularCoursesSection courses={popularCourses} />
    </div>
  );
}

export default Reports;
