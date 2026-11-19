import { LuTriangleAlert as LuAlertTriangle, LuCheck } from "react-icons/lu";
import Button from "../../../../components/common/Button";

function ForgotPasswordForm({
  email,
  setEmail,
  isLoading,
  errorMessage,
  successMessage,
  onSubmit,
}) {
  return (
    <>
      {/* แสดงกล่องแจ้งเตือนเมื่อเกิดข้อผิดพลาด */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 font-medium">
          <LuAlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* แสดงกล่องแจ้งเตือนเมื่อส่งลิงก์สำเร็จ */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <LuCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* แบบฟอร์มกรอกอีเมล */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold text-[#26332F]">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
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
          {isLoading ? "กำลังส่งข้อมูล..." : "ส่งลิงก์ตั้งรหัสผ่านใหม่"}
        </Button>
      </form>
    </>
  );
}

export default ForgotPasswordForm;
