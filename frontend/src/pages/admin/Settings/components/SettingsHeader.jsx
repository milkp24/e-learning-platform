import PageHeader from "../../../../components/layout/PageHeader";

/**
 * SettingsHeader Component
 * Admin Settings page header.
 */
function SettingsHeader() {
  return (
    <PageHeader
      title="ตั้งค่าระบบ"
      description="ปรับแต่งค่าความปลอดภัย เวลาหมดอายุเซสชัน และระยะเวลาการทดลองเรียนเนื้อหา"
      badge="การกำหนดค่า"
    />
  );
}

export default SettingsHeader;
