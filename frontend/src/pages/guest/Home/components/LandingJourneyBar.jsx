import { useEffect, useState } from "react";
import { LearningJourney } from "../../../../features/learningJourney";

// ======================================================
// LandingJourneyBar (ข้อ 26): แถบ Learning Journey ของหน้าแรก Guest
// - ซ่อนตอนอยู่ส่วน Hero (มีการ์ด Learning Journey อยู่แล้ว)
// - เลื่อนพ้น Hero แล้วแถบค้างอยู่ใต้ Header และไฮไลต์ขั้นตาม Section ที่กำลังอ่านอยู่
// - เปลี่ยนการจับคู่ Section กับขั้นได้ที่ SECTION_STEPS ที่เดียว
// ======================================================

// เรียงตามลำดับบนหน้า: id ของ Section → ขั้น Learning Journey
const SECTION_STEPS = [
  { id: "recommended-courses", step: 1 }, // คอร์สแนะนำ → เลือกคอร์ส
  { id: "learning-categories", step: 2 }, // หมวดหมู่การเรียนรู้ → เรียนบทเรียน
  { id: "why-us", step: 3 }, // ทำไมต้องเรียนกับเรา (ฝึกปฏิบัติจริง) → ลงมือทำ
  { id: "learning-experience", step: 4 }, // ประสบการณ์การเรียนรู้ → แก้ปัญหา
  { id: "home-cta", step: 5 }, // พร้อมเริ่มพัฒนาทักษะ → พัฒนาทักษะ
];

// Header สูง 65px + แถบนี้ประมาณ 80px: Section ที่ขอบบนผ่านเส้นนี้แล้วถือว่ากำลังอ่านอยู่
const READING_LINE_PX = 65 + 80 + 40;

function LandingJourneyBar() {
  const [state, setState] = useState({ visible: false, step: 1 });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = document.getElementById("home-hero");
      const visible = hero ? hero.getBoundingClientRect().bottom <= 65 : window.scrollY > 400;

      let step = SECTION_STEPS[0].step;
      for (const { id, step: s } of SECTION_STEPS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= READING_LINE_PX) step = s;
      }
      // เลื่อนถึงท้ายหน้าแล้ว ให้เป็นขั้นสุดท้ายเสมอ (Section สุดท้ายอาจเตี้ยจนขอบบนไม่ถึงเส้น)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) step = SECTION_STEPS[SECTION_STEPS.length - 1].step;

      setState((prev) => (prev.visible === visible && prev.step === step ? prev : { visible, step }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 top-[65px] z-20 px-4 sm:px-6 lg:px-8 py-2 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-[#E5E9E7] transition-all duration-300 ${
        state.visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
      }`}
      aria-hidden={!state.visible}
    >
      <div className="max-w-7xl mx-auto">
        <LearningJourney variant="bar" activeStep={state.step} />
      </div>
    </div>
  );
}

export default LandingJourneyBar;
