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

  // ดึงข้อมูลรายละเอียดผู้ใช้ (GET /api/v1/admin/users/:id)
  async getUserById(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // อัปเดตข้อมูลบัญชีและโปรไฟล์ของผู้ใช้ (PATCH /api/v1/admin/users/:id)
  async updateUser(userId, data) {
    const response = await api.patch(`/admin/users/${userId}`, data);
    return response.data;
  },

  // สร้างบัญชีผู้ใช้งานใหม่โดย Admin / Super Admin (POST /api/v1/admin/users)
  async createUser(data) {
    const response = await api.post("/admin/users", data);
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

  // ดึงสถิติจริงสำหรับ Super Admin Console (GET /api/v1/admin/dashboard/superadmin-stats)
  async getSuperAdminStats() {
    const response = await api.get("/admin/dashboard/superadmin-stats");
    return response.data;
  },

  // ดึงสถิติจริงสำหรับ Admin Dashboard (GET /api/v1/admin/dashboard/admin-stats)
  async getAdminStats() {
    const response = await api.get("/admin/dashboard/admin-stats");
    return response.data;
  },

  // ดึงข้อมูลกิจกรรมรายวันจริงสำหรับกราฟ ActivityChart (GET /api/v1/admin/dashboard/daily-activity)
  async getDailyActivity() {
    const response = await api.get("/admin/dashboard/daily-activity");
    return response.data;
  },

  // ดึงประวัติ Audit Logs จริงจากฐานข้อมูล (GET /api/v1/admin/audit-logs)
  async getAuditLogs(params = {}) {
    const response = await api.get("/admin/audit-logs", { params });
    return response.data;
  },

  // ดึงรายชื่อบุคลากรผู้ดูแลระบบจริง (Super Admin + Admin) (GET /api/v1/admin/staff)
  async getStaff() {
    const response = await api.get("/admin/staff");
    return response.data;
  },

  // ดึงข้อมูลความปลอดภัยจริง (GET /api/v1/admin/security/overview)
  async getSecurityOverview() {
    const response = await api.get("/admin/security/overview");
    return response.data;
  },

  // ดึงข้อมูลการใช้งานระบบจริง (GET /api/v1/admin/usage-overview)
  async getUsageOverview(params = {}) {
    const response = await api.get("/admin/usage-overview", { params });
    return response.data;
  },

  // ข้อ 32: รายงานจากข้อมูลจริงตามช่วงวันที่ (GET /api/v1/admin/reports/summary)
  async getReportsSummary(params = {}) {
    const response = await api.get("/admin/reports/summary", { params });
    return response.data;
  },

  // ข้อ 32: ดาวน์โหลดรายงานเป็นไฟล์ CSV (GET /api/v1/admin/reports/export)
  async downloadReportCsv(params = {}) {
    let response;
    try {
      response = await api.get("/admin/reports/export", {
        params: { ...params, format: "csv" },
        responseType: "blob",
      });
    } catch (err) {
      // คำตอบ Error มาเป็น Blob อ่านข้อความภาษาไทยจาก Backend ออกมาแสดง
      const blob = err.response?.data;
      if (blob instanceof Blob) {
        try {
          const data = JSON.parse(await blob.text());
          if (data?.message) {
            err.response.data = data;
            err.message = data.message;
          }
        } catch {
          // ไม่ใช่ JSON ใช้ข้อความเดิม
        }
      }
      throw err;
    }
    const disposition = response.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename="?([^";]+)"?/);
    const filename = match ? match[1] : "elearning-report.csv";
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return filename;
  },

  // ลบบัญชีผู้ใช้ (DELETE /api/v1/admin/users/:id) - เฉพาะ Super Admin
  // ข้อ 8: Super Admin ตั้งรหัสผ่านใหม่ให้ผู้ใช้อื่น (ไม่ต้องรู้รหัสเดิม)
  async setUserPassword(userId, newPassword, confirmPassword) {
    const response = await api.put(`/admin/users/${userId}/password`, {
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ดึงรายการโรงเรียนทั้งหมด (GET /api/v1/admin/schools)
  async getSchools(params = {}) {
    const response = await api.get("/admin/schools", { params });
    return response.data;
  },

  // ดึงรายละเอียดโรงเรียน (GET /api/v1/admin/schools/:id)
  async getSchoolById(schoolId) {
    const response = await api.get(`/admin/schools/${schoolId}`);
    return response.data;
  },

  // สร้างโรงเรียนใหม่ (POST /api/v1/admin/schools)
  async createSchool(data) {
    const response = await api.post("/admin/schools", data);
    return response.data;
  },

  // แก้ไขข้อมูลโรงเรียน (PATCH /api/v1/admin/schools/:id)
  async updateSchool(schoolId, data) {
    const response = await api.patch(`/admin/schools/${schoolId}`, data);
    return response.data;
  },

  // ลบโรงเรียน (DELETE /api/v1/admin/schools/:id)
  async deleteSchool(schoolId) {
    const response = await api.delete(`/admin/schools/${schoolId}`);
    return response.data;
  },

  // ดึงรายการห้องเรียนในโรงเรียน (GET /api/v1/admin/schools/:id/classrooms)
  async getSchoolClassrooms(schoolId, params = {}) {
    const response = await api.get(`/admin/schools/${schoolId}/classrooms`, { params });
    return response.data;
  },

  // สร้างห้องเรียนใหม่ (POST /api/v1/admin/schools/:id/classrooms)
  async createSchoolClassroom(schoolId, data) {
    const response = await api.post(`/admin/schools/${schoolId}/classrooms`, data);
    return response.data;
  },

  // แก้ไขข้อมูลห้องเรียน (PATCH /api/v1/admin/schools/:schoolId/classrooms/:classroomId)
  async updateSchoolClassroom(schoolId, classroomId, data) {
    const response = await api.patch(`/admin/schools/${schoolId}/classrooms/${classroomId}`, data);
    return response.data;
  },

  // ลบห้องเรียน (DELETE /api/v1/admin/schools/:schoolId/classrooms/:classroomId)
  async deleteSchoolClassroom(schoolId, classroomId) {
    const response = await api.delete(`/admin/schools/${schoolId}/classrooms/${classroomId}`);
    return response.data;
  },

  // ดึงรายชื่อสมาชิกในโรงเรียน (GET /api/v1/admin/schools/:id/members)
  async getSchoolMembers(schoolId, params = {}) {
    const response = await api.get(`/admin/schools/${schoolId}/members`, { params });
    return response.data;
  },

  // เพิ่มสมาชิกเข้าโรงเรียน (POST /api/v1/admin/schools/:id/members)
  async addSchoolMember(schoolId, data) {
    const response = await api.post(`/admin/schools/${schoolId}/members`, data);
    return response.data;
  },

  // เปลี่ยนบทบาทสมาชิกในโรงเรียน (PATCH /api/v1/admin/schools/:schoolId/members/:membershipId)
  async updateSchoolMemberRole(schoolId, membershipId, data) {
    const response = await api.patch(`/admin/schools/${schoolId}/members/${membershipId}`, data);
    return response.data;
  },

  // นำสมาชิกออกจากโรงเรียน (DELETE /api/v1/admin/schools/:schoolId/members/:membershipId)
  async removeSchoolMember(schoolId, membershipId) {
    const response = await api.delete(`/admin/schools/${schoolId}/members/${membershipId}`);
    return response.data;
  },

  // ค้นหารายชื่อผู้ใช้ที่มีอยู่ในระบบสำหรับเพิ่มเข้าโรงเรียน (GET /api/v1/admin/schools/available-users)
  async getAvailableUsersForSchool(params = {}) {
    const response = await api.get("/admin/schools/available-users", { params });
    return response.data;
  },
};

export default adminService;
