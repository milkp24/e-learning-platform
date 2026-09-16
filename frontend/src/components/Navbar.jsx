// นำเข้า React Hooks สำหรับจัดการ State, Lifecycle และ DOM Reference
import { useState, useEffect, useRef } from "react";
// นำเข้า Link และ useNavigate จาก React Router สำหรับการเปลี่ยนหน้า
import { Link, useNavigate } from "react-router-dom";
// นำเข้า useAuthStore สำหรับเข้าถึงสถานะการเข้าสู่ระบบและข้อมูลผู้ใช้
import useAuthStore from "../store/useAuthStore";

// คอมโพเนนต์ Navbar สำหรับแสดงแถบนำทางส่วนบน
function Navbar() {
  // ดึงค่าสถานะการเข้าสู่ระบบ ข้อมูลผู้ใช้ ฟังก์ชันออกจากระบบ และฟังก์ชันตรวจสอบสิทธิ์
  const { isAuthenticated, user, logout, hasRole } = useAuthStore();
  // ฟังก์ชัน navigate สำหรับนำทางเปลี่ยนหน้า
  const navigate = useNavigate();

  // State สำหรับควบคุมการเปิดหรือปิดกล่องเมนู User Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Reference อ้างอิง Element กล่อง Dropdown เพื่อใช้ตรวจจับการคลิกภายนอก
  const dropdownRef = useRef(null);

  // ตรวจสอบว่าผู้ใช้มีบทบาทเป็น Student หรือไม่
  const isStudent = isAuthenticated && hasRole("student");

  // ดักจับการคลิกด้านนอก Dropdown เพื่อปิดอัตโนมัติ
  useEffect(() => {
    // ฟังก์ชันตรวจสอบการคลิกนอกขอบเขต Element
    const handleClickOutside = (event) => {
      // ตรวจสอบว่ามีการคลิกนอก Element หรือไม่
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // สั่งปิดเมนู Dropdown
        setIsDropdownOpen(false);
      }
    };

    // หากเปิด Dropdown อยู่ ให้เริ่มดักจับเหตุการณ์ mousedown
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup ถอด Event Listener เมื่อคอมโพเนนต์ถูกทำลายหรือปิด Dropdown
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // ฟังก์ชันจัดการการออกจากระบบ Logout อย่างปลอดภัย
  const handleLogout = async () => {
    // ปิดเมนู Dropdown ก่อน
    setIsDropdownOpen(false);
    // เรียกฟังก์ชัน logout จาก Auth Store
    await logout();
    // นำทางไปยังหน้าเข้าสู่ระบบหลัง Logout สำเร็จ
    navigate("/login");
  };

  // ดึงชื่อแสดงผลของผู้ใช้
  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "User";

  // ส่งคืนโครงสร้าง JSX ของ Navbar
  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white shadow-xs">
      {/* กล่องจัดวาง Navbar ให้เนื้อหาอยู่กึ่งกลางและกว้างสูงสุด 7xl */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3.5">
        {/* ฝั่งซ้าย: โลโก้แบรนด์ 🤖 E-learning Platform */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg sm:text-xl font-black text-[#26332F] transition hover:opacity-90"
        >
          {/* ไอคอนสำหรับแพลตฟอร์มการเรียนรู้ */}
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xl text-[#004643]">
            🤖
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
                👤
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
                      <span>👤</span>
                      <span>ข้อมูลบัญชี</span>
                    </Link>

                    {/* เมนูความคืบหน้า */}
                    <Link
                      to="/student/home"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] transition hover:bg-[#FAFAFA] hover:text-[#004643]"
                    >
                      <span>📈</span>
                      <span>ความคืบหน้า</span>
                    </Link>

                    {/* เมนูการตั้งค่า / ความเป็นส่วนตัว */}
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] transition hover:bg-[#FAFAFA] hover:text-[#004643]"
                    >
                      <span>⚙️</span>
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
                      <span>🚪</span>
                      <span>ออกจากระบบ</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* เมนูเข้าสู่ระบบสำหรับ Guest */}
                    <Link
                      to="/login"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#004643] transition hover:bg-[#ABD1C6]/20"
                    >
                      <span>🔑</span>
                      <span>เข้าสู่ระบบ</span>
                    </Link>

                    {/* เมนูสมัครสมาชิกสำหรับ Guest */}
                    <Link
                      to="/register"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#26332F] transition hover:bg-gray-100"
                    >
                      <span>✨</span>
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

// ส่งออกคอมโพเนนต์ Navbar สำหรับนำไปใช้งาน
export default Navbar;
