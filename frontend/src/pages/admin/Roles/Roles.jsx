import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeaderButton from "../../../components/layout/PageHeader/PageHeaderButton";
import {
  LuBan,
  LuCheck,
  LuTriangleAlert as LuAlertTriangle,
  LuKey,
  LuPlus,
  LuHistory,
  LuCopy,
  LuPencil as LuEdit,
  LuTrash2,
  LuPower,
  LuSlidersHorizontal,
  LuUserCheck,
} from "react-icons/lu";
import roleService from "../../../services/roleService";
import useAuthStore from "../../../store/useAuthStore";
import usePermissionStore from "../../../features/permissions/store/usePermissionStore";
import PermissionMatrix from "../../../features/permissions/components/PermissionMatrix/PermissionMatrix";
import AuditLogModal from "../../../features/permissions/components/AuditLogModal/AuditLogModal";
import RoleEditorModal from "./components/RoleEditorModal";
import SystemRolesSection from "./components/SystemRolesSection";
import SearchUserRolesSection from "./components/SearchUserRolesSection";
import UserRolesManagerSection from "./components/UserRolesManagerSection";
import RolesInfoCard from "./components/RolesInfoCard";
import { getAllPermissionKeys } from "../../../features/permissions/data/permissionsData";
import { confirmAction, confirmDelete } from "../../../store/useConfirmStore";
import { notify } from "../../../store/useToastStore";

const TOTAL_PERMISSIONS = getAllPermissionKeys().length;

/**
 * Roles Page Component (Admin Roles & Permissions Management)
 * Overhauled to support:
 * 1. Dynamic Permission Matrix per Role
 * 2. Role CRUD (Create, Edit, Clone, Toggle Status, Delete)
 * 3. Audit Log integration
 * 4. Preserves 100% of existing backend User Role search and assignment logic
 */
function Roles() {
  const { hasRole, fetchCurrentUser } = useAuthStore();
  const {
    roles,
    updateRolePermissions,
    cloneRole,
    toggleRoleStatus,
    deleteRole,
  } = usePermissionStore();

  // Tab State: "matrix" | "user_assignment"
  const [activeTab, setActiveTab] = useState("matrix");

  // Selected role for the Dynamic Permission Matrix
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || "super_admin");
  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || roles[0];
  }, [roles, selectedRoleId]);

  // Working permissions state for the currently selected role
  const [workingPermissions, setWorkingPermissions] = useState(
    selectedRole?.permissions || []
  );
  const [matrixSaveSuccess, setMatrixSaveSuccess] = useState(false);

  // Sync working permissions when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setWorkingPermissions(selectedRole.permissions || []);
      setMatrixSaveSuccess(false);
    }
  }, [selectedRoleId, selectedRole]);

  // Modals
  const [isRoleEditorOpen, setIsRoleEditorOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // State สำหรับเก็บรายการ Role ทั้งหมดในระบบจาก Backend API (Tab 2)
  const [allRoles, setAllRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // State สำหรับการค้นหาและจัดการสิทธิ์ผู้ใช้ (Tab 2)
  const [targetUserId, setTargetUserId] = useState("");
  const [activeSearchedUserId, setActiveSearchedUserId] = useState("");
  const [userRoles, setUserRoles] = useState(null);
  const [searchingUser, setSearchingUser] = useState(false);

  // State สำหรับการกำหนด Role ใหม่ (Tab 2)
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // แจ้งผลการทำงานผ่านแถบมุมขวาบนกลางของระบบ
  const showNotice = (type, text) => notify.show(type, text);

  // GET /api/v1/roles for Tab 2
  const fetchSystemRoles = useCallback(async () => {
    try {
      const data = await roleService.getRoles();
      setAllRoles(data.roles || []);
      if (data.roles && data.roles.length > 0) {
        setSelectedRoleToAssign(data.roles[0].role_name);
      }
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "ไม่สามารถโหลดข้อมูล System Roles ได้"
      );
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemRoles();
  }, [fetchSystemRoles]);

  // Sync Dynamic Permission Matrix from Backend Database
  // FB-18: เรียกซ้ำหลังบันทึกเพื่อให้ตัวเลขจำนวนสิทธิ์ตรงกับฐานข้อมูลทันทีโดยไม่ต้องรีเฟรช
  const syncMatrixFromBackend = useCallback(async () => {
    try {
      const res = await roleService.getRolePermissionsMatrix();
      if (res?.matrix) {
        Object.entries(res.matrix).forEach(([rName, perms]) => {
          updateRolePermissions(rName, perms);
        });
      }
      return true;
    } catch {
      // fallback to store defaults
      return false;
    }
  }, [updateRolePermissions]);

  useEffect(() => {
    syncMatrixFromBackend();
  }, [syncMatrixFromBackend]);

  // Save permissions from Matrix for current role
  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;

    // Persist to backend database PostgreSQL ก่อน แล้วค่อยอัปเดตตัวเลขบนหน้าจอ (FB-18)
    try {
      await roleService.updateRolePermissions(selectedRole.id, workingPermissions);
    } catch (err) {
      // ไม่แสดงว่าบันทึกสำเร็จหาก Backend ปฏิเสธ และดึงค่าจริงกลับมาแสดง
      await syncMatrixFromBackend();
      showNotice(
        "error",
        err.response?.data?.message || "บันทึกสิทธิ์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
      return;
    }

    updateRolePermissions(selectedRole.id, workingPermissions);
    await syncMatrixFromBackend();
    if (fetchCurrentUser) {
      await fetchCurrentUser();
    }

    setMatrixSaveSuccess(true);
    showNotice(
      "success",
      `บันทึกสิทธิ์ของบทบาท '${selectedRole.name}' เรียบร้อยแล้ว (${workingPermissions.length} สิทธิ์)`
    );
    setTimeout(() => setMatrixSaveSuccess(false), 2000);
  };

  // Clone Role
  const handleCloneRole = (role) => {
    const cloned = cloneRole(role.id);
    if (cloned) {
      setSelectedRoleId(cloned.id);
      showNotice("success", `คัดลอกบทบาท '${role.name}' สำเร็จ`);
    }
  };

  // Toggle Role Status
  const handleToggleRoleStatus = (role) => {
    if (role.isSystem) {
      showNotice("error", "ไม่สามารถปิดการใช้งานบทบาทระดับระบบได้");
      return;
    }
    toggleRoleStatus(role.id);
    showNotice(
      "success",
      `เปลี่ยนสถานะบทบาท '${role.name}' เรียบร้อยแล้ว`
    );
  };

  // Delete Role
  const handleDeleteRole = async (role) => {
    if (role.isSystem) {
      showNotice("error", "ไม่สามารถลบบทบาทระดับระบบได้");
      return;
    }
    if (await confirmDelete({ itemType: "บทบาท", itemName: role.name })) {
      deleteRole(role.id);
      setSelectedRoleId(roles[0]?.id || "super_admin");
      showNotice("success", `ลบบทบาท '${role.name}' เรียบร้อยแล้ว`);
    }
  };

  // Tab 2: User Role search & assign handlers (preserved)
  const handleSearchUserRoles = async (e) => {
    if (e) e.preventDefault();
    const cleanId = targetUserId.trim();
    if (!cleanId) {
      showNotice("error", "กรุณาระบุรหัสผู้ใช้ที่ต้องการตรวจสอบ");
      return;
    }

    setSearchingUser(true);
    setUserRoles(null);
    try {
      const data = await roleService.getUserRoles(cleanId);
      setUserRoles(data.roles || []);
      setActiveSearchedUserId(cleanId);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "ไม่พบข้อมูลผู้ใช้ หรือ User ID ไม่ถูกต้อง";
      showNotice("error", msg);
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!activeSearchedUserId) {
      showNotice("error", "กรุณาค้นหาผู้ใช้ก่อนทำการกำหนดสิทธิ์");
      return;
    }
    if (!selectedRoleToAssign) {
      showNotice("error", "กรุณาเลือกบทบาทที่ต้องการกำหนด");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await roleService.assignRole(
        activeSearchedUserId,
        selectedRoleToAssign
      );
      showNotice("success", res.message || "กำหนดบทบาทสำเร็จ");
      setUserRoles(res.roles || []);
    } catch (err) {
      const msg =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการกำหนดบทบาท";
      showNotice("error", msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRole = async (roleName) => {
    if (
      !(await confirmAction({
        title: "ยืนยันการถอนบทบาท",
        message: `คุณแน่ใจหรือไม่ว่าต้องการถอนบทบาท "${roleName}" ออกจากผู้ใช้นี้?`,
        confirmText: "ถอนบทบาท",
      }))
    ) {
      return;
    }

    try {
      const res = await roleService.removeRole(activeSearchedUserId, roleName);
      showNotice("success", res.message || "ถอนบทบาทเรียบร้อยแล้ว");
      setUserRoles(res.roles || []);
    } catch (err) {
      const msg =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการถอนบทบาท";
      showNotice("error", msg);
    }
  };

  if (!hasRole("admin")) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E9E7] bg-white p-8 text-center shadow-2xs">
        <LuBan className="mx-auto h-12 w-12 text-rose-500 mb-3" aria-hidden="true" />
        <h2 className="text-xl font-bold text-[#26332F]">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="mt-2 text-sm text-[#6B7773]">
          หน้านี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#26332F]">
              สิทธิ์และบทบาท
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ABD1C6]/30 text-[#004643] border border-[#ABD1C6]">
              Role & Permission Governance
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7773] mt-0.5">
            กำหนดโครงสร้างบทบาทและจัดการ Dynamic Permission Matrix {TOTAL_PERMISSIONS} รายการอย่างอิสระ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <PageHeaderButton variant="secondary" icon={LuHistory} onClick={() => setIsAuditOpen(true)}>
            ประวัติการเปลี่ยนแปลง
          </PageHeaderButton>

          <PageHeaderButton
            icon={LuPlus}
            onClick={() => {
              setRoleToEdit(null);
              setIsRoleEditorOpen(true);
            }}
          >
            สร้างบทบาทใหม่
          </PageHeaderButton>
        </div>
      </div>


      {/* Tabs Switcher */}
      <div className="flex border-b border-[#E5E9E7] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "matrix"
              ? "border-[#004643] text-[#004643]"
              : "border-transparent text-[#6B7773] hover:text-[#26332F]"
          }`}
        >
          <LuSlidersHorizontal className="h-4 w-4" />
          <span>โครงสร้างบทบาทและ Dynamic Permission Matrix</span>
          <span className="rounded-full bg-[#ABD1C6]/30 text-[#004643] px-2 py-0.5 text-[10px]">
            {roles.length} บทบาท
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("user_assignment")}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "user_assignment"
              ? "border-[#004643] text-[#004643]"
              : "border-transparent text-[#6B7773] hover:text-[#26332F]"
          }`}
        >
          <LuUserCheck className="h-4 w-4" />
          <span>กำหนดบทบาทผู้ใช้งาน (API Direct)</span>
        </button>
      </div>

      {/* TAB 1: ROLE PERMISSION MATRIX */}
      {activeTab === "matrix" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Role List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#26332F]">
                เลือกบทบาทที่ต้องการจัดการ
              </span>
              <span className="text-xs text-[#6B7773] font-mono">
                {roles.length} บทบาท
              </span>
            </div>

            <div className="space-y-2.5">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "border-[#004643] bg-white shadow-xs ring-2 ring-[#ABD1C6]/50"
                        : "border-[#E5E9E7] bg-white hover:border-[#CBD5E1] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[#26332F]">
                            {r.name}
                          </span>
                          {r.isSystem && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              ระบบ
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              r.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {r.status === "active" ? "ใช้งานอยู่" : "ปิดการใช้งาน"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7773] mt-1 line-clamp-2">
                          {r.description || "ไม่มีคำอธิบาย"}
                        </p>
                      </div>

                      {/* Action buttons on role item */}
                      <div
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Edit Role info */}
                        <button
                          type="button"
                          onClick={() => {
                            setRoleToEdit(r);
                            setIsRoleEditorOpen(true);
                          }}
                          className="p-1 rounded-md text-[#6B7773] hover:text-[#26332F] hover:bg-slate-100"
                          title="แก้ไขรายละเอียดบทบาท"
                        >
                          <LuEdit className="h-3.5 w-3.5" />
                        </button>

                        {/* Clone role */}
                        <button
                          type="button"
                          onClick={() => handleCloneRole(r)}
                          className="p-1 rounded-md text-[#6B7773] hover:text-[#004643] hover:bg-[#ABD1C6]/20"
                          title="คัดลอกบทบาท (Clone Role)"
                        >
                          <LuCopy className="h-3.5 w-3.5" />
                        </button>

                        {/* Toggle active status */}
                        {!r.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleToggleRoleStatus(r)}
                            className="p-1 rounded-md text-[#6B7773] hover:text-amber-700 hover:bg-amber-50"
                            title={r.status === "active" ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
                          >
                            <LuPower className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Delete role */}
                        {!r.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r)}
                            className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="ลบบทบาท"
                          >
                            <LuTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#E5E9E7]/60 flex items-center justify-between text-[11px]">
                      <span className="text-[#6B7773]">สิทธิ์ที่เปิดใช้งาน:</span>
                      <span className="font-mono font-bold text-[#004643]">
                        {r.permissions?.length || 0} / {TOTAL_PERMISSIONS} สิทธิ์
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Permission Matrix for Selected Role (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedRole ? (
              <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
                {/* Header for Matrix of this role */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7]/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
                        <LuKey className="h-4 w-4" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
                        กำหนดสิทธิ์บทบาท: {selectedRole.name}
                      </h2>
                    </div>
                    <p className="text-xs text-[#6B7773] mt-1">
                      {selectedRole.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleSaveRolePermissions}
                      className="px-4 py-2 rounded-xl bg-[#004643] text-white text-xs font-bold hover:bg-[#003836] active:scale-98 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <LuCheck className="h-4 w-4 text-[#ABD1C6]" />
                      <span>
                        {matrixSaveSuccess
                          ? "บันทึกเรียบร้อย!"
                          : "บันทึกสิทธิ์บทบาท"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* The Dynamic Permission Matrix */}
                <PermissionMatrix
                  selectedPermissions={workingPermissions}
                  onChange={setWorkingPermissions}
                  readOnly={false}
                />

                {/* Bottom Save Bar */}
                <div className="pt-3 border-t border-[#E5E9E7]/60 flex items-center justify-between">
                  <span className="text-xs text-[#6B7773]">
                    ปรับเปลี่ยนแล้วอย่าลืมกดบันทึกเพื่ออัปเดตสิทธิ์ของบทบาทนี้
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveRolePermissions}
                    className="px-4 py-2 rounded-xl bg-[#ABD1C6] text-xs font-bold text-[#004643] hover:bg-[#97c4b7] active:scale-98 transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <LuCheck className="h-4 w-4" />
                    <span>บันทึกสิทธิ์บทบาท</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-12 text-center text-xs text-[#6B7773]">
                กรุณาเลือกบทบาทจากแถบด้านซ้ายเพื่อจัดการสิทธิ์
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT API USER ROLE ASSIGNMENT */}
      {activeTab === "user_assignment" && (
        <div className="space-y-6">
          {/* Section 1: System Roles Overview (from Backend API) */}
          <SystemRolesSection roles={allRoles} loading={loadingRoles} />

          {/* Section 2: User Role Lookup & Manage */}
          <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
                ค้นหาและจัดการสิทธิ์ผู้ใช้งาน
              </h2>
              <p className="text-xs text-[#6B7773] mt-0.5">
                ระบุรหัสผู้ใช้เพื่อตรวจสอบและกำหนดสิทธิ์รายบุคคลผ่าน API ฐานข้อมูล
              </p>
            </div>

            <SearchUserRolesSection
              targetUserId={targetUserId}
              onTargetUserIdChange={setTargetUserId}
              onSearch={handleSearchUserRoles}
              searching={searchingUser}
            />

            <UserRolesManagerSection
              activeSearchedUserId={activeSearchedUserId}
              userRoles={userRoles}
              allRoles={allRoles}
              onRemoveRole={handleRemoveRole}
              selectedRoleToAssign={selectedRoleToAssign}
              onSelectedRoleChange={setSelectedRoleToAssign}
              onAssignRole={handleAssignRole}
              isAssigning={isAssigning}
            />
          </div>

          <RolesInfoCard />
        </div>
      )}

      {/* Role Editor Modal */}
      <RoleEditorModal
        isOpen={isRoleEditorOpen}
        onClose={() => {
          setIsRoleEditorOpen(false);
          setRoleToEdit(null);
        }}
        roleToEdit={roleToEdit}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </div>
  );
}

export default Roles;
