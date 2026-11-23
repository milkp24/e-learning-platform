import { useState, useRef, useEffect } from "react";
import {
  LuUpload,
  LuTrash2,
  LuRefreshCw,
  LuTriangleAlert as LuAlertTriangle,
  LuCheck,
  LuInfo,
} from "react-icons/lu";
import { IMAGE_ACCEPT, mediaService, validateImageFile } from "../../../../services/mediaService";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";
import { notify } from "../../../../store/useToastStore";

/**
 * EditProfileSection Component
 * จัดการการแก้ไขข้อมูลที่ Backend รองรับจริง:
 * 1. display_name (ชื่อแสดงผล)
 * 2. profile_image (รูปภาพโปรไฟล์) ข้อ 34: เลือกรูปแล้วอัปโหลดขึ้นเซิร์ฟเวอร์ทันที
 *    เก็บแค่ที่อยู่ไฟล์ (ไม่เก็บ Base64) รูปจะไปแสดงที่ปุ่มโปรไฟล์มุมขวาบนทุกหน้า
 *
 * หมายเหตุความโปร่งใสทางสถาปัตยกรรม:
 * - ข้อมูลจากการลงทะเบียน (first_name, last_name, occupation, institution_name, institution_email)
 *   แสดงเป็นข้อมูลยืนยันตัวตนทางการ ไม่ส่งไปยัง PUT API ตามข้อกำหนด
 */
function EditProfileSection({
  user,
  displayName,
  onDisplayNameChange,
  profileImage,
  onProfileImageChange,
  onSubmit,
  isLoading,
}) {
  const [imageMode, setImageMode] = useState("file"); // 'file' | 'url'
  const [selectedFileMeta, setSelectedFileMeta] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const uploadSeq = useRef(0);

  useEffect(() => {
    if (!localPreview) return undefined;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const previewSrc = localPreview || resolveMediaUrl(profileImage);
  const isUploadedFile = profileImage.startsWith("/api/") || profileImage.startsWith("data:");

  const formatBytes = (bytes) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = ""; // เลือกไฟล์เดิมซ้ำได้
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      setFileError(invalid);
      return;
    }
    setFileError("");
    setLocalPreview(URL.createObjectURL(file));
    setSelectedFileMeta({ name: file.name, size: formatBytes(file.size), type: file.type });

    const seq = ++uploadSeq.current;
    setIsUploading(true);
    const toastId = notify.loading("กำลังอัปโหลดรูปโปรไฟล์...");
    try {
      const res = await mediaService.uploadImage(file);
      if (seq !== uploadSeq.current) return notify.dismiss(toastId);
      onProfileImageChange(res.relative_url || res.file_url);
      notify.update(toastId, { type: "success", text: "อัปโหลดรูปแล้ว กด \"บันทึกการเปลี่ยนแปลง\" เพื่อใช้รูปนี้" });
    } catch (err) {
      if (seq !== uploadSeq.current) return notify.dismiss(toastId);
      setLocalPreview("");
      setSelectedFileMeta(null);
      const msg = err.response?.data?.message || "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      setFileError(msg);
      notify.update(toastId, { type: "error", text: msg });
    } finally {
      if (seq === uploadSeq.current) setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    uploadSeq.current += 1;
    setIsUploading(false);
    setLocalPreview("");
    onProfileImageChange("");
    setSelectedFileMeta(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const profile = user?.profile || {};
  const registeredName =
    profile.first_name || profile.last_name
      ? `${profile.title ? profile.title + " " : ""}${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : "-";

  return (
    <div className="rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-black text-[#26332F]">แก้ไขข้อมูลโปรไฟล์</h2>
        <p className="text-xs text-[#6B7773] mt-0.5">
          คุณสามารถปรับเปลี่ยนชื่อแสดงผลและรูปภาพโปรไฟล์ประจำบัญชีของคุณได้
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* ==================================================== */}
        {/* 1. ส่วนเลือกและพรีวิวรูปภาพโปรไฟล์ (Profile Image Picker) */}
        {/* ==================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              รูปภาพโปรไฟล์ (Profile Image)
            </label>
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setImageMode("file")}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  imageMode === "file"
                    ? "bg-white text-[#004643] shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                เลือกไฟล์จากเครื่อง
              </button>
              <button
                type="button"
                onClick={() => setImageMode("url")}
                className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                  imageMode === "url"
                    ? "bg-white text-[#004643] shadow-2xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                ระบุ URL
              </button>
            </div>
          </div>

          {/* พรีวิวรูปภาพพร้อมข้อมูลไฟล์ */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#FAFAFA] rounded-2xl border border-[#E5E9E7]">
            <div className="relative shrink-0">
              <img
                src={previewSrc || "/images/default-avatar.svg"}
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-[#ABD1C6] bg-white shadow-2xs"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/default-avatar.svg";
                }}
              />
              {profileImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition shadow-xs cursor-pointer"
                  title="ลบรูปโปรไฟล์"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              {selectedFileMeta ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#26332F] truncate">
                    ไฟล์ที่เลือก: {selectedFileMeta.name}
                  </p>
                  <p className="text-[11px] text-[#6B7773]">
                    ขนาด: <span className="font-semibold text-emerald-700">{selectedFileMeta.size}</span>
                  </p>
                  {isUploading ? (
                    <div className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-[#26332F] border border-gray-200">
                      <LuRefreshCw className="h-3 w-3 animate-spin" />
                      <span>กำลังอัปโหลด...</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      <LuCheck className="h-3 w-3 text-emerald-600" />
                      <span>อัปโหลดแล้ว กดบันทึกเพื่อใช้รูปนี้</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#26332F]">
                    {profileImage ? "ภาพโปรไฟล์ปัจจุบัน" : "ยังไม่ได้เลือกรูปภาพ"}
                  </p>
                  <p className="text-[11px] text-[#6B7773]">
                    รองรับไฟล์ PNG, JPG หรือ WEBP ขนาดไม่เกิน 5 MB
                  </p>
                </div>
              )}

              {/* ปุ่ม Action เลือกไฟล์หรือลบ */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                {imageMode === "file" && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={IMAGE_ACCEPT}
                      onChange={handleFileChange}
                      className="hidden"
                      id="profile-image-upload"
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-white px-3.5 py-1.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/15 transition cursor-pointer shadow-2xs"
                    >
                      <LuUpload className="h-3.5 w-3.5" />
                      <span>{profileImage ? "เปลี่ยนรูปภาพจากเครื่อง" : "เลือกรูปภาพจากเครื่อง"}</span>
                    </label>
                  </>
                )}

                {profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                    <span>รีเซ็ตเป็นรูปเริ่มต้น</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ข้อความแจ้งเตือนความผิดพลาดของไฟล์ (ถ้ามี) */}
          {fileError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <LuAlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{fileError}</span>
            </div>
          )}

          {/* ช่องกรอก URL ในกรณีเลือกโหมด URL */}
          {imageMode === "url" && (
            <div className="space-y-1 animate-fadeIn">
              <input
                type="text"
                value={isUploadedFile ? "" : profileImage}
                onChange={(e) => {
                  uploadSeq.current += 1;
                  setIsUploading(false);
                  setLocalPreview("");
                  setSelectedFileMeta(null);
                  onProfileImageChange(e.target.value);
                }}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-xs outline-none transition focus:border-[#ABD1C6] focus:ring-2 focus:ring-[#ABD1C6]/30 font-mono"
              />
              <p className="text-[11px] text-[#6B7773]">
                * ระบุ URL รูปภาพที่สามารถเข้าถึงได้จากอินเทอร์เน็ต
              </p>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* 2. ช่องแก้ไข Display Name (ฟิลด์ที่ Backend รองรับ) */}
        {/* ==================================================== */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F] mb-1.5">
            ชื่อแสดงผลในระบบ (Display Name) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="ระบุชื่อที่คุณต้องการให้แสดงในระบบ"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#ABD1C6] focus:ring-2 focus:ring-[#ABD1C6]/30"
          />
          <p className="text-[11px] text-[#6B7773] mt-1">
            ชื่อนี้จะแสดงในความคิดเห็น แดชบอร์ด และใบประกาศนียบัตร
          </p>
        </div>

        {/* ==================================================== */}
        {/* 3. ข้อมูลจากการลงทะเบียน (Read-only Verification Data) */}
        {/* ==================================================== */}
        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B7773]">
            <LuInfo className="h-3.5 w-3.5 text-[#004643]" />
            <span>ข้อมูลจากการลงทะเบียน (ไม่สามารถแก้ไขได้ในรอบนี้)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#26332F]">
            <div>
              <span className="text-[#6B7773]">ชื่อ-สกุลทางการ: </span>
              <strong className="font-semibold">{registeredName}</strong>
            </div>
            <div>
              <span className="text-[#6B7773]">อีเมลบัญชี: </span>
              <strong className="font-semibold">{user?.email || "-"}</strong>
            </div>
            <div>
              <span className="text-[#6B7773]">อาชีพ: </span>
              <strong className="font-semibold">{profile.occupation || "-"}</strong>
            </div>
            <div>
              <span className="text-[#6B7773]">สถาบัน/หน่วยงาน: </span>
              <strong className="font-semibold">{profile.institution_name || "-"}</strong>
            </div>
          </div>
          <p className="text-[10px] text-[#6B7773] pt-1 border-t border-gray-200/60">
            * หากต้องการเปลี่ยนแปลงข้อมูลการลงทะเบียนทางการ กรุณาติดต่อผู้ดูแลระบบ
          </p>
        </div>

        {/* ==================================================== */}
        {/* 4. ปุ่มบันทึกการเปลี่ยนแปลง */}
        {/* ==================================================== */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading && <LuRefreshCw className="h-4 w-4 animate-spin" />}
            <span>{isLoading ? "กำลังบันทึกข้อมูล..." : "บันทึกการเปลี่ยนแปลง"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfileSection;
