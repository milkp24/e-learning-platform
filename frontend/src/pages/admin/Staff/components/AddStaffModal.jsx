import { useState, useEffect } from "react";
import { LuX, LuUserPlus, LuUserCheck, LuMail, LuShield, LuCheck } from "react-icons/lu";
import usePermissionStore from "../../../../features/permissions/store/usePermissionStore";

export default function AddStaffModal({ isOpen, onClose, staffToEdit = null }) {
  const { roles, addStaff, updateStaff } = usePermissionStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(roles[1]?.id || "admin");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState("");

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name || "");
      setEmail(staffToEdit.email || "");
      setRoleId(staffToEdit.roleId || roles[0]?.id || "");
      setStatus(staffToEdit.status || "active");
    } else {
      setName("");
      setEmail("");
      setRoleId(roles[1]?.id || roles[0]?.id || "admin");
      setStatus("active");
    }
    setError("");
  }, [staffToEdit, isOpen, roles]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("กรุณากรอกชื่อ-นามสกุลของเจ้าหน้าที่");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("กรุณาระบุอีเมลที่ถูกต้อง");
      return;
    }

    if (staffToEdit) {
      updateStaff(staffToEdit.id, {
        name: cleanName,
        email: cleanEmail,
        roleId,
        status,
      });
    } else {
      addStaff({
        name: cleanName,
        email: cleanEmail,
        roleId,
        status,
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-staff-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
              {staffToEdit ? (
                <LuUserCheck className="h-5 w-5" aria-hidden="true" />
              ) : (
                <LuUserPlus className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2
                id="add-staff-modal-title"
                className="text-base sm:text-lg font-bold text-[#26332F]"
              >
                {staffToEdit ? "แก้ไขข้อมูลเจ้าหน้าที่" : "เพิ่มเจ้าหน้าที่ใหม่"}
              </h2>
              <p className="text-xs text-[#6B7773]">
                {staffToEdit
                  ? "ปรับปรุงข้อมูลส่วนบุคคลและบทบาท"
                  : "สร้างบัญชีเจ้าหน้าที่และกำหนดบทบาทเริ่มต้น"}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="staff-name"
              className="text-xs font-bold text-[#26332F] flex items-center gap-1"
            >
              <span>ชื่อ-นามสกุล</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น นายธนภัทร สุขสมบูรณ์"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="staff-email"
              className="text-xs font-bold text-[#26332F] flex items-center gap-1"
            >
              <LuMail className="h-3.5 w-3.5 text-[#6B7773]" />
              <span>อีเมลเจ้าหน้าที่</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              id="staff-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="เช่น staff@elearning.ac.th"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="staff-role"
                className="text-xs font-bold text-[#26332F] flex items-center gap-1"
              >
                <LuShield className="h-3.5 w-3.5 text-[#6B7773]" />
                <span>บทบาทหน้าที่ (Role)</span>
              </label>
              <select
                id="staff-role"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 cursor-pointer transition"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.permissions?.length || 0} สิทธิ์)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="staff-status"
                className="text-xs font-bold text-[#26332F]"
              >
                สถานะการใช้งาน
              </label>
              <select
                id="staff-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 cursor-pointer transition"
              >
                <option value="active">ใช้งานอยู่ (Active)</option>
                <option value="inactive">ปิดการใช้งาน (Inactive)</option>
              </select>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-[#E5E9E7] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E9E7] bg-white text-xs font-semibold text-[#26332F] hover:bg-[#FAFAFA] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#ABD1C6] text-xs font-bold text-[#004643] hover:bg-[#97c4b7] active:scale-98 transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <LuCheck className="h-4 w-4" />
              <span>{staffToEdit ? "บันทึกการแก้ไข" : "เพิ่มเจ้าหน้าที่"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
