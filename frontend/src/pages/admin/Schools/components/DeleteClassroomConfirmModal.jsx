import { useState } from "react";
import { LuX, LuTrash2, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";

/**
 * DeleteClassroomConfirmModal Component
 * Confirmation modal for deleting a classroom
 * Prevents deletion if students are enrolled in the classroom
 */
function DeleteClassroomConfirmModal({ isOpen, onClose, classroom, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !classroom) return null;

  const studentCount = classroom.student_count || 0;
  const hasStudents = studentCount > 0;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      await onConfirm(classroom);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการลบห้องเรียน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-classroom-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <LuTrash2 className="h-5 w-5" />
            </span>
            <div>
              <h2 id="delete-classroom-title" className="text-base font-black text-[#26332F]">
                ยืนยันการลบห้องเรียน
              </h2>
              <p className="text-xs text-[#6B7773]">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <LuAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 text-xs space-y-2">
            <div>
              <span className="text-[#6B7773] block text-[11px]">ห้องเรียนที่จะลบ:</span>
              <span className="font-bold text-[#26332F] text-sm block">
                {classroom.classroom_name}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#6B7773] pt-1 border-t border-[#E5E9E7]/60">
              {classroom.grade_level && <span>ระดับชั้น: {classroom.grade_level}</span>}
              {classroom.academic_year && <span>ปีการศึกษา: {classroom.academic_year}</span>}
            </div>
          </div>

          {hasStudents ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <LuAlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>ไม่สามารถลบห้องเรียนนี้ได้โดยตรง</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                ห้องเรียนนี้ยังมีนักเรียนสังกัดอยู่จำนวน <strong>{studentCount} คน</strong> ตามกฎความปลอดภัยของระบบ กรุณาปรับสถานะห้องเรียนเป็น &quot;ปิดใช้งาน (Inactive)&quot; แทนการลบ
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B7773] leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบห้องเรียนนี้ออกจากระบบ? ข้อมูลห้องเรียนจะถูกลบอย่างถาวรจากฐานข้อมูล
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || hasStudents}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer ${
                hasStudents
                  ? "bg-gray-400 cursor-not-allowed opacity-60"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? (
                <span>กำลังลบ...</span>
              ) : (
                <>
                  <LuTrash2 className="h-4 w-4" />
                  <span>ยืนยันการลบ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteClassroomConfirmModal;
