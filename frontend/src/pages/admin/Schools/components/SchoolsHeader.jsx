import PageHeader from "../../../../components/layout/PageHeader";
import { LuPlus } from "react-icons/lu";

/**
 * SchoolsHeader Component
 * Header for School Management in Admin console
 * Jade Design System (#ABD1C6, #004643, #26332F, #6B7773, #E5E9E7)
 */
function SchoolsHeader({ total, onOpenCreate, canCreateSchool = false }) {
  return (
    <PageHeader
      title="จัดการโรงเรียนและสถานศึกษา"
      description="บริหารจัดการข้อมูลโรงเรียน สถานศึกษา และหน่วยงานในระบบ พร้อมตรวจสอบจำนวนห้องเรียนและสมาชิก"
      badge={`โรงเรียนทั้งหมด ${total} แห่ง`}
    >
      {canCreateSchool && (
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#004643] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#003835] active:scale-98 transition cursor-pointer shadow-sm"
        >
          <LuPlus className="w-4 h-4 text-[#ABD1C6]" />
          <span>เพิ่มโรงเรียนใหม่</span>
        </button>
      )}
    </PageHeader>
  );
}

export default SchoolsHeader;
