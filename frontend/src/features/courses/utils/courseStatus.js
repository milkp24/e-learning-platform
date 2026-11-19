// ======================================================
// courseStatus — แปลงสถานะคอร์สจาก API เป็นข้อความภาษาไทยและสีป้าย
// ใช้ชุดเดียวกับตารางคอร์สในหน้า Admin: เผยแพร่แล้ว / รอตรวจสอบ / ฉบับร่าง / ปิดการเผยแพร่
// ======================================================

const STATUS_MAP = {
  active: { label: "เผยแพร่แล้ว", className: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500" },
  published: { label: "เผยแพร่แล้ว", className: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500" },
  pending: { label: "รอตรวจสอบ", className: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500" },
  under_review: { label: "รอตรวจสอบ", className: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500" },
  draft: { label: "ฉบับร่าง", className: "bg-gray-100 border-gray-300 text-gray-700", dot: "bg-gray-400" },
};

const CLOSED = { label: "ปิดการเผยแพร่", className: "bg-rose-50 border-rose-200 text-rose-800", dot: "bg-rose-400" };

export function getCourseStatus(status) {
  const key = (status || "active").toString().toLowerCase();
  return STATUS_MAP[key] || CLOSED;
}
