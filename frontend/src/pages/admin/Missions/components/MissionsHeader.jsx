import PageHeader from "../../../../components/layout/PageHeader";
import PageHeaderButton from "../../../../components/layout/PageHeader/PageHeaderButton";

/**
 * MissionsHeader Component
 * Admin Missions page header with action button.
 */
function MissionsHeader({ onCreateMission }) {
  return (
    <PageHeader
      title="ภารกิจท้าทาย"
      description="จัดการภารกิจ กิจกรรมสะสมแต้ม XP และเหรียญรางวัลเพื่อส่งเสริมการเรียนรู้ต่อเนื่อง"
      badge="ภารกิจการเรียนรู้"
    >
      <PageHeaderButton onClick={onCreateMission}>สร้างภารกิจใหม่</PageHeaderButton>
    </PageHeader>
  );
}


export default MissionsHeader;
