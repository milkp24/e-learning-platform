import api from "./api";

// ======================================================
// Auth Service (บริการจัดการระบบสมาชิกและการยืนยันตัวตน)
// ======================================================
// รองรับ UAT-004, UAT-005, UAT-006, UAT-007, UAT-011, UAT-013, UAT-014

export const authService = {
  /**
   * สมัครสมาชิกใหม่ (POST /api/auth/register)
   * รองรับทั้งการส่ง Object ครบฟิลด์ (first_name, last_name, phone_number ฯลฯ) หรือพารามิเตอร์พื้นฐาน
   */
  async register(payloadOrEmail, password, displayName) {
    const payload =
      typeof payloadOrEmail === "object" && payloadOrEmail !== null
        ? payloadOrEmail
        : {
            email: payloadOrEmail,
            password,
            display_name: displayName,
          };
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  /**
   * ยืนยันตัวตนเข้าสู่ระบบ (POST /api/auth/login)
   * ตรวจสอบอีเมลและรหัสผ่าน พร้อมรับ Access Token และ Refresh Token
   */
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  /**
   * ขอ Access Token ใหม่ด้วย Refresh Token (POST /api/auth/refresh)
   * ใช้เมื่อ Access Token หมดอายุ เพื่อให้ผู้ใช้สามารถใช้งานระบบได้อย่างต่อเนื่องโดยไม่ต้อง Login ใหม่
   */
  async refreshToken() {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  /**
   * ออกจากระบบ (POST /api/auth/logout)
   * ส่งคำขอไปยังเซิร์ฟเวอร์เพื่อบันทึก Token เข้าสู่ Database Blocklist ป้องกันการนำกลับมาใช้ซ้ำ
   */
  async logout() {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * ดึงข้อมูลผู้ใช้งานปัจจุบัน (GET /api/auth/me)
   * ตรวจสอบสถานะบัญชีและบทบาทล่าสุดจากเซิร์ฟเวอร์
   */
  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  /**
   * อัปเดตข้อมูลโปรไฟล์ผู้ใช้ (PUT /api/users/me/profile)
   * จัดเก็บข้อมูลผู้ใช้และรูปภาพ (ในรูปแบบ Data URL หรือ Image URL) ลงในฐานข้อมูล
   */
  async updateProfile(data) {
    const response = await api.put("/users/me/profile", data);
    return response.data;
  },

  /**
   * ขอรับลิงก์สำหรับตั้งรหัสผ่านใหม่ (POST /api/auth/forgot-password)
   * ส่งคำขอไปยังเซิร์ฟเวอร์เพื่อสร้าง Reset Token และส่งอีเมลยืนยันตัวตน
   */
  async forgotPassword(email) {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  /**
   * ตั้งรหัสผ่านใหม่ด้วย Reset Token (POST /api/auth/reset-password)
   * บันทึกรหัสผ่านใหม่ลงฐานข้อมูลหลังจากยืนยันความถูกต้องของ Token
   */
  async resetPassword(token, password) {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  },

  /**
   * เปลี่ยนรหัสผ่านสำหรับผู้ใช้งานที่เข้าสู่ระบบแล้ว (POST /api/v1/auth/change-password)
   * ส่งรหัสผ่านปัจจุบัน รหัสผ่านใหม่ และการยืนยันรหัสผ่านไปยังเซิร์ฟเวอร์
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    const response = await api.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },
};

export default authService;
