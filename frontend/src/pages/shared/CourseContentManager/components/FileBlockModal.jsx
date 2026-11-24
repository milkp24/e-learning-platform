import { useState, useEffect } from "react";
import {
  LuX,
  LuUpload,
  LuFileText,
  LuFileSpreadsheet,
  LuFileArchive,
  LuFile,
  LuTrash2,
  LuDownload,
  LuEye,
  LuInfo,
  LuCheck,
  LuRefreshCw,
  LuTriangleAlert as LuAlertTriangle,
} from "react-icons/lu";
import api from "../../../../services/api";

/**
 * FileBlockModal Component
 * เครื่องมือเพิ่มและจัดการเนื้อหาไฟล์เอกสาร (UAT-021, UAT-028)
 * รองรับไฟล์: PDF, DOCX, PPTX, XLSX, ZIP
 *
 * สอดคล้องกับข้อกำหนด:
 * - สำหรับ PDF: อัปโหลดผ่าน API /media/upload โดยตรงไปยังเซิร์ฟเวอร์
 * - รองรับการระบุ External URL สำหรับ PDF และเอกสารแนบทุกชนิด
 * - ตรวจสอบ File Type, File Size
 * - บันทึกด้วย content_type: 'pdf' เพื่อให้สอดคล้องกับ ALLOWED_CONTENT_TYPES ของ Backend
 */
function FileBlockModal({
  isOpen,
  onClose,
  initialData = null,
  onSave,
}) {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("pdf"); // 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'zip'
  const [fileSizeText, setFileSizeText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [addedDate, setAddedDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [error, setError] = useState("");

  // ข้อ 23: ตรงกับรายการที่ Backend รับ (ตรวจเนื้อไฟล์จริงอีกชั้นที่ Backend)
  const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"];
  const maxSizeBytes = 50 * 1024 * 1024; // 50 MB

  useEffect(() => {
    if (initialData) {
      setFileUrl(initialData.content_data || "");
      setCaption(initialData.caption || "");
      setFileName(initialData.file_name || initialData.caption || "เอกสารประกอบการเรียน");
      setFileType(initialData.file_type || "pdf");
      setFileSizeText(initialData.file_size || "2.4 MB");
      setAddedDate(initialData.created_at || new Date().toISOString());
      setIsUploaded(Boolean(initialData.content_data && initialData.content_data.includes("/api/v1/media/uploads/")));
    } else {
      setFileUrl("");
      setCaption("");
      setFileName("");
      setFileType("pdf");
      setFileSizeText("");
      setAddedDate(new Date().toISOString());
      setIsUploaded(false);
    }
    setError("");
    setIsUploading(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // ตรวจหาชนิดไฟล์จากนามสกุล
  const detectFileType = (name) => {
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (ext === ".pdf") return "pdf";
    if (ext === ".docx" || ext === ".doc") return "docx";
    if (ext === ".pptx" || ext === ".ppt") return "pptx";
    if (ext === ".xlsx" || ext === ".xls") return "xlsx";
    if (ext === ".zip" || ext === ".rar") return "zip";
    return "other";
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // จัดการเมื่อผู้ใช้เลือกไฟล์
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // เลือกไฟล์เดิมซ้ำได้หลังแก้ไขแล้ว (ข้อ 23)
    if (!file) return;

    setError("");
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    // 1. ตรวจสอบชนิดไฟล์ (Validation)
    if (!allowedExtensions.includes(ext)) {
      setError(`ชนิดไฟล์ไม่ถูกต้อง (${ext}) รองรับเฉพาะ: ${allowedExtensions.join(", ")}`);
      return;
    }

    // 2. ตรวจสอบขนาดไฟล์ (สูงสุด 50 MB)
    if (file.size > maxSizeBytes) {
      setError(`ขนาดไฟล์เกินขีดจำกัดที่อนุญาต (สูงสุด 50 MB) ไฟล์ของคุณมีขนาด ${formatBytes(file.size)}`);
      return;
    }

    const detected = detectFileType(file.name);
    setFileName(file.name);
    setFileType(detected);
    setFileSizeText(formatBytes(file.size));
    if (!caption) {
      setCaption(file.name.replace(/\.[^/.]+$/, ""));
    }
    setAddedDate(new Date().toISOString());

    // 3. อัปโหลดทุกชนิดไปยัง Backend API /media/upload (ข้อ 23)
    //    เดิมไฟล์ที่ไม่ใช่ PDF ถูกแปลงเป็น Base64 เก็บลงฐานข้อมูลโดยไม่ผ่านการตรวจ
    {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const serverUrl = res.data.file_url;
        setFileUrl(serverUrl);
        setIsUploaded(true);
        setError("");
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
        setError(errorMsg);
        setIsUploaded(false);
        setFileUrl("");
        setFileName("");
        setFileSizeText("");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isUploading) {
      setError("กำลังดำเนินการอัปโหลดไฟล์ กรุณารอสักครู่");
      return;
    }
    if (!fileUrl.trim()) {
      setError("กรุณาเลือกไฟล์หรือระบุ URL ของไฟล์");
      return;
    }

    // บันทึกเป็น Content Type: 'pdf' (สอดคล้องกับ ALLOWED_CONTENT_TYPES ของระบบ)
    onSave({
      content_type: "pdf",
      content_data: fileUrl.trim(),
      caption: caption.trim() || fileName,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSizeText,
      created_at: addedDate,
    });
  };

  // เรนเดอร์ไอคอนตามประเภทไฟล์
  const renderFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return <LuFileText className="h-7 w-7 text-rose-600" />;
      case "xlsx":
        return <LuFileSpreadsheet className="h-7 w-7 text-emerald-600" />;
      case "zip":
        return <LuFileArchive className="h-7 w-7 text-amber-600" />;
      default:
        return <LuFile className="h-7 w-7 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-2xl overflow-hidden animate-fadeIn">
        {/* ส่วนหัว Modal */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold">
              <LuFileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#26332F]">
                {initialData ? "แก้ไขไฟล์เอกสาร" : "เพิ่มเอกสารประกอบบทเรียน (PDF / ไฟล์แนบ)"}
              </h3>
              <p className="text-xs text-[#6B7773] mt-0.5">
                รองรับการอัปโหลดไฟล์ PDF เข้าสู่ระบบ และการระบุ URL ภายนอก
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

          {/* กล่องคำแนะนำ */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <LuInfo className="h-4 w-4 text-amber-700 shrink-0" />
              <span>ข้อแนะนำการแนบเอกสาร</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              - <strong>PDF:</strong> สามารถอัปโหลดไฟล์ PDF จากเครื่องเข้าสู่ระบบได้โดยตรง หรือระบุลิงก์ภายนอก<br />
              - <strong>เอกสารอื่น ๆ (DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP):</strong> อัปโหลดเข้าสู่ระบบหรือระบุ URL เพื่อให้ผู้เรียนดาวน์โหลด
            </p>
          </div>

          {/* ช่องกรอก URL หรือเลือกไฟล์ */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ลิงก์ URL หรือ เลือกไฟล์จากเครื่อง <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={fileUrl}
                disabled={isUploading}
                onChange={(e) => {
                  setFileUrl(e.target.value);
                  setIsUploaded(false);
                  setError("");
                }}
                placeholder="https://example.com/document.pdf..."
                className="flex-1 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs sm:text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs disabled:bg-gray-100"
              />
              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/20 px-4 py-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/40 cursor-pointer transition shadow-2xs shrink-0">
                {isUploading ? (
                  <>
                    <LuRefreshCw className="h-4 w-4 animate-spin" />
                    <span>กำลังอัปโหลด...</span>
                  </>
                ) : (
                  <>
                    <LuUpload className="h-4 w-4" />
                    <span>{isUploaded ? "เปลี่ยนไฟล์" : "เลือกไฟล์"}</span>
                  </>
                )}
                <input
                  type="file"
                  accept={allowedExtensions.join(",")}
                  disabled={isUploading}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-[#6B7773]">
              รองรับนามสกุล: {allowedExtensions.join(", ")} (ขนาดไม่เกิน 50 MB)
            </p>
          </div>

          {/* กล่องแสดงข้อมูลไฟล์ (File Card Preview) */}
          {fileName && !isUploading && (
            <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 border border-gray-200">
                  {renderFileIcon(fileType)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-[#26332F] truncate">
                    {fileName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-[#6B7773] mt-0.5">
                    <span className="uppercase font-bold text-[#004643]">
                      {fileType}
                    </span>
                    <span>•</span>
                    <span>{fileSizeText || "ไม่ระบุขนาด"}</span>
                    {isUploaded && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                          <LuCheck className="h-3.5 w-3.5" />
                          <span>อัปโหลดแล้ว</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: ดูไฟล์, ดาวน์โหลด, ลบ */}
              <div className="flex items-center gap-1.5 shrink-0">
                {fileUrl && fileType === "pdf" && (
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 items-center gap-1 rounded-lg border border-[#E5E9E7] px-2.5 text-xs font-semibold text-[#26332F] hover:bg-gray-100 transition"
                    title="เปิดดูไฟล์ในแท็บใหม่"
                  >
                    <LuEye className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">ดูไฟล์</span>
                  </a>
                )}
                {fileUrl && (
                  <a
                    href={fileUrl}
                    download={fileName}
                    className="flex h-8 items-center gap-1 rounded-lg border border-[#ABD1C6] bg-[#ABD1C6]/20 px-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/40 transition"
                    title="ดาวน์โหลดไฟล์"
                  >
                    <LuDownload className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">ดาวน์โหลด</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFileUrl("");
                    setFileName("");
                    setFileSizeText("");
                    setIsUploaded(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition"
                  title="ลบไฟล์นี้"
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ชื่อที่แสดง / คำอธิบายประกอบ (Caption) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ชื่อที่แสดงบนบทเรียน (Caption)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เช่น เอกสารประกอบ IoT 101 หรือ โค้ดตัวอย่างบทที่ 1"
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
              {isUploading ? "กำลังอัปโหลด..." : "บันทึกไฟล์"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FileBlockModal;
