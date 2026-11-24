// ======================================================
// formValidation.js: กติกาตรวจข้อมูลฟอร์มฝั่งหน้าเว็บ (ข้อ 37)
//
// ใช้กติกาเดียวกับ Backend (backend/app/utils/validators.py) เพื่อให้ผู้ใช้เห็นข้อผิดพลาดทันที
// โดยไม่ต้องรอส่งข้อมูล Backend ยังตรวจซ้ำทุกครั้ง (หน้าเว็บถูกข้ามได้เสมอ)
// ทุกฟังก์ชันคืนข้อความภาษาไทยเมื่อไม่ผ่าน หรือ "" เมื่อผ่าน
// ======================================================

const EMAIL_PATTERN = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
const PHONE_ALLOWED = /^\+?[0-9\s\-().]+$/;
const ACADEMIC_YEAR_PATTERN = /^\d{4}(\/[1-3])?$/;

export function requiredText(value, label, { min = 1, max = 255 } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return `กรุณากรอก${label}`;
  if (text.length < min) return `${label}ต้องมีอย่างน้อย ${min} ตัวอักษร`;
  if (text.length > max) return `${label}ต้องยาวไม่เกิน ${max.toLocaleString()} ตัวอักษร`;
  return "";
}

export function optionalText(value, label, max = 255) {
  const text = String(value ?? "").trim();
  if (text.length > max) return `${label}ต้องยาวไม่เกิน ${max.toLocaleString()} ตัวอักษร`;
  return "";
}

export function email(value, { required = false, label = "อีเมล" } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? `กรุณากรอก${label}` : "";
  if (text.length > 255) return `${label}ต้องยาวไม่เกิน 255 ตัวอักษร`;
  if (!EMAIL_PATTERN.test(text)) return `รูปแบบ${label}ไม่ถูกต้อง เช่น name@example.com`;
  return "";
}

export function phone(value, { required = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "กรุณากรอกเบอร์โทรศัพท์" : "";
  const digits = text.replace(/\D/g, "");
  if (!PHONE_ALLOWED.test(text) || digits.length < 9 || digits.length > 15) {
    return "เบอร์โทรศัพท์ไม่ถูกต้อง ต้องเป็นตัวเลข 9-15 หลัก เช่น 02-123-4567";
  }
  return "";
}

export function academicYear(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (!ACADEMIC_YEAR_PATTERN.test(text)) return "ปีการศึกษาต้องเป็นตัวเลข 4 หลัก เช่น 2569 หรือ 2569/1";
  return "";
}

export function integerInRange(value, label, min, max) {
  const text = String(value ?? "").trim();
  if (!text) return `กรุณากรอก${label}`;
  const number = Number(text);
  if (!Number.isFinite(number) || !Number.isInteger(number)) return `${label}ต้องเป็นจำนวนเต็ม`;
  if (number < min || number > max) return `${label}ต้องอยู่ระหว่าง ${min}-${max}`;
  return "";
}

/** คืนข้อความแรกที่ไม่ผ่าน หรือ "" เมื่อผ่านทั้งหมด */
export function firstError(...messages) {
  return messages.find(Boolean) || "";
}

// ช่วงค่าตั้งค่าระบบ ต้องตรงกับ EDITABLE_SETTINGS ใน backend/app/services/settings_service.py
export const SETTING_LIMITS = {
  session_timeout_minutes: { label: "เวลา Session หมดอายุ (นาที)", min: 5, max: 480 },
  warning_countdown_seconds: { label: "เวลานับถอยหลังก่อนออกจากระบบ (วินาที)", min: 30, max: 600 },
  guest_timeout_minutes: { label: "เวลาแจ้งเตือน Guest (นาที)", min: 1, max: 240 },
};
