import { useState } from "react";
import {
  LuKeyRound,
  LuEye,
  LuEyeOff,
  LuRefreshCw,
  LuCheck,
  LuTriangleAlert as LuAlertTriangle,
  LuShieldCheck,
} from "react-icons/lu";
import useAuthStore from "../../../../store/useAuthStore";

/**
 * ChangePasswordSection Component
 * จัดการการเปลี่ยนรหัสผ่านสำหรับผู้ใช้งานปัจจุบัน:
 * - แยกส่วนชัดเจนจากแบบฟอร์มแก้ไขข้อมูลส่วนตัว (แก้ไขข้อมูลส่วนตัว ≠ เปลี่ยนรหัสผ่าน)
 * - รหัสผ่านปัจจุบัน (Current password) พร้อมปุ่มเปิด/ปิดตา
 * - รหัสผ่านใหม่ (New password) พร้อมปุ่มเปิด/ปิดตา
 * - ยืนยันรหัสผ่านใหม่ (Confirm new password) พร้อมปุ่มเปิด/ปิดตา
 * - ตรวจสอบความถูกต้อง (Validation) ฝั่งหน้าบ้านก่อนส่ง
 * - รองรับ Loading State และป้องกันการกดซ้ำ
 * - ล้างฟิลด์รหัสผ่านทั้งหมดเมื่อสำเร็จ
 * - Design System: Jade (#ABD1C6), Dark (#26332F), Secondary (#6B7773), Background (#FAFAFA), Border (#E5E9E7)
 * - ไม่มี Unicode emoji ใน UI
 */
function ChangePasswordSection() {
  const { changePassword } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", text: "" });

    const current = currentPassword.trim();
    const next = newPassword.trim();
    const confirm = confirmPassword.trim();

    // 1. ตรวจสอบกรณีไม่กรอก
    if (!current || !next || !confirm) {
      setFeedback({
        type: "error",
        text: "กรุณากรอกรหัสผ่านให้ครบถ้วน",
      });
      return;
    }

    // 2. ตรวจสอบรหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน
    if (next !== confirm) {
      setFeedback({
        type: "error",
        text: "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน",
      });
      return;
    }

    // 3. ตรวจสอบรหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม
    if (current === next) {
      setFeedback({
        type: "error",
        text: "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม",
      });
      return;
    }

    // 4. ตรวจสอบ Password Policy ตามระบบ (ขั้นต่ำ 6 ตัวอักษร)
    if (next.length < 6) {
      setFeedback({
        type: "error",
        text: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
      });
      return;
    }
    if (next.length > 128) {
      setFeedback({
        type: "error",
        text: "รหัสผ่านต้องมีความยาวไม่เกิน 128 ตัวอักษร",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await changePassword(current, next, confirm);
      if (result.success) {
        setFeedback({
          type: "success",
          text: "เปลี่ยนรหัสผ่านสำเร็จ",
        });
        // เคลียร์รหัสผ่านออกจาก state ทันทีหลังสำเร็จ
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setFeedback({
          type: "error",
          text: result.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-xs space-y-6">
      {/* ส่วนหัวของฟอร์มเปลี่ยนรหัสผ่าน */}
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
            <LuKeyRound className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-black text-[#26332F]">เปลี่ยนรหัสผ่าน</h2>
        </div>
        <p className="text-xs text-[#6B7773] mt-1">
          อัปเดตรหัสผ่านสำหรับเข้าสู่ระบบของบัญชีคุณ เพื่อความปลอดภัยสูงสุด
        </p>
      </div>

      {/* กล่องแจ้งเตือนผลลัพธ์ (Success / Error Alert) */}
      {feedback.text && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <LuCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
          ) : (
            <LuAlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* แบบฟอร์มเปลี่ยนรหัสผ่าน */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. รหัสผ่านปัจจุบัน */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F] mb-1.5">
            รหัสผ่านปัจจุบัน (Current Password) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (feedback.type === "error") setFeedback({ type: "", text: "" });
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-[#26332F] placeholder:text-[#6B7773]/60 transition-all duration-200 outline-none hover:border-[#ABD1C6]/60 focus:border-[#ABD1C6] focus:bg-white focus:ring-4 focus:ring-[#ABD1C6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              tabIndex="-1"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              aria-label={showCurrentPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-[#6B7773] hover:text-[#26332F] hover:bg-[#ABD1C6]/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/40"
            >
              {showCurrentPassword ? (
                <LuEyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <LuEye className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* 2. รหัสผ่านใหม่ */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F] mb-1.5">
            รหัสผ่านใหม่ (New Password) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (feedback.type === "error") setFeedback({ type: "", text: "" });
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              autoComplete="new-password"
              className="w-full rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-[#26332F] placeholder:text-[#6B7773]/60 transition-all duration-200 outline-none hover:border-[#ABD1C6]/60 focus:border-[#ABD1C6] focus:bg-white focus:ring-4 focus:ring-[#ABD1C6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              tabIndex="-1"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-[#6B7773] hover:text-[#26332F] hover:bg-[#ABD1C6]/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/40"
            >
              {showNewPassword ? (
                <LuEyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <LuEye className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#6B7773] mt-1.5 flex items-center gap-1">
            <LuShieldCheck className="h-3.5 w-3.5 text-[#004643] shrink-0" />
            <span>รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร และต้องแตกต่างจากรหัสผ่านเดิม</span>
          </p>
        </div>

        {/* 3. ยืนยันรหัสผ่านใหม่ */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F] mb-1.5">
            ยืนยันรหัสผ่านใหม่ (Confirm Password) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (feedback.type === "error") setFeedback({ type: "", text: "" });
              }}
              placeholder="••••••••"
              disabled={isSubmitting}
              autoComplete="new-password"
              className="w-full rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-[#26332F] placeholder:text-[#6B7773]/60 transition-all duration-200 outline-none hover:border-[#ABD1C6]/60 focus:border-[#ABD1C6] focus:bg-white focus:ring-4 focus:ring-[#ABD1C6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              tabIndex="-1"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-[#6B7773] hover:text-[#26332F] hover:bg-[#ABD1C6]/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/40"
            >
              {showConfirmPassword ? (
                <LuEyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
              ) : (
                <LuEye className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* ปุ่มบันทึกการเปลี่ยนรหัสผ่าน */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ABD1C6] px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isSubmitting && <LuRefreshCw className="h-4 w-4 animate-spin shrink-0" />}
            <span>{isSubmitting ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePasswordSection;
