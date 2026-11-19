import { Link } from "react-router-dom";
import { LuCrown, LuGraduationCap, LuBot } from "react-icons/lu";

/**
 * SidebarHeader Component
 * Renders role-specific brand identity, logo icon, title, subtitle, home link, and close button.
 */
function SidebarHeader({ effectiveRole, isSuperAdmin = false, onClose }) {
  const getHeaderConfig = () => {
    switch (effectiveRole) {
      case "admin":
        return {
          Icon: LuCrown,
          title: "E-learning",
          subtitle: isSuperAdmin ? "Super Admin Console" : "แดชบอร์ดผู้ดูแลระบบ",
          homeUrl: isSuperAdmin ? "/admin/home" : "/admin/dashboard",
        };
      case "instructor":
        return {
          Icon: LuGraduationCap,
          title: "E-learning",
          subtitle: "สตูดิโอผู้สอน",
          homeUrl: "/instructor/home",
        };
      case "student":
        return {
          Icon: LuBot,
          title: "E-learning",
          subtitle: "พื้นที่การเรียนรู้",
          homeUrl: "/student/home",
        };
      default:
        return {
          Icon: LuBot,
          title: "E-learning",
          subtitle: "ผู้เยี่ยมชม",
          homeUrl: "/",
        };
    }
  };

  const { Icon, title, subtitle, homeUrl } = getHeaderConfig();

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <div className="flex items-center justify-between border-b border-[#E5E9E7] p-5 bg-[#FAFAFA]">
      <Link
        to={homeUrl}
        onClick={handleLinkClick}
        className="flex items-center gap-3 transition hover:opacity-90 select-none"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ABD1C6]/40 text-[#004643] shadow-xs">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <div className="flex items-center gap-1.5 font-black text-[#26332F]">
            <span className="text-base tracking-tight">{title}</span>
          </div>
          <p className="text-[11px] font-bold text-[#004643]">{subtitle}</p>
        </div>
      </Link>

      {/* Close Button (Visible on all viewports) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close sidebar menu"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-[#ABD1C6]/25 hover:text-[#26332F] transition cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default SidebarHeader;
