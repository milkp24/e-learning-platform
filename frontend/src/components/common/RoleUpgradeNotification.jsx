import { useNavigate } from "react-router-dom";
import { LuShieldCheck, LuArrowRight, LuX } from "react-icons/lu";
import useAuthStore from "../../store/useAuthStore";

/**
 * RoleUpgradeNotification Component
 * Displays a clean, production-grade notification when a user account
 * receives administrative privileges (User/Instructor -> Admin).
 *
 * Jade Design System:
 * - Emerald/Jade accents (#004643, #ABD1C6)
 * - Deep Charcoal text (#26332F, #6B7773)
 * - Pure user-facing Thai messages with direct action to Admin Dashboard
 */
function RoleUpgradeNotification() {
  const navigate = useNavigate();
  const { roleUpgradeNotification, dismissRoleNotification } = useAuthStore();

  if (!roleUpgradeNotification) return null;

  const handleGoToAdmin = () => {
    dismissRoleNotification();
    navigate("/admin/dashboard");
  };

  return (
    <aside
      aria-label="การแจ้งเตือนสิทธิ์ผู้ดูแลระบบ"
      className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-md w-[calc(100%-2rem)] sm:w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="rounded-2xl border-2 border-[#ABD1C6] bg-white p-5 shadow-2xl space-y-3.5 ring-1 ring-black/5">
        {/* Header & Icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/35 text-[#004643]">
              <LuShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#ABD1C6]/30 text-[#004643] mb-0.5">
                สิทธิ์ใหม่
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#26332F] leading-tight">
                {roleUpgradeNotification.title || "สิทธิ์ของคุณได้รับการอัปเดตแล้ว"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissRoleNotification}
            aria-label="ปิดการแจ้งเตือน"
            className="p-1 rounded-lg text-[#6B7773] hover:text-[#26332F] hover:bg-gray-100 transition cursor-pointer"
          >
            <LuX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Message Body */}
        <div className="space-y-1 text-xs sm:text-sm text-[#6B7773] leading-relaxed pl-1">
          <p className="font-bold text-[#26332F]">
            {roleUpgradeNotification.subtitle || "บัญชีของคุณได้รับสิทธิ์เป็น Admin"}
          </p>
          <p>
            {roleUpgradeNotification.description ||
              "ตอนนี้คุณสามารถเข้าสู่หน้าผู้ดูแลระบบเพื่อจัดการผู้ใช้ คอร์ส และระบบได้"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-[#E5E9E7]/60">
          <button
            type="button"
            onClick={dismissRoleNotification}
            className="px-3.5 py-2 rounded-xl border border-[#E5E9E7] bg-white text-xs font-bold text-[#6B7773] hover:text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
          >
            ปิด
          </button>
          {roleUpgradeNotification.hasAdminAccess && (
            <button
              type="button"
              onClick={handleGoToAdmin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004643] hover:bg-[#003835] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
            >
              <span>ไปที่ Admin Dashboard</span>
              <LuArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default RoleUpgradeNotification;
