// ======================================================
// userDisplay — ชื่อที่แสดงบนปุ่มโปรไฟล์มุมขวาบน
// ถ้าชื่อแสดงผลซ้ำกับชื่อบทบาท (เช่น บัญชีตั้งต้นชื่อ "Super Admin" บทบาท "Super Admin")
// ให้แสดงอีเมลแทน จะได้ไม่ขึ้นคำเดียวกันสองบรรทัด
// ======================================================

export function getHeaderName(user, roleLabel = "", fallback = "ผู้ใช้งาน") {
  const display = (user?.profile?.display_name || "").trim();
  const emailName = user?.email || "";
  const norm = (v) => v.replace(/\s+/g, "").toLowerCase();
  if (display && (!roleLabel || norm(display) !== norm(roleLabel))) return display;
  return emailName || display || fallback;
}

export default getHeaderName;
