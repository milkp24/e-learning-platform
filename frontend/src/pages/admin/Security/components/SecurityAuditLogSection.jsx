
/**
 * SecurityAuditLogSection Component
 * Table of recent authentication and access control security events.
 */
function SecurityAuditLogSection({ events }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden">
      <div className="border-b border-[#E5E9E7] px-6 py-4 bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-[#26332F]">
          บันทึกเหตุการณ์ความปลอดภัยล่าสุด (Recent Security Audit Logs)
        </h3>
        <p className="text-xs text-[#6B7773] mt-0.5">
          ติดตามการยืนยันตัวตนและการเข้าถึงที่มีสิทธิ์สูง
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#26332F]">
          <thead className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-xs font-bold uppercase tracking-wider text-[#6B7773]">
            <tr>
              <th className="px-6 py-3.5">เหตุการณ์</th>
              <th className="px-6 py-3.5">ผู้ใช้</th>
              <th className="px-6 py-3.5">IP Address</th>
              <th className="px-6 py-3.5">เวลา</th>
              <th className="px-6 py-3.5">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E9E7]">
            {events.map((evt) => (
              <tr key={evt.id} className="hover:bg-[#FAFAFA] transition">
                <td className="px-6 py-3.5 text-xs font-bold text-[#26332F]">
                  {evt.event}
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-[#6B7773]">
                  {evt.user}
                </td>
                <td className="px-6 py-3.5 font-mono text-xs text-[#6B7773]">
                  {evt.ip}
                </td>
                <td className="px-6 py-3.5 text-xs text-[#6B7773]">
                  {evt.time}
                </td>
                <td className="px-6 py-3.5">
                  <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-800">
                    Normal
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default SecurityAuditLogSection;
