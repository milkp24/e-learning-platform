import { Link, useNavigate } from "react-router-dom";
import {
  LuBot,
  LuEye,
  LuChartBar as LuBarChart3,
  LuBookOpen,
  LuSettings,
  LuLogOut,
  LuShield,
} from "react-icons/lu";
import useAuthStore from "../../../store/useAuthStore";
import Dropdown from "../../../components/common/Dropdown";
import HamburgerButton from "../../../components/layout/HamburgerButton";
import UserAvatar from "../../../components/common/UserAvatar";
import { getHeaderName } from "../../../utils/userDisplay";

// ======================================================
// InstructorHeader Component (แถบนำทางส่วนบนสำหรับผู้สอน)
// ======================================================
// - แสดงปุ่มเปิด Sidebar บนมือถือ/แท็บเล็ต/เดสก์ท็อป (Hamburger)
// - โลโก้แบรนด์ E-learning Platform + Badge "Instructor Console"
// - ปุ่ม "มุมมองผู้เรียน" สำหรับสลับดูหน้ามุมมอง Student
// - User Profile Dropdown ตามมาตรฐาน Jade Design System

function InstructorHeader({ onOpenSidebar }) {
  const { user, logout, hasRole, isSuperAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  const isSuper = isSuperAdmin?.() || hasRole("super_admin");
  const isAdmin = hasRole("admin") || isSuper;

  const roleSubtitle = isSuper
    ? "Super Admin"
    : isAdmin
    ? "Admin"
    : "Instructor";
  // ชื่อซ้ำกับบทบาท (เช่น "Super Admin" / "Super Admin") แสดงอีเมลแทน
  const displayName = getHeaderName(user, roleSubtitle, "อาจารย์ผู้สอน");

  const roleBadgeText = isSuper
    ? "Super Admin Account"
    : isAdmin
    ? "Admin Account"
    : "Instructor Account";

  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E9E7] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ฝั่งซ้าย: ปุ่ม Hamburger (ทุกขนาดหน้าจอ) + โลโก้ + Instructor Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <HamburgerButton
            onClick={onOpenSidebar}
            ariaLabel="Open sidebar menu"
          />

          <Link
            to="/instructor/home"
            className="flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base lg:text-lg font-black tracking-tight text-[#26332F] transition hover:opacity-90 select-none shrink-0"
          >
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643] shadow-xs">
              <LuBot className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <span className="truncate">
              E-learning <span className="text-[#004643] hidden min-[400px]:inline">Platform</span>
            </span>
          </Link>

          <span className="hidden lg:inline-flex items-center rounded-lg bg-[#ABD1C6]/20 border border-[#ABD1C6]/60 px-2.5 py-0.5 text-xs font-bold text-[#004643] shrink-0">
            Instructor Console
          </span>
        </div>

        {/* ฝั่งขวา: ปุ่มสลับมุมมองผู้เรียน + User Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* ปุ่มสลับไปมุมมองผู้เรียน */}
          <Link
            to="/student/home"
            className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white px-3 py-2 text-xs font-semibold text-[#26332F] hover:bg-[#ABD1C6]/15 hover:text-[#004643] transition shadow-2xs shrink-0"
          >
            <LuEye className="h-4 w-4 text-[#004643]" aria-hidden="true" />
            <span>มุมมองผู้เรียน</span>
          </Link>

          {/* User Profile Dropdown */}
          <Dropdown
            align="right"
            className="shrink-0"
            trigger={({ isOpen }) => (
              <button
                type="button"
                className="flex h-10 items-center gap-2 sm:gap-2.5 rounded-xl border border-[#E5E9E7] bg-white px-2.5 sm:px-3 py-1.5 text-left text-xs font-semibold text-[#26332F] shadow-2xs hover:bg-[#FAFAFA] transition cursor-pointer"
                aria-label="เมนูผู้ใช้งาน"
                aria-expanded={isOpen}
              >
                <UserAvatar user={user} name={displayName} />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[#26332F] leading-tight truncate max-w-[110px] sm:max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-medium text-[#6B7773] leading-none">
                    {roleSubtitle}
                  </span>
                </div>
                <span className="sm:hidden max-w-[80px] truncate text-xs font-bold text-[#26332F]">
                  {displayName}
                </span>
                <svg
                  className={`h-4 w-4 text-[#6B7773] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
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
            )}
          >
            <div className="w-56 p-1">
              {/* ข้อมูลสรุป */}
              <div className="px-3 py-2 border-b border-[#E5E9E7] mb-1">
                <p className="text-xs font-bold text-[#26332F] truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-[#6B7773] truncate">
                  {user?.email || "instructor@example.com"}
                </p>
                <span className="mt-1 inline-block rounded-md bg-[#ABD1C6]/30 px-2 py-0.5 text-[10px] font-bold text-[#004643]">
                  {roleBadgeText}
                </span>
              </div>

              {/* ลิงก์เมนู */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[#004643] bg-[#ABD1C6]/30 hover:bg-[#ABD1C6]/40 transition my-1"
                >
                  <LuShield className="h-4 w-4 text-[#004643]" aria-hidden="true" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              <Link
                to="/instructor/home"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] hover:bg-[#ABD1C6]/20 transition"
              >
                <LuBarChart3 className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                <span>แดชบอร์ดผู้สอน</span>
              </Link>

              <Link
                to="/classrooms"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] hover:bg-[#ABD1C6]/20 transition"
              >
                <LuBookOpen className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                <span>คอร์สเรียน</span>
              </Link>

              <Link
                to="/student/home"
                className="flex sm:hidden items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] hover:bg-[#ABD1C6]/20 transition"
              >
                <LuEye className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                <span>สลับไปมุมมองผู้เรียน</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] hover:bg-[#ABD1C6]/20 transition"
              >
                <LuSettings className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                <span>การตั้งค่าโปรไฟล์</span>
              </Link>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                <LuLogOut className="h-4 w-4 text-rose-600" aria-hidden="true" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

export default InstructorHeader;
