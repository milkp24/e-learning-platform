import PageHeader from "../../../../components/layout/PageHeader";
import PageHeaderButton from "../../../../components/layout/PageHeader/PageHeaderButton";

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
        <PageHeaderButton onClick={onOpenCreate}>เพิ่มโรงเรียนใหม่</PageHeaderButton>
      )}
    </PageHeader>
  );
}

export default SchoolsHeader;
