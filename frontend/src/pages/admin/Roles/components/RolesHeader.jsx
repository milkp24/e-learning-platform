import PageHeader from "../../../../components/layout/PageHeader";

/**
 * RolesHeader Component
 * Admin Roles page header.
 */
function RolesHeader() {
  return (
    <PageHeader
      title="สิทธิ์และบทบาท"
      description="จัดการและตรวจสอบบทบาทการใช้งานในระบบ กำหนดสิทธิ์รายบุคคลตามข้อกำหนด RBAC"
      badge="ระบบสิทธิ์การใช้งาน"
    />
  );
}

export default RolesHeader;
