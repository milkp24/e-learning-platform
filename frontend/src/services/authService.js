import api from "./api";

// ======================================================
// Auth Service (บริการจัดการระบบสมาชิกและการยืนยันตัวตน)
// ======================================================
// รองรับ UAT-004, UAT-005, UAT-006, UAT-007, UAT-011, UAT-013, UAT-014

export const authService = {
  // สมัครสมาชิกใหม่ (POST /api/v1/auth/register)
  async register(email, password, displayName) {
    const response = await api.post("/auth/register", {
      email,
      password,
      display_name: displayName,
    });
    return response.data;
  },

  // เข้าสู่ระบบ (POST /api/v1/auth/login)
  async login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  // ต่ออายุ Access Token (POST /api/v1/auth/refresh)
  async refreshToken() {
    const response = await api.post("/auth/refresh");
    return response.data;
  },

  // ออกจากระบบ (POST /api/v1/auth/logout)
  async logout() {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch {
      return null;
    }
  },

  // ดึงข้อมูลบัญชีและโปรไฟล์ของผู้ใช้ปัจจุบัน (GET /api/v1/auth/me)
  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // อัปเดตข้อมูลโปรไฟล์ (PUT /api/v1/users/me/profile)
  async updateProfile(data) {
    const response = await api.put("/users/me/profile", data);
    return response.data;
  },

  // ขอลิงก์รีเซ็ตรหัสผ่าน (POST /api/v1/auth/forgot-password)
  async forgotPassword(email) {
    // ส่งคำขอ POST ไปยัง /auth/forgot-password พร้อมอีเมล
    const response = await api.post("/auth/forgot-password", { email });
    // ส่งคืนข้อมูลการตอบกลับจาก Backend
    return response.data;
  },

  // ตั้งรหัสผ่านใหม่ด้วย Token (POST /api/v1/auth/reset-password)
  async resetPassword(token, password) {
    // ส่งคำขอ POST ไปยัง /auth/reset-password พร้อม Token และรหัสผ่านใหม่
    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
    // ส่งคืนข้อมูลการตอบกลับจาก Backend
    return response.data;
  },
};

export default authService;
