import { LuBookOpen, LuZap, LuWrench, LuAward } from "react-icons/lu";

function LearningFlowSection() {
  return (
    <section id="features" className="border-t border-[#E5E9E7] bg-white py-16 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-10 text-center">
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#004643] uppercase tracking-wider">
            ขั้นตอนการเรียนรู้
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-[#26332F]">
            เส้นทางการเรียนรู้ 4 ลำดับ
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7773]">
            โครงสร้างที่ออกแบบมาเพื่อการเรียนรู้ที่มีประสิทธิภาพสูงสุด
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-3xl border border-[#E5E9E7] bg-[#FAFAFA] space-y-2 text-left">
            <div className="text-[#004643]">
              <LuBookOpen className="h-7 w-7 text-[#004643]" aria-hidden="true" />
            </div>
            <div className="text-base font-black text-[#004643]">① เรียนรู้</div>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              ปูพื้นฐานทฤษฎี IoT สถาปัตยกรรม และการเขียนโปรแกรมควบคุม
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-[#E5E9E7] bg-[#FAFAFA] space-y-2 text-left">
            <div className="text-[#004643]">
              <LuZap className="h-7 w-7 text-[#004643]" aria-hidden="true" />
            </div>
            <div className="text-base font-black text-[#004643]">② ทดลอง</div>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              จำลองวงจรอิเล็กทรอนิกส์และทดสอบโค้ดบน Virtual Lab
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-[#E5E9E7] bg-[#FAFAFA] space-y-2 text-left">
            <div className="text-[#004643]">
              <LuWrench className="h-7 w-7 text-[#004643]" aria-hidden="true" />
            </div>
            <div className="text-base font-black text-[#004643]">③ สร้าง</div>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              ต่อเซนเซอร์จริง ส่งข้อมูล Sensor ขึ้น Cloud Platform
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-[#ABD1C6] bg-[#ABD1C6]/15 space-y-2 text-left">
            <div className="text-[#004643]">
              <LuAward className="h-7 w-7 text-[#004643]" aria-hidden="true" />
            </div>
            <div className="text-base font-black text-[#004643]">④ ปลดล็อก</div>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              พิชิตภารกิจแบบทดสอบ รับคะแนนสะสม (XP) และใบประกาศนียบัตรรับรอง
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LearningFlowSection;
