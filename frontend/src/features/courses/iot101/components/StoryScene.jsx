import { LuArrowDown, LuSparkles } from "react-icons/lu";

/**
 * StoryScene Component
 * นำเสนอเนื้อหาแบบ Story-driven มีฉากสวนเรียนรู้แห่งเมืองนาวา
 * องค์ประกอบสิ่งแวดล้อม บทสนทนาตัวละคร "ไอโอ" และปุ่มดำเนินเรื่องต่อ
 */
function StoryScene({
  sceneName = "สวนเรียนรู้แห่งเมืองนาวา",
  sceneSubtitle = "จุดเริ่มต้นของภารกิจฟื้นฟูระบบนิเวศน์เมือง",
  characterName = "ไอโอ (Io)",
  characterAvatar = "🤖",
  characterRole = "หุ่นยนต์ผู้ช่วยดูแลสวนนาวา",
  dialogue = "“วันนี้มีบางอย่างผิดปกติในสวน... ต้นไม้เริ่มเหี่ยวเฉา และระบบรดน้ำไม่ทำงาน เราต้องรีบหาสาเหตุกันเถอะ!”",
  environmentElements = [],
  onContinue,
  className = "",
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-[#ABD1C6] bg-gradient-to-b from-[#FAFAFA] to-white p-6 sm:p-8 shadow-sm transition-all duration-300 ${className}`}
    >
      {/* Decorative Garden Ambient Glow */}
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#ABD1C6]/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#004643]/10 blur-3xl"
        aria-hidden="true"
      />

      {/* 1. ส่วนหัวของฉาก (Scene Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#004643] text-white shadow-2xs">
            <LuSparkles className="h-5 w-5 text-[#ABD1C6]" aria-hidden="true" />
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#004643]">
              ฉากเรื่องราว (Story Scene)
            </span>
            <h2 className="text-xl font-extrabold text-[#26332F]">{sceneName}</h2>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#ABD1C6]/30 px-3 py-1 text-xs font-bold text-[#004643]">
          📍 {sceneSubtitle}
        </span>
      </div>

      {/* 2. องค์ประกอบในฉากสวนนาวา (Environmental Elements) */}
      {environmentElements.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-[#6B7773] mb-2.5">
            องค์ประกอบในพื้นที่สวนเรียนรู้:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {environmentElements.map((item, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-[#E5E9E7] bg-white p-3 text-center transition hover:border-[#ABD1C6] hover:bg-[#ABD1C6]/10 hover:shadow-2xs"
              >
                <span className="text-2xl mb-1 transform transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="text-xs font-bold text-[#26332F]">{item.label}</span>
                <span className="text-[10px] text-[#6B7773] line-clamp-1">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. กล่องบทสนทนาตัวละคร "ไอโอ" (Character Dialogue Box) */}
      <div className="mt-6 flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-[#ABD1C6]/60 bg-[#FAFAFA] p-5">
        {/* Character Avatar */}
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#004643] text-3xl shadow-sm ring-4 ring-[#ABD1C6]/40">
            {characterAvatar}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              ✓
            </span>
          </div>
          <div className="sm:text-center">
            <h4 className="text-sm font-extrabold text-[#26332F]">{characterName}</h4>
            <p className="text-[11px] font-medium text-[#6B7773]">{characterRole}</p>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="relative flex-1 rounded-2xl bg-white p-4 border border-[#E5E9E7] shadow-xs">
          <div className="text-xs sm:text-sm leading-relaxed text-[#26332F] font-medium whitespace-pre-line">
            {dialogue}
          </div>
        </div>
      </div>

      {/* 4. ปุ่มดำเนินเรื่องต่อ (Continue Button) */}
      {onContinue && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#004643] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#003835] active:scale-98 transition cursor-pointer"
          >
            <span>ดำเนินเรื่องต่อ</span>
            <LuArrowDown className="h-4 w-4 text-[#ABD1C6] animate-bounce" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default StoryScene;
