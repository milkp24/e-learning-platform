import { useState, useEffect } from "react";
import { LuX, LuUserPlus, LuSearch, LuTriangleAlert as LuAlertTriangle, LuCheck, LuUsers } from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * AddMemberModal Component
 * Search existing users in platform and assign a school role
 */
function AddMemberModal({ isOpen, onClose, schoolId, schoolName, onSubmit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("student");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load available users when modal opens or search term changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchUsers = async () => {
      try {
        setSearching(true);
        const data = await adminService.getAvailableUsersForSchool({
          school_id: schoolId,
          search: searchTerm.trim() || undefined,
        });
        if (isMounted) {
          setUsers(data.users || []);
        }
      } catch (err) {
        if (isMounted) {
          setError("ไม่สามารถดึงรายชื่อผู้ใช้ได้");
        }
      } finally {
        if (isMounted) setSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchUsers, 300);
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [isOpen, schoolId, searchTerm]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError("กรุณาเลือกผู้ใช้ที่ต้องการเพิ่มเข้าโรงเรียน");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onSubmit({
        user_id: selectedUser.user_id,
        role: selectedRole,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการเพิ่มสมาชิก");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuUserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 id="add-member-title" className="text-base font-black text-[#26332F]">
                เพิ่มสมาชิกเข้าโรงเรียน
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <LuAlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-[#26332F] mb-1.5">
              ค้นหาผู้ใช้จากระบบ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7773]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาด้วยชื่อ, นามสกุล หรืออีเมล..."
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] pl-10 pr-3.5 py-2.5 text-xs text-[#26332F] placeholder-[#6B7773] focus:border-[#004643] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* User Selection List */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#6B7773] uppercase tracking-wider block">
              ผลการค้นหา {users.length > 0 && `(${users.length} รายการ)`}
            </span>
            <div className="max-h-44 overflow-y-auto rounded-2xl border border-[#E5E9E7] divide-y divide-[#E5E9E7] bg-[#FAFAFA]">
              {searching ? (
                <div className="p-4 text-center text-xs text-[#6B7773]">กำลังค้นหา...</div>
              ) : users.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#6B7773]">
                  ไม่พบผู้ใช้ที่สามารถเพิ่มได้ (หรือเป็นสมาชิกอยู่แล้ว)
                </div>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUser?.user_id === u.user_id;
                  return (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className={`w-full text-left p-3 flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected ? "bg-[#ABD1C6]/30 border-l-4 border-l-[#004643]" : "hover:bg-white"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#26332F] block">
                          {u.display_name}
                        </span>
                        <span className="text-[11px] text-[#6B7773] font-mono">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-mono">
                          {u.roles?.join(", ") || "user"}
                        </span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#004643] text-white">
                            <LuCheck className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Role Selection */}
          {selectedUser && (
            <div className="space-y-2 pt-2 border-t border-[#E5E9E7] animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-[#26332F]">
                กำหนดบทบาทในโรงเรียน <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <p className="text-[11px] text-[#6B7773] leading-relaxed">
                หมายเหตุ: บทบาทนี้ใช้เฉพาะการจัดการภายในโรงเรียนเท่านั้น และไม่ส่งผลกระทบต่อสิทธิ์ระดับระบบของผู้ใช้
              </p>
            </div>
          )}

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
              disabled={submitting || !selectedUser}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <LuCheck className="h-4 w-4" />
                  <span>เพิ่มเข้าโรงเรียน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberModal;
