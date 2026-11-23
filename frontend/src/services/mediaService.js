import api from "./api";

// ======================================================
// Media Service — อัปโหลดรูปภาพ (รูปปกคอร์ส, รูปโปรไฟล์) ข้อ 22, 23
// POST /api/v1/media/images (multipart, คีย์ "file")
// Backend ตรวจชนิดไฟล์จากเนื้อไฟล์จริงและขนาดไม่เกิน 5 MB
// คืน relative_url ไว้บันทึกลงฐานข้อมูลแทน Base64
// ======================================================

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** ตรวจไฟล์ฝั่งหน้าเว็บก่อนอัปโหลด คืนข้อความผิดพลาด หรือ "" ถ้าผ่าน */
export function validateImageFile(file) {
  if (!file) return "กรุณาเลือกไฟล์รูปภาพ";
  if (!IMAGE_TYPES.includes(file.type)) return "รองรับเฉพาะไฟล์รูปภาพ PNG, JPG หรือ WEBP เท่านั้น";
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `รูปภาพต้องมีขนาดไม่เกิน 5 MB (ไฟล์นี้ ${mb} MB) กรุณาย่อรูปแล้วลองใหม่`;
  }
  return "";
}

export const mediaService = {
  async uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/media/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default mediaService;
