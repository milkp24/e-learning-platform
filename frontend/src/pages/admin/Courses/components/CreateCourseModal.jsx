import { useState } from "react";
import { LuX, LuUpload } from "react-icons/lu";

/**
 * CreateCourseModal Component
 * หน้าต่างสำหรับสร้างคอร์สเรียนใหม่ (100% Thai UI ตาม Jade Design System)
 * รองรับข้อมูลพื้นฐานครบถ้วน:
 * - ชื่อคอร์ส
 * - คำอธิบาย
 * - คำอธิบายสั้น
 * - รูปปก (URL หรือเลือกไฟล์พรีวิว)
 * - หมวดหมู่
 * - ระดับความยาก
 * - ผู้สอน
 * - สถานะ (ฉบับร่าง / เผยแพร่แล้ว)
 */
function CreateCourseModal({
  isOpen,
  onClose,
  onSubmit,
  isCreating,
  error,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("IoT & Smart City");
  const [level, setLevel] = useState("ระดับเริ่มต้น");
  const [instructor, setInstructor] = useState("อาจารย์ผู้สอน");
  const [status, setStatus] = useState("draft");
  const [previewError, setPreviewError] = useState(false);

  if (!isOpen) return null;

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

    // ส่งข้อมูลทั้งหมดกลับไปบันทึก
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      short_description: shortDescription.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      category,
      level,
      instructor,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-fadeIn">
        {/* หัวข้อ Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-3.5">
          <div>
            <h3 className="text-lg font-black text-[#26332F]">
              เพิ่มคอร์สเรียนใหม่
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              กรอกข้อมูลเพื่อเริ่มต้นสร้างคอร์สและเข้าสู่การจัดการเนื้อหา
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
              placeholder="เช่น IoT 101 — ภารกิจปลุกเมืองให้ฉลาด"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* คำอธิบายสั้น */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำอธิบายสั้น
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="สรุปเนื้อหาสั้นกระชับสำหรับแสดงบนการ์ด"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* คำอธิบายคอร์ส */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำอธิบายรายละเอียด
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เรียนรู้พื้นฐาน IoT ผ่านเรื่องราว การประกอบระบบ และภารกิจแบบขั้นบันได..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs resize-none"
            />
          </div>

          {/* หมวดหมู่ และ ระดับความยาก */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                หมวดหมู่
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
              >
                <option value="IoT & Smart City">IoT & Smart City</option>
                <option value="Hardware & Robotics">Hardware & Robotics</option>
                <option value="Web & Mobile Development">Web & Mobile Development</option>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Cybersecurity">Cybersecurity</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                ระดับความยาก
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
              >
                <option value="ระดับเริ่มต้น">ระดับเริ่มต้น (Beginner)</option>
                <option value="ระดับกลาง">ระดับกลาง (Intermediate)</option>
                <option value="ระดับสูง">ระดับสูง (Advanced)</option>
              </select>
            </div>
          </div>

          {/* ผู้สอน และ สถานะเริ่มต้น */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                ผู้สอน
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="ระบุชื่อผู้สอนหรืออาจารย์ผู้รับผิดชอบ"
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                สถานะเริ่มต้น
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
              >
                <option value="draft">ฉบับร่าง (ยังไม่เผยแพร่)</option>
                <option value="active">เผยแพร่แล้ว (เปิดให้ผู้เรียนเข้าถึง)</option>
              </select>
            </div>
          </div>

          {/* รูปปกคอร์ส (Thumbnail) */}
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
                placeholder="วางลิงก์รูปภาพปก หรือเลือกอัปโหลดรูปภาพ..."
                className="flex-1 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/20 px-4 py-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/40 cursor-pointer transition">
                <LuUpload className="h-4 w-4" />
                <span>เลือกรูปจากเครื่อง</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* พรีวิวรูปปก */}
            {thumbnailUrl && !previewError && (
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-[#E5E9E7] bg-gray-50 h-36 flex items-center justify-center">
                <img
                  src={thumbnailUrl}
                  alt="ตัวอย่างรูปปก"
                  onError={() => setPreviewError(true)}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl("")}
                  className="absolute top-2 right-2 rounded-xl bg-black/60 p-1.5 text-white hover:bg-black/80 transition"
                  title="ลบรูปปก"
                >
                  <LuX className="h-4 w-4" />
                </button>
              </div>
            )}
            {previewError && (
              <p className="text-xs text-rose-600">
                ไม่สามารถโหลดรูปภาพจากลิงก์ที่ระบุได้ กรุณาตรวจสอบ URL
              </p>
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
              disabled={isCreating}
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] disabled:opacity-50 active:scale-98 transition cursor-pointer shadow-sm"
            >
              {isCreating ? "กำลังสร้างคอร์ส..." : "สร้างคอร์สและจัดการเนื้อหา →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCourseModal;
