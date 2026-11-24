// =====================================================================
// LearningJourney.jsx: แถบ Learning Journey 5 ขั้น ใช้ร่วมกันทุกหน้า (ข้อ 26)
//
// variant
//  - "bar"  : แถบแนวนอน (จอเล็กเลื่อนแนวนอนได้) วางด้านบนของหน้าการเรียน
//  - "list" : รายการแนวตั้งแบบกะทัดรัด ใช้ในการ์ดหน้าแรก
//
// activeStep  : ขั้นที่ไฮไลต์ (1-5) หรือ null = ไม่ไฮไลต์ขั้นไหน
// interactive : ชี้/โฟกัสที่ขั้นไหนจะไฮไลต์ขั้นนั้นชั่วคราว ออกจากแถบแล้วกลับเป็น activeStep
//               (ค่าชั่วคราวเป็น state ของคอมโพเนนต์ จึงไม่ติดไปหน้าอื่น)
// =====================================================================
import { useState } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import { JOURNEY_STEPS, STEP_TONE_CLASSES, getJourneyStepFromPath, getStepTone } from "./journeySteps";
import { useJourneyOverrideStore } from "./useJourneyStep";

// เส้นเชื่อมระหว่างขั้น s กับ s+1 ใช้สีตามขั้นถัดไป (ถึงแล้ว = เขียว, ยังไม่ถึง = เทา)
function lineTone(step, activeStep) {
  return STEP_TONE_CLASSES[getStepTone(step + 1, activeStep)].line;
}

function LearningJourney({ activeStep = null, variant = "bar", interactive = false, className = "" }) {
  const [hoverStep, setHoverStep] = useState(null);
  const shownStep = interactive && hoverStep ? hoverStep : activeStep;

  const hoverProps = (step) =>
    interactive
      ? {
          onMouseEnter: () => setHoverStep(step),
          onFocus: () => setHoverStep(step),
          tabIndex: 0,
        }
      : {};

  const resetProps = interactive
    ? { onMouseLeave: () => setHoverStep(null), onBlur: () => setHoverStep(null) }
    : {};

  if (variant === "list") {
    return (
      <ol className={`space-y-1 ${className}`} aria-label="Learning Journey 5 ขั้นตอน" {...resetProps}>
        {JOURNEY_STEPS.map((s, idx) => {
          const tone = STEP_TONE_CLASSES[getStepTone(s.step, shownStep)];
          const isCurrent = s.step === shownStep;
          return (
            <li
              key={s.num}
              className="flex items-start gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ABD1C6]"
              aria-current={isCurrent ? "step" : undefined}
              {...hoverProps(s.step)}
            >
              <div className="flex flex-col items-center w-3.5 pt-1 shrink-0">
                <span className={`h-3 w-3 rounded-full border-2 shrink-0 transition-colors ${tone.dot}`} aria-hidden="true" />
                {idx < JOURNEY_STEPS.length - 1 && (
                  <span className={`w-0.5 h-4.5 my-0.5 transition-colors ${lineTone(s.step, shownStep)}`} aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                <span className={`text-[11px] font-mono font-bold px-1 rounded transition-colors ${tone.num}`}>{s.num}</span>
                <span className={`text-xs sm:text-sm font-semibold transition-colors ${tone.title}`}>{s.title}</span>
                <span className="text-[11px] text-[#6B7773] ml-1 truncate">· {s.short}</span>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  // variant === "bar"
  return (
    <nav
      aria-label="Learning Journey"
      className={`rounded-2xl border border-[#E5E9E7] bg-white px-3 py-3 sm:px-4 shadow-2xs ${className}`}
    >
      <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto" {...resetProps}>
        {JOURNEY_STEPS.map((s, idx) => {
          const toneName = getStepTone(s.step, shownStep);
          const tone = STEP_TONE_CLASSES[toneName];
          const Icon = s.icon;
          const isCurrent = s.step === shownStep;
          return (
            <li
              key={s.num}
              className="flex items-center gap-1 sm:gap-2 shrink-0 flex-1 min-w-fit"
              aria-current={isCurrent ? "step" : undefined}
              {...hoverProps(s.step)}
            >
              <div className="flex items-center gap-2 rounded-xl px-1.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[#ABD1C6]">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0 transition-colors ${tone.dot}`}
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] font-mono font-bold text-[#6B7773]">ขั้น {s.num}</span>
                  <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${tone.title}`}>
                    {s.title}
                  </span>
                </span>
              </div>
              {idx < JOURNEY_STEPS.length - 1 && (
                <span className={`hidden sm:block h-0.5 flex-1 min-w-4 rounded-full transition-colors ${lineTone(s.step, shownStep)}`} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

LearningJourney.propTypes = {
  activeStep: PropTypes.number,
  variant: PropTypes.oneOf(["bar", "list"]),
  interactive: PropTypes.bool,
  className: PropTypes.string,
};

/**
 * แถบ Learning Journey ที่วางใน Layout: หาขั้นจาก URL ของหน้าที่เปิดอยู่
 * และใช้ขั้นที่หน้าบอกผ่าน useJourneyStep() ถ้ามี (ถูกล้างเมื่อออกจากหน้า)
 * หน้าที่ไม่อยู่ในเส้นทางการเรียน (เช่น โปรไฟล์) ไม่แสดงแถบ
 */
export function LearningJourneyBar({ className = "", sticky = false }) {
  const { pathname } = useLocation();
  const override = useJourneyOverrideStore((s) => s.step);
  const pathStep = getJourneyStepFromPath(pathname);
  if (!pathStep) return null;
  const bar = <LearningJourney variant="bar" activeStep={override ?? pathStep} />;
  if (!sticky) return <div className={className}>{bar}</div>;
  // sticky: ค้างอยู่ใต้ Header ตลอดเวลาเลื่อนหน้าจอ (Header สูง 64px + เส้นขอบ 1px)
  return (
    <div className={`sticky top-[65px] z-20 -mx-1 px-1 py-2 bg-[#FAFAFA]/90 backdrop-blur-md ${className}`}>
      {bar}
    </div>
  );
}

LearningJourneyBar.propTypes = {
  className: PropTypes.string,
  sticky: PropTypes.bool,
};

export default LearningJourney;
