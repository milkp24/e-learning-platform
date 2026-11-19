import { useState } from "react";
import { LuMapPin, LuInfo, LuSparkles } from "react-icons/lu";
import { GARDEN_MAP_ZONES } from "../../../../data/iot101InteractiveData";
import useIoT101Store from "../../../../store/useIoT101Store";

/**
 * InteractiveMap Component
 * แผนที่อินเทอร์แอคทีฟของ "สวนเรียนรู้แห่งเมืองนาวา" สำหรับ Chapter 0
 * ผู้เรียนสามารถคลิกสำรวจ 6 โซนปัญหาในสวน ตอบคำถามเพื่อวิเคราะห์ความต้องการ และสะสมคะแนนสำรวจ
 */
function InteractiveMap({ className = "" }) {
  const { exploredMapZones, exploreMapZone } = useIoT101Store();
  const [selectedZone, setSelectedZone] = useState(GARDEN_MAP_ZONES[0]);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const exploredCount = exploredMapZones.length;
  const totalZones = GARDEN_MAP_ZONES.length;
  const isAllExplored = exploredCount >= totalZones;

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
    setSelectedOptionId(null);
    setShowFeedback(false);
  };

  const handleSelectOption = (option) => {
    setSelectedOptionId(option.id);
    setShowFeedback(true);
    if (option.isCorrect) {
      exploreMapZone(selectedZone.id);
    }
  };

  return (
    <div
      className={`rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* 1. Header & Exploration Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E9E7] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#004643] text-white">
              <LuMapPin className="h-4 w-4 text-[#ABD1C6]" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#004643]">
              แผนที่อินเทอร์แอคทีฟ (Interactive Map)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#26332F] mt-1">
            สวนเรียนรู้แห่งเมืองนาวา
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7773] mt-0.5">
            คลิกสำรวจพื้นที่ต่าง ๆ ในสวนเพื่อค้นพบปัญหา และค้นหาเทคโนโลยี IoT ที่เหมาะสม
          </p>
        </div>

        {/* Counter & Progress */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto bg-[#FAFAFA] border border-[#E5E9E7] rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6B7773]">ความคืบหน้าการสำรวจ:</span>
            <span className="text-sm font-extrabold text-[#004643]">
              {exploredCount}/{totalZones} จุด
            </span>
          </div>
          <div className="w-36 h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-[#004643] rounded-full transition-all duration-500"
              style={{ width: `${(exploredCount / totalZones) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {isAllExplored && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 text-xs sm:text-sm shadow-2xs animate-fadeIn">
          <LuSparkles className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-extrabold">สำรวจครบทุกจุดในสวนแล้ว!</span>{" "}
            คุณเข้าใจปัญหาทั้ง 6 ด้านของเมืองนาวาเรียบร้อยแล้ว พร้อมเริ่มเรียนรู้การสร้าง Sensor ใน Chapter 1
          </div>
        </div>
      )}

      {/* 2. Map Layout and Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map Visual (Left / 7 cols) */}
        <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[460px] rounded-3xl border-2 border-[#ABD1C6] bg-gradient-to-br from-[#E8F3EE] via-[#F4F9F6] to-[#FAFAFA] p-4 sm:p-6 overflow-hidden shadow-inner select-none">
          {/* Garden Pathways & Paths Visual SVG */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Curved Path */}
            <path
              d="M 20 80 Q 50 60, 50 50 T 80 30"
              fill="none"
              stroke="#ABD1C6"
              strokeWidth="4"
              strokeDasharray="2,2"
            />
            <path
              d="M 30 30 Q 50 50, 75 75"
              fill="none"
              stroke="#ABD1C6"
              strokeWidth="3"
              strokeDasharray="1,1"
            />
            {/* Garden Pond / Water Area */}
            <ellipse cx="74" cy="28" rx="14" ry="10" fill="#0288D1" fillOpacity="0.12" />
            {/* Green zones */}
            <ellipse cx="26" cy="32" rx="16" ry="12" fill="#2E7D32" fillOpacity="0.1" />
          </svg>

          <div className="relative z-10 text-xs font-extrabold text-[#004643] bg-white/80 backdrop-blur-xs px-3 py-1 rounded-xl inline-block shadow-2xs border border-[#E5E9E7]">
            🌱 แผนผังสวนเรียนรู้แห่งเมืองนาวา (Nava City Garden Layout)
          </div>

          {/* 6 Interactive Hotspot Pins */}
          {GARDEN_MAP_ZONES.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            const isExplored = exploredMapZones.includes(zone.id);

            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleSelectZone(zone)}
                style={{
                  top: `${zone.coordinates.y}%`,
                  left: `${zone.coordinates.x}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center cursor-pointer transition-transform duration-200 ${
                  isSelected ? "scale-110 z-20" : "hover:scale-105 z-10"
                }`}
                aria-label={`สำรวจ ${zone.name}`}
              >
                {/* Pulsing Aura if not explored yet */}
                {!isExplored && (
                  <span className="absolute -inset-2 rounded-full bg-[#004643]/20 animate-ping pointer-events-none" />
                )}

                {/* Hotspot Pin Button */}
                <div
                  className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl text-xl sm:text-2xl shadow-md transition-all ${
                    isSelected
                      ? "bg-[#004643] text-white ring-4 ring-[#ABD1C6]"
                      : isExplored
                      ? "bg-white text-[#26332F] border-2 border-emerald-500"
                      : "bg-white text-[#26332F] border-2 border-[#ABD1C6]"
                  }`}
                >
                  <span>{zone.icon}</span>
                  {isExplored && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                </div>

                {/* Zone Label Badge */}
                <span
                  className={`mt-1.5 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-xs transition-colors ${
                    isSelected
                      ? "bg-[#004643] text-white"
                      : "bg-white/95 text-[#26332F] border border-[#E5E9E7]"
                  }`}
                >
                  {zone.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inspection & Quiz Panel (Right / 5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-[#E5E9E7] bg-[#FAFAFA] p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-[#E5E9E7] pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">{selectedZone.icon}</span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#26332F]">
                  {selectedZone.name}
                </h3>
                <span className="text-xs font-semibold text-[#004643]">
                  {exploredMapZones.includes(selectedZone.id)
                    ? "✓ สำรวจเรียบร้อยแล้ว"
                    : "⚠️ จุดที่ยังไม่ได้สำรวจ"}
                </span>
              </div>
            </div>
          </div>

          {/* Problem Details */}
          <div className="rounded-2xl bg-white border border-[#E5E9E7] p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
              <LuInfo className="h-4 w-4" />
              <span>ปัญหาในพื้นที่:</span>
            </div>
            <h4 className="text-sm font-extrabold text-[#26332F]">
              {selectedZone.problemTitle}
            </h4>
            <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
              {selectedZone.problemDescription}
            </p>
          </div>

          {/* Interactive Question */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#004643]">
              <LuInfo className="h-4 w-4" />
              <span>{selectedZone.question}</span>
            </div>

            <div className="space-y-2">
              {selectedZone.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                let btnStyle =
                  "border-[#E5E9E7] bg-white text-[#26332F] hover:border-[#ABD1C6] hover:bg-[#ABD1C6]/10";

                if (isSelected) {
                  btnStyle = opt.isCorrect
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 font-bold"
                    : "border-rose-400 bg-rose-50 text-rose-950 font-bold";
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left rounded-2xl border p-3.5 text-xs sm:text-sm transition cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {isSelected && (
                      <span className="text-xs font-bold ml-2 shrink-0">
                        {opt.isCorrect ? "✓ ถูกต้อง" : "✕ ลองใหม่"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback */}
            {showFeedback && (
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm transition-all animate-fadeIn ${
                  selectedZone.options.find((o) => o.id === selectedOptionId)?.isCorrect
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border border-amber-200 text-amber-900"
                }`}
              >
                <p className="leading-relaxed">
                  {selectedZone.options.find((o) => o.id === selectedOptionId)?.feedback}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveMap;
