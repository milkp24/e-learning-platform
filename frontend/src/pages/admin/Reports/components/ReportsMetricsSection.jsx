/**
 * ReportsMetricsSection Component
 * Displays system metric cards: total enrollments, completion rate, learning hours, DAU.
 */
function ReportsMetricsSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">การลงทะเบียนรวม</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">1,482 คน</p>
        <span className="text-[11px] font-semibold text-emerald-700">+12% เดือนนี้</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">อัตราเรียนจบเฉลี่ย</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">72.4%</p>
        <span className="text-[11px] font-semibold text-teal-800">Completion rate</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">ชั่วโมงการเรียนสะสม</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">3,480 ชม.</p>
        <span className="text-[11px] font-semibold text-emerald-700">+240 ชม. สัปดาห์นี้</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">ผู้เรียนแอคทีฟรายวัน</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">412 คน</p>
        <span className="text-[11px] font-semibold text-emerald-700">Daily Active Users</span>
      </div>
    </div>
  );
}

export default ReportsMetricsSection;
