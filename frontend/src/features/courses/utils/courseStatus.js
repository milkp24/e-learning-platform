// ======================================================
// courseStatus — สถานะคอร์สและปุ่มเปลี่ยนสถานะ (ใช้ร่วมกันทุกหน้า)
// สถานะตรงกับ Backend:
//   draft    = ฉบับร่าง
//   pending  = รอตรวจสอบ   (ผู้ไม่มีสิทธิ์ courses.publish กดเผยแพร่ → ส่งให้ผู้ดูแลตรวจ)
//   active   = เผยแพร่แล้ว
//   archived = เก็บถาวร    (ซ่อนจากรายการ ผู้ที่ลงทะเบียนแล้วยังเรียนได้)
// ปุ่มที่แสดงคำนวณจาก can_manage / can_publish / can_unpublish / can_review ที่ Backend ส่งมา
// Backend ตรวจสิทธิ์ซ้ำทุกครั้งที่กด
// ======================================================
import { LuSend, LuEyeOff, LuArchive, LuArchiveRestore, LuCheck, LuX, LuUndo2 } from "react-icons/lu";

const ALIASES = { published: "active", under_review: "pending", inactive: "archived" };

export function normalizeCourseStatus(status) {
  const s = (status || "active").toString().toLowerCase();
  return ALIASES[s] || s;
}

const STATUS_INFO = {
  draft: { label: "ฉบับร่าง", className: "bg-gray-100 border-gray-300 text-gray-700", dot: "bg-gray-400" },
  pending: { label: "รอตรวจสอบ", className: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500" },
  active: { label: "เผยแพร่แล้ว", className: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500" },
  archived: { label: "เก็บถาวร", className: "bg-slate-100 border-slate-300 text-slate-600", dot: "bg-slate-500" },
};

export function getCourseStatus(status) {
  return STATUS_INFO[normalizeCourseStatus(status)] || STATUS_INFO.draft;
}

/** คอร์สเผยแพร่แล้วหรือยัง (Guest และผู้เรียนเห็นได้) */
export function isPublishedStatus(status) {
  return normalizeCourseStatus(status) === "active";
}

// tone: primary = ปุ่มหลักสีเข้ม, success / warning / neutral / danger = สีตามความหมาย
const ACTIONS = {
  publish: { key: "publish", label: "เผยแพร่", icon: LuSend, tone: "primary", status: "active",
    hint: "เปิดให้ผู้เรียนและผู้เยี่ยมชมเห็นคอร์สนี้" },
  submit: { key: "submit", label: "ส่งตรวจ", icon: LuSend, tone: "primary", status: "active",
    hint: "ส่งให้ผู้ดูแลตรวจสอบก่อนเผยแพร่" },
  cancel: { key: "cancel", label: "ยกเลิกคำขอ", icon: LuUndo2, tone: "neutral", status: "draft",
    hint: "ถอนคำขอเผยแพร่ กลับไปแก้ไขเป็นฉบับร่าง" },
  approve: { key: "approve", label: "อนุมัติ", icon: LuCheck, tone: "success", review: true,
    hint: "อนุมัติและเผยแพร่คอร์สนี้" },
  reject: { key: "reject", label: "ไม่อนุมัติ", icon: LuX, tone: "danger", review: false,
    hint: "ส่งกลับให้ผู้สอนแก้ไข พร้อมเหตุผล" },
  unpublish: { key: "unpublish", label: "ยกเลิกเผยแพร่", icon: LuEyeOff, tone: "warning", status: "draft",
    hint: "ซ่อนคอร์สและกลับเป็นฉบับร่าง" },
  archive: { key: "archive", label: "เก็บถาวร", icon: LuArchive, tone: "neutral", status: "archived",
    hint: "ซ่อนจากรายการคอร์ส ผู้ที่ลงทะเบียนแล้วยังเรียนได้" },
  restore: { key: "restore", label: "กู้คืน", icon: LuArchiveRestore, tone: "neutral", status: "draft",
    hint: "นำคอร์สกลับมาเป็นฉบับร่าง" },
};

/** ปุ่มเปลี่ยนสถานะที่ผู้ใช้กดได้กับคอร์สนี้ เรียงตามความสำคัญ */
export function getStatusActions(course) {
  if (!course?.can_manage) return [];
  const s = normalizeCourseStatus(course.status);
  if (s === "draft") return [course.can_publish ? ACTIONS.publish : ACTIONS.submit];
  if (s === "pending") return course.can_review ? [ACTIONS.approve, ACTIONS.reject] : [ACTIONS.cancel];
  if (s === "active") return course.can_unpublish ? [ACTIONS.unpublish, ACTIONS.archive] : [];
  if (s === "archived") return [ACTIONS.restore];
  return [];
}
