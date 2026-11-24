// ======================================================
// errorMessage.js: ข้อความ Error ที่ผู้ใช้อ่านเข้าใจ (ข้อ 39)
//
// ทุกคำขอที่ผ่าน services/api.js จะถูกปรับข้อความ Error ที่นี่ก่อนถึงหน้าเว็บ
// - ข้อความจาก Backend ที่เป็นภาษาไทยอยู่แล้ว ใช้ตามเดิม (Backend เขียนให้ผู้ใช้อ่าน)
// - ข้อความภาษาอังกฤษ/ทางเทคนิค แทนด้วยข้อความภาษาไทยตามสถานะ HTTP ที่บอกว่าต้องทำอะไรต่อ
// - ข้อความเดิมเก็บไว้ที่ error.technicalMessage สำหรับนักพัฒนา (ไม่แสดงบนหน้าจอ)
// ======================================================

const THAI_PATTERN = /[฀-๿]/;

export const NETWORK_ERROR_MESSAGE =
  "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";
export const TIMEOUT_ERROR_MESSAGE = "เซิร์ฟเวอร์ตอบกลับช้าเกินไป กรุณาลองใหม่อีกครั้ง";
export const DEFAULT_ERROR_MESSAGE = "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง";

const STATUS_MESSAGES = {
  400: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง",
  401: "กรุณาเข้าสู่ระบบก่อนใช้งาน",
  403: "คุณไม่มีสิทธิ์ทำรายการนี้ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ",
  404: "ไม่พบข้อมูลที่ต้องการ ข้อมูลอาจถูกลบไปแล้ว กรุณารีเฟรชหน้าแล้วลองใหม่",
  405: "ไม่รองรับการทำรายการนี้ กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง",
  409: "ข้อมูลนี้มีอยู่ในระบบแล้ว กรุณาใช้ค่าอื่น",
  413: "ไฟล์หรือข้อมูลมีขนาดใหญ่เกินกำหนด กรุณาเลือกไฟล์ที่เล็กลง",
  422: "ข้อมูลที่กรอกไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง",
  429: "คำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
};

const SERVER_ERROR_MESSAGE =
  "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่ หากยังไม่ได้ให้แจ้งผู้ดูแลระบบ";

export function isUserFriendly(message) {
  return typeof message === "string" && THAI_PATTERN.test(message);
}

/** ข้อความภาษาไทยตามสถานะ HTTP */
export function messageForStatus(status) {
  if (status >= 500) return SERVER_ERROR_MESSAGE;
  return STATUS_MESSAGES[status] || DEFAULT_ERROR_MESSAGE;
}

/** ข้อความสำหรับแสดงผลจาก Error ของ axios (ใช้เองได้ในหน้าเว็บ) */
export function getErrorMessage(error, fallback = DEFAULT_ERROR_MESSAGE) {
  if (!error) return fallback;
  const response = error.response;
  if (!response) {
    if (error.code === "ECONNABORTED") return TIMEOUT_ERROR_MESSAGE;
    if (error.code === "ERR_CANCELED") return fallback;
    return isUserFriendly(error.message) ? error.message : NETWORK_ERROR_MESSAGE;
  }
  const serverMessage = response.data?.message;
  if (isUserFriendly(serverMessage)) return serverMessage;
  return messageForStatus(response.status) || fallback;
}

/**
 * ปรับ Error ของ axios ให้ข้อความที่หน้าเว็บอ่าน (response.data.message, error.message)
 * เป็นภาษาไทยที่เข้าใจง่าย หน้าเว็บเดิมที่ใช้ err.response?.data?.message จึงได้ข้อความใหม่ทันที
 */
export function normalizeApiError(error) {
  if (!error || error.__normalized) return error;
  const friendly = getErrorMessage(error);
  const response = error.response;
  if (response) {
    const data = response.data && typeof response.data === "object" ? response.data : {};
    if (!isUserFriendly(data.message)) {
      error.technicalMessage = data.message || data.error || error.message;
      response.data = { ...data, message: friendly };
    }
  } else {
    error.technicalMessage = error.message;
  }
  error.message = friendly;
  error.__normalized = true;
  return error;
}

export default getErrorMessage;
