// นำเข้า React Hooks สำหรับ State
import { useState } from "react";
// นำเข้า Link สำหรับเชื่อมโยงหน้า
import { Link } from "react-router-dom";
// นำเข้าคอมโพเนนต์ Button สำหรับปุ่มกด
import Button from "../components/Button";
// นำเข้า authService สำหรับเรียกใช้ API ระบบสมาชิก
import authService from "../services/authService";

// คอมโพเนนต์หน้าลืมรหัสผ่าน (Forgot Password)
function ForgotPassword() {
  // State สำหรับเก็บอีเมลที่ผู้ใช้กรอก
  const [email, setEmail] = useState("");
  // State สำหรับแสดงสถานะกำลังส่งข้อมูล
  const [isLoading, setIsLoading] = useState(false);
  // State สำหรับข้อความแจ้งเตือนสำเร็จ
  const [successMessage, setSuccessMessage] = useState("");
  // State สำหรับข้อความผิดพลาด
  const [errorMessage, setErrorMessage] = useState("");

  // ฟังก์ชันจัดการการส่งฟอร์มขอรีเซ็ตรหัสผ่านแบบ Async
  const handleSubmit = async (e) => {
    // ป้องกันการ Reload หน้าจอ
    e.preventDefault();
    // ล้างข้อความผิดพลาดเดิม
    setErrorMessage("");
    // ล้างข้อความสำเร็จเดิม
    setSuccessMessage("");

    // ตัดช่องว่างอีเมล
    const trimmedEmail = email.trim();
    // ตรวจสอบว่ากรอกอีเมลหรือไม่
    if (!trimmedEmail) {
      // แจ้งเตือนเมื่อไม่ได้กรอกอีเมล
      setErrorMessage("กรุณากรอกอีเมลที่ลงทะเบียนไว้");
      // สิ้นสุดการทำงาน
      return;
    }

    // เริ่มต้นสถานะกำลังส่งข้อมูล
    setIsLoading(true);

    try {
      // เรียกใช้ API ขอรีเซ็ตรหัสผ่านจริง (POST /api/v1/auth/forgot-password)
      const response = await authService.forgotPassword(trimmedEmail);
      // แสดงข้อความสำเร็จที่ได้รับจาก Backend
      setSuccessMessage(
        response?.message ||
          "หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณ"
      );
    } catch (err) {
      // ดึงข้อความแจ้งเตือนข้อผิดพลาดจาก Backend
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง";
      // กำหนดข้อความผิดพลาดลงใน State
      setErrorMessage(errorMsg);
    } finally {
      // ปิดสถานะกำลังส่งข้อมูล
      setIsLoading(false);
    }
  };

  // แสดงผลโครงสร้าง JSX ของหน้า Forgot Password
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
          <h1 className="text-2xl font-black text-[#26332F]">ลืมรหัสผ่าน</h1>
          <p className="mt-1 text-xs text-[#6B7773]">
            กรุณากรอกอีเมลที่ลงทะเบียนไว้เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        {/* แสดงกล่องแจ้งเตือนเมื่อเกิดข้อผิดพลาด */}
        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 font-medium">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* แสดงกล่องแจ้งเตือนเมื่อส่งลิงก์สำเร็จ */}
        {successMessage && (
          <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* แบบฟอร์มกรอกอีเมล */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#26332F]">
              อีเมล (Email) <span className="text-red-500">*</span>
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

        {/* ลิงก์กลับไปหน้า Login */}
        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs font-semibold text-[#004643] hover:underline"
          >
            ← กลับสู่หน้าเข้าสู่ระบบ (Login)
          </Link>
        </div>
      </div>
    </div>
  );
}

// ส่งออกคอมโพเนนต์ ForgotPassword
export default ForgotPassword;
