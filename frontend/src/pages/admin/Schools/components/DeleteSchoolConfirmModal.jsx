import { useState } from "react";
import {
  LuX,
  LuTrash2,
  LuTriangleAlert as LuAlertTriangle,
  LuInfo,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * DeleteSchoolConfirmModal Component
 * Confirmation dialog for deleting a School record
 * Strictly verifies business rules preventing deletion if classrooms or members are linked
 */
function DeleteSchoolConfirmModal({
  isOpen,
  onClose,
  school,
  onSchoolDeleted,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !school) return null;

  const classroomCount = school.classroom_count || 0;
  const memberCount = school.member_count || 0;
  const isDeleteBlocked = classroomCount > 0 || memberCount > 0;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      await adminService.deleteSchool(school.school_id);
      onSchoolDeleted(school.school_id);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "ไม่สามารถลบโรงเรียนได้ กรุณาลองใหม่อีกครั้ง";
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-school-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <LuAlertTriangle className="h-5 w-5" />
            </span>
            <h2 id="delete-school-modal-title" className="text-base font-black text-[#26332F]">
              ยืนยันการลบโรงเรียน
            </h2>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              {error}
            </div>
          )}

          <p className="text-xs sm:text-sm text-[#26332F] font-medium leading-relaxed">
            คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลโรงเรียนนี้ออกจากระบบอย่างถาวร?
          </p>

          {/* School Details Box */}
          <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7773]">ชื่อโรงเรียน:</span>
              <span className="font-bold text-[#26332F]">{school.name}</span>
            </div>
            {school.code && (
              <div className="flex items-center justify-between">
                <span className="text-[#6B7773]">รหัสโรงเรียน:</span>
                <span className="font-mono text-[#26332F]">{school.code}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[#6B7773]">ห้องเรียนในสังกัด:</span>
              <span className="font-bold text-[#26332F]">{classroomCount} ห้อง</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7773]">สมาชิกในสังกัด:</span>
              <span className="font-bold text-[#26332F]">{memberCount} คน</span>
            </div>
          </div>

          {/* Safety Warning */}
          {isDeleteBlocked ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5">
              <LuInfo className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">ไม่สามารถลบโรงเรียนนี้ได้โดยตรง</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">
                  เนื่องจากยังมีห้องเรียน ({classroomCount} ห้อง) หรือสมาชิก ({memberCount} คน) ผูกอยู่กับโรงเรียนนี้ เพื่อความปลอดภัยของข้อมูล กรุณาย้ายหรือลบข้อมูลในสังกัดก่อน หรือปรับสถานะเป็น "Inactive (ระงับการใช้งาน)" แทนการลบ
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
              <LuAlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลการตั้งค่าของโรงเรียนจะถูกลบออกจากฐานข้อมูล
              </p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-[#FAFAFA] border-t border-[#E5E9E7]">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isDeleting || isDeleteBlocked}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
              isDeleteBlocked
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-rose-600 text-white hover:bg-rose-700 cursor-pointer disabled:opacity-50"
            }`}
          >
            <LuTrash2 className="h-4 w-4" />
            <span>{isDeleting ? "กำลังลบ..." : "ยืนยันการลบโรงเรียน"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteSchoolConfirmModal;
