import PageHeader from "../../../../components/layout/PageHeader";
import { LuUserPlus } from "react-icons/lu";

function UsersHeader({ total, onOpenCreate, canCreateUser = false }) {
  return (
    <PageHeader
      title="ผู้ใช้งานทั้งหมด"
      description="จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ ตรวจสอบบทบาท และปรับเปลี่ยนสถานะการใช้งาน"
      badge={`ผู้ใช้ทั้งหมด ${total} คน`}
    >
      {canCreateUser && (
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#004643] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#003835] active:scale-98 transition cursor-pointer shadow-sm"
        >
          <LuUserPlus className="w-4 h-4 text-[#ABD1C6]" />
          <span>เพิ่มผู้ใช้ใหม่</span>
        </button>
      )}
    </PageHeader>
  );
}

export default UsersHeader;
