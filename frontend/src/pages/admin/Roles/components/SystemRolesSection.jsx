import { getRoleBadge } from "../utils/roleBadges";

/**
 * SystemRolesSection Component
 * Displays system-wide roles fetched from GET /api/v1/roles
 */
function SystemRolesSection({ roles, loading }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E9E7] pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
            บทบาททั้งหมดในระบบ
          </h2>
          <p className="text-xs text-[#6B7773] mt-0.5">
            โครงสร้างสิทธิ์และระดับการเข้าถึงข้อมูลของผู้ใช้งานในระบบ
          </p>
        </div>
        <span className="self-start sm:self-auto rounded-full bg-[#FAFAFA] border border-[#E5E9E7] px-3 py-1 font-mono text-xs font-bold text-[#26332F]">
          {roles.length} บทบาท
        </span>
      </div>

      {loading ? (
        <div className="py-10 text-center space-y-2">
          <div className="inline-flex h-7 w-7 animate-spin rounded-full border-3 border-[#E5E9E7] border-t-[#ABD1C6]" />
          <p className="text-xs text-[#6B7773]">กำลังโหลดข้อมูลบทบาท...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((r) => {
              const info = getRoleBadge(r.role_name);
              const RoleIcon = info.icon;
              return (
                <div
                  key={r.role_id || r.role_name}
                  className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-4 transition hover:bg-white hover:shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    {RoleIcon && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ABD1C6]/30 text-[#004643]">
                        <RoleIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                    <span
                      className={`rounded-lg px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider ${info.bg}`}
                    >
                      {r.role_name}
                    </span>
                  </div>
                <p className="mt-3 text-xs leading-relaxed text-[#6B7773]">
                  {info.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default SystemRolesSection;
