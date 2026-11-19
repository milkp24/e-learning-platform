import { useState, useEffect } from "react";
import {
  LuX,
  LuShield,
  LuRefreshCw,
  LuTriangleAlert,
  LuCheck,
  LuUser,
  LuMail,
  LuBuilding,
  LuBriefcase,
  LuImage,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";

const TITLE_OPTIONS = ["นาย", "นาง", "นางสาว", "ดร.", "อาจารย์", "อื่น ๆ"];
const OCCUPATION_OPTIONS = [
  "นักเรียน",
  "นักศึกษา",
  "อาจารย์",
  "ข้าราชการ",
  "พนักงานบริษัท",
  "โปรแกรมเมอร์ / นักพัฒนา",
  "นักวิจัย",
  "ฟรีแลนซ์",
  "อื่น ๆ",
];

function EditUserModal({ isOpen, onClose, user, onUserUpdated }) {
  const [formData, setFormData] = useState({
    title: "",
    first_name: "",
    last_name: "",
    display_name: "",
    email: "",
    occupation: "",
    institution_name: "",
    institution_email: "",
    role: "student",
    status: "active",
    profile_image: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Initialize form when user prop changes
  useEffect(() => {
    if (user) {
      const profile = user.profile || {};
      setFormData({
        title: profile.title || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        display_name: profile.display_name || user.display_name || user.email?.split("@")[0] || "",
        email: user.email || "",
        occupation: profile.occupation || "",
        institution_name: profile.institution_name || "",
        institution_email: profile.institution_email || "",
        role: user.role || (user.roles && user.roles[0]) || "student",
        status: user.status || "active",
        profile_image: profile.profile_image || "",
      });
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const validateForm = () => {
    // 1. Email check
    const emailClean = formData.email.trim();
    if (!emailClean) {
      setErrorMessage("กรุณากรอกอีเมลเข้าสู่ระบบ");
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
    if (!emailRegex.test(emailClean)) {
      setErrorMessage("รูปแบบอีเมลเข้าสู่ระบบไม่ถูกต้อง");
      return false;
    }

    // 2. Display Name check
    const dNameClean = formData.display_name.trim();
    if (!dNameClean) {
      setErrorMessage("กรุณากรอกชื่อแสดงผล (Display Name)");
      return false;
    }
    if (dNameClean.length < 2) {
      setErrorMessage("ชื่อแสดงผลต้องมีความยาวอย่างน้อย 2 ตัวอักษร");
      return false;
    }
    if (dNameClean.length > 100) {
      setErrorMessage("ชื่อแสดงผลต้องมีความยาวไม่เกิน 100 ตัวอักษร");
      return false;
    }

    // 3. Institution Email check if provided
    const instEmailClean = formData.institution_email.trim();
    if (instEmailClean && !emailRegex.test(instEmailClean)) {
      setErrorMessage("รูปแบบอีเมลสถาบันไม่ถูกต้อง");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        title: formData.title.trim() || null,
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        display_name: formData.display_name.trim(),
        email: formData.email.trim().toLowerCase(),
        occupation: formData.occupation.trim() || null,
        institution_name: formData.institution_name.trim() || null,
        institution_email: formData.institution_email.trim().toLowerCase() || null,
        role: formData.role,
        roles: [formData.role],
        status: formData.status,
        profile_image: formData.profile_image.trim() || null,
      };

      const res = await adminService.updateUser(user.user_id, payload);
      setSuccessMessage("บันทึกการแก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว");

      if (onUserUpdated) {
        onUserUpdated(res.user || { ...user, ...payload });
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      const apiErr = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      setErrorMessage(apiErr);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#004643] text-[#ABD1C6]">
              <LuUser className="h-5 w-5" />
            </span>
            <div>
              <h2 id="edit-user-title" className="text-base font-black text-[#26332F]">
                แก้ไขข้อมูลผู้ใช้งาน
              </h2>
              <p className="text-xs text-[#6B7773]">
                บันทึกการเปลี่ยนแปลงลงฐานข้อมูลระบบจริงโดย Super Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างแก้ไข"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-5 flex-1">
            {/* Status alerts */}
            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <LuTriangleAlert className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <LuCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Security Notice */}
            <div className="rounded-xl border border-[#ABD1C6]/50 bg-[#ABD1C6]/15 p-3.5 text-xs text-[#26332F] flex items-center gap-2.5">
              <LuShield className="h-4 w-4 text-[#004643] shrink-0" />
              <p className="leading-relaxed">
                ข้อมูลรหัสผ่าน (Password Hash) และโทเค็นระบบมีความปลอดภัยสูงและไม่สามารถแก้ไขจากแบบฟอร์มนี้ได้
              </p>
            </div>

            {/* Section 1: ข้อมูลทางการและข้อมูลส่วนตัว */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#004643] flex items-center gap-1.5">
                <LuUser className="h-3.5 w-3.5" />
                <span>ข้อมูลทางการจากการลงทะเบียน</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Title */}
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                    คำนำหน้าชื่อ (Title)
                  </label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
                  >
                    <option value="">-- เลือกคำนำหน้า --</option>
                    {TITLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. First Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                    ชื่อจริง (First Name)
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="เช่น สมหญิง"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                </div>

                {/* 3. Last Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                    นามสกุล (Last Name)
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="เช่น ใจดี"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  ชื่อแสดงผลในระบบ (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                  placeholder="เช่น สมหญิง ใจดี"
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Occupation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1 flex items-center gap-1">
                    <LuBriefcase className="h-3 w-3 text-[#6B7773]" />
                    <span>อาชีพ (Occupation)</span>
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    list="occupation-list"
                    placeholder="เช่น อาจารย์ หรือ นักเรียน"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                  <datalist id="occupation-list">
                    {OCCUPATION_OPTIONS.map((occ) => (
                      <option key={occ} value={occ} />
                    ))}
                  </datalist>
                </div>

                {/* Profile Image URL */}
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1 flex items-center gap-1">
                    <LuImage className="h-3 w-3 text-[#6B7773]" />
                    <span>รูปภาพโปรไฟล์ (Image URL)</span>
                  </label>
                  <input
                    type="text"
                    name="profile_image"
                    value={formData.profile_image}
                    onChange={handleChange}
                    placeholder="https://... หรือ /images/avatar.png"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Institution details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1 flex items-center gap-1">
                    <LuBuilding className="h-3 w-3 text-[#6B7773]" />
                    <span>ชื่อสถาบัน / มหาวิทยาลัย / องค์กร</span>
                  </label>
                  <input
                    type="text"
                    name="institution_name"
                    value={formData.institution_name}
                    onChange={handleChange}
                    placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1 flex items-center gap-1">
                    <LuMail className="h-3 w-3 text-[#6B7773]" />
                    <span>อีเมลสถาบัน (Institution Email)</span>
                  </label>
                  <input
                    type="email"
                    name="institution_email"
                    value={formData.institution_email}
                    onChange={handleChange}
                    placeholder="เช่น somying@university.ac.th"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: ข้อมูลบัญชีและสิทธิ์ในระบบ */}
            <div className="space-y-3 border-t border-[#E5E9E7] pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#004643] flex items-center gap-1.5">
                <LuShield className="h-3.5 w-3.5" />
                <span>บัญชีผู้ใช้และสิทธิ์ในระบบ (Account & Security)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Email */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                    อีเมลเข้าสู่ระบบ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition font-mono"
                  />
                  <p className="text-[10px] text-[#6B7773] mt-1">
                    * ต้องไม่ซ้ำกับอีเมลอื่นในระบบ
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                    บทบาทหลัก (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs font-bold text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
                  >
                    <option value="student">STUDENT (ผู้เรียน)</option>
                    <option value="instructor">INSTRUCTOR (ผู้สอน)</option>
                    <option value="admin">ADMIN (ผู้ดูแลระบบ)</option>
                    <option value="super_admin">SUPER ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                    สถานะบัญชี (Status) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-xs font-bold text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
                  >
                    <option value="active">Active (เปิดใช้งาน)</option>
                    <option value="inactive">Inactive (ปิดใช้งาน)</option>
                    <option value="suspended">Suspended (ระงับการใช้งาน)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-[#E5E9E7] bg-[#FAFAFA] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition disabled:opacity-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#004643] px-5 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-2xs disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <LuRefreshCw className="h-4 w-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <LuCheck className="h-4 w-4" />
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
