import { Link } from "react-router-dom";
import { LuCode, LuCpu, LuLayers, LuArrowRight, LuSparkles } from "react-icons/lu";

// ======================================================
// LearningCategoriesSection Component (หมวดหมู่การเรียนรู้)
// ======================================================
// นำเสนอหมวดหมู่หลักที่ระบบรองรับ (ไม่มีการใส่สถิติจำนวนคอร์สปลอม):
// 1. Programming & Development
// 2. IoT & Smart Technology
// 3. Data & Systems Engineering
// - แต่ละการ์ดมี Icon, ชื่อหมวด, คำอธิบายสั้น และลิงก์ "ดูคอร์ส →" ไปยัง /classrooms?category=<ชื่อหมวด>
// - ดีไซน์ Soft Jade สะอาด สบายตา
// ======================================================

function LearningCategoriesSection() {
  const categories = [
    {
      id: "programming",
      title: "Programming & Development",
      description: "พื้นฐานและหลักการเขียนโปรแกรม การคิดเชิงตรรกะ และการพัฒนาซอฟต์แวร์",
      icon: LuCode,
    },
    {
      id: "iot",
      title: "IoT & Smart Technology",
      description: "การเชื่อมต่ออุปกรณ์อัจฉริยะ ระบบเซนเซอร์ และเทคโนโลยีเมืองอัจฉริยะ",
      icon: LuCpu,
    },
    {
      id: "data-systems",
      title: "Data & Systems Engineering",
      description: "การจัดการฐานข้อมูล โครงสร้างระบบ และสถาปัตยกรรมคลาวด์",
      icon: LuLayers,
    },
  ];

  return (
    <section
      id="learning-categories"
      className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 border-t border-[#E5E9E7]"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3.5 py-1 text-xs font-bold text-[#004643]">
            <LuSparkles className="h-3.5 w-3.5" />
            <span>เส้นทางพัฒนาทักษะ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#26332F] tracking-tight">
            หมวดหมู่การเรียนรู้
          </h2>
          <p className="text-sm sm:text-base text-[#6B7773] leading-relaxed">
            เลือกเรียนรู้ตามหมวดหมู่หลักที่ระบบรองรับ เพื่อการพัฒนาทักษะที่ตรงเป้าหมาย
          </p>
        </div>

        <Link
          to="/classrooms"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#004643] hover:underline self-start sm:self-auto"
        >
          <span>ดูคอร์สเรียนทั้งหมด</span>
          <LuArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="group rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-2xs hover:border-[#ABD1C6] hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-[#ABD1C6]/25 text-[#004643] flex items-center justify-center group-hover:bg-[#004643] group-hover:text-white transition duration-300">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-[#26332F] group-hover:text-[#004643] transition">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#E5E9E7]/80 mt-6">
                <Link
                  to={`/classrooms?category=${encodeURIComponent(cat.title)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004643] group-hover:translate-x-1 transition-transform"
                >
                  <span>ดูคอร์ส</span>
                  <LuArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default LearningCategoriesSection;
