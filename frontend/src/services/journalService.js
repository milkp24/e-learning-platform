import api from "./api";

// ======================================================
// Journal Service (บริการบันทึกการเรียนรู้ส่วนตัวของผู้เรียน)
// รองรับ UAT-031, UAT-032, UAT-033
// ======================================================

export const journalService = {
  // ดึงรายการบันทึกการเรียนรู้ของผู้ใช้ปัจจุบัน (GET /api/v1/journals)
  // สามารถระบุ ?classroom_id=... หรือ ?episode_id=... เพื่อกรองข้อมูลได้
  async getJournals(params = {}) {
    const response = await api.get("/journals", { params });
    return response.data;
  },

  // ดึงรายละเอียดบันทึกการเรียนรู้ (GET /api/v1/journals/:id)
  async getJournal(journalId) {
    const response = await api.get(`/journals/${journalId}`);
    return response.data;
  },

  // สร้างบันทึกการเรียนรู้ใหม่ (POST /api/v1/journals)
  // รับข้อมูล: { title, content, classroom_id?, episode_id? }
  async createJournal(data) {
    const response = await api.post("/journals", data);
    return response.data;
  },

  // แก้ไขบันทึกการเรียนรู้ (PUT /api/v1/journals/:id)
  async updateJournal(journalId, data) {
    const response = await api.put(`/journals/${journalId}`, data);
    return response.data;
  },

  // ลบบันทึกการเรียนรู้ (DELETE /api/v1/journals/:id)
  async deleteJournal(journalId) {
    const response = await api.delete(`/journals/${journalId}`);
    return response.data;
  },
};

export default journalService;
