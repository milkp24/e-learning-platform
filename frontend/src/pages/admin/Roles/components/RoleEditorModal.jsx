import { useState, useEffect } from "react";
import { LuX, LuKey, LuCheck } from "react-icons/lu";
import usePermissionStore from "../../../../features/permissions/store/usePermissionStore";

export default function RoleEditorModal({ isOpen, onClose, roleToEdit = null }) {
  const { addRole, updateRole } = usePermissionStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name || "");
      setDescription(roleToEdit.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError("");
  }, [roleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("กรุณากรอกชื่อบทบาท");
      return;
    }

    if (roleToEdit) {
      updateRole(roleToEdit.id, {
        name: cleanName,
        description: description.trim(),
      });
    } else {
      addRole({
        name: cleanName,
        description: description.trim(),
        permissions: [],
      });
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-editor-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9E7] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuKey className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="role-editor-modal-title"
                className="text-base sm:text-lg font-bold text-[#26332F]"
              >
                {roleToEdit ? "แก้ไขรายละเอียดบทบาท" : "สร้างบทบาทใหม่"}
              </h2>
              <p className="text-xs text-[#6B7773]">
                {roleToEdit
                  ? "ปรับปรุงชื่อและขอบเขตหน้าที่ของบทบาท"
                  : "เพิ่มบทบาทใหม่และกำหนดขอบเขตหน้าที่"}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="role-name"
              className="text-xs font-bold text-[#26332F] flex items-center gap-1"
            >
              <span>ชื่อบทบาท</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เจ้าหน้าที่ฝ่ายตรวจการบ้าน"
              disabled={roleToEdit?.isSystem}
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {roleToEdit?.isSystem && (
              <span className="text-[11px] text-[#6B7773]">
                * บทบาทระดับระบบ (System Role) ไม่สามารถเปลี่ยนชื่อหลักได้
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="role-desc"
              className="text-xs font-bold text-[#26332F]"
            >
              คำอธิบายขอบเขตหน้าที่
            </label>
            <textarea
              id="role-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุวัตถุประสงค์และหน้าที่ความรับผิดชอบของบทบาทนี้..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ABD1C6]/30 transition"
            />
          </div>

          {/* Footer */}
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
              <span>{roleToEdit ? "บันทึกการแก้ไข" : "สร้างบทบาท"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
