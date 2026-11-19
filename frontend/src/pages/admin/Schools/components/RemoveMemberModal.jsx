import { useState } from "react";
import { LuX, LuUserMinus, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";

/**
 * RemoveMemberModal Component
 * Confirmation modal for removing a member from a school
 * Explicitly preserves the user account in the system
 */
function RemoveMemberModal({ isOpen, onClose, member, schoolName, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !member) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");
      await onConfirm(member);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการนำสมาชิกออก");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-red-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <LuUserMinus className="h-5 w-5" />
            </span>
            <div>
              <h2 id="remove-member-title" className="text-base font-black text-[#26332F]">
                นำสมาชิกออกจากโรงเรียน
              </h2>
              <p className="text-xs text-[#6B7773] truncate max-w-64">
                สังกัด: {schoolName}
              </p>
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

          <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 text-xs space-y-1">
            <div className="font-bold text-[#26332F]">{member.display_name}</div>
            <div className="font-mono text-[#6B7773] text-[11px]">{member.email}</div>
            <div className="text-[#6B7773] text-[11px]">
              บทบาทในโรงเรียน:{" "}
              <span className="font-bold text-[#004643] uppercase">
                {member.school_role}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ABD1C6] bg-emerald-50/50 p-3.5 text-xs text-[#26332F] space-y-1.5">
            <div className="font-bold text-[#004643]">
              คำเตือนความปลอดภัยของข้อมูล:
            </div>
            <p className="text-[11px] text-[#6B7773] leading-relaxed">
              การนำสมาชิกออกจะเป็นการยกเลิกการสังกัดโรงเรียนนี้เท่านั้น โดยบัญชีผู้ใช้ (User Account) ในระบบยังคงอยู่ตามปกติ และไม่ส่งผลกระทบต่อข้อมูลการเรียนหรือบัญชีในระบบ
            </p>
          </div>

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
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>กำลังนำออก...</span>
              ) : (
                <>
                  <LuUserMinus className="h-4 w-4" />
                  <span>ยืนยันการนำออก</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemoveMemberModal;
