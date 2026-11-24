import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { LuChartColumn, LuTable } from "react-icons/lu";

// ======================================================
// DailyTrendChart (ข้อ 31, 32): กราฟแท่งรายวันจากข้อมูลจริง
// - แสดงทีละตัวชี้วัด (เลือกได้) จึงเป็นกราฟชุดเดียว ไม่ต้องมี legend (ชื่อกราฟบอกอยู่แล้ว)
// - แท่งบาง ปลายมน 4px ฐานเหลี่ยม เส้นตารางจาง ชี้ที่แท่งแล้วเห็นค่า (พื้นที่ชี้กว้างเต็มคอลัมน์)
// - สลับดูเป็นตารางได้ ข้อมูลไม่ได้อยู่ในสีอย่างเดียว
// series: [{ date, label, day, activeLearners, logins, enrollments, lessonsCompleted, quizzesSubmitted }]
// ======================================================

export const TREND_METRICS = [
  { key: "activeLearners", label: "ผู้เรียนที่เข้าใช้งาน", unit: "คน" },
  { key: "logins", label: "ผู้ใช้ที่เข้าสู่ระบบ", unit: "คน" },
  { key: "enrollments", label: "การลงทะเบียน", unit: "ครั้ง" },
  { key: "lessonsCompleted", label: "บทเรียนที่เรียนจบ", unit: "บท" },
  { key: "quizzesSubmitted", label: "ส่งแบบทดสอบ", unit: "ครั้ง" },
];

const BAR_COLOR = "#004643";
const BAR_HOVER = "#2F7A6E";
const CHART_HEIGHT = 168;

function niceMax(value) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value / 2) * magnitude;
  return Math.ceil(value / step) * step;
}

function formatThaiDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d} ${months[m - 1]} ${y + 543}`;
}

function DailyTrendChart({ series = [], isLoading = false, title = "แนวโน้มรายวัน", defaultMetric = "activeLearners" }) {
  const [metricKey, setMetricKey] = useState(defaultMetric);
  const [showTable, setShowTable] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  const metric = TREND_METRICS.find((m) => m.key === metricKey) || TREND_METRICS[0];
  const values = useMemo(() => series.map((d) => Number(d[metric.key]) || 0), [series, metric.key]);
  const total = values.reduce((a, b) => a + b, 0);
  const max = niceMax(Math.max(0, ...values));
  const count = series.length;
  // ป้ายแกน X ประมาณ 6 จุด ไม่ให้ซ้อนกันเมื่อช่วงยาว
  const labelEvery = Math.max(1, Math.ceil(count / 6));
  const gap = count <= 45 ? 2 : count <= 120 ? 1 : 0;
  const peakIndex = values.length ? values.indexOf(Math.max(...values)) : -1;

  return (
    <section className="rounded-2xl border border-[#E5E9E7] bg-white p-5 shadow-2xs space-y-4" aria-label={title}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#26332F]">
            {title}: {metric.label}
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            รวม {total.toLocaleString()} {metric.unit} ใน {count} วัน
            {peakIndex >= 0 && values[peakIndex] > 0 && (
              <> · สูงสุด {values[peakIndex].toLocaleString()} {metric.unit} ({formatThaiDay(series[peakIndex].date)})</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <label className="sr-only" htmlFor="trend-metric">เลือกตัวชี้วัด</label>
          <select
            id="trend-metric"
            value={metric.key}
            onChange={(e) => setMetricKey(e.target.value)}
            className="rounded-lg border border-[#E5E9E7] bg-[#FAFAFA] px-2.5 py-1.5 text-xs font-semibold text-[#26332F] focus:border-[#004643] focus:outline-none cursor-pointer"
          >
            {TREND_METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E9E7] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#26332F] hover:bg-[#FAFAFA] transition cursor-pointer"
          >
            {showTable ? <LuChartColumn className="h-3.5 w-3.5" /> : <LuTable className="h-3.5 w-3.5" />}
            {showTable ? "ดูเป็นกราฟ" : "ดูเป็นตาราง"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] rounded-xl bg-[#FAFAFA] animate-pulse" aria-label="กำลังโหลดข้อมูล" />
      ) : count === 0 ? (
        <p className="py-12 text-center text-xs text-[#6B7773]">ไม่มีข้อมูลในช่วงที่เลือก</p>
      ) : showTable ? (
        <div className="max-h-[260px] overflow-auto rounded-xl border border-[#E5E9E7]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#FAFAFA] text-[#6B7773]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">วันที่</th>
                {TREND_METRICS.map((m) => (
                  <th key={m.key} className="px-3 py-2 text-right font-semibold">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {series.map((d) => (
                <tr key={d.date} className="border-t border-[#E5E9E7]/70">
                  <td className="px-3 py-1.5 text-[#26332F]">{formatThaiDay(d.date)}</td>
                  {TREND_METRICS.map((m) => (
                    <td key={m.key} className="px-3 py-1.5 text-right font-mono text-[#26332F]">
                      {(Number(d[m.key]) || 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* แกน Y: 0 / กลาง / สูงสุด */}
          <div className="relative w-8 shrink-0 text-[10px] text-[#6B7773]" style={{ height: CHART_HEIGHT }}>
            {[max, max / 2, 0].map((v, i) => (
              <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / 2) * 100}%` }}>
                {Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1)}
              </span>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="relative" style={{ height: CHART_HEIGHT }} onMouseLeave={() => setHoverIndex(null)}>
              {/* เส้นตาราง (จาง) */}
              {[0, 0.5, 1].map((p) => (
                <div key={p} className="absolute inset-x-0 h-px bg-[#EEF1EF]" style={{ top: `${p * 100}%` }} aria-hidden="true" />
              ))}
              <div className="absolute inset-0 flex items-end" style={{ gap }} role="img" aria-label={`${metric.label} รายวัน รวม ${total} ${metric.unit}`}>
                {series.map((d, i) => {
                  const value = values[i];
                  const heightPct = max ? (value / max) * 100 : 0;
                  const isHover = hoverIndex === i;
                  return (
                    <div
                      key={d.date}
                      className="relative flex h-full flex-1 min-w-0 items-end justify-center cursor-default"
                      onMouseEnter={() => setHoverIndex(i)}
                    >
                      <div
                        className="w-full transition-colors"
                        style={{
                          maxWidth: 24,
                          height: value > 0 ? `max(${heightPct}%, 2px)` : 0,
                          background: isHover ? BAR_HOVER : BAR_COLOR,
                          borderRadius: count <= 90 ? "4px 4px 0 0" : 0,
                        }}
                      />
                      {isHover && (
                        <div
                          role="tooltip"
                          className={`pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-[#E5E9E7] bg-white px-2.5 py-1.5 text-[11px] shadow-md ${
                            i < count / 3 ? "left-0" : i > (count * 2) / 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                          }`}
                          style={{ bottom: `calc(${Math.min(heightPct, 92)}% + 4px)` }}
                        >
                          <p className="text-[#6B7773]">{d.day} {formatThaiDay(d.date)}</p>
                          <p className="font-bold text-[#26332F]">
                            {value.toLocaleString()} {metric.unit}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* แกน X */}
            <div className="relative mt-1.5 h-4 text-[10px] text-[#6B7773]">
              {series.map((d, i) =>
                i % labelEvery === 0 || (i === count - 1 && (count - 1) % labelEvery >= labelEvery / 2) ? (
                  <span
                    key={d.date}
                    className="absolute -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${((i + 0.5) / count) * 100}%` }}
                  >
                    {count === 1 ? formatThaiDay(d.date) : d.label}
                  </span>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

DailyTrendChart.propTypes = {
  series: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
  title: PropTypes.string,
  defaultMetric: PropTypes.string,
};

export default DailyTrendChart;
