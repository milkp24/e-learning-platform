import { useState, useMemo, useEffect } from "react";
import {
  LuX,
  LuSlidersHorizontal,
  LuRotateCcw,
  LuCheck,
  LuInfo,
} from "react-icons/lu";
import usePermissionStore from "../../../../features/permissions/store/usePermissionStore";
import PermissionMatrix from "../../../../features/permissions/components/PermissionMatrix/PermissionMatrix";

/**
 * StaffPermissionModal
 * Allows Super Admin to configure granular permissions for a specific staff member.
 * Supports individual user overrides on top of their base role permissions.
 */
export default function StaffPermissionModal({ staff, isOpen, onClose }) {
  const { roles, updateStaffPermissions } = usePermissionStore();

  const currentRole = useMemo(() => {
    if (!staff) return null;
    return roles.find((r) => r.id === staff.roleId) || null;
  }, [staff, roles]);

  const baseRolePermissions = useMemo(() => {
    return currentRole?.permissions || [];
  }, [currentRole]);

  // Compute initial effective permissions for this staff
  const initialEffective = useMemo(() => {
    if (!staff) return [];
    const baseSet = new Set(baseRolePermissions);
    const overrides = staff.customPermissions || {};
    Object.entries(overrides).forEach(([k, granted]) => {
      if (granted) {
        baseSet.add(k);
      } else {
        baseSet.delete(k);
      }
    });
    return Array.from(baseSet);
  }, [staff, baseRolePermissions]);

  const [selectedPermissions, setSelectedPermissions] = useState(initialEffective);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync when staff changes
  useEffect(() => {
    setSelectedPermissions(initialEffective);
    setSaveSuccess(false);
  }, [initialEffective]);

  if (!isOpen || !staff) return null;

  // Handle saving overrides
  const handleSave = () => {
    const baseSet = new Set(baseRolePermissions);
    const currentSet = new Set(selectedPermissions);

    // Calculate overrides relative to role
    const newOverrides = {};

    // 1. Permissions user has that role DOES NOT have -> explicitly true
    currentSet.forEach((permKey) => {
      if (!baseSet.has(permKey)) {
        newOverrides[permKey] = true;
      }
    });

    // 2. Permissions role has that user DOES NOT have -> explicitly false
    baseSet.forEach((permKey) => {
      if (!currentSet.has(permKey)) {
        newOverrides[permKey] = false;
      }
    });

    updateStaffPermissions(staff.id, newOverrides);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  // Reset back to exact role defaults
  const handleResetToRole = () => {
    setSelectedPermissions(baseRolePermissions);
  };

  // Count overrides
  const baseSet = new Set(baseRolePermissions);
  const currentSet = new Set(selectedPermissions);
  let addedCount = 0;
  let revokedCount = 0;
  currentSet.forEach((k) => {
    if (!baseSet.has(k)) addedCount++;
  });
  baseSet.forEach((k) => {
    if (!currentSet.has(k)) revokedCount++;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-perm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuSlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="staff-perm-modal-title"
                  className="text-base sm:text-lg font-bold text-[#26332F]"
                >
                  กำหนดสิทธิ์เฉพาะบุคคล: {staff.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white border border-[#E5E9E7] font-semibold text-[#004643]">
                  บทบาท: {currentRole?.name || "ไม่ระบุ"}
                </span>
              </div>
              <p className="text-xs text-[#6B7773] mt-0.5">
                อีเมล {staff.email} • ปรับเปลี่ยนสิทธิ์เพิ่มเติมหรือระงับสิทธิ์เฉพาะบุคคลได้อิสระ
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

        {/* Override status info banner */}
        <div className="px-6 py-2.5 bg-sky-50 border-b border-sky-100 flex flex-wrap items-center justify-between text-xs text-sky-900 gap-2">
          <div className="flex items-center gap-2">
            <LuInfo className="h-4 w-4 text-sky-600 shrink-0" />
            <span>
              สิทธิ์เริ่มต้นจากบทบาท: <strong>{baseRolePermissions.length}</strong> สิทธิ์ | สิทธิ์พิเศษเพิ่มเติม: <strong>+{addedCount}</strong> | ระงับเฉพาะบุคคล: <strong>-{revokedCount}</strong>
            </span>
          </div>
          {(addedCount > 0 || revokedCount > 0) && (
            <button
              type="button"
              onClick={handleResetToRole}
              className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline cursor-pointer"
            >
              <LuRotateCcw className="h-3 w-3" />
              รีเซ็ตกลับเป็นค่ามาตรฐานของบทบาท
            </button>
          )}
        </div>

        {/* Modal Body: Permission Matrix */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAFAFA]/40 space-y-4">
          <PermissionMatrix
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
            rolePermissions={baseRolePermissions}
            isUserOverrideMode={true}
            onResetToRole={handleResetToRole}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#E5E9E7] bg-[#FAFAFA] flex items-center justify-between gap-3">
          <div className="text-xs text-[#6B7773]">
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <LuCheck className="h-4 w-4" /> บันทึกการกำหนดสิทธิ์เรียบร้อยแล้ว
              </span>
            ) : (
              <span>
                สิทธิ์ที่ได้ผลลัพธ์จริง:{" "}
                <strong className="text-[#004643] font-bold">
                  {selectedPermissions.length} / 37 สิทธิ์
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E9E7] bg-white text-xs font-semibold text-[#26332F] hover:bg-[#FAFAFA] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#ABD1C6] text-xs font-bold text-[#004643] hover:bg-[#97c4b7] active:scale-98 transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <LuCheck className="h-4 w-4" />
              <span>บันทึกการกำหนดสิทธิ์</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
