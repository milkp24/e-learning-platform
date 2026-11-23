import { LuGlobe, LuLock, LuEyeOff } from "react-icons/lu";

// ======================================================
// courseVisibility — การมองเห็นคอร์สที่เผยแพร่แล้ว (ข้อ 1) ค่าตรงกับ Backend
//   public  = สาธารณะ     ทุกคนเห็น รวม Guest
//   members = จำกัดสิทธิ์  เฉพาะผู้ที่เข้าสู่ระบบ
//   hidden  = ซ่อน        ไม่ขึ้นในรายการ เข้าได้เฉพาะผู้เรียนที่ถูกเพิ่มไว้
// ======================================================

export const COURSE_VISIBILITY_OPTIONS = [
  {
    key: "public",
    label: "สาธารณะ",
    hint: "ทุกคนเห็นคอร์สนี้ รวมถึงผู้ที่ยังไม่ได้เข้าสู่ระบบ",
    icon: LuGlobe,
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  {
    key: "members",
    label: "จำกัดสิทธิ์",
    hint: "เห็นและลงทะเบียนได้เฉพาะผู้ที่เข้าสู่ระบบแล้ว",
    icon: LuLock,
    className: "border-violet-200 bg-violet-50 text-violet-800",
  },
  {
    key: "hidden",
    label: "ซ่อน",
    hint: "ไม่แสดงในรายการ ผู้สอนเพิ่มผู้เรียนเข้าคอร์สเอง",
    icon: LuEyeOff,
    className: "border-slate-300 bg-slate-100 text-slate-700",
  },
];

export function getCourseVisibility(value) {
  return COURSE_VISIBILITY_OPTIONS.find((o) => o.key === value) || COURSE_VISIBILITY_OPTIONS[0];
}
