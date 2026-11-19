import { useState } from "react";
import { LuX, LuTrash2, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * DeleteUserConfirmModal Component
 * Modal ยืนยันการลบบัญชีผู้ใช้งานออกจากระบบถาวร (Permanent Deletion)
 * เรียกใช้ API DELETE /api/v1/admin/users/<id>
 */
function DeleteUserConfirmModal({
  isOpen,
  onClose,
  user,
  onUserDeleted,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !user) return null;

  const displayName =
    user.profile?.display_name || user.email?.split("@")[0] || "ผู้ใช้งาน";
  const userRoles = user.roles || (user.role ? [user.role] : []);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      await adminService.deleteUser(user.user_id);
      onUserDeleted(user.user_id);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "ไม่สามารถลบบัญชีผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง";
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
      aria-labelledby="delete-user-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-rose-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <LuAlertTriangle className="h-5 w-5" />
            </span>
            <h2 id="delete-user-modal-title" className="text-base font-black text-[#26332F]">
              ยืนยันการลบบัญชีผู้ใช้
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
            คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้ออกจากระบบอย่างถาวร?
          </p>

          {/* User Details Box */}
          <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7773]">ชื่อแสดงผล:</span>
              <span className="font-bold text-[#26332F]">{displayName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7773]">อีเมล:</span>
              <span className="font-mono text-[#26332F]">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7773]">บทบาท:</span>
              <div className="flex gap-1">
                {userRoles.map((r) => (
                  <span
                    key={r}
                    className="rounded-md bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-800"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex items-start gap-2">
            <LuAlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ ข้อมูลการลงทะเบียนเรียน บันทึก และประวัติที่เกี่ยวข้องจะถูกลบออกจากฐานข้อมูล
            </p>
          </div>
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
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <LuTrash2 className="h-4 w-4" />
            <span>{isDeleting ? "กำลังลบ..." : "ยืนยันการลบบัญชี"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserConfirmModal;
