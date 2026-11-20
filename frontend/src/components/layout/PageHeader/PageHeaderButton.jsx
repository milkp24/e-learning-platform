import { Link } from "react-router-dom";
import { LuPlus } from "react-icons/lu";

// ======================================================
// PageHeaderButton — ปุ่มบนหัวหน้าเพจ ใช้รูปแบบเดียวกันทุกหน้า ทุกบทบาท
// - variant="primary":   ปุ่มหลักของหน้า (สร้าง / เพิ่ม) สี Jade พร้อมไอคอน (ค่าเริ่มต้นเป็น +)
// - variant="secondary": ปุ่มรอง (เช่น ประวัติการเปลี่ยนแปลง) พื้นขาวมีกรอบ
// ส่ง to เพื่อให้เป็นลิงก์ หรือ onClick เพื่อเป็นปุ่ม
// ไม่ต้องใส่ "+" ในข้อความ ไอคอนแสดงให้แล้ว
// ======================================================

const VARIANTS = {
  primary: "bg-[#ABD1C6] text-[#20302C] hover:bg-[#9bc3b7] shadow-sm",
  secondary: "border border-[#E5E9E7] bg-white text-[#26332F] hover:bg-gray-50 shadow-2xs",
};

const BASE =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 sm:px-5 text-xs sm:text-sm font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

function PageHeaderButton({ children, icon: Icon = LuPlus, variant = "primary", to, className = "", ...rest }) {
  const cls = `${BASE} ${VARIANTS[variant] || VARIANTS.primary} ${className}`;
  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {content}
    </button>
  );
}

export default PageHeaderButton;
