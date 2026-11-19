import { useState, useMemo, useEffect } from "react";
import {
  LuX,
  LuHistory,
  LuSearch,
  LuUserCheck,
} from "react-icons/lu";
import usePermissionStore from "../../store/usePermissionStore";
import adminService from "../../../../services/adminService";

export default function AuditLogModal({ isOpen, onClose }) {
  const { auditLogs } = usePermissionStore();
  const [realLogs, setRealLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const data = await adminService.getAuditLogs({ per_page: 50 });
        if (isMounted && data && Array.isArray(data.logs)) {
          setRealLogs(data.logs);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      }
    };
    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const activeAuditLogs = useMemo(() => {
    if (realLogs.length > 0) {
      return realLogs.map((log) => {
        const detailsStr = typeof log.details === "object"
          ? (log.details?.actor ? `${log.details.actor}: ${log.details.action || ""}` : JSON.stringify(log.details))
          : (log.details || "-");
        return {
          id: log.log_id || log.id,
          timestamp: log.created_at ? new Date(log.created_at).toLocaleString("th-TH") : (log.timestamp || "-"),
          operator: log.operator || log.user_email || "System",
          action: log.action || "กิจกรรม",
          target: log.entity_type ? `${log.entity_type} (${log.entity_id || ""})` : (log.target || "-"),
          details: detailsStr,
        };
      });
    }
    return auditLogs;
  }, [realLogs, auditLogs]);

  const actionTypes = useMemo(() => {
    const set = new Set();
    activeAuditLogs.forEach((log) => set.add(log.action));
    return ["all", ...Array.from(set)];
  }, [activeAuditLogs]);

  const filteredLogs = useMemo(() => {
    return activeAuditLogs.filter((log) => {
      const matchAction =
        filterAction === "all" || log.action === filterAction;
      const matchSearch =
        !search.trim() ||
        log.target.toLowerCase().includes(search.toLowerCase()) ||
        log.operator.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.timestamp.includes(search);
      return matchAction && matchSearch;
    });
  }, [activeAuditLogs, filterAction, search]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuHistory className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="audit-modal-title"
                className="text-base sm:text-lg font-bold text-[#26332F]"
              >
                บันทึกประวัติการเปลี่ยนแปลงระบบ (Audit Log)
              </h2>
              <p className="text-xs text-[#6B7773]">
                ประวัติการแก้ไขสิทธิ์ เปลี่ยนแปลงบทบาท และการจัดการเจ้าหน้าที่
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#6B7773] hover:text-[#26332F] hover:bg-slate-100 transition cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <LuX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-[#E5E9E7] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <div className="relative flex-1">
            <LuSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตามผู้ดำเนินการ, เจ้าหน้าที่, รายละเอียด..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs text-[#6B7773] shrink-0 font-medium">ประเภท:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 cursor-pointer"
            >
              <option value="all">ทั้งหมด ({auditLogs.length})</option>
              {actionTypes
                .filter((t) => t !== "all")
                .map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Table / List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-[#E5E9E7]">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#6B7773]">
              ไม่พบประวัติการเปลี่ยนแปลงที่ตรงกับเงื่อนไข
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E9E7] text-[11px] font-bold uppercase tracking-wider text-[#6B7773]">
                    <th className="pb-3 pl-2">วันและเวลา</th>
                    <th className="pb-3 px-3">ผู้ดำเนินการ</th>
                    <th className="pb-3 px-3">การกระทำ</th>
                    <th className="pb-3 px-3">เป้าหมาย</th>
                    <th className="pb-3 pr-2">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9E7]/60">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FAFAFA] transition"
                    >
                      <td className="py-3 pl-2 font-mono text-[11px] text-[#6B7773] whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#26332F] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-[#ABD1C6]/20 text-[#004643] px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          <LuUserCheck className="h-3 w-3" aria-hidden="true" />
                          {log.operator}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-[#26332F] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#26332F]">
                        {log.target}
                      </td>
                      <td className="py-3 pr-2 text-[#6B7773] max-w-xs break-words">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E9E7] bg-[#FAFAFA] flex items-center justify-between text-xs text-[#6B7773]">
          <span>รวมทั้งสิ้น {filteredLogs.length} รายการ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#26332F] text-white font-semibold hover:bg-black transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
