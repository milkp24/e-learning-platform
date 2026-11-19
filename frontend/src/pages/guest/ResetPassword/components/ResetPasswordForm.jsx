import { Link } from "react-router-dom";
import { LuCheck } from "react-icons/lu";
import Button from "../../../../components/common/Button";

function ResetPasswordForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  isSuccess,
  onSubmit,
}) {
  if (isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 font-bold">
          <LuCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</span>
        </div>
        <Link
          to="/login"
          className="inline-block w-full rounded-xl bg-[#004643] py-2.5 text-xs font-bold text-white transition hover:bg-[#003835]"
        >
          เข้าสู่ระบบทันที
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-bold text-[#26332F]">
          รหัสผ่านใหม่ (New Password) <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-xs text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-[#26332F]">
          ยืนยันรหัสผ่านใหม่ (Confirm Password) <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-xs text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
      </Button>
    </form>
  );
}

export default ResetPasswordForm;
