import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LuBot, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";
import authService from "../../../services/authService";
import ResetPasswordForm from "./components/ResetPasswordForm";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("ไม่พบรหัสยืนยันสำหรับรีเซ็ตรหัสผ่าน กรุณาใช้ลิงก์จากอีเมลของคุณ");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่ กรุณาลองใหม่อีกครั้ง";
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
          <h1 className="text-2xl font-black text-[#26332F]">ตั้งรหัสผ่านใหม่</h1>
          <p className="mt-1 text-xs text-[#6B7773]">
            กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน
          </p>
        </div>

        {token && (
          <div className="rounded-xl bg-gray-50 p-2.5 text-[11px] text-[#6B7773] border border-gray-100 truncate">
            รหัสยืนยัน: <span className="font-mono font-bold text-[#26332F]">{token}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-700 font-medium">
            <LuAlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <ResetPasswordForm
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          isLoading={isLoading}
          isSuccess={isSuccess}
          onSubmit={handleSubmit}
        />

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

export default ResetPassword;
