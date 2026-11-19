import { useState } from "react";
import { LuSparkles, LuInfo, LuCheck, LuRotateCcw } from "react-icons/lu";

/**
 * InteractiveActivity Component
 * กิจกรรมอินเทอร์แอคทีฟประจำบทเรียน (ตัวอย่าง EP 1.1 / EP 1.3: ปักเซนเซอร์วัดความชื้นลงแปลงพืช)
 * ผู้เรียนสามารถคลิกเลือกตำแหน่งปัก Soil Moisture Sensor
 * ถูก → แสดง Success Feedback
 * ผิด → แสดง Hint แนะนำ
 */
function InteractiveActivity({
  activityData = {
    title: "กิจกรรม: ลากเซนเซอร์ไปวางตำแหน่งที่เหมาะสม",
    instruction: "เลือกตำแหน่งที่ควรปัก Soil Moisture Sensor เพื่อวัดความชื้นของต้นไม้ได้อย่างแม่นยำที่สุด",
    zones: [
      { id: "leaves", name: "🌿 บริเวณใบไม้ (Leaves)", isCorrect: false, hint: "ใบไม้ไม่ได้ดูดซึมน้ำจากดิน ลองเลื่อนลงไปในชั้นดินดูนะ" },
      { id: "stem", name: "🪵 บริเวณลำต้น (Stem)", isCorrect: false, hint: "ลำต้นอยู่เหนือดิน ความชื้นในดินต้องวัดในดินใต้พื้นผิว" },
      { id: "topsoil", name: "─── ผิวหน้าดิน (Topsoil) ───", isCorrect: false, hint: "ผิวดินอาจแห้งเร็วจากลมแดด แต่รากพืชอยู่ลึกลงไปอีกนิด" },
      { id: "roots", name: "🌱 บริเวณรากพืช (Root Zone)", isCorrect: true, hint: "ยอดเยี่ยม! รากพืชเป็นจุดที่ดูดซึมน้ำ ปักตรงนี้จะได้ค่าความชื้นที่แท้จริง!" },
    ],
  },
  onComplete,
  className = "",
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const zones = activityData.zones || [];
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const handleSelectZone = (zone) => {
    setSelectedZoneId(zone.id);
    if (zone.isCorrect) {
      setIsCompleted(true);
      onComplete?.();
    }
  };

  const handleReset = () => {
    setSelectedZoneId(null);
    setIsCompleted(false);
  };

  return (
    <div
      className={`rounded-3xl border border-[#ABD1C6] bg-white p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#004643] text-white">
              <LuSparkles className="h-4 w-4 text-[#ABD1C6]" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#004643]">
              กิจกรรมลงมือทำ (Interactive Activity)
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#26332F] mt-1">
            {activityData.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7773] mt-0.5">
            {activityData.instruction}
          </p>
        </div>

        {isCompleted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800 self-start sm:self-auto shadow-2xs">
            <LuCheck className="h-4 w-4 text-emerald-600" />
            <span>ทำกิจกรรมสำเร็จแล้ว</span>
          </span>
        )}
      </div>

      {/* Visual Plant & Ground Cross-section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Plant Cross-section Diagram (Left / 7 cols) */}
        <div className="md:col-span-7 rounded-2xl border border-[#E5E9E7] bg-gradient-to-b from-sky-50/50 via-amber-50/40 to-amber-100/60 p-6 space-y-3 shadow-inner">
          <div className="text-xs font-extrabold text-[#004643] mb-2 flex items-center justify-between">
            <span>🌳 ภาคตัดขวางต้นไม้และชั้นดิน (Cross-section)</span>
            <span className="text-[11px] text-[#6B7773]">คลิกโซนเพื่อปักเซนเซอร์</span>
          </div>

          <div className="space-y-2">
            {zones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              let zoneStyle =
                "border-[#E5E9E7] bg-white/90 text-[#26332F] hover:border-[#ABD1C6] hover:bg-white";

              if (isSelected) {
                zoneStyle = zone.isCorrect
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-300"
                  : "border-amber-400 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-200";
              }

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => handleSelectZone(zone)}
                  className={`w-full text-left rounded-2xl border p-3.5 text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${zoneStyle}`}
                >
                  <span className="flex items-center gap-2">
                    {isSelected && (
                      <span className="inline-block text-xs bg-[#004643] text-white px-2 py-0.5 rounded-lg font-mono">
                        📍 ปักที่นี่
                      </span>
                    )}
                    <span>{zone.name}</span>
                  </span>

                  {isSelected && (
                    <span className="text-xs font-bold shrink-0">
                      {zone.isCorrect ? "✓ ถูกต้อง" : "💡 ข้อแนะนำ"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Zone Feedback & Sensor Spec (Right / 5 cols) */}
        <div className="md:col-span-5 rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004643] text-2xl shadow-xs ring-2 ring-[#ABD1C6]">
              🌱
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#26332F]">
                Soil Moisture Sensor
              </h4>
              <p className="text-xs text-[#004643] font-semibold">
                โพรบตรวจวัดความชื้นในดิน 2 ขา
              </p>
            </div>
          </div>

          {selectedZone ? (
            <div
              className={`rounded-2xl p-4 text-xs sm:text-sm border transition-all animate-fadeIn ${
                selectedZone.isCorrect
                  ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                  : "bg-amber-50 border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {selectedZone.isCorrect ? (
                  <LuCheck className="h-4 w-4 text-emerald-600" />
                ) : (
                  <LuInfo className="h-4 w-4 text-amber-600" />
                )}
                <span>{selectedZone.isCorrect ? "ปักเซนเซอร์ถูกต้อง!" : "ยังไม่ตรงจุด"}</span>
              </div>
              <p className="leading-relaxed">{selectedZone.hint}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E5E9E7] bg-white p-4 text-center text-xs text-[#6B7773]">
              เลือกตำแหน่งในแผนภาพทางซ้าย เพื่อทดสอบปักเซนเซอร์ลงในชั้นดิน
            </div>
          )}

          {selectedZone && (
            <button
              type="button"
              onClick={handleReset}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white py-2 text-xs font-semibold text-[#6B7773] hover:text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
            >
              <LuRotateCcw className="h-3.5 w-3.5" />
              <span>ลองปักจุดอื่นใหม่</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InteractiveActivity;
