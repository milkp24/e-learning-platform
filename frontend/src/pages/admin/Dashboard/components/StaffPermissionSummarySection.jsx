import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LuShieldCheck,
  LuKey,
  LuSlidersHorizontal,
} from "react-icons/lu";
import usePermissionStore from "../../../../features/permissions/store/usePermissionStore";
import adminService from "../../../../services/adminService";

export default function StaffPermissionSummarySection() {
  const { roles: storeRoles, staffList: storeStaffList } = usePermissionStore();
  const [realStaff, setRealStaff] = useState(null);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStaff = async () => {
      try {
        const res = await adminService.getStaff();
        if (isMounted && res && Array.isArray(res.staff)) {
          setRealStaff(res.staff);
        }
      } catch (err) {
        console.error("Failed to load staff list from backend:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchStaff();
    return () => {
      isMounted = false;
    };
  }, []);

  const staffList = realStaff || storeStaffList;
  const activeStaff = staffList.filter((s) => s.status === "active").length;
  const staffWithOverrides = staffList.filter(
    (s) => s.customPermissions && Object.keys(s.customPermissions).length > 0
  ).length;

  // Real roles definition or fallback to store roles
const roles = storeRoles;

const staffRoleDefinitions = [
  { id: "super_admin", name: "Super Admin" },
  { id: "admin", name: "Admin" },
  { id: "instructor", name: "Instructor" },
];

  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header with Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
              ภาพรวมสิทธิ์และเจ้าหน้าที่ (Staff & Role Governance)
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ABD1C6]/30 text-[#004643]">
              Dynamic Matrix
            </span>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5">
            ควบคุมการเข้าถึงระบบ จัดการบทบาท และกำหนดสิทธิ์เจ้าหน้าที่จากฐานข้อมูลจริง
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ABD1C6] text-xs font-bold text-[#004643] hover:bg-[#97c4b7] active:scale-98 transition shadow-xs cursor-pointer"
          >
            <LuSlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            <span>จัดการสิทธิ์</span>
          </Link>
          <Link
            to="/admin/roles"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E9E7] bg-white text-xs font-semibold text-[#26332F] hover:bg-[#FAFAFA] active:scale-98 transition shadow-2xs cursor-pointer"
          >
            <LuKey className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
            <span>จัดการบทบาท</span>
          </Link>
        </div>
      </div>

      {/* 3 Quick Summary Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ABD1C6]/20 text-[#004643]">
            <LuShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs text-[#6B7773] font-medium block">
              เจ้าหน้าที่ทั้งหมด (PostgreSQL)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-[#26332F]">
                {staffList.length}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                (ใช้งานอยู่ {activeStaff})
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
            <LuKey className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs text-[#6B7773] font-medium block">
              บทบาทที่กำหนดในระบบ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-[#26332F]">
                {roles.length}
              </span>
              <span className="text-xs text-[#6B7773]">บทบาทมาตรฐาน</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ABD1C6]/20 text-[#004643]">
            <LuSlidersHorizontal className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs text-[#6B7773] font-medium block">
              สิทธิ์พิเศษเฉพาะบุคคล
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-[#26332F]">
                {staffWithOverrides}
              </span>
              <span className="text-xs text-[#6B7773] font-semibold">
                (Custom Overrides)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Roles Badge Distribution */}
      <div className="pt-2">
        <span className="text-xs font-bold text-[#26332F] block mb-2.5">
          การกระจายตัวของเจ้าหน้าที่ตามบทบาท:
        </span>
        <div className="flex flex-wrap gap-2">
          {staffRoleDefinitions.map((r) => {
            const count = staffList.filter((s) => {
              if (s.roleId === r.id) return true;
              if (Array.isArray(s.roles) && s.roles.includes(r.id)) return true;
              return false;
            }).length;
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-xl border border-[#E5E9E7] bg-white px-3 py-1.5 shadow-2xs text-xs"
              >
                <span className="font-semibold text-[#26332F]">{r.name}</span>
                <span className="rounded-md bg-[#ABD1C6]/30 px-1.5 py-0.5 font-mono font-bold text-[11px] text-[#004643]">
                  {count} คน
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
