import { useState } from "react";
import { LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";
import QuizzesHeader from "./components/QuizzesHeader";
import QuizzesMetricsSection from "./components/QuizzesMetricsSection";
import QuizzesFilters from "./components/QuizzesFilters";
import QuizzesTable from "./components/QuizzesTable";

/**
 * Quizzes Page Component (Admin Quiz & Assessment Management)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * 
 * สถานะทางสถาปัตยกรรม (Architecture Status): LIMITATION
 * ข้อจำกัดของระบบ: ปัจจุบันระบบ Backend ยังไม่มี API Endpoint และ Database Schema สำหรับจัดการแบบทดสอบส่วนกลาง (Quizzes Management)
 * ข้อมูลที่แสดงในหน้านี้เป็น Mock Data สำหรับการแสดงผลเลย์เอาต์ UI เท่านั้น ไม่มีการบันทึกลงฐานข้อมูลจริง
 */
function Quizzes() {
  const [search, setSearch] = useState("");

  const sampleQuizzes = [
    {
      id: "quiz-01",
      title: "Python Fundamentals & Data Structures Quiz",
      course: "Python Programming Masterclass",
      questionsCount: 15,
      passScore: 80,
      durationMinutes: 30,
      status: "active",
      attempts: 324,
    },
    {
      id: "quiz-02",
      title: "React Component Lifecycle & Hooks Evaluation",
      course: "Full-Stack Web Development",
      questionsCount: 20,
      passScore: 80,
      durationMinutes: 45,
      status: "active",
      attempts: 218,
    },
    {
      id: "quiz-03",
      title: "Database Design & PostgreSQL Indexing",
      course: "Backend Architecture & Databases",
      questionsCount: 12,
      passScore: 75,
      durationMinutes: 25,
      status: "active",
      attempts: 145,
    },
    {
      id: "quiz-04",
      title: "API Security & JWT Token Lifecycle",
      course: "Cloud & Cybersecurity Essentials",
      questionsCount: 10,
      passScore: 85,
      durationMinutes: 20,
      status: "draft",
      attempts: 0,
    },
  ];

  const filtered = sampleQuizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.course.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateQuiz = () => {
    alert("ข้อจำกัดระบบ (LIMITATION): ฟีเจอร์สร้างแบบทดสอบส่วนกลางยังไม่มี Backend API รองรับในเวอร์ชันปัจจุบัน");
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
              ฟีเจอร์จัดการแบบทดสอบส่วนกลาง (Quizzes Management) ยังไม่มี Backend API และ Database Schema รองรับในเวอร์ชันปัจจุบัน ข้อมูลที่แสดงผลด้านล่างเป็นข้อมูลตัวอย่าง (Mock Data) สำหรับการพรีวิวเลย์เอาต์หน้าจอเท่านั้น และจะไม่ถูกบันทึกหรือคงอยู่จริงหลังรีเฟรช
            </p>
          </div>
        </div>
      </div>

      {/* 1. Page Header */}
      <QuizzesHeader onCreateQuiz={handleCreateQuiz} />

      {/* 2. Overview Metrics */}
      <QuizzesMetricsSection />

      {/* 3. Search Bar */}
      <QuizzesFilters search={search} onSearchChange={setSearch} />

      {/* 4. Quizzes Table */}
      <QuizzesTable quizzes={filtered} />
    </div>
  );
}

export default Quizzes;
