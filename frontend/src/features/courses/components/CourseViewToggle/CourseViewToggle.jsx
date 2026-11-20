import { LuLayoutGrid, LuList } from "react-icons/lu";

/**
 * CourseViewToggle — ปุ่มสลับมุมมองรายการคอร์ส ตาราง / การ์ด
 * ใช้ร่วมกันทุกหน้าที่แสดงรายการคอร์ส (หน้าคอร์สเรียน, หน้าจัดการคอร์สของ Admin)
 * ค่าที่เลือกควรเก็บใน URL (?layout=table|cards) เพื่อให้ย้อนกลับแล้วยังอยู่มุมมองเดิม
 */
const OPTIONS = [
  { value: "table", label: "ตาราง", icon: LuList },
  { value: "cards", label: "การ์ด", icon: LuLayoutGrid },
];

function CourseViewToggle({ value = "cards", onChange }) {
  return (
    <div
      role="group"
      aria-label="มุมมองรายการคอร์ส"
      className="flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white p-1 shadow-2xs"
    >
      {OPTIONS.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange?.(v)}
          aria-pressed={value === v}
          title={`แสดงแบบ${label}`}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            value === v ? "bg-[#ABD1C6] text-[#20302C]" : "text-[#6B7773] hover:text-[#26332F]"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default CourseViewToggle;
