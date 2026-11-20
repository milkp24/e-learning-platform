import PageHeader from "../../../../components/layout/PageHeader";
import { LuUserPlus } from "react-icons/lu";
import PageHeaderButton from "../../../../components/layout/PageHeader/PageHeaderButton";

function UsersHeader({ total, onOpenCreate, canCreateUser = false }) {
  return (
    <PageHeader
      title="ผู้ใช้งานทั้งหมด"
      description="จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ ตรวจสอบบทบาท และปรับเปลี่ยนสถานะการใช้งาน"
      badge={`ผู้ใช้ทั้งหมด ${total} คน`}
    >
      {canCreateUser && (
        <PageHeaderButton icon={LuUserPlus} onClick={onOpenCreate}>
          เพิ่มผู้ใช้ใหม่
        </PageHeaderButton>
      )}
    </PageHeader>
  );
}

export default UsersHeader;
