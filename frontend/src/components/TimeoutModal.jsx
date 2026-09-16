import React from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

// ======================================================
// TimeoutModal Component (กล่องแจ้งเตือนหมดเวลาใช้งาน)
// รองรับ UAT-015 (Session Idle Warning) และ UAT-020 (Guest Preview Limit)
// ======================================================

function TimeoutModal({
  isWarningOpen,
  countdown,
  onExtend,
  isGuestTimeout,
  onCloseGuest,
}) {
  const { logout } = useAuthStore();

  const handleLogoutNow = async () => {
    await logout();
    window.location.href = "/login";
  };

  // 1. กล่องแจ้งเตือน Session Inactivity ใกล้หมดเวลา (สมาชิก)
  if (isWarningOpen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-600">
            ⏳
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            เตือน: ท่านไม่มีการใช้งานมาระยะหนึ่ง
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            เพื่อความปลอดภัยของบัญชี ระบบจะทำการออกจากระบบอัตโนมัติในอีก:
          </p>

          <div className="my-5 flex items-center justify-center">
            <span className="rounded-2xl bg-amber-50 px-6 py-3 font-mono text-3xl font-extrabold text-amber-600 border border-amber-200">
              {countdown} วินาที
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={onExtend}
              type="button"
              className="flex-1 rounded-xl bg-[#004643] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003835] active:scale-98"
            >
              ขยายเวลาการใช้งาน
            </button>
            <button
              onClick={handleLogoutNow}
              type="button"
              className="rounded-xl border border-gray-300 py-2.5 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              ออกจากระบบตอนนี้
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. กล่องแจ้งเตือนสำหรับ Guest หมดเวลาทดลองดูฟรี
  if (isGuestTimeout) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl text-blue-600">
            🎓
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            หมดเวลาดูตัวอย่างสำหรับผู้เยี่ยมชม
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            ท่านได้ทดลองดูตัวอย่างคอร์สครบเวลาที่กำหนดแล้ว กรุณาเข้าสู่ระบบหรือสมัครสมาชิกเพื่อเข้าถึงเนื้อหาบทเรียนฉบับเต็ม
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/login"
              className="flex-1 rounded-xl bg-[#004643] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003835] text-center"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/register"
              className="flex-1 rounded-xl border border-[#004643] py-2.5 text-sm font-semibold text-[#004643] transition hover:bg-teal-50 text-center"
            >
              สมัครสมาชิกฟรี
            </Link>
          </div>

          <button
            onClick={onCloseGuest}
            type="button"
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            ดูคอร์สอื่นต่อในฐานะผู้เยี่ยมชม
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default TimeoutModal;
