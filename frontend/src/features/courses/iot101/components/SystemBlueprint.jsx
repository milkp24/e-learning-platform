import { LuLayers, LuSparkles, LuArrowRight } from "react-icons/lu";
import { SYSTEM_BLUEPRINT_CHAPTERS } from "../../../../data/iot101InteractiveData";
import useIoT101Store from "../../../../store/useIoT101Store";

/**
 * SystemBlueprint Component
 * ส่วนสำคัญ "พิมพ์เขียวระบบของฉัน"
 * แสดงการเติบโตของสถาปัตยกรรมระบบ IoT ตาม Chapter (Ch 1 → Ch 2 → Ch 3 → Ch 4)
 * โหนดที่ปลดล็อกแล้วจะแสดงผลสีสดใส ส่วนที่ยังไม่เรียนจะแสดงเป็น Locked / Silhouette
 */
function SystemBlueprint({ className = "" }) {
  const { unlockedBlueprintChapters, unlockedAbilities } = useIoT101Store();

  return (
    <div
      className={`rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-8 shadow-sm space-y-6 ${className}`}
    >
      {/* 1. Header & Growth Philosophy */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E9E7] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#004643] text-white">
              <LuLayers className="h-4 w-4 text-[#ABD1C6]" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#004643]">
              สถาปัตยกรรมระบบที่เติบโต (Evolution Blueprint)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#26332F] mt-1">
            พิมพ์เขียวระบบของฉัน (My System Blueprint)
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7773] mt-0.5">
            เห็นการเชื่อมโยงจริงว่าแต่ละบทเรียนประกอบกันขึ้นเป็นระบบ Smart City ได้อย่างไร
          </p>
        </div>

        {/* Unlocked Abilities Badges */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {["SENSE", "ACTUATE", "CONNECT", "PLATFORM"].map((ability) => {
            const hasAbility = unlockedAbilities.includes(ability);
            return (
              <span
                key={ability}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-mono font-bold transition ${
                  hasAbility
                    ? "bg-[#004643] text-[#ABD1C6] shadow-2xs"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                {hasAbility ? "⚡" : "🔒"} {ability}
              </span>
            );
          })}
        </div>
      </div>

      {/* Growth Highlight Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#004643]/10 via-[#ABD1C6]/20 to-[#004643]/10 p-4 border border-[#ABD1C6]/40 flex items-center gap-3">
        <LuSparkles className="h-5 w-5 text-[#004643] shrink-0" />
        <p className="text-xs sm:text-sm font-semibold text-[#004643]">
          <span className="font-extrabold">“ระบบของฉันกำลังเติบโตขึ้น”</span> —
          ทุก ๆ ภารกิจที่คุณทำสำเร็จในสวนนาวา จะช่วยต่อเติมสถาปัตยกรรมฮาร์ดแวร์และคลาวด์ให้สมบูรณ์ยิ่งขึ้น
        </p>
      </div>

      {/* 2. 4-Chapter Blueprint Progression */}
      <div className="space-y-6">
        {SYSTEM_BLUEPRINT_CHAPTERS.map((bp) => {
          const isUnlocked = unlockedBlueprintChapters.includes(bp.chapter);

          return (
            <div
              key={bp.chapter}
              className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                isUnlocked
                  ? "border-[#ABD1C6] bg-[#FAFAFA] shadow-xs"
                  : "border-dashed border-gray-200 bg-gray-50/40 opacity-70"
              }`}
            >
              {/* Chapter Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E9E7]/60 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                      isUnlocked
                        ? "bg-[#004643] text-[#ABD1C6]"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    Ch.{bp.chapter}
                  </span>
                  <h3
                    className={`text-sm sm:text-base font-extrabold ${
                      isUnlocked ? "text-[#26332F]" : "text-gray-500"
                    }`}
                  >
                    {bp.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isUnlocked
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isUnlocked ? `✓ ปลดล็อก: ${bp.ability}` : `🔒 ปลดล็อกใน Chapter ${bp.chapter}`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#6B7773] mb-4">{bp.description}</p>

              {/* Visual Flow Diagram Nodes */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-2 overflow-x-auto">
                {bp.nodes.map((node, nIdx) => (
                  <div key={node.id} className="flex items-center gap-2 sm:gap-3">
                    {/* Node Card */}
                    <div
                      className={`flex flex-col items-center justify-center min-w-[90px] sm:min-w-[110px] rounded-2xl p-3 text-center border transition ${
                        isUnlocked
                          ? "border-[#ABD1C6] bg-white shadow-xs hover:border-[#004643]"
                          : "border-gray-200 bg-gray-100/80 text-gray-400"
                      }`}
                    >
                      <span className="text-xl sm:text-2xl mb-1">{node.icon}</span>
                      <span
                        className={`text-xs font-extrabold ${
                          isUnlocked ? "text-[#26332F]" : "text-gray-500"
                        }`}
                      >
                        {node.label}
                      </span>
                      <span className="text-[10px] text-[#6B7773] line-clamp-1">
                        {node.subtitle}
                      </span>
                    </div>

                    {/* Arrow to Next Node */}
                    {nIdx < bp.nodes.length - 1 && (
                      <LuArrowRight
                        className={`h-4 w-4 shrink-0 ${
                          isUnlocked ? "text-[#004643]" : "text-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SystemBlueprint;
