import { LuSparkles, LuCode, LuTrendingUp, LuCircleCheck } from "react-icons/lu";

// ======================================================
// WhyLearnSection Component (ทำไมต้องเรียนกับ E-learning Platform)
// ======================================================
// นำเสนอ 4 จุดเด่นหลักของ E-learning Platform:
// 1. Interactive Learning - เรียนรู้ผ่านเนื้อหาและกิจกรรมแบบ Interactive
// 2. Hands-on Practice - นำความรู้ไปทดลองและลงมือทำจริง
// 3. Learning Progress - ติดตามความก้าวหน้าในการเรียนได้อย่างเป็นระบบ
// 4. Practical Skills - พัฒนาทักษะที่สามารถนำไปประยุกต์ใช้ได้จริง
// - ห้ามสร้างตัวเลขสถิติปลอม (ไม่มี 10,000+ Students หรือ 98% Satisfaction)
// - ออกแบบตาม Soft Jade Design System
// ======================================================

function WhyLearnSection() {
  const highlights = [
    {
      icon: LuSparkles,
      title: "Interactive Learning",
      description: "เรียนรู้ผ่านเนื้อหาและกิจกรรมแบบ Interactive ช่วยให้เข้าใจแนวคิดสำคัญได้อย่างลึกซึ้ง",
      badge: "Interactive",
    },
    {
      icon: LuCode,
      title: "Hands-on Practice",
      description: "นำความรู้ไปทดลองและลงมือทำจริงในสภาพแวดล้อมจำลอง เพื่อเสริมสร้างความมั่นใจ",
      badge: "Practice",
    },
    {
      icon: LuTrendingUp,
      title: "Learning Progress",
      description: "ติดตามความก้าวหน้าในการเรียนได้อย่างเป็นระบบ บันทึกพัฒนาการและสถิติอย่างชัดเจน",
      badge: "Progress",
    },
    {
      icon: LuCircleCheck,
      title: "Practical Skills",
      description: "พัฒนาทักษะที่สามารถนำไปประยุกต์ใช้ได้จริงในงานหรือการสร้างโปรเจกต์ของตนเอง",
      badge: "Practical",
    },
  ];

  return (
    <section
      id="why-us"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 border-t border-[#E5E9E7]"
    >
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3.5 py-1 text-xs font-bold text-[#004643]">
          <span>จุดเด่นของแพลตฟอร์ม</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#26332F] tracking-tight">
          ทำไมต้องเรียนกับ E-learning Platform
        </h2>
        <p className="text-sm sm:text-base text-[#6B7773] leading-relaxed">
          แนวทางการเรียนรู้ที่ออกแบบมาเพื่อให้คุณพัฒนาทักษะได้อย่างมีประสิทธิภาพ ตั้งแต่ก้าวแรกสู่การประยุกต์ใช้จริง
        </p>
      </div>

      {/* 4 Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-2xs hover:shadow-md hover:border-[#ABD1C6] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-2xl bg-[#ABD1C6]/25 flex items-center justify-center text-[#004643] group-hover:bg-[#004643] group-hover:text-white transition duration-300">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold text-[#004643] bg-[#ABD1C6]/20 px-2.5 py-1 rounded-md">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#26332F] group-hover:text-[#004643] transition">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default WhyLearnSection;
