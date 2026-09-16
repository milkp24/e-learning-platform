import api from "./api";

// ======================================================
// Role Service (บริการจัดการบทบาทและสิทธิ์)
// ======================================================
// ไฟล์นี้ทำหน้าที่เรียก API ใน Module 2 (Role & Permission)
// ใช้เฉพาะ API ที่ Backend มีอยู่จริงเท่านั้นตามข้อกำหนด:
// - GET /api/v1/roles (เฉพาะ Admin)
// - GET /api/v1/users/<user_id>/roles
// - POST /api/v1/users/<user_id>/roles (เฉพาะ Admin)
// - DELETE /api/v1/users/<user_id>/roles/<role_name> (เฉพาะ Admin)

export const roleService = {
  // ดึงรายการ Role ทั้งหมดในระบบ (GET /api/v1/roles)
  // สงวนสิทธิ์เฉพาะผู้ใช้ที่มี Role 'admin' เท่านั้น
  // ส่งคืนรายชื่อบทบาท เช่น student, instructor, admin
  async getRoles() {
    const response = await api.get("/roles");
    return response.data;
  },

  // ดึงรายการ Role ของ User ตาม user_id (GET /api/v1/users/<user_id>/roles)
  // อนุญาตเฉพาะเจ้าของบัญชี หรือผู้ดูแลระบบ (Admin) เท่านั้น
  async getUserRoles(userId) {
    const response = await api.get(`/users/${userId}/roles`);
    return response.data;
  },

  // กำหนด Role เพิ่มเติมให้ผู้ใช้ (POST /api/v1/users/<user_id>/roles)
  // สงวนสิทธิ์เฉพาะ Admin เท่านั้น
  // ข้อมูลส่งไป: { role_name: 'instructor' }
  // ป้องกันการกำหนด Role ซ้ำที่ฝั่ง Backend หากมีอยู่แล้วจะตอบกลับ 409
  async assignRole(userId, roleName) {
    const response = await api.post(`/users/${userId}/roles`, {
      role_name: roleName,
    });
    return response.data;
  },

  // ถอน Role ออกจากผู้ใช้ (DELETE /api/v1/users/<user_id>/roles/<role_name>)
  // สงวนสิทธิ์เฉพาะ Admin เท่านั้น
  // Backend มีระบบป้องกันไม่ให้ลบ Role สุดท้ายของผู้ใช้ (ต้องเหลืออย่างน้อย 1 Role)
  async removeRole(userId, roleName) {
    const response = await api.delete(`/users/${userId}/roles/${roleName}`);
    return response.data;
  },
};

export default roleService;
