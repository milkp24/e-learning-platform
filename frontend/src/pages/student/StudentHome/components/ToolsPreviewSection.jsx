import { Link } from "react-router-dom";
import { LuBookOpen, LuFlaskConical, LuRadio, LuTrophy } from "react-icons/lu";

function ToolsPreviewSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-black text-[#26332F]">
        เครื่องมือการเรียนรู้ของคุณ
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Courses */}
        <Link
          to="/classrooms"
          className="group rounded-3xl border border-[#E5E9E7] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-2">
            <LuBookOpen className="h-7 w-7 text-[#004643]" aria-hidden="true" />
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
              คอร์สเรียน
            </h3>
            <p className="text-xs text-[#6B7773]">เรียน IoT ตามลำดับขั้นตอน 4 ระดับ</p>
          </div>
          <span className="pt-3 text-xs font-bold text-[#004643]">เข้าเรียน →</span>
        </Link>

        {/* Card Virtual Lab */}
        <a
          href="#lab"
          className="group rounded-3xl border border-[#E5E9E7] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-2">
            <LuFlaskConical className="h-7 w-7 text-cyan-700" aria-hidden="true" />
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
              ห้องแล็บจำลอง
            </h3>
            <p className="text-xs text-[#6B7773]">ทดลองต่อวงจรและโค้ดเสมือนจริง</p>
          </div>
          <span className="pt-3 text-xs font-bold text-cyan-800">เข้าแล็บ →</span>
        </a>

        {/* Card Live */}
        <a
          href="#live"
          className="group rounded-3xl border border-[#E5E9E7] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-2">
            <LuRadio className="h-7 w-7 text-rose-600" aria-hidden="true" />
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
              ห้องเรียนสด
            </h3>
            <p className="text-xs text-[#6B7773]">ห้องเรียนถ่ายทอดสดกับอาจารย์</p>
          </div>
          <span className="pt-3 text-xs font-bold text-rose-800">ดูตาราง →</span>
        </a>

        {/* Card Quest */}
        <a
          href="#quest"
          className="group rounded-3xl border border-[#E5E9E7] bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-[#ABD1C6] hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-2">
            <LuTrophy className="h-7 w-7 text-amber-600" aria-hidden="true" />
            <h3 className="text-base font-black text-[#26332F] group-hover:text-[#004643]">
              ภารกิจท้าทาย
            </h3>
            <p className="text-xs text-[#6B7773]">ภารกิจและคะแนนสะสม XP</p>
          </div>
          <span className="pt-3 text-xs font-bold text-amber-800">ดูภารกิจ →</span>
        </a>
      </div>
    </section>
  );
}

export default ToolsPreviewSection;
