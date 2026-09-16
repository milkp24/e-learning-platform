import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import Button from "../components/Button";

// =====================================================================
// Register.jsx: หน้าจอสมัครสมาชิก (Registration Page) - UAT-010
// =====================================================================
// หน้านี้รับข้อมูล:
// 1. Display Name (ชื่อที่ต้องการแสดง)
// 2. Email (อีเมลสำหรับเข้าสู่ระบบ)
// 3. Password (รหัสผ่านอย่างน้อย 6 ตัวอักษร)
// 4. Confirm Password (ยืนยันรหัสผ่าน)
//
// คุณสมบัติด้านความปลอดภัยและการทำงาน:
// - Frontend Submit & Validation: ตรวจสอบความถูกต้องเบื้องต้นก่อนส่ง Request
// - เรียกใช้งาน API POST /api/v1/auth/register ผ่าน Zustand useAuthStore
// - ไม่เก็บรหัสผ่าน Plain Text และไม่ทำ Auto-login หลังสมัครสำเร็จ
// - เมื่อสมัครสำเร็จ จะแสดงข้อความแจ้งเตือนและปุ่มนำทางให้ผู้ใช้กดไปหน้า Login เอง
// =====================================================================

function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuthStore();

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State สำหรับแจ้งเตือนสถานะ
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // หากผู้ใช้ Login อยู่แล้ว ให้ Redirect ไปยังหน้าแรกของบทบาททันที
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/student/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // =====================================================================
  // Frontend Submit: จัดการการส่งฟอร์มและตรวจสอบความถูกต้อง (Validation)
  // =====================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // 1. ตรวจสอบช่องว่าง (Empty Validation)
    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    // 2. ตรวจสอบรูปแบบอีเมล (Email Format Validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีเมลอีกครั้ง");
      return;
    }

    // 3. ตรวจสอบเงื่อนไขรหัสผ่าน (Password Policy: ขั้นต่ำ 6 ตัวอักษร)
    if (password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    // 4. ตรวจสอบการยืนยันรหัสผ่าน (Password Match)
    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // 5. ส่งข้อมูลไปยัง Backend API (POST /api/v1/auth/register)
    const regResult = await register(trimmedEmail, password, trimmedName);

    if (regResult.success) {
      // เมื่อสมัครสำเร็จ:
      // - แสดงข้อความแจ้งเตือนสำเร็จ
      // - ล้างรหัสผ่านออกจากฟอร์ม
      // - ไม่ทำ Auto-login ตามข้อกำหนด UAT-010 เพื่อให้ผู้ใช้กดเข้าสู่ระบบเอง
      setIsSuccess(true);
      setSuccessMessage(regResult.message || "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบเพื่อเริ่มต้นใช้งาน");
      setPassword("");
      setConfirmPassword("");
    } else {
      // Error Handling: แสดงข้อความจาก Backend เช่น "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" (HTTP 409)
      setIsSuccess(false);
      setErrorMessage(regResult.error || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-lg">

        {/* โลโก้เว็บไซต์ */}
        <Link to="/" className="flex items-center gap-2.5 text-2xl font-bold text-[#26332F]">
          <img
            src="/images/logo.svg"
            alt="Logo"
            className="h-8 w-8 rounded-xl object-contain shadow-sm"
          />
          <span>
            E-learning <span className="text-[#004643]">Platform</span>
          </span>
        </Link>

        {/* หัวข้อหน้าจอ */}
        <h1 className="mt-8 text-3xl font-extrabold text-[#26332F]">
          สมัครสมาชิก
        </h1>
        <p className="mt-2 text-sm text-[#6B7773]">
          สร้างบัญชีใหม่เพื่อเริ่มต้นการเรียนรู้ (สิทธิ์ผู้เรียน: Student)
        </p>

        {/* กล่องแสดงข้อความผิดพลาด (Error Alert) */}
        {errorMessage && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start gap-3">
            <span className="text-base">⚠️</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* กล่องแสดงข้อความสำเร็จ (Success Alert) */}
        {successMessage && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800 flex items-start gap-3">
            <span className="text-base font-bold text-emerald-600">✓</span>
            <div className="flex-1">
              <p className="font-semibold">{successMessage}</p>
              <p className="mt-1 text-xs text-emerald-700">
                คุณสามารถใช้ Email และ Password ที่ตั้งไว้เข้าสู่ระบบได้ทันที
              </p>
            </div>
          </div>
        )}

        {/* กรณีสมัครสำเร็จแล้ว ให้แสดงปุ่มเข้าสู่ระบบอย่างชัดเจน (ไม่ Auto-login) */}
        {isSuccess ? (
          <div className="mt-6 space-y-4">
            <Button
              to="/login"
              variant="secondary"
              size="lg"
              fullWidth
            >
              ไปที่หน้าเข้าสู่ระบบ (Login) →
            </Button>
            <Button
              onClick={() => {
                setIsSuccess(false);
                setSuccessMessage("");
                setName("");
                setEmail("");
              }}
              variant="outlineDark"
              size="md"
              fullWidth
            >
              สมัครบัญชีอื่นเพิ่มเติม
            </Button>
          </div>
        ) : (
          /* แบบฟอร์มกรอกข้อมูลการสมัครสมาชิก */
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Display Name */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26332F]">
                ชื่อที่แสดง (Display Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น สมชาย ใจดี หรือ Somchai"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white focus:ring-2 focus:ring-[#ABD1C6]/30 disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26332F]">
                อีเมล (Email) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white focus:ring-2 focus:ring-[#ABD1C6]/30 disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26332F]">
                รหัสผ่าน (Password) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white focus:ring-2 focus:ring-[#ABD1C6]/30 disabled:opacity-50"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26332F]">
                ยืนยันรหัสผ่าน (Confirm Password) <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white focus:ring-2 focus:ring-[#ABD1C6]/30 disabled:opacity-50"
              />
            </div>

            {/* ปุ่มส่งข้อมูลการสมัครสมาชิก */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "กำลังตรวจสอบข้อมูล..." : "สมัครสมาชิก"}
              </Button>
            </div>
          </form>
        )}

        {/* ลิงก์ไปยังหน้าเข้าสู่ระบบ */}
        <p className="mt-6 text-center text-sm text-[#6B7773]">
          มีบัญชีผู้ใช้งานอยู่แล้ว?{" "}
          <Link
            to="/login"
            className="font-bold text-[#004643] hover:underline"
          >
            เข้าสู่ระบบ (Login)
          </Link>
        </p>

        {/* ลิงก์กลับหน้าแรก */}
        <Link
          to="/"
          className="mt-4 block text-center text-sm text-[#6B7773] hover:text-[#004643]"
        >
          ← กลับสู่หน้าหลัก
        </Link>

      </div>
    </div>
  );
}

export default Register;