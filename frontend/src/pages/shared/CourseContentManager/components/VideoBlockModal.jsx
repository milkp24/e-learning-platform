import { useState, useEffect, useRef } from "react";
import {
  LuX,
  LuUpload,
  LuVideo,
  LuTrash2,
  LuInfo,
  LuTriangleAlert as LuAlertTriangle,
  LuCheck,
  LuRefreshCw,
} from "react-icons/lu";
import api from "../../../../services/api";

/**
 * VideoBlockModal Component
 * เครื่องมือเพิ่มและแก้ไขเนื้อหาวิดีโอ MP4 (UAT-021)
 * รองรับทั้ง:
 * 1. อัปโหลดไฟล์ MP4 / WebM โดยตรงผ่านระบบ (Multipart Form Data)
 * 2. ระบุลิงก์ Direct Video URL จากภายนอก
 */
function VideoBlockModal({
  isOpen,
  onClose,
  initialData = null,
  onSave,
}) {
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSizeText, setFileSizeText] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const allowedExtensions = [".mp4", ".webm"];
  const maxSizeBytes = 50 * 1024 * 1024; // 50 MB

  const formatBytes = (bytes) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  useEffect(() => {
    if (initialData) {
      setVideoUrl(initialData.content_data || "");
      setCaption(initialData.caption || "");
      setFileName(initialData.file_name || "");
      setFileSizeText(initialData.file_size || "");
      setIsUploaded(Boolean(initialData.content_data && initialData.content_data.includes("/api/v1/media/uploads/")));
    } else {
      setVideoUrl("");
      setCaption("");
      setFileName("");
      setFileSizeText("");
      setIsUploaded(false);
    }
    setError("");
    setIsUploading(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // จัดการเลือกไฟล์วิดีโอจากเครื่องและอัปโหลดไปยัง Backend จริง
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // เลือกไฟล์เดิมซ้ำได้หลังแก้ไขแล้ว (ข้อ 23)
    if (!file) return;

    setError("");

    const nameLower = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some((ext) => nameLower.endsWith(ext));

    // 1. ตรวจสอบประเภทไฟล์
    if (!hasValidExt && file.type !== "video/mp4" && file.type !== "video/webm") {
      setError("ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์วิดีโอ MP4 หรือ WebM เท่านั้น");
      return;
    }

    // 2. ตรวจสอบขนาดไฟล์ (สูงสุด 50 MB)
    if (file.size > maxSizeBytes) {
      setError(`ขนาดไฟล์เกินขีดจำกัดที่อนุญาต (สูงสุด 50 MB) ไฟล์ของคุณมีขนาด ${formatBytes(file.size)}`);
      return;
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setFileName(file.name);
    setFileSizeText(formatBytes(file.size));
    if (!caption) {
      setCaption(cleanName);
    }

    // 3. ทำการอัปโหลดไฟล์ผ่าน Backend API จริง
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const serverUrl = res.data.file_url;
      setVideoUrl(serverUrl);
      setIsUploaded(true);
      setError("");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "เกิดข้อผิดพลาดในการอัปโหลดไฟล์วิดีโอ";
      setError(errorMsg);
      setIsUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setVideoUrl("");
    setFileName("");
    setFileSizeText("");
    setIsUploaded(false);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isUploading) {
      setError("กรุณารอการอัปโหลดไฟล์ให้เสร็จสิ้นก่อนบันทึก");
      return;
    }
    if (!videoUrl.trim()) {
      setError("กรุณาเลือกไฟล์วิดีโอหรือระบุ URL ของวิดีโอ MP4");
      return;
    }

    onSave({
      content_type: "video",
      content_data: videoUrl.trim(),
      caption: caption.trim() || fileName || "วิดีโอบทเรียน",
      file_name: fileName || null,
      file_size: fileSizeText || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-fadeIn">
        {/* ส่วนหัว Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
              <LuVideo className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#26332F]">
                {initialData ? "แก้ไขเนื้อหาวิดีโอ (MP4)" : "เพิ่มเนื้อหาวิดีโอ (MP4 Video)"}
              </h3>
              <p className="text-xs text-[#6B7773] mt-0.5">
                รองรับการอัปโหลดไฟล์วิดีโอเข้าสู่ระบบ และการระบุ Direct URL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-gray-200 transition cursor-pointer"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* ฟอร์มและพรีวิว */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
              <LuAlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* กล่องคำชี้แจงการใช้งาน */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 text-xs text-purple-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <LuInfo className="h-4 w-4 text-purple-700 shrink-0" />
              <span>ตัวเลือกการแนบวิดีโอ MP4</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              คุณสามารถ <strong>อัปโหลดไฟล์ MP4 จากเครื่อง</strong> (ขนาดสูงสุด 50 MB) หรือกรอก <strong>Direct Video URL</strong> จากแหล่งจัดเก็บภายนอกได้โดยตรง
            </p>
          </div>

          {/* เลือกไฟล์ หรือ ระบุ URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ลิงก์ URL หรือ อัปโหลดไฟล์จากเครื่อง <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  setIsUploaded(false);
                  setFileName("");
                  setFileSizeText("");
                  setError("");
                }}
                disabled={isUploading}
                placeholder="https://example.com/video.mp4"
                className="flex-1 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs disabled:bg-gray-100 disabled:text-gray-600"
              />
              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-800 hover:bg-purple-100 cursor-pointer transition shadow-2xs shrink-0">
                {isUploading ? (
                  <>
                    <LuRefreshCw className="h-4 w-4 animate-spin text-purple-700" />
                    <span>กำลังอัปโหลด...</span>
                  </>
                ) : (
                  <>
                    <LuUpload className="h-4 w-4" />
                    <span>{isUploaded ? "เปลี่ยนไฟล์ MP4" : "เลือกไฟล์ MP4"}</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm"
                  disabled={isUploading}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-[#6B7773]">
              รองรับไฟล์รูปแบบ .mp4 และ .webm (ขนาดไม่เกิน 50 MB)
            </p>
          </div>

          {/* ตัวอย่างวิดีโอ (Live Video Preview) */}
          {videoUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#26332F] font-bold">
                <span>ตัวอย่างวิดีโอ (Live Preview)</span>
                {isUploaded && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <LuCheck className="h-3 w-3" />
                    <span>อัปโหลดสำเร็จ: {fileName} ({fileSizeText})</span>
                  </span>
                )}
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-300 bg-black p-2 relative shadow-inner">
                <video
                  key={videoUrl}
                  src={videoUrl}
                  controls
                  className="w-full max-h-56 mx-auto rounded-xl object-contain bg-black"
                >
                  เบราว์เซอร์ไม่รองรับการเล่นวิดีโอ
                </video>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold transition cursor-pointer"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                  <span>ล้างวิดีโอนี้</span>
                </button>
              </div>
            </div>
          )}

          {/* คำบรรยายวิดีโอ (Caption) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำบรรยายวิดีโอ / ชื่อตอนย่อย (Caption)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เช่น การสาธิตการเชื่อมต่อเซนเซอร์ หรือ วิดีโออธิบายโค้ด"
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
              disabled={isUploading}
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 disabled:opacity-50 transition cursor-pointer shadow-sm"
            >
              {isUploading ? "กำลังอัปโหลด..." : "บันทึกวิดีโอ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VideoBlockModal;
