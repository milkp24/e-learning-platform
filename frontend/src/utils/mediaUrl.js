// ======================================================
// mediaUrl — แปลงที่อยู่ไฟล์ที่อัปโหลด (เช่น รูปปกคอร์ส) ให้เปิดได้จากหน้าเว็บ
// Backend เก็บเป็น path "/api/v1/media/uploads/<ไฟล์>" (ไม่ผูกชื่อโฮสต์) ข้อ 22
// หน้าเว็บกับ API อยู่คนละพอร์ต จึงต้องเติมโฮสต์ของ API ด้านหน้า
// ลิงก์ภายนอก (https://...) และ data: (ตัวอย่างก่อนอัปโหลด) คืนค่าเดิม
// ======================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

function apiOrigin() {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "";
  }
}

export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("/api/")) return `${apiOrigin()}${url}`;
  return url;
}

export default resolveMediaUrl;
