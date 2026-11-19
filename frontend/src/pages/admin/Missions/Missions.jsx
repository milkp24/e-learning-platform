import { useState } from "react";
import { LuSprout, LuFlame, LuTarget, LuPenLine, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";
import MissionsHeader from "./components/MissionsHeader";
import MissionsMetricsSection from "./components/MissionsMetricsSection";
import MissionsFilters from "./components/MissionsFilters";
import MissionsList from "./components/MissionsList";

/**
 * Missions Page Component (Admin Missions & Gamification Management)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * 
 * สถานะทางสถาปัตยกรรม (Architecture Status): LIMITATION
 * ข้อจำกัดของระบบ: ปัจจุบันระบบ Backend ยังไม่มี API Endpoint และ Database Schema สำหรับจัดการภารกิจ (Missions)
 * ข้อมูลที่แสดงในหน้านี้เป็น Mock Data สำหรับการแสดงผลเลย์เอาต์ UI เท่านั้น ไม่มีการบันทึกลงฐานข้อมูลจริง
 */
function Missions() {
  const [search, setSearch] = useState("");

  const sampleMissions = [
    {
      id: "m-01",
      title: "First Steps into Coding",
      description: "เรียนจบบทเรียนแรกของหลักสูตรใดก็ได้ในระบบ",
      category: "Onboarding",
      xp: 150,
      badge: "Seedling",
      badgeIcon: LuSprout,
      status: "active",
      completions: 894,
    },
    {
      id: "m-02",
      title: "7-Day Learning Streak",
      description: "เข้าสู่ระบบและเรียนต่อเนื่องติดต่อกันครบ 7 วัน",
      category: "Consistency",
      xp: 500,
      badge: "Dedicated",
      badgeIcon: LuFlame,
      status: "active",
      completions: 342,
    },
    {
      id: "m-03",
      title: "Quiz Master",
      description: "ทำคะแนนแบบทดสอบได้เต็ม 100% ในความพยายามครั้งแรก",
      category: "Achievement",
      xp: 300,
      badge: "Marksman",
      badgeIcon: LuTarget,
      status: "active",
      completions: 215,
    },
    {
      id: "m-04",
      title: "Reflective Scholar",
      description: "เขียนบันทึกการเรียนรู้ครบ 5 เรื่อง",
      category: "Journal",
      xp: 250,
      badge: "Thinker",
      badgeIcon: LuPenLine,
      status: "active",
      completions: 461,
    },
  ];

  const filtered = sampleMissions.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateMission = () => {
    alert("ข้อจำกัดระบบ (LIMITATION): ฟีเจอร์สร้างภารกิจยังไม่มี Backend API และฐานข้อมูลรองรับในเวอร์ชันปัจจุบัน");
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
              ฟีเจอร์ระบบภารกิจและการสะสมแต้ม (Missions & Gamification) ยังไม่มี Backend API และ Database Schema รองรับในเวอร์ชันปัจจุบัน ข้อมูลที่แสดงผลด้านล่างเป็นข้อมูลตัวอย่าง (Mock Data) สำหรับการพรีวิวเลย์เอาต์หน้าจอเท่านั้น และจะไม่ถูกบันทึกหรือคงอยู่จริงหลังรีเฟรช
            </p>
          </div>
        </div>
      </div>

      {/* 1. Page Header */}
      <MissionsHeader onCreateMission={handleCreateMission} />

      {/* 2. Overview Metrics */}
      <MissionsMetricsSection />

      {/* 3. Search Bar */}
      <MissionsFilters search={search} onSearchChange={setSearch} />

      {/* 4. Missions List */}
      <MissionsList missions={filtered} />
    </div>
  );
}

export default Missions;
