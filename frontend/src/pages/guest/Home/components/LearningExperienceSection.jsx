import { useState } from "react";
import { JOURNEY_STEPS, STEP_TONE_CLASSES, getStepTone } from "../../../../features/learningJourney";
import {
  LuArrowRight,
  LuArrowDown,
  LuSparkles,
} from "react-icons/lu";

// ======================================================
// LearningExperienceSection Component (ประสบการณ์การเรียนรู้)
// ======================================================
// แสดง Journey 5 ขั้น:
// 01 เลือกคอร์ส → 02 เรียนบทเรียน → 03 ลงมือทำ → 04 แก้ปัญหา → 05 พัฒนาทักษะ
// - Desktop: Horizontal Flow 5 คอลัมน์ เชื่อมต่อด้วยลูกศรแนวนอน
// - Mobile / Tablet: Vertical Flow เชื่อมต่อด้วยลูกศรแนวตั้ง
// - ออกแบบให้เชื่อมโยงกับ Learning Journey แต่มีความกว้างขวางของเนื้อหา
// ======================================================

function LearningExperienceSection() {
  // ข้อมูลและสีชุดเดียวกับ Learning Journey ทุกหน้า (ข้อ 26)
  const steps = JOURNEY_STEPS;
  // ขั้นที่ชี้อยู่ (ชั่วคราว) ออกจากส่วนนี้แล้วกลับเป็นไม่ไฮไลต์
  const [hoverStep, setHoverStep] = useState(null);
  const toneOf = (step) => STEP_TONE_CLASSES[getStepTone(step, hoverStep)];

  return (
    <section
      id="learning-experience"
      className="border-t border-[#E5E9E7] bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/30 px-3.5 py-1 text-xs font-bold text-[#004643]">
            <LuSparkles className="h-3.5 w-3.5" />
            <span>กระบวนการเรียนรู้</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#26332F] tracking-tight">
            ประสบการณ์การเรียนรู้
          </h2>
          <p className="text-sm sm:text-base text-[#6B7773] leading-relaxed">
            กระบวนการ 5 ขั้นตอนในการพัฒนาทักษะอย่างเป็นขั้นตอน จากผู้เริ่มต้นสู่ความเชี่ยวชาญ
          </p>
        </div>

        {/* 1. Desktop View: Horizontal Flow (lg screens, 5 cols) */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-stretch relative" onMouseLeave={() => setHoverStep(null)}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;
            return (
              <div key={step.num} className="relative flex flex-col" onMouseEnter={() => setHoverStep(step.step)}>
                <div className={`flex-1 rounded-3xl border p-5 xl:p-6 space-y-4 transition-all duration-200 shadow-2xs flex flex-col justify-between ${toneOf(step.step).card}`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition-colors ${toneOf(step.step).num}`}>
                        {step.num}
                      </span>
                      <div className="h-10 w-10 rounded-2xl bg-white border border-[#E5E9E7] flex items-center justify-center text-[#004643] shadow-2xs">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                    <h3 className={`text-base font-black transition-colors ${toneOf(step.step).title}`}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#6B7773] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Arrow Connector between steps */}
                {!isLast && (
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center h-6 w-6 rounded-full bg-white border border-[#E5E9E7] shadow-xs text-[#004643]">
                    <LuArrowRight className="h-3 w-3" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Mobile & Tablet View: Vertical Flow (< lg screens) */}
        <div className="lg:hidden flex flex-col space-y-3 max-w-md mx-auto" onMouseLeave={() => setHoverStep(null)}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;
            return (
              <div key={step.num} className="flex flex-col items-center w-full" onMouseEnter={() => setHoverStep(step.step)}>
                <div className={`w-full rounded-2xl border p-5 space-y-2 transition shadow-2xs ${toneOf(step.step).card}`}>
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-white border border-[#E5E9E7] flex items-center justify-center text-[#004643] shrink-0 shadow-2xs">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded transition-colors ${toneOf(step.step).num}`}>
                          {step.num}
                        </span>
                        <h3 className={`text-base font-black truncate transition-colors ${toneOf(step.step).title}`}>
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[#6B7773] mt-1 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Downward Connector between steps */}
                {!isLast && (
                  <div className="my-1.5 flex items-center justify-center text-[#004643]">
                    <LuArrowDown className="h-4 w-4" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LearningExperienceSection;
