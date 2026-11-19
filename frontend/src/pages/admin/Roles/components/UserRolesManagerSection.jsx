import { LuX } from "react-icons/lu";
import { getRoleBadge } from "../utils/roleBadges";

/**
 * UserRolesManagerSection Component
 * Displays user's active roles with removal action and provides form to assign a new role.
 */
function UserRolesManagerSection({
  activeSearchedUserId,
  userRoles,
  allRoles,
  onRemoveRole,
  selectedRoleToAssign,
  onSelectedRoleChange,
  onAssignRole,
  isAssigning,
}) {
  if (!userRoles) return null;

  return (
    <div className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-5 space-y-5">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7773]">
          ผลการค้นหาสำหรับผู้ใช้:
        </span>
        <div className="mt-1 font-mono text-xs sm:text-sm font-bold text-[#26332F] break-all">
          {activeSearchedUserId}
        </div>
      </div>

      {/* Current Roles */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F] mb-2">
          บทบาทปัจจุบัน (Current Roles)
        </label>
        <div className="flex flex-wrap gap-2.5">
          {userRoles.length === 0 ? (
            <span className="text-xs text-[#6B7773]">ไม่มีบทบาท</span>
          ) : (
            userRoles.map((r) => {
              const rName = r.role_name || r;
              const info = getRoleBadge(rName);
              return (
                <div
                  key={r.role_id || rName}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 shadow-2xs bg-white ${info.bg}`}
                >
                  <span className="font-mono text-xs font-bold uppercase">
                    {rName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveRole(rName)}
                    title={`ถอนสิทธิ์ ${rName}`}
                    className="ml-1 rounded-full p-0.5 text-[#6B7773] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LuX className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>
        <p className="mt-2 text-[11px] text-[#6B7773]">
          * หมายเหตุ: Backend ป้องกันไม่ให้ลบ Role สุดท้ายของผู้ใช้ (ผู้ใช้ต้องมีอย่างน้อย 1 บทบาท)
        </p>
      </div>

      {/* Assign Role Form */}
      <div className="border-t border-[#E5E9E7] pt-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F] mb-2">
          กำหนดบทบาทเพิ่มเติม (Assign New Role)
        </label>
        <form onSubmit={onAssignRole} className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRoleToAssign}
            onChange={(e) => onSelectedRoleChange(e.target.value)}
            className="rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2 text-xs font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs cursor-pointer"
          >
            {allRoles.map((r) => (
              <option key={r.role_id || r.role_name} value={r.role_name}>
                {r.role_name.toUpperCase()}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isAssigning}
            className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 disabled:opacity-50 transition cursor-pointer shadow-2xs"
          >
            {isAssigning ? "กำลังกำหนดสิทธิ์..." : "+ เพิ่มบทบาทนี้ให้ผู้ใช้"}
          </button>
        </form>
      </div>
    </div>
  );
}


export default UserRolesManagerSection;
