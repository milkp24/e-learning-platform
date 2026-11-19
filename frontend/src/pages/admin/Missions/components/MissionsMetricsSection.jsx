/**
 * MissionsMetricsSection Component
 * Displays summary cards for missions active, XP pool, badges, and completions.
 */
function MissionsMetricsSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">ภารกิจที่เปิดใช้งาน</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">4 ภารกิจ</p>
        <span className="text-[11px] font-semibold text-emerald-700">ครอบคลุมทุกหมวดหมู่</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">XP Pool ทั้งหมด</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">1,200 XP</p>
        <span className="text-[11px] font-semibold text-[#6B7773]">รางวัลต่อรอบ</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">เหรียญรางวัล</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">4 รางวัล</p>
        <span className="text-[11px] font-semibold text-teal-800">ระบบสะสมเหรียญ</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">ภารกิจสำเร็จสะสม</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">1,912 ครั้ง</p>
        <span className="text-[11px] font-semibold text-emerald-700">+14% สัปดาห์นี้</span>
      </div>
    </div>
  );
}

export default MissionsMetricsSection;
