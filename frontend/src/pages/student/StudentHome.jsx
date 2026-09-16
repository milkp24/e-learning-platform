// นำเข้า React Hooks สำหรับ State
import { useState } from "react";
// นำเข้า Link สำหรับการเชื่อมโยงหน้า
import { Link } from "react-router-dom";
// นำเข้า useAuthStore สำหรับดึงข้อมูลผู้ใช้ที่ล็อกอิน
import useAuthStore from "../../store/useAuthStore";
// นำเข้า Sidebar สำหรับ Workspace ของ Student
import Sidebar from "../../components/Sidebar";
// นำเข้า Footer สำหรับส่วนท้ายหน้า
import Footer from "../../components/Footer";

// คอมโพเนนต์หน้าหลักสำหรับผู้เรียน (Student Home)
function StudentHome() {
  // ดึงข้อมูลผู้ใช้จาก Zustand Auth Store
  const { user } = useAuthStore();

  // ดึงชื่อแสดงผลของผู้เรียน
  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "ผู้เรียน";

  // ข้อมูลตัวอย่างสำหรับแสดงผล Low-fidelity UI
  // ยังไม่ได้เชื่อมต่อกับ Backend จริง
  const [dailyQuests, setDailyQuests] = useState([
    {
      id: 1,
      title: "เรียนบทเรียน 1 ตอน",
      xp: 20,
      completed: false,
    },
    {
      id: 2,
      title: "ทำแบบทดสอบประจำบท",
      xp: 30,
      completed: false,
    },
    {
      id: 3,
      title: "เข้าเรียนวันนี้",
      xp: 10,
      completed: true,
    },
  ]);

  // ฟังก์ชันสลับสถานะทำ Daily Quest ในฝั่ง UI
  const toggleDailyQuest = (id) => {
    // ปรับปรุงสถานะ completed ของภารกิจที่เลือก
    setDailyQuests((prev) =>
      prev.map((q) => (q.id === id ? { ...q, completed: !q.completed } : q))
    );
  };

  // แสดงผลโครงสร้างหน้า Student Home
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-[#26332F]">
      {/* แถบ Sidebar ทางซ้ายสำหรับ Workspace ของ Student */}
      <Sidebar isGuest={false} />

      {/* พื้นที่ Content ด้านขวาของ Sidebar (Desktop เว้นระยะทางซ้าย lg:pl-64) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* เนื้อหาหลักของหน้า Student Home */}
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* ส่วนต้อนรับผู้เรียน Welcome Section */}
          <section className="rounded-3xl border border-[#E5E7EB] bg-gradient-to-r from-white via-white to-[#ABD1C6]/20 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ABD1C6]/40 px-3.5 py-1 text-xs font-bold text-[#004643]">
              <span>👋</span>
              <span>ผู้เรียน (Student)</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#26332F]">
                สวัสดี 👋 คุณ <span className="text-[#004643]">{displayName}</span>
              </h1>
              {/* ข้อความต้อนรับเข้าสู่ระบบ E-learning Platform */}
              <p className="text-base text-[#6B7773] font-semibold">
                พร้อมเรียนรู้บน E-learning Platform วันนี้หรือยัง?
              </p>
            </div>

            <div>
              <Link
                to="/classrooms"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004643] px-7 py-3 text-sm font-black text-white shadow-xs transition hover:bg-[#003835]"
              >
                <span>🚀</span>
                <span>เริ่มเรียน</span>
              </Link>
            </div>
          </section>

          {/* ส่วน Preview Cards 4 หมวดหมู่ */}
          <section className="space-y-4">
            <h2 className="text-lg font-black text-[#26332F]">
              เครื่องมือการเรียนรู้ของคุณ
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card Courses */}
              <Link
                to="/classrooms"
                className="group rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-2xl">📚</span>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
                    Courses
                  </h3>
                  <p className="text-xs text-[#6B7773]">เรียน IoT ตามลำดับขั้นตอน</p>
                </div>
                <span className="pt-3 text-xs font-bold text-[#004643]">เข้าเรียน →</span>
              </Link>

              {/* Card Virtual Lab */}
              <a
                href="#lab"
                className="group rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-2xl">🧪</span>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
                    Virtual Lab
                  </h3>
                  <p className="text-xs text-[#6B7773]">ทดลองต่อวงจรเสมือนจริง</p>
                </div>
                <span className="pt-3 text-xs font-bold text-cyan-800">เข้าแล็บ →</span>
              </a>

              {/* Card Live */}
              <a
                href="#live"
                className="group rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-2xl">📡</span>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
                    Live
                  </h3>
                  <p className="text-xs text-[#6B7773]">ห้องเรียนถ่ายทอดสด</p>
                </div>
                <span className="pt-3 text-xs font-bold text-rose-800">ดูตาราง →</span>
              </a>

              {/* Card Quest */}
              <a
                href="#quest"
                className="group rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
                    Quest
                  </h3>
                  <p className="text-xs text-[#6B7773]">ภารกิจและคะแนน XP</p>
                </div>
                <span className="pt-3 text-xs font-bold text-amber-800">ดูภารกิจ →</span>
              </a>
            </div>
          </section>

          {/* ส่วน Learning Flow เส้นทางการเรียนรู้ */}
          <section className="rounded-3xl border border-[#E5E7EB] bg-white p-6 space-y-4 shadow-xs">
            <h2 className="text-lg font-black text-[#26332F]">
              เส้นทางการเรียนรู้: เรียนรู้ → ทดลอง → สร้าง → ปลดล็อก
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
                <div className="font-bold text-[#004643]">① เรียนรู้</div>
                <div className="text-xs text-[#6B7773]">ทฤษฎี IoT & พื้นฐาน</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
                <div className="font-bold text-[#004643]">② ทดลอง</div>
                <div className="text-xs text-[#6B7773]">จำลองวงจรบนแล็บ</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
                <div className="font-bold text-[#004643]">③ สร้าง</div>
                <div className="text-xs text-[#6B7773]">ต่อเซนเซอร์ & คลาวด์</div>
              </div>
              <div className="p-3 rounded-xl bg-[#ABD1C6]/20 border border-[#ABD1C6]">
                <div className="font-bold text-[#004643]">④ ปลดล็อก</div>
                <div className="text-xs text-[#6B7773]">พิชิตภารกิจรับ XP</div>
              </div>
            </div>
          </section>

          {/* ส่วน Daily Quests ตัวอย่าง */}
          <section className="rounded-3xl border border-[#E5E7EB] bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-[#26332F]">
                ภารกิจประจำวัน (คลิกเพื่อทดสอบ)
              </h3>
              <span className="text-xs font-bold text-[#004643] bg-[#ABD1C6]/30 px-2.5 py-1 rounded-md">
                {dailyQuests.filter((q) => q.completed).length} / {dailyQuests.length} สำเร็จ
              </span>
            </div>

            <div className="space-y-2.5">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  onClick={() => toggleDailyQuest(quest.id)}
                  className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition ${
                    quest.completed
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-[#FAFAFA] border-[#E5E7EB] hover:border-[#ABD1C6] text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md border border-gray-300 bg-white text-xs font-bold">
                      {quest.completed ? "✓" : ""}
                    </span>
                    <span className={`text-xs font-semibold ${quest.completed ? "line-through opacity-70" : ""}`}>
                      {quest.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                    +{quest.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* แสดงส่วน Footer ด้านล่าง */}
        <Footer simple={true} />
      </div>
    </div>
  );
}

// ส่งออกคอมโพเนนต์ StudentHome
export default StudentHome;
