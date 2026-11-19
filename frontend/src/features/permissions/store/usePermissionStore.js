import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  INITIAL_ROLES,
  INITIAL_STAFF,
  INITIAL_AUDIT_LOGS,
} from "../data/permissionsData";

// Helper จัดรูปแบบวันและเวลาไทยสำหรับ Audit Log
export const getThaiFormattedDateTime = () => {
  const now = new Date();
  const yearTh = now.getFullYear() + 543;
  const pad = (n) => String(n).padStart(2, "0");
  const d = pad(now.getDate());
  const m = pad(now.getMonth() + 1);
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${d}/${m}/${yearTh} ${time}`;
};

export const usePermissionStore = create(
  persist(
    (set, get) => ({
      roles: INITIAL_ROLES,
      staffList: INITIAL_STAFF,
      auditLogs: INITIAL_AUDIT_LOGS,
      notificationCount: 3,
      systemStatus: {
        website: "operational",
        api: "operational",
        database: "operational",
        auth: "operational",
        lastChecked: "เพิ่งอัปเดต",
      },

      // --- AUDIT LOG ACTION ---
      addAuditLog: ({ operator = "Super Admin", action, target, details }) => {
        const newLog = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          operator,
          action,
          target,
          details,
          timestamp: getThaiFormattedDateTime(),
        };
        set((state) => ({
          auditLogs: [newLog, ...state.auditLogs],
        }));
      },

      // --- ROLE ACTIONS ---
      addRole: (roleData) => {
        const newRoleId = `role_${Date.now()}`;
        const newRole = {
          id: newRoleId,
          name: roleData.name || "บทบาทใหม่",
          description: roleData.description || "",
          isSystem: false,
          status: "active",
          badgeColor: roleData.badgeColor || "teal",
          permissions: roleData.permissions || [],
        };
        set((state) => ({
          roles: [...state.roles, newRole],
        }));
        get().addAuditLog({
          action: "สร้างบทบาทใหม่",
          target: newRole.name,
          details: `สร้างบทบาทพร้อมกำหนดสิทธิ์เริ่มต้น ${newRole.permissions.length} สิทธิ์`,
        });
        return newRole;
      },

      updateRole: (roleId, updatedFields) => {
        const current = get().roles.find((r) => r.id === roleId);
        if (!current) return;

        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === roleId ? { ...r, ...updatedFields } : r
          ),
        }));

        get().addAuditLog({
          action: "แก้ไขบทบาท",
          target: current.name,
          details: `อัปเดตข้อมูลรายละเอียดหรือสิทธิ์ของบทบาท`,
        });
      },

      updateRolePermissions: (roleId, permissions) => {
        const current = get().roles.find((r) => r.id === roleId);
        if (!current) return;

        const oldCount = current.permissions?.length || 0;
        const newCount = permissions.length;

        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === roleId ? { ...r, permissions } : r
          ),
        }));

        get().addAuditLog({
          action: "แก้ไขสิทธิ์บทบาท",
          target: current.name,
          details: `ปรับสิทธิ์จาก ${oldCount} เป็น ${newCount} สิทธิ์`,
        });
      },

      cloneRole: (roleId) => {
        const sourceRole = get().roles.find((r) => r.id === roleId);
        if (!sourceRole) return;

        const clonedId = `role_${Date.now()}`;
        const clonedRole = {
          ...sourceRole,
          id: clonedId,
          name: `${sourceRole.name} (คัดลอก)`,
          isSystem: false,
          status: "active",
          permissions: [...(sourceRole.permissions || [])],
        };

        set((state) => ({
          roles: [...state.roles, clonedRole],
        }));

        get().addAuditLog({
          action: "คัดลอกบทบาท",
          target: clonedRole.name,
          details: `คัดลอกแม่แบบจากบทบาท '${sourceRole.name}' (${clonedRole.permissions.length} สิทธิ์)`,
        });
        return clonedRole;
      },

      toggleRoleStatus: (roleId) => {
        const current = get().roles.find((r) => r.id === roleId);
        if (!current || current.isSystem) return;

        const nextStatus = current.status === "active" ? "inactive" : "active";
        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === roleId ? { ...r, status: nextStatus } : r
          ),
        }));

        get().addAuditLog({
          action: nextStatus === "active" ? "เปิดการใช้งานบทบาท" : "ระงับการใช้งานบทบาท",
          target: current.name,
          details: `เปลี่ยนสถานะเป็น ${nextStatus === "active" ? "ใช้งานอยู่" : "ปิดการใช้งาน"}`,
        });
      },

      deleteRole: (roleId) => {
        const current = get().roles.find((r) => r.id === roleId);
        if (!current || current.isSystem) return;

        set((state) => ({
          roles: state.roles.filter((r) => r.id !== roleId),
        }));

        get().addAuditLog({
          action: "ลบบทบาท",
          target: current.name,
          details: `ลบบทบาทออกจากระบบถาวร`,
        });
      },

      // --- STAFF ACTIONS ---
      addStaff: (staffData) => {
        const newStaffId = `staff_${Date.now()}`;
        const role = get().roles.find((r) => r.id === staffData.roleId) || get().roles[1];
        const newStaff = {
          id: newStaffId,
          name: staffData.name,
          email: staffData.email,
          roleId: role.id,
          status: staffData.status || "active",
          createdAt: new Date().toISOString().split("T")[0],
          customPermissions: staffData.customPermissions || {},
        };

        set((state) => ({
          staffList: [newStaff, ...state.staffList],
        }));

        get().addAuditLog({
          action: "เพิ่มเจ้าหน้าที่",
          target: `${newStaff.name} (${role.name})`,
          details: `สร้างบัญชีเจ้าหน้าที่อีเมล ${newStaff.email}`,
        });
        return newStaff;
      },

      updateStaff: (staffId, updatedFields) => {
        const current = get().staffList.find((s) => s.id === staffId);
        if (!current) return;

        set((state) => ({
          staffList: state.staffList.map((s) =>
            s.id === staffId ? { ...s, ...updatedFields } : s
          ),
        }));

        get().addAuditLog({
          action: "แก้ไขข้อมูลเจ้าหน้าที่",
          target: current.name,
          details: `แก้ไขข้อมูลโปรไฟล์หรือรายละเอียดบัญชี`,
        });
      },

      changeStaffRole: (staffId, newRoleId) => {
        const current = get().staffList.find((s) => s.id === staffId);
        const nextRole = get().roles.find((r) => r.id === newRoleId);
        if (!current || !nextRole) return;

        const oldRole = get().roles.find((r) => r.id === current.roleId);

        set((state) => ({
          staffList: state.staffList.map((s) =>
            s.id === staffId ? { ...s, roleId: newRoleId, customPermissions: {} } : s
          ),
        }));

        get().addAuditLog({
          action: "เปลี่ยนบทบาทเจ้าหน้าที่",
          target: current.name,
          details: `เปลี่ยนบทบาทจาก '${oldRole?.name || "ไม่ระบุ"}' เป็น '${nextRole.name}' และรีเซ็ตสิทธิ์พิเศษเฉพาะบุคคล`,
        });
      },

      toggleStaffStatus: (staffId) => {
        const current = get().staffList.find((s) => s.id === staffId);
        if (!current) return;

        // ไม่ให้ปิดการใช้งานตัวเองหรือ superadmin คนแรก
        if (current.roleId === "super_admin" && current.id === "staff_1") return;

        const nextStatus = current.status === "active" ? "inactive" : "active";
        set((state) => ({
          staffList: state.staffList.map((s) =>
            s.id === staffId ? { ...s, status: nextStatus } : s
          ),
        }));

        get().addAuditLog({
          action: nextStatus === "active" ? "เปิดการใช้งานเจ้าหน้าที่" : "ระงับการใช้งานเจ้าหน้าที่",
          target: current.name,
          details: `เปลี่ยนสถานะเป็น ${nextStatus === "active" ? "ใช้งานอยู่" : "ปิดการใช้งาน"}`,
        });
      },

      updateStaffPermissions: (staffId, customPermissions) => {
        const current = get().staffList.find((s) => s.id === staffId);
        if (!current) return;

        set((state) => ({
          staffList: state.staffList.map((s) =>
            s.id === staffId ? { ...s, customPermissions } : s
          ),
        }));

        const overrideCount = Object.keys(customPermissions).length;
        get().addAuditLog({
          action: "แก้ไขสิทธิ์เฉพาะบุคคล",
          target: current.name,
          details: `กำหนดสิทธิ์เฉพาะบุคคล (${overrideCount} สิทธิ์ที่ปรับเปลี่ยนจากบทบาท)`,
        });
      },

      deleteStaff: (staffId) => {
        const current = get().staffList.find((s) => s.id === staffId);
        if (!current) return;
        if (current.roleId === "super_admin" && current.id === "staff_1") return;

        set((state) => ({
          staffList: state.staffList.filter((s) => s.id !== staffId),
        }));

        get().addAuditLog({
          action: "ลบเจ้าหน้าที่",
          target: current.name,
          details: `ลบเจ้าหน้าที่ออกจากระบบถาวร`,
        });
      },

      // --- HELPER QUERIES ---
      getEffectiveStaffPermissions: (staffId) => {
        const staff = get().staffList.find((s) => s.id === staffId);
        if (!staff) return [];

        const role = get().roles.find((r) => r.id === staff.roleId);
        const rolePermissions = role?.permissions || [];
        const customOverrides = staff.customPermissions || {};

        // เริ่มต้นด้วยสิทธิ์จากบทบาท
        const effectiveSet = new Set(rolePermissions);

        // นำ customOverrides มาทับ
        Object.entries(customOverrides).forEach(([permKey, isGranted]) => {
          if (isGranted) {
            effectiveSet.add(permKey);
          } else {
            effectiveSet.delete(permKey);
          }
        });

        return Array.from(effectiveSet);
      },

      resetToDefaults: () => {
        set({
          roles: INITIAL_ROLES,
          staffList: INITIAL_STAFF,
          auditLogs: INITIAL_AUDIT_LOGS,
        });
      },
    }),
    {
      name: "elearning_admin_permissions_v1",
    }
  )
);
export default usePermissionStore;
