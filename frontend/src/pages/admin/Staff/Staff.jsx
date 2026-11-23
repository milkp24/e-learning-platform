import { useState, useMemo, useEffect, useCallback } from "react";
import { RowActionGroup, RowTextButton, RowIconButton } from "../../../components/common/RowActions";
import PageHeaderButton from "../../../components/layout/PageHeader/PageHeaderButton";
import {
  LuUserPlus,
  LuSearch,
  LuSlidersHorizontal,
  LuHistory,
  LuPencil as LuEdit,
  LuTrash2,
  LuPower,
  LuX,
  LuShield,
} from "react-icons/lu";
import usePermissionStore from "../../../features/permissions/store/usePermissionStore";
import adminService from "../../../services/adminService";
import { getAllPermissionKeys } from "../../../features/permissions/data/permissionsData";
import AddStaffModal from "./components/AddStaffModal";
import StaffPermissionModal from "./components/StaffPermissionModal";
import AuditLogModal from "../../../features/permissions/components/AuditLogModal/AuditLogModal";
import useUrlParam from "../../../hooks/useUrlParam";
import { confirmDelete } from "../../../store/useConfirmStore";
import { notify } from "../../../store/useToastStore";

export default function Staff() {
  const {
    staffList,
    roles,
    toggleStaffStatus,
    deleteStaff,
    getEffectiveStaffPermissions,
  } = usePermissionStore();

  const [realStaff, setRealStaff] = useState([]);
  // FB-18: จำนวนสิทธิ์ทั้งหมด (ใช้ค่าจาก Backend ถ้ามี ไม่ hardcode)
  const [totalPermissions, setTotalPermissions] = useState(getAllPermissionKeys().length);
  const [search, setSearch] = useUrlParam("q", "");
  const [roleFilter, setRoleFilter] = useUrlParam("role", "all");
  const [statusFilter, setStatusFilter] = useUrlParam("status", "all");

  const loadStaff = useCallback(async () => {
    try {
      const data = await adminService.getStaff();
      if (data && Array.isArray(data.staff)) {
        setRealStaff(data.staff);
      }
      if (data && Number.isInteger(data.total_permissions) && data.total_permissions > 0) {
        setTotalPermissions(data.total_permissions);
      }
    } catch (err) {
      console.error("Failed to load real staff:", err);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const activeStaffList = realStaff.length > 0 ? realStaff : staffList;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [staffForPermission, setStaffForPermission] = useState(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Notification Banner
  // แจ้งผลการทำงานผ่านแถบมุมขวาบนกลางของระบบ
  const showNotice = (text, type = "success") => {
    notify.show(type, text);
  };

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return activeStaffList.filter((staff) => {
      const matchSearch =
        !search.trim() ||
        staff.name?.toLowerCase().includes(search.toLowerCase()) ||
        staff.email?.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === "all" || staff.roleId === roleFilter;
      const matchStatus =
        statusFilter === "all" || staff.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [activeStaffList, search, roleFilter, statusFilter]);

  // Statistics
  const activeCount = activeStaffList.filter((s) => s.status === "active").length;
  const inactiveCount = activeStaffList.filter((s) => s.status === "inactive" || s.status === "suspended").length;
  const overrideCount = activeStaffList.filter(
    (s) => s.customPermissions && Object.keys(s.customPermissions).length > 0
  ).length;

  const handleToggleStatus = async (staff) => {
    if (staff.roleId === "super_admin" && (staff.id === "staff_1" || staff.isSuperAdmin)) {
      showNotice("ไม่สามารถปิดการใช้งานบัญชี Super Admin ได้", "error");
      return;
    }
    const nextStatus = staff.status === "active" ? "inactive" : "active";
    try {
      await adminService.updateUserStatus(staff.id, nextStatus);
      showNotice(
        `เปลี่ยนสถานะของ ${staff.name} เป็น ${
          nextStatus === "active" ? "ใช้งานอยู่" : "ปิดการใช้งาน"
        } เรียบร้อยแล้ว`
      );
      loadStaff();
    } catch {
      // Fallback local store if mock id
      toggleStaffStatus(staff.id);
      showNotice(
        `เปลี่ยนสถานะของ ${staff.name} เรียบร้อยแล้ว`
      );
    }
  };

  const handleDeleteStaff = async (staff) => {
    if (staff.roleId === "super_admin" || staff.isSuperAdmin) {
      showNotice("ไม่สามารถลบบัญชี Super Admin ได้", "error");
      return;
    }
    if (await confirmDelete({ itemType: "บัญชีเจ้าหน้าที่", itemName: `${staff.name}${staff.email ? ` (${staff.email})` : ""}` })) {
      try {
        await adminService.deleteUser(staff.id);
        showNotice(`ลบเจ้าหน้าที่ ${staff.name} เรียบร้อยแล้ว`);
        loadStaff();
      } catch {
        deleteStaff(staff.id);
        showNotice(`ลบเจ้าหน้าที่ ${staff.name} เรียบร้อยแล้ว`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#26332F]">
              จัดการเจ้าหน้าที่
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ABD1C6]/30 text-[#004643] border border-[#ABD1C6]">
              Staff Management
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7773] mt-0.5">
            จัดการรายชื่อผู้ดูแลระบบ กำหนดบทบาท และปรับแต่งสิทธิ์รายบุคคลแบบ Dynamic
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <PageHeaderButton variant="secondary" icon={LuHistory} onClick={() => setIsAuditOpen(true)}>
            ประวัติการเปลี่ยนแปลง
          </PageHeaderButton>

          <PageHeaderButton
            icon={LuUserPlus}
            onClick={() => {
              setStaffToEdit(null);
              setIsAddOpen(true);
            }}
          >
            เพิ่มเจ้าหน้าที่
          </PageHeaderButton>
        </div>
      </div>


      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs">
          <span className="text-xs text-[#6B7773] font-medium block">
            เจ้าหน้าที่ทั้งหมด
          </span>
          <div className="text-2xl font-black font-mono text-[#26332F] mt-1">
            {staffList.length}
          </div>
          <span className="text-[11px] text-[#6B7773]">คนในระบบ</span>
        </div>

        <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs">
          <span className="text-xs text-[#6B7773] font-medium block">
            ใช้งานอยู่ (Active)
          </span>
          <div className="text-2xl font-black font-mono text-emerald-700 mt-1">
            {activeCount}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            เข้าถึงระบบได้ปกติ
          </span>
        </div>

        <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs">
          <span className="text-xs text-[#6B7773] font-medium block">
            ปิดการใช้งาน (Inactive)
          </span>
          <div className="text-2xl font-black font-mono text-slate-500 mt-1">
            {inactiveCount}
          </div>
          <span className="text-[11px] text-[#6B7773]">ระงับการใช้งาน</span>
        </div>

        <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs">
          <span className="text-xs text-[#6B7773] font-medium block">
            สิทธิ์เฉพาะบุคคล (Overrides)
          </span>
          <div className="text-2xl font-black font-mono text-amber-700 mt-1">
            {overrideCount}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold">
            ปรับแต่งสิทธิ์พิเศษ
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <LuSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อ หรืออีเมลเจ้าหน้าที่..."
            className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-10 pr-4 py-2 text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 cursor-pointer"
          >
            <option value="all">ทุกบทบาท ({staffList.length})</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 cursor-pointer"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งานอยู่</option>
            <option value="inactive">ปิดการใช้งาน</option>
          </select>
        </div>
      </div>

      {/* Staff Table (7 Columns) */}
      <div className="rounded-2xl border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-[11px] font-bold uppercase tracking-wider text-[#6B7773]">
                <th className="py-3.5 pl-4 sm:pl-6">1. ชื่อ</th>
                <th className="py-3.5 px-3">2. อีเมล</th>
                <th className="py-3.5 px-3">3. บทบาท</th>
                <th className="py-3.5 px-3">4. จำนวนสิทธิ์</th>
                <th className="py-3.5 px-3">5. สถานะ</th>
                <th className="py-3.5 px-3">6. วันที่เพิ่ม</th>
                <th className="py-3.5 pr-4 sm:pr-6 text-right">7. การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9E7]/60">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B7773]">
                    ไม่พบเจ้าหน้าที่ที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const role =
                    roles.find((r) => r.id === staff.roleId) || {
                      name: "ไม่ระบุ",
                      badgeColor: "slate",
                    };
                  // FB-18: ใช้สิทธิ์จริงจาก Backend (รวมทุก Role) ก่อน หากไม่มีจึงใช้ข้อมูลตัวอย่างใน Store
                  const effectivePerms = Array.isArray(staff.permissions)
                    ? staff.permissions
                    : getEffectiveStaffPermissions(staff.id);
                  const hasOverrides =
                    staff.customPermissions &&
                    Object.keys(staff.customPermissions).length > 0;

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-[#FAFAFA] transition group"
                    >
                      {/* Column 1: ชื่อ */}
                      <td className="py-3.5 pl-4 sm:pl-6 font-bold text-[#26332F]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xs font-black text-[#004643]">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <span className="block">{staff.name}</span>
                            <span className="text-[10px] font-mono text-[#6B7773]">
                              {staff.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: อีเมล */}
                      <td className="py-3.5 px-3 text-[#6B7773] font-mono text-[11px]">
                        {staff.email}
                      </td>

                      {/* Column 3: บทบาท */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#ABD1C6]/20 text-[#004643] border border-[#ABD1C6]">
                          <LuShield className="h-3 w-3" />
                          {role.name}
                        </span>
                      </td>

                      {/* Column 4: จำนวนสิทธิ์ */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#26332F]">
                            {effectivePerms.length}/{totalPermissions}
                          </span>
                          {hasOverrides && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                              title="เจ้าหน้าที่ท่านนี้มีการปรับแต่งสิทธิ์เฉพาะบุคคลเพิ่มเติมจากบทบาท"
                            >
                              สิทธิ์พิเศษ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: สถานะ */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            staff.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              staff.status === "active"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {staff.status === "active"
                            ? "ใช้งานอยู่"
                            : "ปิดการใช้งาน"}
                        </span>
                      </td>

                      {/* Column 6: วันที่เพิ่ม */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-[#6B7773] whitespace-nowrap">
                        {staff.createdAt}
                      </td>

                      {/* Column 7: การจัดการ */}
                      <td className="py-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        {/* [กำหนดสิทธิ์] [แก้ไข] [เปิด-ปิด] [ลบ] รูปแบบเดียวกับทุกตารางในระบบ (RowActions) */}
                        <RowActionGroup>
                          <RowTextButton
                            icon={LuSlidersHorizontal}
                            onClick={() => setStaffForPermission(staff)}
                            title="กำหนดสิทธิ์เฉพาะบุคคล (Permission Matrix)"
                          >
                            กำหนดสิทธิ์
                          </RowTextButton>
                          <RowIconButton
                            icon={LuEdit}
                            label="แก้ไขข้อมูลเจ้าหน้าที่"
                            onClick={() => {
                              setStaffToEdit(staff);
                              setIsAddOpen(true);
                            }}
                          />
                          <RowIconButton
                            icon={LuPower}
                            tone="warning"
                            label={staff.status === "active" ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                            onClick={() => handleToggleStatus(staff)}
                          />
                          <RowIconButton
                            icon={LuTrash2}
                            tone="danger"
                            label="ลบเจ้าหน้าที่"
                            onClick={() => handleDeleteStaff(staff)}
                            disabled={staff.roleId === "super_admin" && staff.id === "staff_1"}
                            disabledReason="ลบบัญชี Super Admin หลักไม่ได้"
                          />
                        </RowActionGroup>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      <AddStaffModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setStaffToEdit(null);
        }}
        staffToEdit={staffToEdit}
      />

      {/* Staff Permission Matrix Modal */}
      <StaffPermissionModal
        isOpen={Boolean(staffForPermission)}
        onClose={() => setStaffForPermission(null)}
        staff={staffForPermission}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </div>
  );
}
