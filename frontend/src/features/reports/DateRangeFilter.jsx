import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { LuCalendarRange } from "react-icons/lu";
import { RANGE_OPTIONS, addDays, describeRange, todayThai, validateCustomRange } from "./dateRange";

// ======================================================
// DateRangeFilter (ข้อ 31): ตัวเลือกช่วงวันที่ วันนี้ / 7 วัน / 30 วัน / กำหนดเอง
// - กด "กำหนดเอง" จะมีช่องเลือกวันเริ่มต้น-สิ้นสุด และปุ่ม "ใช้ช่วงนี้"
//   (ยังไม่เปลี่ยนข้อมูลจนกว่าจะกดใช้ และตรวจวันที่ก่อนเสมอ)
// - value: { range, start, end }  onChange(newValue)
// ======================================================
function DateRangeFilter({ value, onChange, className = "", align = "end", showCaption = true }) {
  const today = todayThai();
  const [isCustomOpen, setIsCustomOpen] = useState(value.range === "custom");
  const [draft, setDraft] = useState({
    start: value.start || addDays(today, -13),
    end: value.end || today,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (value.range !== "custom") setIsCustomOpen(false);
  }, [value.range]);

  const selectPreset = (id) => {
    setError("");
    if (id === "custom") {
      setIsCustomOpen(true);
      return;
    }
    setIsCustomOpen(false);
    onChange({ range: id, start: "", end: "" });
  };

  const applyCustom = (e) => {
    e.preventDefault();
    const message = validateCustomRange(draft.start, draft.end);
    if (message) {
      setError(message);
      return;
    }
    setError("");
    onChange({ range: "custom", start: draft.start, end: draft.end });
  };

  const activeId = isCustomOpen ? "custom" : value.range;

  return (
    <div className={`flex flex-col gap-2 ${align === "end" ? "items-start sm:items-end" : "items-start"} ${className}`}>
      <div
        role="radiogroup"
        aria-label="เลือกช่วงวันที่"
        className="inline-flex rounded-xl border border-[#E5E9E7] bg-white p-1 shadow-2xs"
      >
        {RANGE_OPTIONS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="radio"
            aria-checked={activeId === tab.id}
            onClick={() => selectPreset(tab.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              activeId === tab.id
                ? "bg-[#ABD1C6] text-[#004643] shadow-xs"
                : "text-[#6B7773] hover:text-[#26332F] hover:bg-[#FAFAFA]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isCustomOpen && (
        <form
          onSubmit={applyCustom}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-[#E5E9E7] bg-white p-2.5 shadow-2xs"
        >
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#6B7773]">
            ตั้งแต่วันที่
            <input
              type="date"
              value={draft.start}
              max={draft.end || today}
              onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
              className="rounded-lg border border-[#E5E9E7] bg-[#FAFAFA] px-2 py-1 text-xs text-[#26332F] focus:border-[#004643] focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#6B7773]">
            ถึงวันที่
            <input
              type="date"
              value={draft.end}
              min={draft.start || undefined}
              max={today}
              onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
              className="rounded-lg border border-[#E5E9E7] bg-[#FAFAFA] px-2 py-1 text-xs text-[#26332F] focus:border-[#004643] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[#004643] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#003835] transition cursor-pointer"
          >
            ใช้ช่วงนี้
          </button>
          {error && (
            <p role="alert" className="basis-full text-[11px] font-semibold text-rose-600">
              {error}
            </p>
          )}
        </form>
      )}

      {showCaption && (
        <p className="flex items-center gap-1 text-[11px] text-[#6B7773]">
          <LuCalendarRange className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
          {describeRange(value)}
        </p>
      )}
    </div>
  );
}

DateRangeFilter.propTypes = {
  value: PropTypes.shape({ range: PropTypes.string, start: PropTypes.string, end: PropTypes.string }).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  align: PropTypes.oneOf(["start", "end"]),
  showCaption: PropTypes.bool,
};

export default DateRangeFilter;
