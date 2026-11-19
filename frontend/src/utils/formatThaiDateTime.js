// ======================================================
// formatThaiDateTime — แปลงเวลาแบบ ISO จาก API เป็นวันที่ภาษาไทย
// "2026-11-17T08:09:12+00:00" → "17 พ.ย. 2569 15:09"
// ถ้าแปลงไม่ได้ (เช่น เป็นข้อความอยู่แล้ว "เมื่อสักครู่") จะคืนค่าเดิม
// ======================================================

export default function formatThaiDateTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
