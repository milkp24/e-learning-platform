import { LuPencil, LuTrash2 } from "react-icons/lu";
import { getStatusActions } from "../../utils/courseStatus";

// ======================================================
// CourseManageActions — ปุ่มจัดการคอร์สชุดเดียว ใช้ทั้งการ์ดและตาราง ทุกหน้า ทุกบทบาท
// ลำดับคงที่: [ปุ่มสถานะ...] [แก้ไข] [ลบ]
// - ปุ่มสถานะ (เผยแพร่ / ส่งตรวจ / อนุมัติ / ไม่อนุมัติ / ยกเลิกเผยแพร่ / เก็บถาวร / กู้คืน)
//   คำนวณจากสถานะคอร์สและสิทธิ์ที่ Backend ส่งมา (getStatusActions)
// - variant="row":  บรรทัดเดียว ไม่ตัดขึ้นบรรทัดใหม่ (ใช้ในตาราง)
// - variant="card": เต็มความกว้างการ์ด ปุ่มสถานะยืดเท่ากัน (ใช้ในการ์ด)
// แก้ไข / ลบ เป็นปุ่มไอคอน มีคำอธิบายเมื่อชี้เมาส์และสำหรับโปรแกรมอ่านหน้าจอ
// ======================================================

const TONES = {
  primary: "bg-[#004643] text-white hover:bg-[#00332f] border border-[#004643]",
  success: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200",
  warning: "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200",
  danger: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200",
  neutral: "bg-white text-[#26332F] hover:bg-gray-100 border border-[#E5E9E7]",
};

const btn =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const iconBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] transition cursor-pointer";

function CourseManageActions({
  course,
  onEdit,
  onStatusAction,
  onDelete,
  busy = false,
  variant = "row",
  actions: actionsOverride,
}) {
  // actions: ส่งรายการปุ่มเองได้ (เช่น หน้าจัดการเนื้อหาที่ไม่แสดงปุ่มไม่อนุมัติ)
  const actions = actionsOverride ?? (onStatusAction ? getStatusActions(course) : []);
  const isCard = variant === "card";

  return (
    <div className={`flex items-center gap-1.5 ${isCard ? "w-full" : "flex-nowrap"}`}>
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.key}
            type="button"
            onClick={() => onStatusAction(course, a)}
            disabled={busy}
            title={a.hint}
            className={`${btn} ${TONES[a.tone]} ${isCard ? "flex-1 min-w-0" : ""}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{busy ? "กำลังบันทึก..." : a.label}</span>
          </button>
        );
      })}

      {isCard && actions.length === 0 && <span className="flex-1" />}

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(course)}
          title="แก้ไขชื่อ คำอธิบาย และรูปปก"
          aria-label={`แก้ไขคอร์ส ${course?.title || ""}`}
          className={`${iconBtn} hover:bg-gray-100 hover:text-[#26332F]`}
        >
          <LuPencil className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(course)}
          title="ลบคอร์สเรียน"
          aria-label={`ลบคอร์ส ${course?.title || ""}`}
          className={`${iconBtn} hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`}
        >
          <LuTrash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default CourseManageActions;
