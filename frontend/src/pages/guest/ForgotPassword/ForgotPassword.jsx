import { useState } from "react";
import { Link } from "react-router-dom";
import { LuBot } from "react-icons/lu";
import authService from "../../../services/authService";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("กรุณากรอกอีเมลที่ลงทะเบียนไว้");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(trimmedEmail);
      setSuccessMessage(
        response?.message ||
          "หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณ"
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "เกิดข้อผิดพลาดในการส่งคำขอ กรุณาลองใหม่อีกครั้ง";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-lg space-y-6">
        <Link to="/" className="flex items-center gap-2.5 text-2xl font-bold text-[#26332F]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
            <LuBot className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            E-learning <span className="text-[#004643]">Platform</span>
          </span>
        </Link>

        <div>
          <h1 className="text-2xl font-black text-[#26332F]">ลืมรหัสผ่าน</h1>
          <p className="mt-1 text-xs text-[#6B7773]">
            กรุณากรอกอีเมลที่ลงทะเบียนไว้เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        <ForgotPasswordForm
          email={email}
          setEmail={setEmail}
          isLoading={isLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onSubmit={handleSubmit}
        />

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs font-semibold text-[#004643] hover:underline"
          >
            ← กลับสู่หน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
