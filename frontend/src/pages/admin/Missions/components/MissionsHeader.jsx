import PageHeader from "../../../../components/layout/PageHeader";

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
      <button
        type="button"
        onClick={onCreateMission}
        className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-2xs"
      >
        + สร้างภารกิจใหม่
      </button>
    </PageHeader>
  );
}


export default MissionsHeader;
