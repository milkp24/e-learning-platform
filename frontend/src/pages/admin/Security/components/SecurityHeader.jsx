import PageHeader from "../../../../components/layout/PageHeader";

/**
 * SecurityHeader Component
 * Admin Security page header.
 */
function SecurityHeader() {
  return (
    <PageHeader
      title="ความปลอดภัยระบบ"
      description="การตั้งค่าความปลอดภัย การหมุนเวียนโทเค็นยืนยันตัวตน และการควบคุมการเข้าถึงระบบ"
      badge="ระบบความปลอดภัย"
    />
  );
}

export default SecurityHeader;
