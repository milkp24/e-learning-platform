import { Link } from "react-router-dom";
import {
  LuArrowDown,
  LuArrowRight,
  LuMousePointerClick,
  LuWrench,
  LuChartLine,
  LuTarget,
  LuWorkflow,
} from "react-icons/lu";
import { LearningJourney } from "../../../../features/learningJourney";

// ======================================================
// HeroSection Component (Structured Professional E-learning Hero)
// ======================================================
// 1. Left Visual Zone: Hero Content Panel
//    - Background Panel (bg-white/90, border-[#E5E9E7], subtle shadow, rounded-3xl)
//    - Subtle internal decorative vector (dot matrix, thin geometric lines, opacity 4%-7%)
//    - Vertical Soft Jade accent line beside Heading (3px, #ABD1C6, rounded-full)
//    - Soft Jade subtle highlight anchor on "ลงมือทำจริง"
//    - Eyebrow: "แพลตฟอร์มเรียนรู้ออนไลน์ระดับมืออาชีพ" (Soft Jade label badge, no icon)
//    - Heading: "เรียนรู้ผ่านการลงมือทำจริง" (font-semibold ~600, text-[#26332F])
//    - Description: "เรียนรู้ ทดลอง และพัฒนาทักษะผ่านบทเรียนแบบ Interactive พร้อมนำความรู้ไปประยุกต์ใช้ได้จริง" (max-w-xl)
//    - CTA: "เริ่มเรียนรู้" & "ดูคอร์สทั้งหมด" (Equal button height)
//    - 5 Feature Highlights (Compact 3+2 layout, 2D flat SVG, straight, equal frame):
//      * Interactive Learning -> เรียนรู้แบบ Interactive (LuMousePointerClick)
//      * Hands-on Practice -> ฝึกปฏิบัติจริง (LuWrench)
//      * Track Progress -> ติดตามความก้าวหน้า (LuChartLine)
//      * Practical Skills -> ประยุกต์ใช้ได้จริง (LuTarget)
//      * Learn by Doing -> เปลี่ยนความรู้เป็นทักษะ (LuWorkflow)
// 2. Right Visual Zone: Layered Product Visual
//    - Top/Right: LEARNING JOURNEY Card (ใช้ LearningJourney กลาง: สีและรูปแบบเดียวกับทุกหน้า)
//    - Bottom/Left: LEARNING WORKSPACE Card (Chapter 01, Intro to IoT, Modules, Static Action)
// ======================================================

function HeroSection() {
  const scrollToCourses = () => {
    const el =
      document.getElementById("course-preview") ||
      document.getElementById("recommended-courses") ||
      document.getElementById("courses-discovery");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const featureHighlights = [
    {
      icon: LuMousePointerClick,
      title: "Interactive Learning",
      desc: "เรียนรู้แบบ Interactive",
    },
    {
      icon: LuWrench,
      title: "Hands-on Practice",
      desc: "ฝึกปฏิบัติจริง",
    },
    {
      icon: LuChartLine,
      title: "Track Progress",
      desc: "ติดตามความก้าวหน้า",
    },
    {
      icon: LuTarget,
      title: "Practical Skills",
      desc: "ประยุกต์ใช้ได้จริง",
    },
    {
      icon: LuWorkflow,
      title: "Learn by Doing",
      desc: "เปลี่ยนความรู้เป็นทักษะ",
    },
  ];


  return (
    <section id="home-hero" className="relative overflow-hidden bg-gradient-to-b from-[#F8FAF9] via-white to-white border-b border-[#E5E9E7] pt-10 sm:pt-14 lg:pt-16 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
      {/* ======================================================== */}
      {/* Background Subtle Ambient Vectors                        */}
      {/* ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Dot Matrix Pattern */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="hero-ambient-dots"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.25" fill="#004643" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-ambient-dots)" />
        </svg>

        {/* Right Geometric Architectural Background */}
        <svg
          className="absolute -top-16 -right-16 w-[540px] h-[540px] text-[#004643] opacity-[0.07]"
          viewBox="0 0 540 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="70" y="70" width="400" height="400" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <rect x="130" y="130" width="280" height="280" stroke="currentColor" strokeWidth="1" />
          <circle cx="270" cy="270" r="160" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="270" cy="270" r="90" stroke="currentColor" strokeWidth="1" />
          <line x1="70" y1="270" x2="470" y2="270" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="270" y1="70" x2="270" y2="470" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="270" cy="130" r="3.5" fill="currentColor" />
          <circle cx="270" cy="410" r="3.5" fill="currentColor" />
          <circle cx="130" cy="270" r="3.5" fill="currentColor" />
          <circle cx="410" cy="270" r="3.5" fill="currentColor" />
          <circle cx="270" cy="270" r="4.5" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start lg:items-center">
          {/* ======================================================== */}
          {/* 1. ฝั่งซ้าย: Hero Content Panel (7 Cols on LG)           */}
          {/* Visual Frame / Background Panel ที่สร้างโครงสร้างชัดเจน  */}
          {/* ======================================================== */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl border border-[#E5E9E7] bg-white/90 p-6 sm:p-8 lg:p-9 shadow-xs space-y-6 text-center lg:text-left overflow-hidden">
              {/* Decorative Vector Background inside the Content Panel (4%-6% opacity) */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden select-none"
                aria-hidden="true"
              >
                <svg
                  className="absolute inset-0 h-full w-full opacity-[0.05]"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="panel-dot-matrix"
                      width="24"
                      height="24"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="2" cy="2" r="1" fill="#004643" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#panel-dot-matrix)" />
                </svg>

                {/* Subtle Geometric Wireframe in Top-Right Corner of Panel */}
                <svg
                  className="absolute -top-10 -right-10 w-56 h-56 text-[#ABD1C6] opacity-[0.09]"
                  viewBox="0 0 224 224"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="112" cy="112" r="84" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="28" y1="112" x2="196" y2="112" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="112" y1="28" x2="112" y2="196" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="112" cy="112" r="3" fill="currentColor" />
                </svg>
              </div>

              {/* Panel Content (Above Internal Background) */}
              <div className="relative z-10 space-y-6">
                {/* 1. Eyebrow: Soft Jade label badge */}
                <div>
                  <div className="inline-flex items-center rounded-lg border border-[#ABD1C6] bg-[#ABD1C6]/15 px-3.5 py-1 text-xs sm:text-sm font-medium tracking-wide text-[#004643]">
                    แพลตฟอร์มเรียนรู้ออนไลน์ระดับมืออาชีพ
                  </div>
                </div>

                {/* 2. Main Heading & 3. Description (พร้อม Vertical Accent Line & Anchor) */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4 text-center lg:text-left justify-center lg:justify-start">
                    {/* Vertical Soft Jade Accent Line */}
                    <span
                      className="w-[3px] self-stretch rounded-full bg-[#ABD1C6] shrink-0 mt-1.5 mb-1 hidden sm:block"
                      aria-hidden="true"
                    />
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight text-[#26332F] leading-tight sm:leading-tight lg:leading-tight">
                      เรียนรู้ผ่านการ{" "}
                      <span className="relative inline-block">
                        <span
                          className="absolute inset-x-0 bottom-1.5 h-3 bg-[#ABD1C6]/35 -z-10 rounded-xs"
                          aria-hidden="true"
                        />
                        ลงมือทำจริง
                      </span>
                    </h1>
                  </div>

                  <p className="text-base sm:text-lg lg:text-xl font-normal text-[#6B7773] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    เรียนรู้ ทดลอง และพัฒนาทักษะผ่านบทเรียนแบบ Interactive
                    พร้อมนำความรู้ไปประยุกต์ใช้ได้จริง
                  </p>
                </div>

                {/* 4. CTA Buttons (ความสูงเท่ากัน) */}
                <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    type="button"
                    onClick={scrollToCourses}
                    className="w-full sm:w-auto h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-[#004643] px-7 text-sm sm:text-base font-medium text-white shadow-xs hover:bg-[#003835] hover:shadow-sm transition-colors duration-200 cursor-pointer"
                  >
                    <span>เริ่มเรียนรู้</span>
                    <LuArrowDown className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <Link
                    to="/classrooms"
                    className="w-full sm:w-auto h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-[#ABD1C6] bg-white px-7 text-sm sm:text-base font-medium text-[#26332F] hover:border-[#004643] hover:bg-[#F4F8F6] transition-colors duration-200 shadow-2xs"
                  >
                    <span>ดูคอร์สทั้งหมด</span>
                    <LuArrowRight className="w-4 h-4 text-[#004643]" aria-hidden="true" />
                  </Link>
                </div>

                {/* 5. Feature Highlights (5 Compact Cards ภายใน Panel เดียวกัน) */}
                <div className="pt-5 border-t border-[#E5E9E7]/90">
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3 items-stretch">
                    {featureHighlights.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <div
                          key={feature.title}
                          className={`h-full flex flex-col items-center text-center p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#E5E9E7] bg-white shadow-2xs hover:border-[#ABD1C6] hover:bg-[#F4F8F6] transition-colors duration-200 transition-shadow col-span-1 lg:col-span-2 ${
                            idx === 4
                              ? "col-span-2 sm:col-span-1 lg:col-span-2 max-w-[calc(50%-0.3125rem)] sm:max-w-none mx-auto sm:mx-0 w-full"
                              : ""
                          }`}
                        >
                          {/* Consistent Square Frame for Vector/SVG Icon (w-10 h-10, Icon w-5 h-5) */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#ABD1C6]/20 text-[#004643] mb-2 shrink-0">
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-semibold text-[#26332F] leading-snug">
                            {feature.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-[#6B7773] mt-0.5 leading-normal">
                            {feature.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. ฝั่งขวา: Layered Learning Platform Visual (5 Cols on LG)*/}
          {/* Layer 1: Learning Journey Card (Top/Right)               */}
          {/* Layer 2: Learning Workspace Card (Bottom/Left)           */}
          {/* ======================================================== */}
          {/* ======================================================== */}
          {/* 2. ฝั่งขวา: Layered Learning Platform Visual (5 Cols on LG)*/}
          {/* Layer 1: Learning Journey Card (Top)                      */}
          {/* Layer 2: Learning Workspace Card (Bottom)                 */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end gap-6 sm:gap-7 lg:gap-8 w-full">
            {/* Layer 1: Learning Journey Card */}
            <div className="w-full max-w-sm lg:max-w-[400px] rounded-2xl border border-[#E5E9E7] bg-white p-4 sm:p-5 shadow-xs relative z-20 space-y-3.5">
              {/* Card Header */}
              <div className="border-b border-[#E5E9E7] pb-2.5 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold tracking-widest text-[#004643] uppercase">
                    LEARNING JOURNEY
                  </h2>
                  <p className="text-[11px] text-[#6B7773] mt-0.5">
                    เส้นทางการพัฒนาทักษะแบบเป็นขั้นตอน
                  </p>
                </div>
                <span className="rounded-md border border-[#ABD1C6]/60 bg-[#ABD1C6]/15 px-2 py-0.5 text-[10px] font-semibold text-[#004643]">
                  5 ขั้นตอน
                </span>
              </div>

              {/* Steps Timeline: ใช้คอมโพเนนต์กลาง (ข้อ 26) ชี้ที่ขั้นไหนจะไฮไลต์ขั้นนั้น */}
              <LearningJourney variant="list" interactive />

              {/* Card Footer: Learning Experience */}
              <div className="border-t border-[#E5E9E7] pt-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#6B7773]">
                    LEARNING EXPERIENCE
                  </p>
                  <p className="text-xs font-semibold text-[#004643] mt-0.5 tracking-wide">
                    Interactive · Practice · Build
                  </p>
                </div>
              </div>
            </div>

            {/* Layer 2: Learning Workspace Card (Clean vertical separation) */}
            <div className="w-full max-w-sm lg:max-w-[400px] rounded-2xl border border-[#ABD1C6] bg-white p-4 sm:p-5 shadow-xs relative z-10 space-y-3.5">
              {/* Workspace Header */}
              <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1" aria-hidden="true">
                    <span className="w-2 h-2 rounded-full bg-[#E5E9E7]" />
                    <span className="w-2 h-2 rounded-full bg-[#ABD1C6]" />
                    <span className="w-2 h-2 rounded-full bg-[#004643]" />
                  </div>
                  <span className="text-[11px] font-bold tracking-widest text-[#004643] uppercase ml-1">
                    LEARNING WORKSPACE
                  </span>
                </div>
                <span className="rounded-md border border-[#ABD1C6]/60 bg-[#ABD1C6]/15 px-2 py-0.5 text-[10px] font-semibold text-[#004643]">
                  Interactive Session
                </span>
              </div>

              {/* Workspace Body: Course -> Chapter -> Lesson Hierarchy */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#004643]">
                    Chapter 01
                  </span>
                  <span className="text-[10px] text-[#6B7773] bg-[#FAFAF9] border border-[#E5E9E7] px-1.5 py-0.5 rounded">
                    Course: IoT Fundamentals
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-[#26332F]">
                  Introduction to IoT: Sensor Basics
                </h3>
              </div>

              {/* 3 Pillars / Status Tags (Responsive Spacing) */}
              <div className="border-t border-[#E5E9E7]/80 pt-3">
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAF9] p-2">
                    <p className="text-[10px] text-[#6B7773]">Interactive</p>
                    <p className="text-xs font-bold text-[#26332F] mt-0.5">Lesson</p>
                  </div>
                  <div className="rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/15 p-2">
                    <p className="text-[10px] text-[#004643]">Practice</p>
                    <p className="text-xs font-bold text-[#004643] mt-0.5">Available</p>
                  </div>
                  <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAF9] p-2">
                    <p className="text-[10px] text-[#6B7773]">Build</p>
                    <p className="text-xs font-bold text-[#26332F] mt-0.5">Hands-on</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <Link
                  to="/classrooms"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#004643] hover:bg-[#003835] py-2.5 px-3 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
                >
                  <span>เข้าสู่ Learning Workspace</span>
                  <LuArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
