// นำเข้า React Hooks สำหรับ State
import { useState } from "react";
// นำเข้า Link และ useSearchParams จาก React Router
import { Link, useSearchParams } from "react-router-dom";
// นำเข้าคอมโพเนนต์ Button
import Button from "../components/Button";
// นำเข้า authService สำหรับเรียกใช้ API ระบบสมาชิก
import authService from "../services/authService";

// คอมโพเนนต์หน้าตั้งรหัสผ่านใหม่ (Reset Password)
function ResetPassword() {
  // ดึงค่า Query Parameters จาก URL
  const [searchParams] = useSearchParams();
  // ดึงค่า Token จาก URL เช่น ?token=xxxx
  const token = searchParams.get("token") || "";

  // State สำหรับรหัสผ่านใหม่
  const [password, setPassword] = useState("");
  // State สำหรับยืนยันรหัสผ่านใหม่
  const [confirmPassword, setConfirmPassword] = useState("");
  // State แสดงสถานะกำลังบันทึก
  const [isLoading, setIsLoading] = useState(false);
  // State แจ้งเตือนสำเร็จ
  const [isSuccess, setIsSuccess] = useState(false);
  // State ข้อความผิดพลาด
  const [errorMessage, setErrorMessage] = useState("");

  // ฟังก์ชันจัดการการส่งฟอร์มตั้งรหัสผ่านใหม่แบบ Async
  const handleSubmit = async (e) => {
    // ป้องกันการ Reload หน้าจอ
    e.preventDefault();
    // ล้างข้อความผิดพลาดเดิม
    setErrorMessage("");

    // ตรวจสอบว่ามี Token จาก URL หรือไม่
    if (!token) {
      // แจ้งเตือนเมื่อไม่พบ Token
      setErrorMessage("ไม่พบรหัสยืนยันสำหรับรีเซ็ตรหัสผ่าน กรุณาใช้ลิงก์จากอีเมลของคุณ");
      // สิ้นสุดการทำงาน
      return;
    }

    // ตรวจสอบความยาวรหัสผ่านอย่างน้อย 6 ตัวอักษร
    if (password.length < 6) {
      // แจ้งเตือนเมื่อรหัสผ่านสั้นเกินไป
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      // สิ้นสุดการทำงาน
      return;
    }

    // ตรวจสอบว่ารหัสผ่านทั้งสองช่องตรงกันหรือไม่
    if (password !== confirmPassword) {
      // แจ้งเตือนเมื่อรหัสผ่านไม่ตรงกันตามข้อกำหนด
      setErrorMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      // สิ้นสุดการทำงาน
      return;
    }

    // เริ่มต้นสถานะกำลังบันทึกข้อมูล
    setIsLoading(true);

    try {
      // เรียกใช้ API ตั้งรหัสผ่านใหม่จริง (POST /api/v1/auth/reset-password)
      await authService.resetPassword(token, password);
      // กำหนดสถานะสำเร็จ
      setIsSuccess(true);
    } catch (err) {
      // ดึงข้อความแจ้งเตือนข้อผิดพลาดจาก Backend เช่น Token หมดอายุ หรือถูกใช้แล้ว
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่ กรุณาลองใหม่อีกครั้ง";
      // กำหนดข้อความผิดพลาดลงใน State
      setErrorMessage(errorMsg);
    } finally {
      // ปิดสถานะกำลังบันทึก
      setIsLoading(false);
    }
  };

  // แสดงผลโครงสร้าง JSX ของหน้า Reset Password
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-lg space-y-6">
        {/* โลโก้และชื่อระบบ E-learning Platform */}
        <Link to="/" className="flex items-center gap-2.5 text-2xl font-bold text-[#26332F]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xl text-[#004643]">
            🤖
          </span>
          <span>
            E-learning <span className="text-[#004643]">Platform</span>
          </span>
        </Link>

        {/* ส่วนหัวข้อหน้าจอ */}
        <div>
          <h1 className="text-2xl font-black text-[#26332F]">ตั้งรหัสผ่านใหม่</h1>
          <p className="mt-1 text-xs text-[#6B7773]">
            กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน
          </p>
        </div>

        {/* แสดง Token อ้างอิงหากมี */}
        {token && (
          <div className="rounded-xl bg-gray-50 p-2.5 text-[11px] text-[#6B7773] border border-gray-100 truncate">
            รหัสยืนยัน: <span className="font-mono font-bold text-[#26332F]">{token}</span>
          </div>
        )}

        {/* แสดงข้อความผิดพลาดเมื่อมี Error */}
        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ตรวจสอบว่าตั้งรหัสผ่านสำเร็จแล้วหรือไม่ */}
        {isSuccess ? (
          <div className="space-y-4 text-center">
            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 font-bold">
              ✓ ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่
            </div>
            <Link
              to="/login"
              className="inline-block w-full rounded-xl bg-[#004643] py-2.5 text-xs font-bold text-white transition hover:bg-[#003835]"
            >
              เข้าสู่ระบบทันที
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
        )}

        {/* ลิงก์กลับหน้าแรก */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-[#6B7773] hover:text-[#004643]"
          >
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

// ส่งออกคอมโพเนนต์ ResetPassword
export default ResetPassword;
