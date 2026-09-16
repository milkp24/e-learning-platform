// นำเข้า Link, useLocation และ useNavigate จาก React Router
import { Link, useLocation, useNavigate } from "react-router-dom";
// นำเข้า useAuthStore สำหรับเข้าถึงสถานะผู้ใช้และฟังก์ชัน Logout
import useAuthStore from "../store/useAuthStore";

// คอมโพเนนต์ Sidebar รองรับทั้ง Fixed Sidebar สำหรับ Guest และ Workspace Sidebar สำหรับ Student
function Sidebar({ isGuest = false, onOpenLockModal, className = "" }) {
  // ดึงค่า Location ปัจจุบันเพื่อตรวจสอบความตรงกับเมนู (Active State)
  const location = useLocation();
  // ฟังก์ชัน navigate สำหรับนำทางเปลี่ยนหน้า
  const navigate = useNavigate();
  // ดึงข้อมูลผู้ใช้ ฟังก์ชัน logout และฟังก์ชัน hasRole จาก Zustand Store
  const { user, logout, hasRole } = useAuthStore();

  // ฟังก์ชันสำหรับออกจากระบบอย่างปลอดภัย
  const handleLogout = async () => {
    // เรียกใช้ฟังก์ชัน Logout จาก Auth Store
    await logout();
    // นำทางไปยังหน้า Login หลังออกจากระบบสำเร็จ
    navigate("/login");
  };

  // ฟังก์ชันตรวจสอบว่า Path หรือ Hash ปัจจุบันตรงกับเมนูหรือไม่
  const isActive = (path, hash = "") => {
    // หากมีการระบุ Hash ให้ตรวจสอบทั้ง Path และ Hash
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    // หากเป็นหน้า Student Home หลัก
    if (path === "/student/home") {
      return location.pathname === "/student/home" && !location.hash;
    }
    // สำหรับ Path อื่นๆ ให้ตรวจสอบการตรงกับ Path นั้น
    return location.pathname === path;
  };

  // ดึงชื่อแสดงผลของผู้ใช้
  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "ผู้เรียน";
  // ตรวจสอบสิทธิ์ Admin
  const isAdmin = hasRole("admin");

  // หากเป็น Sidebar สำหรับ Guest (Fixed Sidebar ตรึงอยู่ตลอดเวลา ไม่มี Drawer และไม่มี Hamburger)
  if (isGuest) {
    return (
      <aside
        className={`w-56 sm:w-60 shrink-0 border-r border-[#E5E7EB] bg-white p-4 flex flex-col justify-between sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto ${className}`}
      >
        {/* รายการเมนูหลักสำหรับ Guest */}
        <div className="space-y-6">
          <nav className="space-y-1.5">
            {/* เมนู Home */}
            <Link
              to="/"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                location.pathname === "/"
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">🏠</span>
              <span>Home</span>
            </Link>

            {/* เมนู Course พร้อมไอคอนล็อก */}
            <button
              type="button"
              onClick={() => onOpenLockModal?.("Course")}
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] transition hover:bg-gray-100 hover:text-[#26332F] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📚</span>
                <span>Course</span>
              </div>
              <span className="text-xs text-amber-600">🔒</span>
            </button>

            {/* เมนู Virtual Lab พร้อมไอคอนล็อก */}
            <button
              type="button"
              onClick={() => onOpenLockModal?.("Virtual Lab")}
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] transition hover:bg-gray-100 hover:text-[#26332F] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🧪</span>
                <span>Virtual Lab</span>
              </div>
              <span className="text-xs text-amber-600">🔒</span>
            </button>

            {/* เมนู Live พร้อมไอคอนล็อก */}
            <button
              type="button"
              onClick={() => onOpenLockModal?.("Live")}
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] transition hover:bg-gray-100 hover:text-[#26332F] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📡</span>
                <span>Live</span>
              </div>
              <span className="text-xs text-amber-600">🔒</span>
            </button>

            {/* เมนู Quest พร้อมไอคอนล็อก */}
            <button
              type="button"
              onClick={() => onOpenLockModal?.("Quest")}
              className="flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] transition hover:bg-gray-100 hover:text-[#26332F] text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🏆</span>
                <span>Quest</span>
              </div>
              <span className="text-xs text-amber-600">🔒</span>
            </button>
          </nav>
        </div>

        {/* ส่วนท้าย Sidebar: ลิงก์เข้าสู่ระบบและสมัครสมาชิก */}
        <div className="pt-4 border-t border-[#E5E7EB] space-y-2">
          {/* ลิงก์เข้าสู่ระบบ */}
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#004643] bg-[#ABD1C6]/30 hover:bg-[#ABD1C6]/50 transition"
          >
            <span className="text-base">🔑</span>
            <span>เข้าสู่ระบบ</span>
          </Link>

          {/* ลิงก์สมัครสมาชิก */}
          <Link
            to="/register"
            className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-gray-100 transition"
          >
            <span className="text-base">✨</span>
            <span>สมัครสมาชิก</span>
          </Link>
        </div>
      </aside>
    );
  }

  // แสดงผล Sidebar สำหรับ Student Workspace
  return (
    <aside
      className={`w-64 shrink-0 border-r border-[#E5E7EB] bg-white flex flex-col justify-between fixed top-0 bottom-0 left-0 z-40 overflow-y-auto ${className}`}
    >
      <div className="flex-1 overflow-y-auto">
        {/* ส่วนหัว Workspace */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ABD1C6]/40 text-2xl text-[#004643]">
              🤖
            </span>
            <div>
              {/* ชื่อระบบ E-learning Platform */}
              <div className="flex items-center gap-1.5 font-black text-[#26332F]">
                <span className="text-base tracking-tight">E-learning</span>
                <span className="text-xs text-[#6B7773]">▼</span>
              </div>
              {/* คำบรรยายประเภทรวมเป็น E-learning Platform */}
              <p className="text-[11px] font-semibold text-[#6B7773]">
                Platform
              </p>
            </div>
          </div>
        </div>

        {/* เมนูนำทางหลักสำหรับ Student */}
        <nav className="p-4 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B7773]">
              เมนูหลัก (Main Navigation)
            </p>

            {/* เมนู Home */}
            <Link
              to="/student/home"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive("/student/home")
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">🏠</span>
              <span>Home</span>
            </Link>

            {/* เมนู Courses */}
            <Link
              to="/classrooms"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive("/classrooms")
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">📚</span>
              <span>Courses</span>
            </Link>

            {/* เมนู Virtual Lab */}
            <a
              href="#lab"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive("/student/home", "#lab")
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">🧪</span>
              <span>Virtual Lab</span>
            </a>

            {/* เมนู Live */}
            <a
              href="#live"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive("/student/home", "#live")
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">📡</span>
              <span>Live</span>
            </a>

            {/* เมนู Quest */}
            <a
              href="#quest"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive("/student/home", "#quest")
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">🏆</span>
              <span>Quest</span>
            </a>
          </div>

          {/* เส้นคั่นหมวดหมู่ */}
          <div className="border-t border-[#E5E7EB]" />

          {/* หมวดหมู่การเรียนรู้ Learning */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B7773]">
              การเรียนรู้ (Learning)
            </p>

            {/* เมนู Progress */}
            <a
              href="#progress"
              className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition"
            >
              <span className="text-base">📈</span>
              <span>Progress</span>
            </a>

            {/* เมนู Achievement */}
            <a
              href="#achievement"
              className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition"
            >
              <span className="text-base">🎖</span>
              <span>Achievement</span>
            </a>

            {/* เมนู Streak */}
            <a
              href="#streak"
              className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition"
            >
              <span className="text-base">🔥</span>
              <span>Streak</span>
            </a>
          </div>

          {/* เส้นคั่นหมวดหมู่ */}
          <div className="border-t border-[#E5E7EB]" />

          {/* หมวดหมู่บัญชีผู้ใช้ Account */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B7773]">
              บัญชีผู้ใช้ (Account)
            </p>

            {/* เมนู Settings */}
            <Link
              to="/profile"
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                isActive("/profile")
                  ? "bg-[#ABD1C6] text-[#26332F] shadow-xs"
                  : "text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F]"
              }`}
            >
              <span className="text-base">⚙️</span>
              <span>Settings</span>
            </Link>

            {/* เมนู Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer"
            >
              <span className="text-base">🚪</span>
              <span>Logout</span>
            </button>
          </div>

          {/* เมนู Admin Console สำหรับผู้ใช้ที่มีบทบาท admin */}
          {isAdmin && (
            <div className="pt-2 border-t border-[#E5E7EB] space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                ผู้ดูแลระบบ (Admin)
              </p>
              <Link
                to="/admin/home"
                className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 transition"
              >
                <span>🛡️</span>
                <span>Admin Console</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* ส่วนท้ายแสดงสถานะผู้เรียน */}
      <div className="border-t border-[#E5E7EB] p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/40 text-sm font-bold text-[#004643]">
            👤
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#26332F]">
              {displayName}
            </p>
            <p className="truncate text-[10px] font-semibold text-[#004643]">
              Student
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ส่งออกคอมโพเนนต์ Sidebar
export default Sidebar;
