import { useState, useEffect } from "react";
import { LuX, LuUpload } from "react-icons/lu";

/**
 * EditCourseModal Component
 * หน้าต่างสำหรับแก้ไขข้อมูลคอร์สเรียนเดิม (100% Thai UI)
 */
function EditCourseModal({
  isOpen,
  onClose,
  course,
  onSubmit,
  isUpdating,
  error,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("active");
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (course) {
      setTitle(course.title || "");
      setDescription(course.description || "");
      setThumbnailUrl(course.thumbnail_url || course.cover_image || "");
      setStatus(course.status || "active");
      setPreviewError(false);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnailUrl(event.target.result);
        setPreviewError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-fadeIn">
        {/* หัวข้อ Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-3.5">
          <div>
            <h3 className="text-lg font-black text-[#26332F]">
              แก้ไขข้อมูลคอร์สเรียน
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              ปรับปรุงรายละเอียดคอร์ส รูปปก และสถานะการเผยแพร่
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            <LuX className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อคอร์ส */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ชื่อคอร์ส <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ระบุชื่อคอร์สเรียน"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* คำอธิบายคอร์ส */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำอธิบายคอร์ส
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดเนื้อหา จุดประสงค์การเรียนรู้..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs resize-none"
            />
          </div>

          {/* สถานะ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              สถานะคอร์ส
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
            >
              <option value="draft">ฉบับร่าง (ยังไม่เผยแพร่)</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="active">เผยแพร่แล้ว (เปิดให้ผู้เรียนเข้าถึง)</option>
              <option value="inactive">ปิดการเผยแพร่</option>
            </select>
          </div>

          {/* รูปปกคอร์ส */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              รูปปกคอร์ส
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder="วางลิงก์รูปภาพปก..."
                className="flex-1 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/20 px-4 py-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/40 cursor-pointer transition">
                <LuUpload className="h-4 w-4" />
                <span>เปลี่ยนรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {thumbnailUrl && !previewError && (
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-[#E5E9E7] bg-gray-50 h-32 flex items-center justify-center">
                <img
                  src={thumbnailUrl}
                  alt="ตัวอย่างรูปปก"
                  onError={() => setPreviewError(true)}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl("")}
                  className="absolute top-2 right-2 rounded-xl bg-black/60 p-1 text-white hover:bg-black/80 transition"
                  title="ลบรูปปก"
                >
                  <LuX className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E5E9E7] bg-white px-5 py-2.5 text-xs font-bold text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] disabled:opacity-50 active:scale-98 transition cursor-pointer shadow-sm"
            >
              {isUpdating ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCourseModal;
