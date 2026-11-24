import { useState } from "react";
import { LuX, LuGraduationCap, LuTriangleAlert as LuAlertTriangle, LuCheck } from "react-icons/lu";
import { academicYear, firstError, optionalText, requiredText } from "../../../../utils/formValidation";

/**
 * CreateClassroomModal Component
 * Form for adding a new classroom to a school
 */
function CreateClassroomModal({ isOpen, onClose, schoolId, schoolName, onSubmit }) {
  const [formData, setFormData] = useState({
    classroom_name: "",
    grade_level: "",
    academic_year: new Date().getFullYear() + 543 + "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.classroom_name.trim();
    // ข้อ 37: ตรวจข้อมูลก่อนส่ง (กติกาเดียวกับ Backend)
    const invalid = firstError(
      requiredText(name, "ชื่อห้องเรียน", { max: 100 }),
      optionalText(formData.grade_level, "ระดับชั้น", 50),
      academicYear(formData.academic_year)
    );
    if (invalid) {
      setError(invalid);
      return;
    }

    try {
      setLoading(true);
      setError("");
      await onSubmit({
        classroom_name: name,
        grade_level: formData.grade_level.trim() || null,
        academic_year: formData.academic_year.trim() || null,
        status: formData.status,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการสร้างห้องเรียน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-classroom-title"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuGraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h2 id="create-classroom-title" className="text-base font-black text-[#26332F]">
                เพิ่มห้องเรียนใหม่
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

          <div>
            <label className="block text-xs font-bold text-[#26332F] mb-1.5">
              ชื่อห้องเรียน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="classroom_name"
              value={formData.classroom_name}
              onChange={handleChange}
              placeholder="เช่น ม.4/1, Grade 10-A, ห้องเรียนพิเศษวิทย์-คณิต"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#26332F] placeholder-[#6B7773] focus:border-[#004643] focus:bg-white focus:outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#26332F] mb-1.5">
                ระดับชั้น
              </label>
              <input
                type="text"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleChange}
                placeholder="เช่น ม.4, Grade 10"
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#26332F] placeholder-[#6B7773] focus:border-[#004643] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#26332F] mb-1.5">
                ปีการศึกษา
              </label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="เช่น 2567, 2024"
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#26332F] placeholder-[#6B7773] focus:border-[#004643] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#26332F] mb-1.5">
              สถานะห้องเรียน
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#26332F] focus:border-[#004643] focus:bg-white focus:outline-none transition cursor-pointer"
            >
              <option value="active">เปิดใช้งาน (Active)</option>
              <option value="inactive">ปิดใช้งาน (Inactive)</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <LuCheck className="h-4 w-4" />
                  <span>บันทึกห้องเรียน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClassroomModal;
