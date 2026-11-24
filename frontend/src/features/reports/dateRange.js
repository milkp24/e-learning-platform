// ======================================================
// dateRange.js: ช่วงวันที่ของรายงาน/Dashboard (ข้อ 31)
// ค่าเป็น Object { range, start, end } ใช้ร่วมกันทุกหน้า
// กติกาตรวจตรงกับ Backend (backend/app/services/reports_service.py)
// ======================================================

export const RANGE_OPTIONS = [
  { id: "today", label: "วันนี้" },
  { id: "7d", label: "7 วัน" },
  { id: "30d", label: "30 วัน" },
  { id: "custom", label: "กำหนดเอง" },
];

export const MAX_RANGE_DAYS = 366;

export const DEFAULT_RANGE = { range: "7d", start: "", end: "" };

/** วันนี้ตามเวลาไทย ในรูป YYYY-MM-DD */
export function todayThai() {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(start, end) {
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000) + 1;
}

/** ตรวจช่วงกำหนดเอง คืนข้อความภาษาไทยเมื่อไม่ผ่าน หรือ "" */
export function validateCustomRange(start, end) {
  if (!start || !end) return "กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด";
  if (start > end) return "วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด";
  if (end > todayThai()) return "วันที่สิ้นสุดต้องไม่เกินวันนี้";
  if (daysBetween(start, end) > MAX_RANGE_DAYS) return `เลือกช่วงวันที่ได้ไม่เกิน ${MAX_RANGE_DAYS} วัน`;
  return "";
}

/** แปลงเป็น Query Params สำหรับ API */
export function rangeToParams(value) {
  const v = value || DEFAULT_RANGE;
  if (v.range === "custom") return { range: "custom", start: v.start, end: v.end };
  return { range: v.range };
}

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function formatThaiDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** ข้อความอธิบายช่วงที่เลือก เช่น "7 วันที่ผ่านมา (18 พ.ย. 2569 – 24 พ.ย. 2569)" */
export function describeRange(value) {
  const today = todayThai();
  const v = value || DEFAULT_RANGE;
  if (v.range === "today") return `วันนี้ (${formatThaiDate(today)})`;
  if (v.range === "7d") return `7 วันที่ผ่านมา (${formatThaiDate(addDays(today, -6))} – ${formatThaiDate(today)})`;
  if (v.range === "30d") return `30 วันที่ผ่านมา (${formatThaiDate(addDays(today, -29))} – ${formatThaiDate(today)})`;
  if (v.start && v.end) {
    return v.start === v.end
      ? formatThaiDate(v.start)
      : `${formatThaiDate(v.start)} – ${formatThaiDate(v.end)}`;
  }
  return "ช่วงที่กำหนดเอง";
}
