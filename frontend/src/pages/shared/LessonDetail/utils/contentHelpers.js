/**
 * Helper to get form label, placeholder, and row count according to Content Type.
 */
export const getContentHelper = (type) => {
  switch (type) {
    case "text":
      return {
        label: "ข้อความเนื้อหา (Text Content)",
        placeholder: "พิมพ์ข้อความคำอธิบายเนื้อหาที่นี่...",
        rows: 6,
      };
    case "video":
      return {
        label: "URL วิดีโอ (Video URL)",
        placeholder: "https://www.youtube.com/watch?v=... หรือ direct link",
        rows: 2,
      };
    case "youtube":
      return {
        label: "URL วิดีโอ YouTube (Safe YouTube Embed)",
        placeholder: "https://www.youtube.com/watch?v=... หรือ https://youtu.be/...",
        rows: 2,
      };
    case "pdf":
      return {
        label: "URL ไฟล์ PDF (PDF Document URL)",
        placeholder: "https://example.com/document.pdf",
        rows: 2,
      };
    case "image":
      return {
        label: "ที่อยู่รูปภาพ (Image Path/URL)",
        placeholder: "/images/classroom-default.svg หรือ URL/Path รูปภาพในโปรเจกต์",
        rows: 2,
      };
    case "code":
      return {
        label: "ซอร์สโค้ดโปรแกรม (Source Code)",
        placeholder: "// วางซอร์สโค้ดที่ต้องการแสดงที่นี่...",
        rows: 8,
      };
    default:
      return { label: "ข้อมูลเนื้อหา", placeholder: "", rows: 4 };
  }
};
