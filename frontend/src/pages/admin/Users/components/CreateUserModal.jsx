import { useState, useEffect } from "react";
import {
  LuX,
  LuUserPlus,
  LuMail,
  LuLock,
  LuUser,
  LuBriefcase,
  LuShield,
  LuCheck,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * CreateUserModal Component
 * Modal สำหรับ Admin / Super Admin ในการสร้างบัญชีผู้ใช้งานใหม่
 * บันทึกลงฐานข้อมูลจริงผ่าน POST /api/v1/admin/users
 * ปฏิบัติตาม Jade Design System และ Role Security
 */
function CreateUserModal({
  isOpen,
  onClose,
  onUserCreated,
  isSuperAdmin = false,
}) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    title: "นาย",
    first_name: "",
    last_name: "",
    display_name: "",
    occupation: "",
    institution_name: "",
    institution_email: "",
    role: "student",
    status: "active",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        title: "นาย",
        first_name: "",
        last_name: "",
        display_name: "",
        occupation: "",
        institution_name: "",
        institution_email: "",
        role: "student",
        status: "active",
      });
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto generate display_name if user hasn't explicitly typed one
      if (name === "first_name" || name === "last_name") {
        const full = `${name === "first_name" ? value : prev.first_name} ${name === "last_name" ? value : prev.last_name}`.trim();
        if (!prev.display_name || prev.display_name === `${prev.first_name} ${prev.last_name}`.trim()) {
          updated.display_name = full;
        }
      }
      return updated;
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password;
    const cleanConfirm = formData.confirmPassword;
    const cleanDisplayName = (formData.display_name || `${formData.first_name} ${formData.last_name}`.trim() || cleanEmail.split("@")[0]).trim();

    // 1. Validation: Email
    if (!cleanEmail) {
      setError("กรุณาระบุอีเมลสำหรับเข้าสู่ระบบ");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    // 2. Validation: Password
    if (!cleanPassword) {
      setError("กรุณาระบุรหัสผ่าน");
      return;
    }
    if (cleanPassword.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (cleanPassword !== cleanConfirm) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // 3. Validation: Display Name
    if (cleanDisplayName.length < 2) {
      setError("ชื่อแสดงผลต้องมีความยาวอย่างน้อย 2 ตัวอักษร");
      return;
    }

    // 4. Role Security: Prevent regular admin from picking super_admin
    if (["admin", "super_admin"].includes(formData.role) && !isSuperAdmin) {
      setError("แต่งตั้งผู้ดูแลระบบได้เฉพาะ Super Admin เท่านั้น");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        email: cleanEmail,
        password: cleanPassword,
        display_name: cleanDisplayName,
        title: formData.title || null,
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        occupation: formData.occupation.trim() || null,
        institution_name: formData.institution_name.trim() || null,
        institution_email: formData.institution_email.trim() || null,
        roles: [formData.role],
        status: formData.status,
      };

      const res = await adminService.createUser(payload);
      if (res && res.user) {
        onUserCreated(res.user);
        onClose();
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "ไม่สามารถสร้างผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuUserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 id="create-user-modal-title" className="text-base font-black text-[#26332F]">
                เพิ่มผู้ใช้งานใหม่
              </h2>
              <p className="text-xs text-[#6B7773]">
                สร้างบัญชีผู้ใช้งานใหม่และบันทึกลงระบบฐานข้อมูล
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              {error}
            </div>
          )}

          {/* Section 1: ข้อมูลบัญชีสำหรับเข้าสู่ระบบ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#26332F]">
              <LuMail className="h-3.5 w-3.5 text-[#004643]" />
              <span>ข้อมูลบัญชีสำหรับเข้าสู่ระบบ (จำเป็น)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* อีเมล */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  อีเมลเข้าสู่ระบบ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  required
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* รหัสผ่านเริ่มต้น */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="ขั้นต่ำ 6 ตัวอักษร"
                    required
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                  <LuLock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#6B7773]" />
                </div>
              </div>

              {/* ยืนยันรหัสผ่าน */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    required
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                  <LuLock className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#6B7773]" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: บทบาทและสถานะ */}
          <div className="space-y-3 pt-3 border-t border-[#E5E9E7]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#26332F]">
              <LuShield className="h-3.5 w-3.5 text-[#004643]" />
              <span>บทบาทและสถานะการใช้งาน</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Role */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  บทบาทในระบบ <span className="text-rose-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  <option value="student">Student (ผู้เรียน)</option>
                  <option value="instructor">Instructor (ผู้สอน)</option>
                  {/* ข้อ 12: แต่งตั้งผู้ดูแลระบบได้เฉพาะ Super Admin */}
                  {isSuperAdmin && <option value="admin">Admin (ผู้ดูแลระบบ)</option>}
                  {isSuperAdmin && (
                    <option value="super_admin">Super Admin (ผู้ดูแลระบบสูงสุด)</option>
                  )}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  สถานะบัญชี <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  <option value="active">Active (เปิดใช้งานปกติ)</option>
                  <option value="inactive">Inactive (ปิดใช้งานชั่วคราว)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: ข้อมูลส่วนบุคคลและโปรไฟล์ */}
          <div className="space-y-3 pt-3 border-t border-[#E5E9E7]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#26332F]">
              <LuUser className="h-3.5 w-3.5 text-[#004643]" />
              <span>ข้อมูลโปรไฟล์และข้อมูลส่วนบุคคล</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* คำนำหน้า */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">คำนำหน้าชื่อ</label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                >
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="ดร.">ดร.</option>
                  <option value="อาจารย์">อาจารย์</option>
                </select>
              </div>

              {/* ชื่อจริง */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">ชื่อจริง</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="เช่น สมชาย"
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* นามสกุล */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">นามสกุล</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="เช่น ใจดี"
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Display Name */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  ชื่อที่แสดงผล (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  placeholder="ชื่อที่จะแสดงในระบบ เช่น สมชาย ใจดี"
                  required
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section 4: องค์กรและการทำงาน (ไม่บังคับ) */}
          <div className="space-y-3 pt-3 border-t border-[#E5E9E7]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#26332F]">
              <LuBriefcase className="h-3.5 w-3.5 text-[#004643]" />
              <span>ข้อมูลการทำงานและสถาบัน (ไม่บังคับ)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* อาชีพ */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">อาชีพ</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="เช่น นักศึกษา / นักพัฒนา"
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* สถาบัน / บริษัท */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">สถาบัน / หน่วยงาน</label>
                <input
                  type="text"
                  name="institution_name"
                  value={formData.institution_name}
                  onChange={handleChange}
                  placeholder="เช่น มหาวิทยาลัย / บริษัท"
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* อีเมลสถาบัน */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">อีเมลสถาบัน</label>
                <input
                  type="email"
                  name="institution_email"
                  value={formData.institution_email}
                  onChange={handleChange}
                  placeholder="institution@school.ac.th"
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-5 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <LuCheck className="h-4 w-4" />
              <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกและสร้างผู้ใช้"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;
