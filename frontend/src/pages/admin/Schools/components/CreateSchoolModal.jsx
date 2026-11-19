import { useState, useEffect } from "react";
import {
  LuX,
  LuBuilding,
  LuMail,
  LuPhone,
  LuMapPin,
  LuBarcode,
  LuCheck,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * CreateSchoolModal Component
 * Modal for creating a new School in PostgreSQL database
 * Follows Jade Design System (#ABD1C6, #004643, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 */
function CreateSchoolModal({ isOpen, onClose, onSchoolCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    status: "active",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        code: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        status: "active",
      });
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanName = formData.name.trim();
    const cleanCode = formData.code.trim();
    const cleanAddress = formData.address.trim();
    const cleanEmail = formData.contact_email.trim().toLowerCase();
    const cleanPhone = formData.contact_phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setError("กรุณาระบุชื่อโรงเรียน/สถานศึกษา (อย่างน้อย 2 ตัวอักษร)");
      return;
    }

    if (cleanEmail) {
      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError("รูปแบบอีเมลติดต่อไม่ถูกต้อง");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: cleanName,
        code: cleanCode || null,
        address: cleanAddress || null,
        contact_email: cleanEmail || null,
        contact_phone: cleanPhone || null,
        status: formData.status,
      };

      const res = await adminService.createSchool(payload);
      if (res && res.school) {
        onSchoolCreated(res.school);
        onClose();
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "ไม่สามารถสร้างโรงเรียนได้ กรุณาลองใหม่อีกครั้ง";
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
      aria-labelledby="create-school-modal-title"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuBuilding className="h-5 w-5" />
            </span>
            <div>
              <h2 id="create-school-modal-title" className="text-base font-black text-[#26332F]">
                เพิ่มโรงเรียน / สถานศึกษาใหม่
              </h2>
              <p className="text-xs text-[#6B7773]">
                สร้างข้อมูลสถานศึกษาใหม่และบันทึกลงระบบฐานข้อมูล
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

          {/* Section 1: ข้อมูลทั่วไป */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#26332F]">
              <LuBuilding className="h-3.5 w-3.5 text-[#004643]" />
              <span>ข้อมูลสถานศึกษา (จำเป็น)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* ชื่อโรงเรียน */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  ชื่อโรงเรียน / สถานศึกษา <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="เช่น โรงเรียนสาธิตวิทยาคม"
                  required
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* รหัสโรงเรียน */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  รหัสโรงเรียน (School Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="เช่น SCH-001"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition uppercase"
                  />
                  <LuBarcode className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#6B7773]" />
                </div>
              </div>

              {/* สถานะ */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  สถานะการใช้งาน <span className="text-rose-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
                >
                  <option value="active">Active (เปิดใช้งาน)</option>
                  <option value="inactive">Inactive (ระงับการใช้งาน)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลติดต่อและที่อยู่ */}
          <div className="space-y-3 pt-3 border-t border-[#E5E9E7]">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#26332F]">
              <LuMail className="h-3.5 w-3.5 text-[#004643]" />
              <span>ข้อมูลการติดต่อและที่อยู่ (ไม่บังคับ)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* อีเมลติดต่อ */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  อีเมลติดต่อ
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleChange}
                    placeholder="contact@school.ac.th"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                  <LuMail className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#6B7773]" />
                </div>
              </div>

              {/* เบอร์โทรติดต่อ */}
              <div>
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="02-123-4567"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition"
                  />
                  <LuPhone className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#6B7773]" />
                </div>
              </div>

              {/* ที่อยู่ */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#26332F] mb-1">
                  ที่อยู่สถานศึกษา
                </label>
                <div className="relative">
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                    className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition resize-none"
                  />
                  <LuMapPin className="absolute right-3 top-2.5 h-3.5 w-3.5 text-[#6B7773]" />
                </div>
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
              <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกและสร้างโรงเรียน"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSchoolModal;
