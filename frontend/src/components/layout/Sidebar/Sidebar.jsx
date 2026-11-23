import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/useAuthStore";
import { getNavSections } from "./sidebarMenuConfig";
import SidebarHeader from "./SidebarHeader";
import SidebarItem from "./SidebarItem";
import SidebarUserFooter from "./SidebarUserFooter";

/**
 * Shared Unified Sidebar Component (Single Source of Truth)
 * Supports all 4 roles: "guest" | "student" | "instructor" | "admin"
 * Super Admin Sidebar serves as the exact visual and behavioral reference
 * Unified under the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7, #004643)
 * Behavior: On-Demand Slide-over Drawer for ALL viewports (Desktop, Tablet, Mobile)
 * Opened exclusively via Hamburger button; closed via Close button, Backdrop overlay, or Escape key
 */
function Sidebar({
  role,
  isOpen = false,
  onClose,
  onOpenLockModal,
  className = "",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, isAuthenticated } = useAuthStore();

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Determine current effective role if not explicitly passed
  const isSuperAdminUser = hasRole("super_admin");
  const effectiveRole =
    role ||
    (isAuthenticated
      ? isSuperAdminUser || hasRole("admin")
        ? "admin"
        : hasRole("instructor")
        ? "instructor"
        : "student"
      : "guest");

  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || "ผู้ใช้งาน";
  const isAdmin = hasRole("admin") || isSuperAdminUser;

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    onClose?.();
  };

  const handleLockedClick = (featureName) => {
    onClose?.();
    onOpenLockModal?.(featureName);
  };

  // เทียบ path ที่อาจมี query (?view=mine) กับ URL ปัจจุบัน
  // เมนู "คอร์สเรียนทั้งหมด" กับ "คอร์สเรียนของฉัน" ใช้ pathname เดียวกัน จึงต้องดูค่า view ด้วย
  const matchesPath = (path) => {
    if (!path) return false;
    const [pathname, query = ""] = path.split("?");
    if (location.pathname !== pathname) return false;
    const targetView = new URLSearchParams(query).get("view");
    const currentView = new URLSearchParams(location.search).get("view");
    return (targetView || null) === (currentView || null);
  };

  const isActive = (path, hash = "") => {
    if (hash) {
      return location.pathname === path && location.hash === hash;
    }
    if (
      path === "/student/home" ||
      path === "/instructor/home" ||
      path === "/admin/home" ||
      path === "/admin/dashboard" ||
      path === "/"
    ) {
      return location.pathname === path && !location.hash;
    }
    return matchesPath(path);
  };

  const isCurrentActive = (path) => {
    if (path === "/admin/home" || path === "/admin/dashboard") {
      return location.pathname === path;
    }
    return matchesPath(path);
  };

  // Nav items resolved from sidebarMenuConfig
  const renderNavItems = () => {
    const sections = getNavSections({
      role: effectiveRole,
      isAdmin,
      isSuperAdmin: isSuperAdminUser,
    });

    if (!sections || sections.length === 0) return null;

    return (
      <nav className="p-4 space-y-6">
        {sections.map((section, sIdx) => {
          const sectionContainerClass = section.isSpecialAdmin
            ? "pt-2 border-t border-[#E5E9E7] space-y-1"
            : "space-y-1";

          return (
            <div key={section.title || sIdx} className="space-y-6">
              {section.hasDivider && <div className="border-t border-[#E5E9E7]" />}

              <div className={sectionContainerClass}>
                <p
                  className={`px-3 text-[11px] font-bold tracking-wider uppercase ${
                    section.titleColor || "text-[#6B7773]"
                  }`}
                >
                  {section.title}
                </p>

                {section.items.map((item) => {
                  const isItemActive =
                    item.type === "hash"
                      ? isActive(item.path, item.hash)
                      : effectiveRole === "admin"
                      ? isCurrentActive(item.path) ||
                        (item.altPath ? isCurrentActive(item.altPath) : false)
                      : isActive(item.path);

                  const itemKey =
                    item.type === "hash"
                      ? `${item.path}${item.hash}`
                      : item.path || item.label;

                  return (
                    <SidebarItem
                      key={itemKey}
                      item={item}
                      isActive={isItemActive}
                      onClick={handleLinkClick}
                      onLockedClick={handleLockedClick}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-[#E5E9E7]">
      <SidebarHeader
        effectiveRole={effectiveRole}
        isSuperAdmin={isSuperAdminUser}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto">{renderNavItems()}</div>
      <SidebarUserFooter
        effectiveRole={effectiveRole}
        displayName={displayName}
        user={user}
        onClose={onClose}
        onLogout={handleLogout}
      />
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop Overlay */}
      <div
        data-testid="sidebar-backdrop"
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        aria-label={`${effectiveRole} Navigation Drawer`}
        className="fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] z-50 shadow-2xl transition-transform duration-300 ease-in-out animate-slideIn"
      >
        {navContent}
      </aside>
    </div>
  );
}

export default Sidebar;
