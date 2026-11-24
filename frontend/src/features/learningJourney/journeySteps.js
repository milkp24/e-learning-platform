// =====================================================================
// journeySteps.js: ข้อมูลและกติกากลางของ Learning Journey 5 ขั้น (ข้อ 26)
//
// ทุกหน้าที่แสดง Learning Journey (หน้าแรก, รายการคอร์ส, หน้าคอร์ส, บทเรียน,
// บันทึกการเรียนรู้, หน้าแรกนักเรียน) ใช้ข้อมูลชุดนี้ชุดเดียว
// เพื่อให้ชื่อขั้น สี และรูปแบบเหมือนกันทุกหน้า
//
// ขั้นที่ไฮไลต์คำนวณจาก URL ของหน้าที่เปิดอยู่ทุกครั้ง (getJourneyStepFromPath)
// ไม่เก็บไว้ใน store จึงไม่ค้างค่าจากหน้าก่อน
// =====================================================================
import { LuBookOpen, LuCirclePlay, LuCode, LuCompass, LuTrendingUp } from "react-icons/lu";

export const JOURNEY_STEPS = [
  {
    step: 1,
    num: "01",
    icon: LuBookOpen,
    title: "เลือกคอร์ส",
    short: "เลือกหลักสูตรที่ต้องการเรียน",
    desc: "ค้นหาหลักสูตรที่ตรงกับเป้าหมายและความสนใจของคุณ",
  },
  {
    step: 2,
    num: "02",
    icon: LuCirclePlay,
    title: "เรียนบทเรียน",
    short: "ศึกษาเนื้อหาแบบ Interactive",
    desc: "ทำความเข้าใจเนื้อหาและแนวคิดสำคัญผ่านสื่อคุณภาพ",
  },
  {
    step: 3,
    num: "03",
    icon: LuCode,
    title: "ลงมือทำ",
    short: "ฝึกปฏิบัติจริงใน Workspace",
    desc: "นำความรู้มาทดลองและฝึกปฏิบัติจริงในระบบ",
  },
  {
    step: 4,
    num: "04",
    icon: LuCompass,
    title: "แก้ปัญหา",
    short: "ทดสอบและแก้โจทย์ท้าทาย",
    desc: "เรียนรู้จากการแก้โจทย์และรับมือกับความท้าทาย",
  },
  {
    step: 5,
    num: "05",
    icon: LuTrendingUp,
    title: "พัฒนาทักษะ",
    short: "ต่อยอดสู่ระดับมืออาชีพ",
    desc: "ต่อยอดองค์ความรู้เพื่อนำไปประยุกต์ใช้สร้างสรรค์จริง",
  },
];

/**
 * หาขั้นของ Learning Journey จาก path ของหน้าที่เปิดอยู่
 * คืน null ถ้าหน้านั้นไม่อยู่ในเส้นทางการเรียน (เช่นหน้าแรก Guest, หน้าโปรไฟล์)
 *
 * - /classrooms                              → 1 เลือกคอร์ส
 * - /classrooms/:id, /courses/:id            → 1 (ยังไม่ได้ลงทะเบียน) หรือ 2 (ลงทะเบียนแล้ว) ให้หน้าส่ง override มา
 * - /classrooms/:id/lessons/:lessonId        → 2 เรียนบทเรียน (หน้าบทเรียนส่ง 3/4 มาเองถ้ามีกิจกรรม/โจทย์)
 * - /journals, /student/home                 → 5 พัฒนาทักษะ (ทบทวนความก้าวหน้าและบันทึกการเรียนรู้)
 */
export function getJourneyStepFromPath(pathname = "") {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (/^\/classrooms\/[^/]+\/lessons\/[^/]+$/.test(path)) return 2;
  if (/^\/(classrooms|courses)\/[^/]+$/.test(path)) return 1;
  if (path === "/classrooms") return 1;
  if (path === "/journals" || path === "/student/home") return 5;
  return null;
}

/**
 * สถานะของแต่ละขั้นเมื่อเทียบกับขั้นที่ไฮไลต์
 * - "active": ขั้นปัจจุบัน
 * - "done":   ขั้นที่ผ่านมาแล้ว
 * - "todo":   ขั้นถัดไป
 * - "idle":   ยังไม่มีขั้นที่ไฮไลต์ (ทุกขั้นหน้าตาเหมือนกัน)
 */
export function getStepTone(step, activeStep) {
  if (!activeStep) return "idle";
  if (step === activeStep) return "active";
  return step < activeStep ? "done" : "todo";
}

// สีชุดเดียวของทุกหน้า (โทน Primary #004643 / Soft Jade #ABD1C6)
export const STEP_TONE_CLASSES = {
  active: {
    dot: "bg-[#004643] border-[#004643] text-white ring-4 ring-[#ABD1C6]/40",
    card: "border-[#004643] bg-white shadow-sm",
    num: "bg-[#004643] text-white",
    title: "text-[#004643]",
    line: "bg-[#004643]",
  },
  done: {
    dot: "bg-[#ABD1C6] border-[#ABD1C6] text-[#004643]",
    card: "border-[#ABD1C6] bg-[#F4F8F6]",
    num: "bg-[#ABD1C6]/50 text-[#004643]",
    title: "text-[#26332F]",
    line: "bg-[#ABD1C6]",
  },
  todo: {
    dot: "bg-white border-[#E5E9E7] text-[#6B7773]",
    card: "border-[#E5E9E7] bg-[#FAFAFA]",
    num: "bg-[#E5E9E7]/70 text-[#6B7773]",
    title: "text-[#6B7773]",
    line: "bg-[#E5E9E7]",
  },
  idle: {
    dot: "bg-white border-[#004643] text-[#004643]",
    card: "border-[#E5E9E7] bg-[#FAFAFA]",
    num: "bg-[#ABD1C6]/30 text-[#004643]",
    title: "text-[#26332F]",
    line: "bg-[#ABD1C6]/70",
  },
};
