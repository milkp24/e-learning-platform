import { LuBookMarked } from "react-icons/lu";
import PageHeaderButton from "../../../../components/layout/PageHeader/PageHeaderButton";

function InstructorWelcomeSection({ displayName }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-8 shadow-xs">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#ABD1C6]/40 px-2.5 py-0.5 text-xs font-bold text-[#004643]">
            สตูดิโอผู้สอน
          </span>
          <span className="text-xs text-[#6B7773]">
            • {new Date().toLocaleDateString("th-TH", { dateStyle: "long" })}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#26332F]">
          ยินดีต้อนรับอาจารย์ <span className="text-[#004643]">{displayName}</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7773]">
          ศูนย์จัดการคอร์สเรียน ติดตามผู้เรียน และปรับปรุงเนื้อหาบทเรียนของคุณ
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <PageHeaderButton to="/classrooms?view=mine" icon={LuBookMarked}>
          คอร์สเรียนของฉัน
        </PageHeaderButton>
      </div>
    </div>
  );
}

export default InstructorWelcomeSection;
