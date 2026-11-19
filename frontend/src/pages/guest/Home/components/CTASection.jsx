import { Link } from "react-router-dom";
import { LuUserPlus, LuBookOpen } from "react-icons/lu";

// ======================================================
// CTASection Component (Call To Action ก่อน Footer)
// ======================================================
// เชิญชวนให้สมัครสมาชิกเพื่อเริ่มเรียนรู้
// Headline: "พร้อมเริ่มพัฒนาทักษะของคุณแล้วหรือยัง?"
// Text: "เริ่มต้นเรียนรู้จากคอร์สที่เหมาะกับคุณ และพัฒนาทักษะผ่านการลงมือทำจริง"
// Buttons:
// - สมัครสมาชิก → /register
// - ดูคอร์สทั้งหมด → /classrooms
// ใช้โทนสีหลัก #004643 และ #ABD1C6 ในสไตล์ Soft Jade
// ======================================================

function CTASection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-[#004643] via-[#003835] to-[#26332F] p-8 sm:p-12 lg:p-16 text-center text-white space-y-6 shadow-md border border-[#004643]/40">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
            พร้อมเริ่มพัฒนาทักษะของคุณแล้วหรือยัง?
          </h2>
          <p className="text-sm sm:text-base text-[#ABD1C6] leading-relaxed">
            เริ่มต้นเรียนรู้จากคอร์สที่เหมาะกับคุณ และพัฒนาทักษะผ่านการลงมือทำจริง
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ABD1C6] px-8 py-3.5 text-sm sm:text-base font-bold text-[#20302C] hover:bg-[#9CC5B9] transition duration-200 shadow-sm"
          >
            <LuUserPlus className="h-4 w-4" aria-hidden="true" />
            <span>สมัครสมาชิก</span>
          </Link>
          <Link
            to="/classrooms"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ABD1C6]/40 bg-white/5 px-8 py-3.5 text-sm sm:text-base font-bold text-white hover:bg-white/10 transition duration-200"
          >
            <LuBookOpen className="h-4 w-4" aria-hidden="true" />
            <span>ดูคอร์สทั้งหมด</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
