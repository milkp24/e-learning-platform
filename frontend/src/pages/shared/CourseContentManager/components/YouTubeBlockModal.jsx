import { useState, useEffect } from "react";
import { LuX, LuTriangleAlert as LuAlertTriangle, LuCheck } from "react-icons/lu";

/**
 * YouTubeBlockModal Component
 * เครื่องมือเพิ่มและแก้ไขเนื้อหาวิดีโอ YouTube (YouTube Content)
 *
 * ฟังก์ชันหลักตามข้อ 8:
 * 1. ตรวจสอบว่าเป็น YouTube URL (watch, youtu.be, embed)
 * 2. หาก URL ไม่ถูกต้อง แสดง: "ลิงก์ YouTube ไม่ถูกต้อง"
 * 3. ดึง Video ID (11 ตัวอักษร)
 * 4. แสดง Preview สดผ่าน Safe YouTube No-Cookie Embed
 * 5. กำหนดชื่อวิดีโอ (Title / Caption)
 * 6. เพิ่มคำอธิบาย (Description)
 * 7. บันทึก
 */
function YouTubeBlockModal({
  isOpen,
  onClose,
  initialData = null,
  onSave,
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ฟังก์ชันสกัด Video ID ของ YouTube ตามรูปแบบ watch, youtu.be, embed
  const extractVideoId = (inputUrl) => {
    if (!inputUrl || typeof inputUrl !== "string") return null;
    const clean = inputUrl.trim();
    const regex = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = clean.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (initialData) {
      const initialUrl = initialData.content_data || "";
      setUrl(initialUrl);
      setTitle(initialData.caption || "");
      setDescription(initialData.description || "");

      const vid = extractVideoId(initialUrl);
      setVideoId(vid);
      setIsUrlValid(Boolean(vid));
      setErrorMessage(vid ? "" : "ลิงก์ YouTube ไม่ถูกต้อง");
    } else {
      setUrl("");
      setTitle("");
      setDescription("");
      setVideoId(null);
      setIsUrlValid(true);
      setErrorMessage("");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // ตรวจสอบ URL ทันทีเมื่อผู้ใช้พิมพ์หรือวาง
  const handleUrlChange = (e) => {
    const input = e.target.value;
    setUrl(input);

    if (!input.trim()) {
      setVideoId(null);
      setIsUrlValid(true);
      setErrorMessage("");
      return;
    }

    const vid = extractVideoId(input);
    if (vid) {
      setVideoId(vid);
      setIsUrlValid(true);
      setErrorMessage("");
      if (!title) {
        setTitle("วิดีโอบทเรียน YouTube");
      }
    } else {
      setVideoId(null);
      setIsUrlValid(false);
      setErrorMessage("ลิงก์ YouTube ไม่ถูกต้อง");
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setIsUrlValid(false);
      setErrorMessage("กรุณาระบุลิงก์ YouTube");
      return;
    }

    const vid = extractVideoId(url);
    if (!vid) {
      setIsUrlValid(false);
      setErrorMessage("ลิงก์ YouTube ไม่ถูกต้อง");
      return;
    }

    const safeEmbedUrl = `https://www.youtube-nocookie.com/embed/${vid}`;

    onSave({
      content_type: "youtube",
      content_data: safeEmbedUrl,
      caption: title.trim() || `วิดีโอ YouTube: ${vid}`,
      description: description.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-fadeIn">
        {/* ส่วนหัว Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-[#FAFAFA]">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              {initialData ? "แก้ไขวิดีโอ YouTube" : "เพิ่มวิดีโอ YouTube"}
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              วางลิงก์วิดีโอจาก YouTube เพื่อนำมาแสดงในบทเรียน
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

        {/* ฟอร์มและพรีวิว */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* กล่องวาง URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ลิงก์วิดีโอ YouTube <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/watch?v=xxxxxxxx หรือ https://youtu.be/xxxxxxxx"
                className={`w-full rounded-xl border bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:bg-white focus:outline-none transition shadow-2xs ${
                  !isUrlValid
                    ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                    : "border-[#E5E9E7] focus:border-[#ABD1C6]"
                }`}
              />
              {videoId && isUrlValid && (
                <span className="absolute right-3 top-3 text-emerald-600 font-bold text-xs flex items-center gap-1">
                  <LuCheck className="h-4 w-4" />
                  <span>พบวิดีโอ</span>
                </span>
              )}
            </div>

            {/* ข้อความแจ้งเตือนเมื่อ URL ไม่ถูกต้อง */}
            {!isUrlValid && errorMessage && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 pt-0.5">
                <LuAlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <p className="text-[11px] text-[#6B7773]">
              รองรับรูปแบบ: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
            </p>
          </div>

          {/* พรีวิว YouTube สด */}
          {videoId && isUrlValid && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#6B7773]">
                ตัวอย่างวิดีโอ (YouTube Preview)
              </span>
              <div className="relative w-full overflow-hidden rounded-2xl bg-black pt-[56.25%] shadow-md">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title="YouTube Preview Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          )}

          {/* ชื่อวิดีโอ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ชื่อวิดีโอ (Title)
            </label>
            <input
              type="text"
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น วิดีโอ: ESP32 เบื้องต้น และการเชื่อมต่อ Sensor"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* คำอธิบายวิดีโอ */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำอธิบายวิดีโอ (Description)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เรียนรู้การทำงานพื้นฐานของ ESP32 และการอ่านค่าจากเซนเซอร์..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs resize-none"
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
              disabled={!videoId || !isUrlValid}
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] disabled:opacity-50 active:scale-98 transition cursor-pointer shadow-sm"
            >
              บันทึกวิดีโอ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default YouTubeBlockModal;
