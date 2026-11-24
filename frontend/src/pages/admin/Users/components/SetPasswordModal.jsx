import { useEffect, useState } from "react";
import { LuX, LuKeyRound, LuEye, LuEyeOff } from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * SetPasswordModal (ข้อ 8)
 * Super Admin ตั้งรหัสผ่านใหม่ให้ผู้ใช้อื่นโดยไม่ต้องรู้รหัสเดิม
 * - เรียก PUT /api/v1/admin/users/<id>/password
 * - Backend ตรวจสิทธิ์ ตรวจรหัสผ่าน บันทึก Audit Log และบังคับให้ผู้ใช้ Login ใหม่ทุกเครื่อง
 * - ไม่เก็บรหัสผ่านไว้หลังปิดหน้าต่าง
 */
const MIN_LENGTH = 6;
const MAX_LENGTH = 128;

function SetPasswordModal({ isOpen, onClose, user, onPasswordSet }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // เปิดใหม่ทุกครั้งเริ่มจากฟอร์มว่าง
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setError("");
    }
  }, [isOpen, user?.user_id]);

  if (!isOpen || !user) return null;

  const displayName = user.profile?.display_name || user.email?.split("@")[0] || "ผู้ใช้งาน";

  const validate = () => {
    if (!password) return "กรุณากรอกรหัสผ่านใหม่";
    if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
      return `รหัสผ่านต้องมีความยาว ${MIN_LENGTH}-${MAX_LENGTH} ตัวอักษร`;
    }
    if (password !== confirm) return "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      const res = await adminService.setUserPassword(user.user_id, password, confirm);
      setPassword("");
      setConfirm("");
      onPasswordSet?.(res?.message || `ตั้งรหัสผ่านใหม่ให้ ${user.email} เรียบร้อยแล้ว`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "ตั้งรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2.5 pr-10 text-sm text-[#26332F] focus:border-[#004643] focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-password-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-[#F4F8F6]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/40 text-[#004643]">
              <LuKeyRound className="h-5 w-5" />
            </span>
            <h2 id="set-password-modal-title" className="text-base font-black text-[#26332F]">
              ตั้งรหัสผ่านใหม่
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

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3 text-xs">
            <p className="font-bold text-[#26332F]">{displayName}</p>
            <p className="font-mono text-[#6B7773]">{user.email}</p>
          </div>

          <p className="text-xs text-[#6B7773] leading-relaxed">
            ไม่ต้องใช้รหัสผ่านเดิม หลังบันทึก ผู้ใช้จะถูกออกจากระบบทุกเครื่องและต้องเข้าสู่ระบบด้วยรหัสผ่านใหม่
            การดำเนินการนี้ถูกบันทึกใน Audit Log (ไม่บันทึกรหัสผ่าน)
          </p>

          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              {error}
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#26332F]">รหัสผ่านใหม่</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                maxLength={MAX_LENGTH}
                className={inputClass}
                placeholder={`อย่างน้อย ${MIN_LENGTH} ตัวอักษร`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7773] hover:text-[#004643] cursor-pointer"
              >
                {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-[#26332F]">ยืนยันรหัสผ่านใหม่</span>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={MAX_LENGTH}
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#E5E9E7] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-white hover:bg-[#003835] disabled:opacity-60 transition cursor-pointer"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SetPasswordModal;
