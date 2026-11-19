import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuBot,
  LuCrown,
  LuUser,
  LuSettings,
  LuLogOut,
  LuSearch,
  LuX,
  LuArrowRight,
  LuShieldCheck,
  LuBookOpen,
  LuUsers,
  LuKey,
  LuChartBar as LuBarChart3,
  LuShield,
} from "react-icons/lu";
import useAuthStore from "../../../store/useAuthStore";
import usePermissionStore from "../../../features/permissions/store/usePermissionStore";
import HamburgerButton from "../../../components/layout/HamburgerButton";

/**
 * AdminHeader Component
 * Clean, modern top navigation bar for Super Admin Console
 * Includes:
 * - Hamburger drawer toggle
 * - Brand logo & name
 * - Global Quick Search modal & Ctrl+K shortcut
 * - Thai Notification center
 * - Super Admin Profile menu
 */
function AdminHeader({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { user, logout, hasRole, isSuperAdmin } = useAuthStore();
  const { staffList } = usePermissionStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "ผู้ดูแลระบบ";

  const isSuper = isSuperAdmin?.() || hasRole("super_admin");
  const roleSubtitle = isSuper ? "Super Admin" : "Admin";
  const roleBadgeText = isSuper ? "Super Admin" : "Admin";

  // Handle Ctrl+K shortcut to toggle quick search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate("/login");
  };

  const sampleNotifications = [
    {
      id: 1,
      title: "มีผู้ใช้ใหม่ลงทะเบียน",
      desc: "user@example.com เข้าร่วมระบบเรียบร้อยแล้ว",
      time: "10 นาทีที่แล้ว",
      read: false,
    },
    {
      id: 2,
      title: "เผยแพร่คอร์สเรียนแล้ว",
      desc: "IoT Fundamentals พร้อมให้ผู้เรียนเข้าถึงแล้ว",
      time: "25 นาทีที่แล้ว",
      read: false,
    },
    {
      id: 3,
      title: "ตรวจสอบความปลอดภัยระบบ",
      desc: "เซสชันและระบบความปลอดภัยทำงานสมบูรณ์ 100%",
      time: "1 ชม. ที่แล้ว",
      read: true,
    },
  ];

  // Quick navigation items for search modal
  const navigationItems = [
    { title: "แดชบอร์ดหลัก", path: "/admin/home", category: "ระบบ", icon: LuBot },
    { title: "จัดการเจ้าหน้าที่", path: "/admin/staff", category: "ผู้ใช้งานและสิทธิ์", icon: LuShieldCheck },
    { title: "สิทธิ์และบทบาท", path: "/admin/roles", category: "ผู้ใช้งานและสิทธิ์", icon: LuKey },
    { title: "ผู้ใช้งานทั้งหมด", path: "/admin/users", category: "ผู้ใช้งานและสิทธิ์", icon: LuUsers },
    { title: "คอร์สเรียนทั้งหมด", path: "/admin/courses", category: "การเรียนรู้", icon: LuBookOpen },
    { title: "บทเรียนในหลักสูตร", path: "/admin/lessons", category: "การเรียนรู้", icon: LuBookOpen },
    { title: "แบบทดสอบและควิซ", path: "/admin/quizzes", category: "การเรียนรู้", icon: LuBookOpen },
    { title: "ภารกิจและการบ้าน", path: "/admin/missions", category: "การเรียนรู้", icon: LuBookOpen },
    { title: "รายงานและสถิติ", path: "/admin/reports", category: "รายงาน", icon: LuBarChart3 },
    { title: "ความปลอดภัยและบันทึก", path: "/admin/security", category: "ระบบ", icon: LuShield },
    { title: "ตั้งค่าระบบ", path: "/admin/settings", category: "ระบบ", icon: LuSettings },
  ];

  // Filtered search results
  const filteredNavItems = navigationItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaffItems = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header
        aria-label="Super Admin Top Navigation"
        className="sticky top-0 z-30 border-b border-[#E5E9E7] bg-white/95 backdrop-blur-md"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Side: Hamburger & Brand Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <HamburgerButton
              onClick={onOpenSidebar}
              ariaLabel="Open sidebar menu"
            />

            <Link
              to="/admin/home"
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
              Super Admin Console
            </span>
          </div>

          {/* Right Side: Global Search Trigger + Notifications + Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center justify-center gap-2 h-10 w-10 sm:w-auto px-0 sm:px-3 rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:text-[#26332F] hover:bg-[#ABD1C6]/15 transition cursor-pointer shadow-2xs text-xs font-medium shrink-0"
              aria-label="ค้นหาระบบด่วน"
            >
              <LuSearch className="h-4 w-4 text-[#004643] shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">ค้นหาระบบ...</span>
              <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                Ctrl+K
              </kbd>
            </button>

            {/* Notification Bell */}
            <div className="relative shrink-0" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#26332F] hover:bg-[#ABD1C6]/25 transition cursor-pointer shadow-2xs"
                aria-label="การแจ้งเตือน"
                aria-expanded={isNotifOpen}
              >
                <svg
                  className="h-5 w-5 text-[#26332F]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {/* Notification Ping Badge */}
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ABD1C6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#004643]"></span>
                </span>
              </button>

              {/* Notification Dropdown Box */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-[#E5E9E7] bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-2 px-2">
                    <h4 className="text-xs font-bold text-[#26332F]">
                      การแจ้งเตือน
                    </h4>
                    <span className="rounded-md bg-[#ABD1C6]/30 px-2 py-0.5 text-[10px] font-bold text-[#004643]">
                      2 ข้อความใหม่
                    </span>
                  </div>
                  <div className="mt-2 space-y-1 divide-y divide-gray-50">
                    {sampleNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl transition ${
                          notif.read ? "bg-white" : "bg-[#ABD1C6]/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#26332F]">
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-[#6B7773]">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7773] mt-0.5">
                          {notif.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative shrink-0" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsNotifOpen(false);
                }}
                className="flex h-10 items-center gap-2 sm:gap-2.5 rounded-xl border border-[#E5E9E7] bg-white px-2.5 sm:px-3 py-1.5 text-left text-xs font-semibold text-[#26332F] shadow-2xs hover:bg-[#FAFAFA] transition cursor-pointer"
                aria-label="เมนูผู้ใช้งาน"
                aria-expanded={isProfileOpen}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ABD1C6]/40 text-[#004643]">
                  <LuCrown className="h-4 w-4" aria-hidden="true" />
                </span>
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
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[#E5E9E7] bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="border-b border-gray-100 px-3 py-2 mb-1">
                    <p className="text-xs font-bold text-[#26332F] truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-[#6B7773] truncate">
                      {user?.email || "admin@example.com"}
                    </p>
                    <span className="mt-1 inline-block rounded-md bg-[#ABD1C6]/30 px-2 py-0.5 text-[10px] font-bold text-[#004643]">
                      {roleBadgeText}
                    </span>
                  </div>

                  <Link
                    to={isSuper ? "/admin/home" : "/admin/dashboard"}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-[#004643] bg-[#ABD1C6]/20 hover:bg-[#ABD1C6]/35 transition my-1"
                  >
                    <LuShield className="h-4 w-4 text-[#004643]" aria-hidden="true" />
                    <span>Admin Dashboard</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] hover:bg-[#ABD1C6]/20 transition"
                  >
                    <LuUser className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                    <span>ข้อมูลโปรไฟล์</span>
                  </Link>

                  {isSuper && (
                    <Link
                      to="/admin/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#26332F] hover:bg-[#ABD1C6]/20 transition"
                    >
                      <LuSettings className="h-4 w-4 text-[#6B7773]" aria-hidden="true" />
                      <span>ตั้งค่าระบบ</span>
                    </Link>
                  )}

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                  >
                    <LuLogOut className="h-4 w-4 text-rose-600" aria-hidden="true" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      {isSearchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-xl rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Search Input Box */}
            <div className="flex items-center px-4 py-3.5 border-b border-[#E5E9E7] gap-3">
              <LuSearch className="h-5 w-5 text-[#004643] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาหน้า, เจ้าหน้าที่, หรือเมนูในระบบ..."
                className="w-full bg-transparent text-sm text-[#26332F] placeholder-[#6B7773] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded-lg text-[#6B7773] hover:text-[#26332F] hover:bg-slate-100 cursor-pointer"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* Results Body */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
              {/* Navigation links */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#6B7773] px-3 uppercase tracking-wider">
                  เมนูและหน้าจัดการ ({filteredNavItems.length})
                </span>
                <div className="space-y-1">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setIsSearchModalOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#ABD1C6]/20 transition group text-xs text-[#26332F]"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-[#004643]" />
                          <span className="font-semibold">{item.title}</span>
                          <span className="text-[10px] text-[#6B7773] bg-slate-100 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <LuArrowRight className="h-3.5 w-3.5 text-[#6B7773] group-hover:translate-x-1 transition" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Staff results if query matches */}
              {searchQuery && filteredStaffItems.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-[#E5E9E7]">
                  <span className="text-[11px] font-bold text-[#6B7773] px-3 uppercase tracking-wider">
                    เจ้าหน้าที่ ({filteredStaffItems.length})
                  </span>
                  <div className="space-y-1">
                    {filteredStaffItems.map((st) => (
                      <Link
                        key={st.id}
                        to="/admin/staff"
                        onClick={() => {
                          setIsSearchModalOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#ABD1C6]/20 transition group text-xs text-[#26332F]"
                      >
                        <div className="flex items-center gap-2.5">
                          <LuShieldCheck className="h-4 w-4 text-[#004643]" />
                          <span className="font-semibold">{st.name}</span>
                          <span className="text-[10px] text-[#6B7773] font-mono">
                            {st.email}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#004643] font-bold">
                          ดูรายละเอียด
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[#E5E9E7] bg-[#FAFAFA] flex items-center justify-between text-[11px] text-[#6B7773]">
              <span>กด <kbd className="font-mono bg-white px-1 py-0.5 rounded border">Esc</kbd> เพื่อปิด</span>
              <span>นำทางด่วนในระบบ Super Admin</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminHeader;
