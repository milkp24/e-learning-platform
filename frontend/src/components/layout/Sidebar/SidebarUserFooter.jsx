import { Link } from "react-router-dom";
import {
  LuBot,
  LuCrown,
  LuGraduationCap,
  LuKey,
  LuSparkles,
  LuUser,
  LuLogOut,
} from "react-icons/lu";

/**
 * SidebarUserFooter Component
 * Presentational component that renders:
 * - Guest action links (Admin Login, Login, Register) when effectiveRole === "guest"
 * - User card with avatar, role badge subtitle, profile link, and logout button for authenticated roles
 */
function SidebarUserFooter({
  effectiveRole,
  displayName = "ผู้ใช้งาน",
  onClose,
  onLogout,
}) {
  const handleLinkClick = () => {
    onClose?.();
  };

  // Guest view: Action links for authentication
  if (effectiveRole === "guest") {
    return (
      <div className="p-4 border-t border-[#E5E9E7] bg-[#FAFAFA] space-y-2">
        <Link
          to="/admin/login"
          onClick={handleLinkClick}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#004643] bg-white border border-[#E5E9E7] hover:bg-[#ABD1C6]/25 transition shadow-2xs"
        >
          <LuCrown className="w-4 h-4 text-[#004643]" aria-hidden="true" />
          <span>ผู้ดูแลระบบ</span>
        </Link>
        <Link
          to="/login"
          onClick={handleLinkClick}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#004643] bg-[#ABD1C6] hover:bg-[#9CC5B9] transition shadow-2xs"
        >
          <LuKey className="w-4 h-4" aria-hidden="true" />
          <span>เข้าสู่ระบบ</span>
        </Link>
        <Link
          to="/register"
          onClick={handleLinkClick}
          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#26332F] bg-white border border-[#E5E9E7] hover:bg-[#ABD1C6]/25 transition shadow-2xs"
        >
          <LuSparkles className="w-4 h-4 text-[#004643]" aria-hidden="true" />
          <span>สมัครสมาชิก</span>
        </Link>
      </div>
    );
  }

  // Role-specific badge and subtitle matching Super Admin pattern
  const roleConfig = {
    admin: {
      Icon: LuCrown,
      subtitle: "ผู้ดูแลระบบ",
    },
    instructor: {
      Icon: LuGraduationCap,
      subtitle: "อาจารย์ผู้สอน",
    },
    student: {
      Icon: LuBot,
      subtitle: "ผู้เรียน",
    },
  }[effectiveRole] || {
    Icon: LuUser,
    subtitle: "สมาชิก",
  };

  // Authenticated user view: User profile card + Profile & Logout action buttons
  return (
    <div className="p-4 border-t border-[#E5E9E7] bg-[#FAFAFA] space-y-3">
      <div className="flex items-center gap-3 px-2 py-1.5 rounded-2xl bg-white border border-[#E5E9E7] shadow-2xs">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6] text-[#26332F] font-bold text-sm">
          <roleConfig.Icon className="h-5 w-5 text-[#004643]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-[#26332F]">
            {displayName}
          </p>
          <p className="text-[11px] font-semibold text-[#6B7773]">
            {roleConfig.subtitle}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          to="/profile"
          onClick={handleLinkClick}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white px-3 py-2 text-xs font-semibold text-[#26332F] hover:bg-[#ABD1C6]/25 transition"
        >
          <LuUser className="w-4 h-4" aria-hidden="true" />
          <span>โปรไฟล์</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <LuLogOut className="w-4 h-4" aria-hidden="true" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
}

export default SidebarUserFooter;
