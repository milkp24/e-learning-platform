import api from "./api";

// ======================================================
// Admin Service (บริการจัดการระบบสำหรับ Admin)
// รองรับ UAT-015, UAT-020, UAT-021, UAT-022, UAT-023, UAT-024, UAT-025, UAT-035
// ======================================================

export const adminService = {
  // ดึงรายชื่อผู้ใช้ทั้งหมด พร้อมการค้นหา กรอง และแบ่งหน้า (GET /api/v1/admin/users)
  // params: { search, role, status, page, per_page }
  async getUsers(params = {}) {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  // เปลี่ยนสถานะผู้ใช้ (PUT /api/v1/admin/users/:id/status)
  // รับข้อมูล: { status: 'active' | 'inactive' | 'suspended' }
  async updateUserStatus(userId, status) {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  // เปลี่ยนบทบาทผู้ใช้ (PUT /api/v1/admin/users/:id/roles)
  // รับข้อมูล: { roles: ['student', 'instructor', 'admin'] }
  async updateUserRoles(userId, roles) {
    const response = await api.put(`/admin/users/${userId}/roles`, { roles });
    return response.data;
  },

  // ดึงการตั้งค่าทั้งหมดของระบบสำหรับ Admin (GET /api/v1/admin/settings)
  async getSettings() {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  // อัปเดตการตั้งค่าระบบ เช่น เวลา Timeout (PUT /api/v1/admin/settings)
  async updateSettings(settingsData) {
    const response = await api.put("/admin/settings", settingsData);
    return response.data;
  },

  // ดึงค่าตั้งค่าสาธารณะ เช่น เวลา Timeout (GET /api/v1/settings/public)
  async getPublicSettings() {
    const response = await api.get("/settings/public");
    return response.data;
  },
};

export default adminService;
