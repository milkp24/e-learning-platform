import { useState, useEffect } from "react";
import { LuShieldCheck, LuHistory } from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * RecentActivity Component
 * Displays system events and dynamic audit logs with "ดูกิจกรรมทั้งหมด" action
 * Fetches real audit logs directly from backend database
 */
function RecentActivity({ onViewAll }) {
  const [realLogs, setRealLogs] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const data = await adminService.getAuditLogs({ per_page: 5 });
        if (isMounted && data && Array.isArray(data.logs)) {
          setRealLogs(data.logs);
        }
      } catch (err) {
        console.error("Failed to fetch real audit logs:", err);
      }
    };
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayList = realLogs.length > 0 ? realLogs : [];

  const recentItems = displayList.slice(0, 5).map((log) => {
    const detailsStr = typeof log.details === "object"
      ? (log.details?.actor ? `${log.details.actor}: ${log.details.action || ""}` : JSON.stringify(log.details))
      : (log.details || "");
    const dateStr = log.created_at
      ? new Date(log.created_at).toLocaleString("th-TH")
      : (log.timestamp || "เมื่อสักครู่");

    return {
      id: log.log_id || log.id,
      icon: LuShieldCheck,
      title: log.action ? `${log.action}${log.entity_type ? ` - ${log.entity_type}` : ""}` : (log.target || "กิจกรรมระบบ"),
      description: `${detailsStr} ${log.operator ? `โดย ${log.operator}` : ""}`.trim(),
      timestamp: dateStr,
    };
  });

  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E9E7]">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#26332F]">
            กิจกรรมล่าสุดในระบบ (Recent Activities)
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            เหตุการณ์สำคัญ การเปลี่ยนแปลงสิทธิ์ และการดำเนินงานล่าสุด
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E9E7] bg-white text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/20 transition shadow-2xs cursor-pointer"
          >
            <LuHistory className="h-3.5 w-3.5" />
            <span>ดูกิจกรรมทั้งหมด</span>
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="mt-3 divide-y divide-[#E5E9E7]/60">
        {recentItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6B7773]">
            ไม่มีกิจกรรมล่าสุด
          </div>
        ) : (
          recentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3.5 py-3 first:pt-2 last:pb-1 group hover:bg-[#FAFAFA] -mx-2 px-2 rounded-xl transition"
            >
              {/* Jade Icon Box */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-base text-[#004643]">
                <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-bold text-[#26332F] truncate">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[10px] font-mono text-[#6B7773]">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[#6B7773] truncate">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentActivity;
