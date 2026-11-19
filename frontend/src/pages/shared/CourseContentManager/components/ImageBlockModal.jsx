import { useState, useEffect } from "react";
import { LuX, LuUpload, LuTrash2, LuRefreshCw } from "react-icons/lu";

/**
 * ImageBlockModal Component
 * เครื่องมือเพิ่มและแก้ไขเนื้อหารูปภาพ (Image Content)
 * รองรับ:
 * - อัปโหลดรูปภาพผ่าน File Selector (PNG, JPG, WebP, GIF, SVG)
 * - วาง Image URL ได้โดยตรง
 * - Preview รูปภาพสดก่อนบันทึก
 * - กำหนด Alt Text (ข้อความอธิบายภาพสำหรับ Accessibility)
 * - กำหนด Caption (คำบรรยายใต้ภาพ)
 * - เปลี่ยนรูปภาพ และ ลบรูปภาพ
 * - ตรวจสอบชนิดไฟล์และขนาด (จำกัด 5 MB) พร้อม Error Feedback
 */
function ImageBlockModal({
  isOpen,
  onClose,
  initialData = null,
  onSave,
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [error, setError] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setImageUrl(initialData.content_data || "");
      setCaption(initialData.caption || "");
      setAltText(initialData.alt_text || initialData.caption || "");
    } else {
      setImageUrl("");
      setCaption("");
      setAltText("");
    }
    setError("");
    setImageLoadError(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // จัดการเมื่อผู้ใช้เลือกไฟล์รูปภาพจากเครื่อง
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setImageLoadError(false);

    // ตรวจสอบชนิดไฟล์
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setError("ชนิดไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, GIF, SVG)");
      return;
    }

    // ตรวจสอบขนาดไฟล์ (สูงสุด 5 MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("ขนาดไฟล์รูปภาพเกินกำหนด (ต้องไม่เกิน 5 MB)");
      return;
    }

    // แปลงเป็น Data URL เพื่อให้ Browser สามารถพรีวิวและจัดเก็บได้โดยตรง
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target.result);
      if (!caption) {
        // ใช้ชื่อไฟล์เดิมเป็น Default Caption
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        setCaption(cleanName);
        setAltText(cleanName);
      }
    };
    reader.onerror = () => {
      setError("ไม่สามารถอ่านไฟล์รูปภาพได้");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError("กรุณาเลือกรูปภาพหรือระบุ URL รูปภาพ");
      return;
    }
    if (imageLoadError) {
      setError("ไม่สามารถโหลดรูปภาพจากแหล่งข้อมูลนี้ได้ กรุณาตรวจสอบ URL หรือเลือกไฟล์ใหม่");
      return;
    }

    onSave({
      content_type: "image",
      content_data: imageUrl.trim(),
      caption: caption.trim() || null,
      alt_text: altText.trim() || caption.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-fadeIn">
        {/* ส่วนหัว Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-[#FAFAFA]">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              {initialData ? "แก้ไขรูปภาพ" : "เพิ่มเนื้อหารูปภาพ (Image Content)"}
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              อัปโหลดรูปภาพประกอบ หรือระบุลิงก์รูปภาพ พร้อมคำบรรยาย
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-gray-200 transition cursor-pointer"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* ฟอร์มและอัปโหลด */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {/* กล่องอัปโหลดหรือระบุ URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              เลือกรูปภาพ หรือ ระบุ URL รูปภาพ <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setError("");
                  setImageLoadError(false);
                }}
                placeholder="https://example.com/image.jpg หรืออัปโหลดจากเครื่อง..."
                className="flex-1 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/20 px-4 py-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/40 cursor-pointer transition shadow-2xs shrink-0">
                <LuUpload className="h-4 w-4" />
                <span>เลือกรูปภาพ</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* พรีวิวรูปภาพ (Image Preview) */}
          {imageUrl && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#6B7773]">
                ตัวอย่างรูปภาพก่อนบันทึก
              </span>
              <div className="relative overflow-hidden rounded-2xl border border-[#E5E9E7] bg-gray-50 max-h-[260px] flex items-center justify-center p-3 text-center">
                <img
                  src={imageUrl}
                  alt={altText || caption || "Preview"}
                  className="max-h-[240px] w-auto max-w-full rounded-xl object-contain shadow-xs"
                  onError={() => setImageLoadError(true)}
                  onLoad={() => setImageLoadError(false)}
                />
                {/* ปุ่มลบและเปลี่ยนรูปภาพ */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <label
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
                    title="เปลี่ยนรูปภาพ"
                  >
                    <LuRefreshCw className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setImageLoadError(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600/80 text-white hover:bg-rose-700 transition cursor-pointer"
                    title="ลบรูปภาพ"
                  >
                    <LuTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {imageLoadError && (
                <p className="text-xs text-rose-600 font-medium">
                  ❌ ไม่สามารถแสดงภาพจาก URL ที่ระบุได้ กรุณาตรวจสอบความถูกต้องของที่อยู่รูปภาพ
                </p>
              )}
            </div>
          )}

          {/* คำบรรยายใต้ภาพ (Caption) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำบรรยายใต้ภาพ (Caption)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เช่น Soil Moisture Sensor เซนเซอร์สำหรับตรวจวัดความชื้นในดิน"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ข้อความอธิบายรูปภาพ (Alt Text)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="คำอธิบายสั้นสำหรับผู้พิการทางสายตาหรือเมื่อรูปโหลดไม่ได้"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* ส่วนท้ายและปุ่มบันทึก */}
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
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-sm"
            >
              บันทึกรูปภาพ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ImageBlockModal;
