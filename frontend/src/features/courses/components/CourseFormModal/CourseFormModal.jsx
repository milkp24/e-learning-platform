import { useEffect, useState } from "react";
import { LuX, LuUpload, LuFilePen, LuSend } from "react-icons/lu";

// ======================================================
// CourseFormModal — ฟอร์มสร้าง / แก้ไขคอร์ส (ใช้ร่วมกันทุกหน้า ทุกบทบาท)
// - mode="create": เลือกได้ว่าจะสร้างเป็นฉบับร่าง หรือเผยแพร่
//                   (ผู้ไม่มีสิทธิ์ courses.publish จะเห็นเป็น "ส่งตรวจก่อนเผยแพร่")
// - mode="edit":   แก้ชื่อ คำอธิบาย รูปปก (เปลี่ยนสถานะใช้ปุ่มสถานะบนการ์ด/ตาราง)
// ส่งเฉพาะฟิลด์ที่ Backend บันทึกจริง (ชื่อ, คำอธิบาย, รูปปก, สถานะ)
// ======================================================

function getCreateOptions(canPublish) {
  return [
    {
      key: "draft",
      label: "ฉบับร่าง",
      hint: "ยังไม่มีผู้เรียนเห็น ทำเนื้อหาให้เสร็จก่อนแล้วค่อยเผยแพร่",
      icon: LuFilePen,
    },
    canPublish
      ? {
          key: "active",
          label: "เผยแพร่ทันที",
          hint: "ผู้เรียนและผู้เยี่ยมชมเห็นคอร์สและลงทะเบียนได้เลย",
          icon: LuSend,
        }
      : {
          key: "active",
          label: "ส่งตรวจก่อนเผยแพร่",
          hint: "ส่งให้ผู้ดูแลตรวจสอบ คอร์สจะเผยแพร่เมื่อได้รับการอนุมัติ",
          icon: LuSend,
        },
  ];
}

const inputClass =
  "w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs";
const labelClass = "block text-xs font-bold uppercase tracking-wider text-[#26332F]";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function CourseFormModal({
  isOpen,
  mode = "create",
  course = null,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = "",
  canPublish = false,
}) {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [previewError, setPreviewError] = useState(false);
  const [fileError, setFileError] = useState("");

  // เปิดฟอร์มใหม่ทุกครั้ง: โหมดแก้ไขเติมค่าเดิม, โหมดสร้างล้างค่า (เริ่มที่ฉบับร่าง)
  useEffect(() => {
    if (!isOpen) return;
    setTitle(isEdit ? course?.title || "" : "");
    setDescription(isEdit ? course?.description || "" : "");
    setThumbnailUrl(isEdit ? course?.thumbnail_url || course?.cover_image || "" : "");
    setStatus("draft");
    setPreviewError(false);
    setFileError("");
  }, [isOpen, isEdit, course]);

  if (!isOpen || (isEdit && !course)) return null;

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (เช่น .jpg, .png)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB");
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailUrl(event.target.result);
      setPreviewError(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl.trim() || null,
    };
    if (!isEdit) payload.status = status;
    onSubmit(payload);
  };

  const submitLabel = isEdit
    ? isSubmitting
      ? "กำลังบันทึก..."
      : "บันทึกการแก้ไข"
    : isSubmitting
    ? "กำลังสร้างคอร์ส..."
    : "สร้างคอร์สและจัดการเนื้อหา →";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-form-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-3.5">
          <div>
            <h3 id="course-form-title" className="text-lg font-black text-[#26332F]">
              {isEdit ? "แก้ไขคอร์สเรียน" : "สร้างคอร์สเรียนใหม่"}
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              {isEdit
                ? "แก้ไขข้อมูลที่แสดงบนการ์ดคอร์ส"
                : "กรอกข้อมูลคอร์ส แล้วเลือกว่าจะเก็บเป็นฉบับร่างหรือเผยแพร่"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
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
          <div className="space-y-1.5">
            <label htmlFor="course-title" className={labelClass}>
              ชื่อคอร์ส <span className="text-rose-600">*</span>
            </label>
            <input
              id="course-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น IoT 101 — ภารกิจปลุกเมืองให้ฉลาด"
              className={`${inputClass} font-semibold`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="course-description" className={labelClass}>
              คำอธิบาย
            </label>
            <textarea
              id="course-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ผู้เรียนจะได้เรียนรู้อะไรจากคอร์สนี้"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* สร้างใหม่: เลือกฉบับร่าง หรือเผยแพร่ / ส่งตรวจ ตามสิทธิ์ */}
          {!isEdit && (
          <fieldset className="space-y-2">
            <legend className={labelClass}>สร้างคอร์สแบบ</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {getCreateOptions(canPublish).map((opt) => {
                const key = opt.key;
                const Icon = opt.icon;
                const selected = status === key;
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition ${
                      selected
                        ? "border-[#004643] bg-[#ABD1C6]/20 ring-1 ring-[#004643]"
                        : "border-[#E5E9E7] bg-white hover:border-[#ABD1C6]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="course-status"
                      value={key}
                      checked={selected}
                      onChange={() => setStatus(key)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-[#004643] text-white" : "bg-gray-100 text-[#6B7773]"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-sm font-bold text-[#26332F]">{opt.label}</span>
                      <span className="block text-xs text-[#6B7773]">{opt.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          )}

          <div className="space-y-2">
            <span className={labelClass}>รูปปกคอร์ส</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                aria-label="ลิงก์รูปปก"
                value={thumbnailUrl.startsWith("data:") ? "" : thumbnailUrl}
                onChange={(e) => {
                  setThumbnailUrl(e.target.value);
                  setPreviewError(false);
                }}
                placeholder={
                  thumbnailUrl.startsWith("data:")
                    ? "ใช้รูปที่เลือกจากเครื่อง"
                    : "วางลิงก์รูปภาพ หรือเลือกรูปจากเครื่อง"
                }
                className={`flex-1 ${inputClass} text-xs sm:text-sm`}
              />
              <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-[#ABD1C6]/20 px-4 py-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/40 cursor-pointer transition">
                <LuUpload className="h-4 w-4" aria-hidden="true" />
                <span>เลือกรูปจากเครื่อง</span>
                <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
              </label>
            </div>
            {fileError && <p className="text-xs font-semibold text-rose-600">{fileError}</p>}
            {thumbnailUrl && !previewError && (
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-[#E5E9E7] bg-gray-50 h-36">
                <img
                  src={thumbnailUrl}
                  alt="ตัวอย่างรูปปก"
                  onError={() => setPreviewError(true)}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl("")}
                  className="absolute top-2 right-2 rounded-xl bg-black/60 p-1.5 text-white hover:bg-black/80 transition cursor-pointer"
                  title="เอารูปปกออก"
                >
                  <LuX className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
            {previewError && (
              <p className="text-xs text-rose-600">
                โหลดรูปจากลิงก์นี้ไม่ได้ กรุณาตรวจสอบลิงก์อีกครั้ง
              </p>
            )}
          </div>

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
              disabled={isSubmitting || !title.trim()}
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] disabled:opacity-50 transition cursor-pointer shadow-sm"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseFormModal;
