// นำเข้า React Hooks สำหรับ State และ Lifecycle
import { useState, useEffect } from "react";
// นำเข้า Link และ useNavigate จาก React Router
import { Link, useNavigate } from "react-router-dom";
// นำเข้าคอมโพเนนต์ Navbar สำหรับแสดงส่วนบน
import Navbar from "../components/Navbar";
// นำเข้าคอมโพเนนต์ Sidebar สำหรับแสดงเมนูด้านข้าง
import Sidebar from "../components/Sidebar";
// นำเข้าคอมโพเนนต์ Footer สำหรับแสดงส่วนล่างสุด
import Footer from "../components/Footer";
// นำเข้าคอมโพเนนต์ GuestLockModal สำหรับแสดงข้อความแจ้งเตือนเมื่อคลิกฟังก์ชันที่ล็อก
import GuestLockModal from "../components/GuestLockModal";
// นำเข้า useAuthStore สำหรับตรวจสอบสถานะการเข้าสู่ระบบ
import useAuthStore from "../store/useAuthStore";

// คอมโพเนนต์หน้าแรกสำหรับผู้เยี่ยมชม (Guest Home)
function Home() {
  // ดึงค่าสถานะยืนยันตัวตนและฟังก์ชันตรวจ Role
  const { isAuthenticated, hasRole } = useAuthStore();
  // ฟังก์ชัน navigate สำหรับเปลี่ยนหน้า
  const navigate = useNavigate();

  // ตรวจสอบว่าผู้ใช้มีบทบาทเป็น Student หรือไม่
  const isStudent = isAuthenticated && hasRole("student");

  // หากผู้ใช้มีสถานะเป็น Student และ Login อยู่แล้ว ให้นำทางไปยัง /student/home โดยอัตโนมัติ
  useEffect(() => {
    // ตรวจสอบว่า Login สำเร็จและมีบทบาทเป็น student
    if (isAuthenticated && hasRole("student")) {
      // นำทางไปยังหน้า /student/home
      navigate("/student/home", { replace: true });
    }
  }, [isAuthenticated, hasRole, navigate]);

  // State สำหรับควบคุมการเปิดหรือปิด GuestLockModal
  const [modalState, setModalState] = useState({
    // สถานะเปิดหรือปิด Modal
    isOpen: false,
    // หัวข้อของ Modal ตามข้อกำหนด
    title: "🔒 ฟังก์ชันนี้สำหรับสมาชิก",
    // รายละเอียดข้อความแจ้งเตือนตามข้อกำหนด
    message: "กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อนใช้งาน",
    // ป้ายสถานะ
    badge: "สมาชิกเท่านั้น (Members Only)",
  });

  // ฟังก์ชันเปิด Modal แจ้งเตือนสิทธิ์เมื่อคลิกฟังก์ชันล็อก
  const openLockModal = () => {
    // ปรับปรุงสถานะ Modal ให้แสดงผล
    setModalState({
      isOpen: true,
      title: "🔒 ฟังก์ชันนี้สำหรับสมาชิก",
      message: "กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อนใช้งาน",
      badge: "สมาชิกเท่านั้น (Members Only)",
    });
  };

  // ฟังก์ชันปิด Modal แจ้งเตือน
  const closeModal = () => {
    // ปรับสถานะ isOpen เป็น false
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // แสดงผลโครงสร้างหน้า Guest Home
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#26332F]">
      {/* แสดง Top Navbar ของ Guest */}
      <Navbar />

      {/* แถวจัดวางเนื้อหา: Fixed Sidebar ด้านซ้าย + Content ด้านขวา */}
      <div className="flex flex-1 relative">
        {/* Fixed Sidebar ด้านซ้ายสำหรับ Guest */}
        <Sidebar isGuest={true} onOpenLockModal={openLockModal} />

        {/* Content Area ทางฝั่งขวาของ Fixed Sidebar */}
        <main className="flex-1 min-w-0">
          {/* ส่วน Hero หลัก: Interactive E-learning Platform */}
          <section className="border-b border-[#E5E7EB] bg-gradient-to-b from-white via-white to-[#FAFAFA] py-12 sm:py-16 px-4 sm:px-8 text-center space-y-6">
            {/* ป้ายกำกับแพลตฟอร์ม E-learning Platform */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ABD1C6]/60 bg-[#ABD1C6]/25 px-4 py-1.5 text-xs font-black text-[#004643]">
              <span>🤖</span>
              <span>INTERACTIVE E-LEARNING PLATFORM</span>
            </div>

            {/* หัวข้อหลักและลำดับขั้นตอน */}
            <div className="space-y-3">
              {/* หัวข้อหลัก */}
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#26332F]">
                เรียน IoT แบบ <span className="text-[#004643]">ลงมือทำจริง</span>
              </h1>

              {/* ขั้นตอนการเรียนรู้ */}
              <div className="inline-flex items-center justify-center flex-wrap gap-2 text-base sm:text-xl font-black text-[#004643]">
                <span>เรียน</span>
                <span className="text-[#ABD1C6]">→</span>
                <span>ทดลอง</span>
                <span className="text-[#ABD1C6]">→</span>
                <span>สร้าง</span>
                <span className="text-[#ABD1C6]">→</span>
                <span className="text-[#004643] bg-[#ABD1C6]/40 px-2.5 py-0.5 rounded-lg">
                  ปลดล็อก
                </span>
              </div>

              {/* คำอธิบายแพลตฟอร์ม */}
              <p className="mx-auto max-w-xl text-xs sm:text-sm text-[#6B7773] leading-relaxed font-medium">
                เรียนรู้ IoT ตั้งแต่พื้นฐาน ผ่านบทเรียน การทดลองเสมือนจริง
                และภารกิจที่ช่วยให้เข้าใจ IoT จากการลงมือทำ
              </p>
            </div>

            {/* ปุ่มกดเริ่มเรียน CTA */}
            <div className="pt-2">
              <Link
                to={isStudent ? "/student/home" : "/login"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#004643] px-8 py-3.5 text-sm sm:text-base font-black text-white shadow-md transition hover:bg-[#003835] active:scale-98"
              >
                <span>🚀</span>
                <span>เริ่มเรียน</span>
              </Link>
            </div>
          </section>

          {/* ส่วนแสดง 4 Feature Cards */}
          <section className="py-12 px-4 sm:px-8 space-y-6 max-w-6xl mx-auto">
            {/* หัวข้อส่วนฟีเจอร์ */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold text-[#004643] uppercase tracking-wider">
                ฟีเจอร์การเรียนรู้
              </p>
              {/* หัวข้อสำรวจระบบแพลตฟอร์ม E-learning Platform */}
              <h2 className="text-xl sm:text-2xl font-black text-[#26332F]">
                สำรวจระบบ E-learning Platform
              </h2>
            </div>

            {/* กล่อง Grid 4 การ์ด */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Course */}
              <div
                onClick={() => openLockModal()}
                className="group cursor-pointer rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">📚</span>
                    <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2 py-0.5 rounded-md">
                      COURSE
                    </span>
                  </div>
                  <div className="inline-block rounded-md bg-[#ABD1C6]/40 px-2 py-0.5 text-xs font-black text-[#004643]">
                    เรียนรู้
                  </div>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
                    บทเรียนแบบขั้นตอน
                  </h3>
                  <p className="text-xs text-[#6B7773] leading-relaxed">
                    เรียน IoT ตั้งแต่พื้นฐาน ผ่านบทเรียนแบบเป็นขั้นตอน
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                    🔒 สมาชิก
                  </span>
                  <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
                </div>
              </div>

              {/* Card 2: Virtual Lab */}
              <div
                onClick={() => openLockModal()}
                className="group cursor-pointer rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🧪</span>
                    <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2 py-0.5 rounded-md">
                      VIRTUAL LAB
                    </span>
                  </div>
                  <div className="inline-block rounded-md bg-cyan-100/70 px-2 py-0.5 text-xs font-black text-cyan-900">
                    ทดลอง
                  </div>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
                    ห้องแล็บเสมือนจริง
                  </h3>
                  <p className="text-xs text-[#6B7773] leading-relaxed">
                    ทดลองการทำงานของ IoT ผ่าน Virtual Lab
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                    🔒 สมาชิก
                  </span>
                  <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
                </div>
              </div>

              {/* Card 3: Live */}
              <div
                onClick={() => openLockModal()}
                className="group cursor-pointer rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">📡</span>
                    <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2 py-0.5 rounded-md">
                      LIVE
                    </span>
                  </div>
                  <div className="inline-block rounded-md bg-rose-100/70 px-2 py-0.5 text-xs font-black text-rose-900">
                    เรียนสด
                  </div>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
                    ห้องเรียนถ่ายทอดสด
                  </h3>
                  <p className="text-xs text-[#6B7773] leading-relaxed">
                    เข้าร่วม Live และเรียนรู้ไปพร้อมกับผู้สอน
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                    🔒 สมาชิก
                  </span>
                  <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
                </div>
              </div>

              {/* Card 4: Quest */}
              <div
                onClick={() => openLockModal()}
                className="group cursor-pointer rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🏆</span>
                    <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2 py-0.5 rounded-md">
                      QUEST
                    </span>
                  </div>
                  <div className="inline-block rounded-md bg-amber-100/70 px-2 py-0.5 text-xs font-black text-amber-900">
                    ภารกิจ
                  </div>
                  <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
                    ภารกิจปลดล็อกทักษะ
                  </h3>
                  <p className="text-xs text-[#6B7773] leading-relaxed">
                    ทำภารกิจและกิจกรรม เพื่อปลดล็อกการเรียนรู้
                  </p>
                </div>
                <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                    🔒 สมาชิก
                  </span>
                  <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
                </div>
              </div>
            </div>
          </section>

          {/* ส่วน Learning Flow เส้นทางการเรียนรู้ */}
          <section className="border-t border-[#E5E7EB] bg-white py-12 px-4 sm:px-8">
            <div className="max-w-5xl mx-auto space-y-6 text-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#004643] uppercase tracking-wider">
                  HOW YOU WILL LEARN
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-[#26332F]">
                  เส้นทางการเรียนรู้
                </h2>
              </div>

              {/* ผังขั้นตอน 4 ลำดับ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ลำดับที่ 1 */}
                <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
                  <div className="text-lg font-black text-[#004643]">① เรียนรู้</div>
                  <p className="text-xs text-[#6B7773]">ปูพื้นฐานทฤษฎีและเขียนโปรแกรม</p>
                </div>
                {/* ลำดับที่ 2 */}
                <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
                  <div className="text-lg font-black text-[#004643]">② ทดลอง</div>
                  <p className="text-xs text-[#6B7773]">จำลองวงจรบน Virtual Lab</p>
                </div>
                {/* ลำดับที่ 3 */}
                <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
                  <div className="text-lg font-black text-[#004643]">③ สร้าง</div>
                  <p className="text-xs text-[#6B7773]">ต่อเซนเซอร์และส่งข้อมูลขึ้นคลาวด์</p>
                </div>
                {/* ลำดับที่ 4 */}
                <div className="p-4 rounded-2xl border border-[#ABD1C6] bg-[#ABD1C6]/15 space-y-1">
                  <div className="text-lg font-black text-[#004643]">④ ปลดล็อก</div>
                  <p className="text-xs text-[#6B7773]">พิชิตภารกิจและรับ XP โบนัส</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ส่วน Footer ด้านล่างสุด */}
      <Footer simple={true} />

      {/* กล่องแจ้งเตือนสิทธิ์เมื่อคลิกฟังก์ชันที่ล็อก */}
      <GuestLockModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        badge={modalState.badge}
      />
    </div>
  );
}

// ส่งออกคอมโพเนนต์ Home
export default Home;
