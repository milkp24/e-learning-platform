/**
 * QuizzesMetricsSection Component
 * Displays summary cards for quiz counts, questions, criteria, and attempts.
 */
function QuizzesMetricsSection() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">แบบทดสอบทั้งหมด</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">4 ชุด</p>
        <span className="text-[11px] font-semibold text-emerald-700">ครอบคลุม 4 หลักสูตร</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">จำนวนข้อสอบรวม</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">57 ข้อ</p>
        <span className="text-[11px] font-semibold text-[#6B7773]">เฉลี่ย 14 ข้อ/ชุด</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">เกณฑ์ผ่านเฉลี่ย</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">80%</p>
        <span className="text-[11px] font-semibold text-emerald-700">Passing criteria</span>
      </div>
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs">
        <p className="text-xs font-bold text-[#6B7773]">ผู้เข้าสอบสะสม</p>
        <p className="text-2xl font-black text-[#26332F] mt-1">687 ครั้ง</p>
        <span className="text-[11px] font-semibold text-teal-800">อัตราผ่าน 76.4%</span>
      </div>
    </div>
  );
}

export default QuizzesMetricsSection;
