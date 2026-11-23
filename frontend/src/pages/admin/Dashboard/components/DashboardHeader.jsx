import { LuCalendar, LuRefreshCw, LuSearch } from "react-icons/lu";
import useAuthStore from "../../../../store/useAuthStore";
import { ProfileAvatarLink } from "../../../../components/common/UserAvatar";

// Helper จัดรูปแบบวันปัจจุบันในรูปแบบภาษาไทย
const getThaiTodayDateString = () => {
  const days = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์",
  ];
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const now = new Date();
  const dayName = days[now.getDay()];
  const dateNum = now.getDate();
  const monthName = months[now.getMonth()];
  const yearTh = now.getFullYear() + 543;
  return `${dayName}ที่ ${dateNum} ${monthName} ${yearTh}`;
};

/**
 * DashboardHeader Component
 * Greets the Super Admin with Thai date, quick status, and action buttons
 */
export default function DashboardHeader({
  onRefresh,
  isLoading,
  onOpenSearch,
  dateFilter,
  setDateFilter,
}) {
  const { user, hasRole, isSuperAdmin: checkSuperAdmin } = useAuthStore();
  const isSuperAdmin = Boolean(checkSuperAdmin?.() || hasRole("super_admin"));
  const displayName =
    user?.profile?.display_name || user?.email?.split("@")[0] || (isSuperAdmin ? "Super Admin" : "ผู้ดูแลระบบ");

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-[#E5E9E7]/60">
      {/* Left: รูปโปรไฟล์ (ข้อ 34) + Greeting & Current Date */}
      <div className="flex items-center gap-4 min-w-0">
      <ProfileAvatarLink user={user} name={displayName} />
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#26332F]">
            สวัสดี, {displayName} 👋
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ABD1C6]/30 text-[#004643] border border-[#ABD1C6]">
            {isSuperAdmin ? "Super Admin Console" : "Admin Console"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#6B7773]">
          <LuCalendar className="h-4 w-4 text-[#004643] shrink-0" aria-hidden="true" />
          <span>{getThaiTodayDateString()}</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden sm:inline">
            ยินดีต้อนรับสู่ศูนย์ควบคุมระบบ E-learning Platform
          </span>
        </div>
      </div>
      </div>

      {/* Right: Actions (Date Filter + Refresh) */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Quick Date Filter Tabs */}
        {setDateFilter && (
          <div className="inline-flex rounded-xl border border-[#E5E9E7] bg-white p-1 shadow-2xs">
            {[
              { id: "today", label: "วันนี้" },
              { id: "7d", label: "7 วัน" },
              { id: "30d", label: "30 วัน" },
              { id: "custom", label: "กำหนดเอง" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  dateFilter === tab.id
                    ? "bg-[#ABD1C6] text-[#004643] shadow-xs"
                    : "text-[#6B7773] hover:text-[#26332F] hover:bg-[#FAFAFA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E9E7] bg-white text-xs font-semibold text-[#26332F] hover:bg-[#FAFAFA] transition shadow-2xs cursor-pointer"
          >
            <LuSearch className="w-3.5 h-3.5 text-[#6B7773]" aria-hidden="true" />
            <span className="hidden sm:inline">ค้นหาด่วน</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
              Ctrl+K
            </kbd>
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E9E7] bg-white text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/20 active:scale-98 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <LuRefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#004643]" : "text-[#004643]"}`}
              aria-hidden="true"
            />
            <span>{isLoading ? "กำลังโหลด..." : "รีเฟรช"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
