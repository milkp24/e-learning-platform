// ======================================================
// VideoProgressBar — แถบแสดงว่าดูวิดีโอไปแล้วกี่เปอร์เซ็นต์ (ข้อ 25)
// เส้นแบ่งที่ requiredPercent คือเกณฑ์ที่ต้องดูถึงก่อนกด "เรียนจบแล้ว" (ข้อ 24)
// ======================================================

function VideoProgressBar({ percent = 0, requiredPercent = 90, tone = "dark" }) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const passed = value >= requiredPercent;
  const text = tone === "dark" ? "text-gray-300" : "text-[#6B7773]";
  return (
    <div className="mt-3 space-y-1 text-left" aria-label={`ดูวิดีโอแล้ว ${value}%`}>
      <div className={`flex items-center justify-between text-[11px] font-semibold ${text}`}>
        <span>ดูแล้ว {value}%</span>
        <span className={passed ? "text-emerald-400" : ""}>
          {passed ? "ดูครบตามเกณฑ์แล้ว" : `ต้องดูถึง ${requiredPercent}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="relative h-2 w-full overflow-hidden rounded-full bg-white/15"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${passed ? "bg-emerald-400" : "bg-[#ABD1C6]"}`}
          style={{ width: `${value}%` }}
        />
        <span
          className="absolute top-0 h-full w-0.5 bg-white/70"
          style={{ left: `${requiredPercent}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default VideoProgressBar;
