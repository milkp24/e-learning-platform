import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/useAuthStore";
import {
  LuBot,
  LuCrown,
  LuUser,
  LuTrendingUp,
  LuSettings,
  LuLogOut,
  LuKey,
  LuSparkles,
} from "react-icons/lu";

/**
 * Navbar Component
 * แถบนำทางหลักส่วนบนของเว็บไซต์ (Sticky Top Navigation)
 * 
 * ฟังก์ชันหลัก:
 * 1. แสดงอัตลักษณ์แบรนด์ E-learning Platform
 * 2. ควบคุม User Dropdown Menu ตามสถานะ Authentication:
 *    - สมาชิกที่ Login แล้ว: แสดงชื่อผู้ใช้, ลิงก์โปรไฟล์, ความคืบหน้าการเรียน, การตั้งค่า และปุ่มออกจากระบบ
 *    - ผู้เข้าชมทั่วไป (Guest): แสดงปุ่มเข้าสู่ระบบ, สมัครสมาชิก และทางลัดสำหรับผู้ดูแล
 * 3. ตรวจจับ Click Outside เพื่อปิดเมนู Dropdown อัตโนมัติ
 */
function Navbar() {
  const { isAuthenticated, user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isStudent = isAuthenticated && hasRole("student");

  // ปิดเมนูอัตโนมัติเมื่อคลิกนอกพื้นที่ Dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate("/login");
  };

  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* ฝั่งซ้าย: โลโก้แบรนด์ E-learning Platform */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg sm:text-xl font-black text-[#26332F] transition hover:opacity-90"
        >
          {/* ไอคอนสำหรับแพลตฟอร์มการเรียนรู้ */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xl text-[#004643]">
            <LuBot className="h-5 w-5 text-[#004643]" aria-hidden="true" />
          </span>
          {/* ข้อความชื่อแพลตฟอร์ม E-learning Platform */}
          <span>
            E-learning <span className="text-[#004643]">Platform</span>
          </span>
        </Link>

        {/* ฝั่งขวา: ปุ่ม User ▼ พร้อม Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            {/* ปุ่มกดเปิด/ปิด Dropdown */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#26332F] shadow-xs transition hover:bg-gray-50 active:scale-98 cursor-pointer"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              {/* ไอคอนรูปผู้ใช้ */}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ABD1C6]/40 text-xs font-bold text-[#004643]">
                <LuUser className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
              </span>
              {/* แสดงชื่อผู้ใช้หรือคำว่า User */}
              <span className="max-w-[120px] truncate">
                {isAuthenticated ? displayName : "User"}
              </span>
              {/* ไอคอน Chevron Down หมุนตามสถานะเปิด/ปิด */}
              <svg
                className={`h-4 w-4 text-[#6B7773] transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* กล่องแสดงผล Dropdown เมื่อเปิดใช้งาน */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-xl z-50">
                {/* ตรวจสอบว่าผู้ใช้ล็อกอินในฐานะ Student หรือไม่ */}
                {isAuthenticated && isStudent ? (
                  <>
                    {/* ข้อมูลสรุปโปรไฟล์ผู้เรียน */}
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-bold text-[#26332F] truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-[#6B7773] truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* เมนูข้อมูลบัญชี */}
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] transition hover:bg-[#FAFAFA] hover:text-[#004643]"
                    >
                      <LuUser className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                      <span>ข้อมูลบัญชี</span>
                    </Link>

                    {/* เมนูความคืบหน้า */}
                    <Link
                      to="/student/home"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] transition hover:bg-[#FAFAFA] hover:text-[#004643]"
                    >
                      <LuTrendingUp className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                      <span>ความคืบหน้า</span>
                    </Link>

                    {/* เมนูการตั้งค่า / ความเป็นส่วนตัว */}
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] transition hover:bg-[#FAFAFA] hover:text-[#004643]"
                    >
                      <LuSettings className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                      <span>การตั้งค่า / ความเป็นส่วนตัว</span>
                    </Link>

                    {/* เส้นคั่นรายการเมนู */}
                    <div className="my-1 border-t border-[#E5E7EB]" />

                    {/* ปุ่มออกจากระบบ Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LuLogOut className="h-4 w-4 text-red-600" aria-hidden="true" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* เมนูผู้ดูแลระบบสำหรับ Guest */}
                    <Link
                      to="/admin/home"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#26332F] transition hover:bg-gray-100"
                    >
                      <LuCrown className="h-4 w-4 text-[#004643]" aria-hidden="true" />
                      <span>ผู้ดูแลระบบ</span>
                    </Link>

                    {/* เมนูเข้าสู่ระบบสำหรับ Guest */}
                    <Link
                      to="/login"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#004643] transition hover:bg-[#ABD1C6]/20"
                    >
                      <LuKey className="h-4 w-4 text-[#004643]" aria-hidden="true" />
                      <span>เข้าสู่ระบบ</span>
                    </Link>

                    {/* เมนูสมัครสมาชิกสำหรับ Guest */}
                    <Link
                      to="/register"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#26332F] transition hover:bg-gray-100"
                    >
                      <LuSparkles className="h-4 w-4 text-[#004643]" aria-hidden="true" />
                      <span>สมัครสมาชิก</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
