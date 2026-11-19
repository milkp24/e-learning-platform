import { Link } from "react-router-dom";
import { LuBot, LuShieldCheck } from "react-icons/lu";
import HamburgerButton from "../../../components/layout/HamburgerButton";

// ======================================================
// GuestHeader Component (แถบนำทางส่วนบนสำหรับ Guest)
// ======================================================
// โครงสร้างตามข้อกำหนด:
// ┌──────────────────────────────────────────────────────────────┐
// │ ☰  E-learning Platform              เข้าสู่ระบบ  สมัครสมาชิก  [ผู้ดูแลระบบ] │
// └──────────────────────────────────────────────────────────────┘
// - ด้านซ้าย: Hamburger icon สำหรับเปิด Sidebar + โลโก้แบรนด์ E-learning Platform
// - ด้านขวา: เข้าสู่ระบบ (/login), สมัครสมาชิก (/register), ผู้ดูแลระบบ (/admin/login)
// - Responsive: ปรับ spacing และย่อข้อความปุ่มแอดมินบนจอมือถือขนาดเล็ก (< sm) ป้องกันการเบียด
// ======================================================

function GuestHeader({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5E9E7] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ฝั่งซ้าย: ปุ่ม Hamburger + โลโก้แบรนด์ */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <HamburgerButton
            onClick={onOpenSidebar}
            ariaLabel="Open sidebar menu"
          />

          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base lg:text-lg font-black tracking-tight text-[#26332F] transition hover:opacity-90 select-none shrink-0"
          >
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643] shadow-xs">
              <LuBot className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </span>
            <span className="truncate">
              E-learning <span className="text-[#004643] hidden min-[400px]:inline">Platform</span>
            </span>
          </Link>
        </div>

        {/* ฝั่งขวา: เข้าสู่ระบบ | สมัครสมาชิก | [ผู้ดูแลระบบ] */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className="rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold text-[#26332F] hover:text-[#004643] transition whitespace-nowrap shrink-0"
          >
            เข้าสู่ระบบ
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-[#004643] px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#003835] transition whitespace-nowrap shrink-0"
          >
            สมัครสมาชิก
          </Link>

          <Link
            to="/admin/login"
            aria-label="ผู้ดูแลระบบ"
            title="ผู้ดูแลระบบ"
            className="rounded-xl border border-[#E5E9E7] bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-[#6B7773] hover:text-[#26332F] hover:border-[#ABD1C6] transition shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <LuShieldCheck className="h-4 w-4 text-[#004643] shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default GuestHeader;
