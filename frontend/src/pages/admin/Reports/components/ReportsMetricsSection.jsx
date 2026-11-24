import PropTypes from "prop-types";

/**
 * ReportsMetricsSection (ข้อ 32): ตัวชี้วัดหลักจากข้อมูลจริงตามช่วงวันที่ที่เลือก
 */
function MetricTile({ label, value, caption }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-4.5 shadow-2xs break-inside-avoid">
      <p className="text-xs font-bold text-[#6B7773]">{label}</p>
      <p className="text-2xl font-black text-[#26332F] mt-1">{value}</p>
      <span className="text-[11px] text-[#6B7773]">{caption}</span>
    </div>
  );
}

MetricTile.propTypes = { label: PropTypes.string, value: PropTypes.node, caption: PropTypes.string };

function ReportsMetricsSection({ metrics, isLoading = false }) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="กำลังโหลดตัวชี้วัด">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[98px] rounded-[16px] border border-[#E5E9E7] bg-[#FAFAFA] animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricTile
        label="การลงทะเบียน"
        value={`${metrics.enrollments.toLocaleString()} ครั้ง`}
        caption="ลงทะเบียนเรียนในช่วงที่เลือก"
      />
      <MetricTile
        label="อัตราเรียนจบทั้งคอร์ส"
        value={`${metrics.completionRate}%`}
        caption="ผู้เรียนที่จบทุกบท ÷ ผู้เรียนทั้งหมด"
      />
      <MetricTile
        label="บทเรียนที่เรียนจบ"
        value={`${metrics.lessonsCompleted.toLocaleString()} บท`}
        caption="กดเรียนจบในช่วงที่เลือก"
      />
      <MetricTile
        label="ผู้เรียนที่เข้าใช้งาน"
        value={`${metrics.activeLearners.toLocaleString()} คน`}
        caption={`เฉลี่ย ${metrics.avgDailyActiveLearners} คนต่อวัน`}
      />
    </div>
  );
}

ReportsMetricsSection.propTypes = {
  metrics: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default ReportsMetricsSection;
