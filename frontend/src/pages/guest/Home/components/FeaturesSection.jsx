import {
  LuBookOpen,
  LuFlaskConical,
  LuRadio,
  LuTrophy,
  LuLock,
} from "react-icons/lu";

function FeaturesSection({ onOpenLockModal }) {
  const handleCourseClick = () => {
    const el = document.getElementById("courses-discovery");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/classrooms";
    }
  };

  return (
    <section id="courses" className="py-16 px-4 sm:px-8 space-y-10 max-w-7xl mx-auto">
      <div className="text-center space-y-2">
        <p className="text-xs font-bold text-[#004643] uppercase tracking-wider">
          ฟีเจอร์การเรียนรู้
        </p>
        <h2 className="text-2xl sm:text-3xl font-black text-[#26332F]">
          สำรวจเครื่องมือบน E-learning Platform
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7773] max-w-xl mx-auto">
          ออกแบบให้ผู้เรียนสามารถฝึกฝนและพัฒนาทักษะ IoT ได้อย่างสมบูรณ์แบบ
        </p>
      </div>

      {/* Grid 4 การ์ด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Course */}
        <div
          onClick={handleCourseClick}
          className="group cursor-pointer rounded-3xl border border-[#E5E9E7] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <LuBookOpen className="h-8 w-8 text-[#004643]" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase text-[#004643] bg-[#ABD1C6]/30 px-2.5 py-1 rounded-md">
                สำรวจได้
              </span>
            </div>
            <div className="inline-block rounded-md bg-[#ABD1C6]/40 px-2 py-0.5 text-xs font-black text-[#004643]">
              เรียนรู้
            </div>
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
              บทเรียนแบบขั้นตอน
            </h3>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              เรียน IoT ตั้งแต่พื้นฐาน ผ่านบทเรียน 4 ระดับแบบเป็นระบบ
            </p>
          </div>
          <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[#004643] font-bold bg-[#ABD1C6]/20 px-2 py-0.5 rounded-md">
              <LuBookOpen className="h-3 w-3" aria-hidden="true" />
              <span>พรีวิวคอร์สฟรี</span>
            </span>
            <span className="text-[#004643] font-bold">ดูคอร์สแนะนำ →</span>
          </div>
        </div>

        {/* Card 2: Virtual Lab */}
        <div
          onClick={() => onOpenLockModal("ห้องแล็บจำลอง")}
          className="group cursor-pointer rounded-3xl border border-[#E5E9E7] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <LuFlaskConical className="h-8 w-8 text-cyan-700" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2.5 py-1 rounded-md">
                แล็บเสมือนจริง
              </span>
            </div>
            <div className="inline-block rounded-md bg-cyan-100/70 px-2 py-0.5 text-xs font-black text-cyan-900">
              ทดลอง
            </div>
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
              ห้องแล็บเสมือนจริง
            </h3>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              ทดลองการทำงานของวงจรและ Microcontroller ได้โดยไม่ต้องซื้อบอร์ดจริง
            </p>
          </div>
          <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
              <LuLock className="h-3 w-3" aria-hidden="true" />
              <span>สมาชิก</span>
            </span>
            <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
          </div>
        </div>

        {/* Card 3: Live */}
        <div
          onClick={() => onOpenLockModal("ห้องเรียนสด")}
          className="group cursor-pointer rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <LuRadio className="h-8 w-8 text-rose-700" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2.5 py-1 rounded-md">
                ถ่ายทอดสด
              </span>
            </div>
            <div className="inline-block rounded-md bg-rose-100/70 px-2 py-0.5 text-xs font-black text-rose-900">
              เรียนสด
            </div>
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
              ห้องเรียนถ่ายทอดสด
            </h3>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              เข้าร่วม Live และปรึกษาแลกเปลี่ยนคำแนะนำกับอาจารย์ผู้สอน
            </p>
          </div>
          <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
              <LuLock className="h-3 w-3" aria-hidden="true" />
              <span>สมาชิก</span>
            </span>
            <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
          </div>
        </div>

        {/* Card 4: Quest */}
        <div
          onClick={() => onOpenLockModal("ภารกิจท้าทาย")}
          className="group cursor-pointer rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-xs transition hover:-translate-y-1 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <LuTrophy className="h-8 w-8 text-amber-600" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase text-[#6B7773] bg-gray-100 px-2.5 py-1 rounded-md">
                ภารกิจท้าทาย
              </span>
            </div>
            <div className="inline-block rounded-md bg-amber-100/70 px-2 py-0.5 text-xs font-black text-amber-900">
              ภารกิจ
            </div>
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643] transition">
              ภารกิจปลดล็อกทักษะ
            </h3>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              ทำภารกิจประจำวันและโปรเจกต์ท้าทาย เพื่อสะสมคะแนน (XP) และรางวัล
            </p>
          </div>
          <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
              <LuLock className="h-3 w-3" aria-hidden="true" />
              <span>สมาชิก</span>
            </span>
            <span className="text-[#004643] font-bold">ดูตัวอย่าง →</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
