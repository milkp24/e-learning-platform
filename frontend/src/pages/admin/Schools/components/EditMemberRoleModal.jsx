import { useState, useEffect } from "react";
import { LuX, LuShieldCheck, LuTriangleAlert as LuAlertTriangle, LuCheck } from "react-icons/lu";

/**
 * EditMemberRoleModal Component
 * Update a user's school-specific role without touching their global system role
 */
function EditMemberRoleModal({ isOpen, onClose, member, schoolName, onSubmit }) {
  const [selectedRole, setSelectedRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (member) {
      setSelectedRole(member.school_role || "member");
      setError("");
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      setError("กรุณาเลือกบทบาทในโรงเรียน");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onSubmit(member, selectedRole);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-member-role-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 id="edit-member-role-title" className="text-base font-black text-[#26332F]">
                เปลี่ยนบทบาทในโรงเรียน
              </h2>
              <p className="text-xs text-[#6B7773] truncate max-w-64">
                สังกัด: {schoolName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <LuAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Card */}
          <div className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 text-xs space-y-1">
            <div className="font-bold text-[#26332F]">{member.display_name}</div>
            <div className="font-mono text-[#6B7773] text-[11px]">{member.email}</div>
            <div className="pt-1 text-[#6B7773] text-[11px]">
              บทบาทปัจจุบัน:{" "}
              <span className="font-bold text-[#004643] uppercase">
                {member.school_role}
              </span>
            </div>
          </div>

          {/* Role Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#26332F]">
              เลือกบทบาทใหม่ในโรงเรียน
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "student", label: "นักเรียน (Student)" },
                { id: "teacher", label: "ครู/อาจารย์ (Teacher)" },
                { id: "admin", label: "ผู้ดูแล (Admin)" },
                { id: "member", label: "สมาชิกทั่วไป (Member)" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`rounded-xl border p-2.5 text-center text-xs font-bold transition cursor-pointer ${
                    selectedRole === r.id
                      ? "border-[#004643] bg-[#004643] text-[#ABD1C6] shadow-xs"
                      : "border-[#E5E9E7] bg-white text-[#26332F] hover:bg-gray-50"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#ABD1C6] bg-emerald-50/50 p-3 text-[11px] text-[#26332F] leading-relaxed">
            <span className="font-bold text-[#004643] block mb-0.5">ข้อกำหนดความปลอดภัย:</span>
            การเปลี่ยนแปลงบทบาทนี้มีผลเฉพาะสิทธิ์ภายในโรงเรียนนี้เท่านั้น และไม่กระทบสิทธิ์ผู้ใช้ระดับระบบ (Global System Role)
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <LuCheck className="h-4 w-4" />
                  <span>บันทึกบทบาท</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMemberRoleModal;
