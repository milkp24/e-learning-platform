import { Link } from "react-router-dom";

// ======================================================
// RowActions — ปุ่มในแถวของตาราง / รายการ ใช้รูปแบบเดียวกันทุกหน้า ทุกบทบาท
// กติกา:
// - งานหลักของแถว (เช่น จัดการเนื้อหา, กำหนดสิทธิ์, บทบาท) ใช้ RowTextButton มีข้อความ
// - ดู / แก้ไข / ลบ / เปิด-ปิด ใช้ RowIconButton เป็นไอคอนมีกรอบ ขนาด 32px เท่ากันทุกหน้า
// - ลำดับ: [งานหลัก...] [ดู] [แก้ไข] [เปิด-ปิด] [ลบ]
// - ปุ่มที่ผู้ใช้กดไม่ได้ให้แสดงแบบจาง (disabled) พร้อมเหตุผลใน disabledReason
//   ไม่ซ่อน เพื่อให้ปุ่มทุกแถวอยู่ตำแหน่งเดียวกัน
// ======================================================

const TEXT_TONES = {
  primary: "bg-[#ABD1C6] text-[#20302C] hover:bg-[#9bc3b7] border border-[#ABD1C6]",
  neutral: "bg-white text-[#26332F] hover:bg-gray-100 border border-[#E5E9E7]",
};

const ICON_TONES = {
  neutral: "hover:bg-gray-100 hover:text-[#26332F]",
  warning: "hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700",
  danger: "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600",
};

const BASE_TEXT =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition";
const BASE_ICON =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] transition";
const DISABLED = "opacity-40 cursor-not-allowed";

export function RowActionGroup({ children, className = "" }) {
  return <div className={`flex flex-nowrap items-center justify-end gap-1.5 ${className}`}>{children}</div>;
}

export function RowTextButton({ icon: Icon, children, onClick, to, tone = "neutral", disabled = false, disabledReason, title }) {
  const cls = `${BASE_TEXT} ${TEXT_TONES[tone] || TEXT_TONES.neutral} ${disabled ? DISABLED : "cursor-pointer"}`;
  const content = (
    <>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </>
  );
  if (to && !disabled) {
    return (
      <Link to={to} className={cls} title={title}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={cls} title={disabled ? disabledReason || title : title}>
      {content}
    </button>
  );
}

export function RowIconButton({ icon: Icon, label, onClick, to, tone = "neutral", disabled = false, disabledReason }) {
  const cls = `${BASE_ICON} ${disabled ? DISABLED : `${ICON_TONES[tone] || ICON_TONES.neutral} cursor-pointer`}`;
  const tip = disabled ? disabledReason || label : label;
  if (to && !disabled) {
    return (
      <Link to={to} className={cls} title={label} aria-label={label}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={cls} title={tip} aria-label={tip}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
