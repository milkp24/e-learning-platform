import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";

/**
 * RejectCourseDialog — ไม่อนุมัติการเผยแพร่ ต้องระบุเหตุผลเพื่อให้ผู้สอนรู้ว่าต้องแก้อะไร
 * เหตุผลจะแสดงบนคอร์สของผู้สอน และบันทึกลง Audit Log
 */
function RejectCourseDialog({ course, onClose, onConfirm, loading = false }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (course) setNote("");
  }, [course]);

  if (!course) return null;
  const trimmed = note.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-course-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="reject-course-title" className="text-lg font-black text-[#26332F]">
              ไม่อนุมัติการเผยแพร่
            </h3>
            <p className="mt-0.5 text-xs text-[#6B7773]">
              คอร์ส "{course.title}" จะกลับเป็นฉบับร่าง และผู้สอนจะเห็นเหตุผลนี้
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-gray-100 cursor-pointer"
          >
            <LuX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <label htmlFor="reject-note" className="block text-xs font-bold text-[#26332F]">
          เหตุผล / สิ่งที่ต้องแก้ไข <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="reject-note"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น ยังไม่มีบทเรียน หรือวิดีโอบทที่ 2 เปิดไม่ได้"
          className="w-full resize-none rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl border border-[#E5E9E7] bg-white px-4 text-xs font-bold text-[#26332F] hover:bg-gray-50 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={!trimmed || loading}
            className="h-9 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "กำลังบันทึก..." : "ไม่อนุมัติและส่งกลับ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectCourseDialog;
