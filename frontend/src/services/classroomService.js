import api from "./api";

// ======================================================
// Classroom Service (บริการจัดการคอร์สเรียน บทเรียน ตอนย่อย และเนื้อหา)
// โครงสร้าง 4 ระดับ: Course (Classroom) -> Chapter (Lesson) -> Episode -> Content
// ======================================================

export const classroomService = {
  // ====================================================
  // 1. จัดการคอร์สเรียน (Courses / Classrooms)
  // ====================================================

  // ดึงรายการคอร์สเรียนทั้งหมด (GET /api/v1/classrooms)
  async getClassrooms() {
    const response = await api.get("/classrooms");
    return response.data;
  },

  // ดึงรายการคอร์สที่ฉันลงทะเบียนไว้ (GET /api/v1/classrooms/my-enrollments)
  async getMyEnrollments() {
    const response = await api.get("/classrooms/my-enrollments");
    return response.data;
  },

  // สร้างคอร์สเรียนใหม่ (POST /api/v1/classrooms)
  async createClassroom(data) {
    const response = await api.post("/classrooms", data);
    return response.data;
  },

  // ดึงรายละเอียดคอร์สเรียน (GET /api/v1/classrooms/:id)
  async getClassroom(classroomId) {
    const response = await api.get(`/classrooms/${classroomId}`);
    return response.data;
  },

  // แก้ไขข้อมูลคอร์สเรียน (PUT /api/v1/classrooms/:id)
  async updateClassroom(classroomId, data) {
    const response = await api.put(`/classrooms/${classroomId}`, data);
    return response.data;
  },

  // ลบคอร์สเรียน (DELETE /api/v1/classrooms/:id)
  async deleteClassroom(classroomId) {
    const response = await api.delete(`/classrooms/${classroomId}`);
    return response.data;
  },

  // ====================================================
  // 2. จัดการสมาชิกและการลงทะเบียน (Enrollment)
  // ====================================================

  // ดูรายชื่อสมาชิกในคอร์สเรียน (GET /api/v1/classrooms/:id/members)
  async getMembers(classroomId) {
    const response = await api.get(`/classrooms/${classroomId}/members`);
    return response.data;
  },

  // นักเรียนลงทะเบียนเรียน (POST /api/v1/classrooms/:id/join)
  async joinClassroom(classroomId) {
    const response = await api.post(`/classrooms/${classroomId}/join`);
    return response.data;
  },

  // เพิ่มสมาชิกเข้าคอร์สเรียนโดยตรง (POST /api/v1/classrooms/:id/members)
  async addMember(classroomId, userId) {
    const response = await api.post(`/classrooms/${classroomId}/members`, {
      user_id: userId,
    });
    return response.data;
  },

  // นำสมาชิกออกจากคอร์สเรียน (DELETE /api/v1/classrooms/:id/members/:userId)
  async removeMember(classroomId, userId) {
    const response = await api.delete(`/classrooms/${classroomId}/members/${userId}`);
    return response.data;
  },

  // ====================================================
  // 3. จัดการบทเรียน (Chapters / Lessons)
  // ====================================================

  // ดึงรายการบทเรียนในคอร์ส (GET /api/v1/classrooms/:id/lessons)
  async getLessons(classroomId) {
    const response = await api.get(`/classrooms/${classroomId}/lessons`);
    return response.data;
  },

  // สร้างบทเรียนใหม่ (POST /api/v1/classrooms/:id/lessons)
  async createLesson(classroomId, data) {
    const response = await api.post(`/classrooms/${classroomId}/lessons`, data);
    return response.data;
  },

  // ดูรายละเอียดบทเรียนเดี่ยว (GET /api/v1/lessons/:id)
  async getLesson(lessonId) {
    const response = await api.get(`/lessons/${lessonId}`);
    return response.data;
  },

  // แก้ไขบทเรียน (PUT /api/v1/lessons/:id)
  async updateLesson(lessonId, data) {
    const response = await api.put(`/lessons/${lessonId}`, data);
    return response.data;
  },

  // ลบบทเรียน (DELETE /api/v1/lessons/:id)
  async deleteLesson(lessonId) {
    const response = await api.delete(`/lessons/${lessonId}`);
    return response.data;
  },

  // ====================================================
  // 4. จัดการตอนย่อย (Episodes)
  // ====================================================

  // ดึงรายการ Episodes ในบทเรียน (GET /api/v1/lessons/:id/episodes)
  async getEpisodes(lessonId) {
    const response = await api.get(`/lessons/${lessonId}/episodes`);
    return response.data;
  },

  // สร้าง Episode ใหม่ (POST /api/v1/lessons/:id/episodes)
  async createEpisode(lessonId, data) {
    const response = await api.post(`/lessons/${lessonId}/episodes`, data);
    return response.data;
  },

  // ดูรายละเอียด Episode และเนื้อหาภายใน (GET /api/v1/episodes/:id)
  async getEpisode(episodeId) {
    const response = await api.get(`/episodes/${episodeId}`);
    return response.data;
  },

  // แก้ไขข้อมูล Episode (PUT /api/v1/episodes/:id)
  async updateEpisode(episodeId, data) {
    const response = await api.put(`/episodes/${episodeId}`, data);
    return response.data;
  },

  // ลบ Episode (DELETE /api/v1/episodes/:id)
  async deleteEpisode(episodeId) {
    const response = await api.delete(`/episodes/${episodeId}`);
    return response.data;
  },

  // ====================================================
  // 5. จัดการเนื้อหา (Contents)
  // ====================================================

  // ดึงเนื้อหาทั้งหมดใน Episode (GET /api/v1/episodes/:id/contents)
  async getEpisodeContents(episodeId) {
    const response = await api.get(`/episodes/${episodeId}/contents`);
    return response.data;
  },

  // เพิ่มเนื้อหาใหม่ลงใน Episode (POST /api/v1/episodes/:id/contents)
  async addEpisodeContent(episodeId, data) {
    const response = await api.post(`/episodes/${episodeId}/contents`, data);
    return response.data;
  },

  // Legacy: เพิ่มเนื้อหาลงใน Lesson (POST /api/v1/lessons/:id/contents)
  async addContent(lessonId, data) {
    const response = await api.post(`/lessons/${lessonId}/contents`, data);
    return response.data;
  },

  // แก้ไขเนื้อหา (PUT /api/v1/contents/:id)
  async updateContent(contentId, data) {
    const response = await api.put(`/contents/${contentId}`, data);
    return response.data;
  },

  // ลบเนื้อหา (DELETE /api/v1/contents/:id)
  async deleteContent(contentId) {
    const response = await api.delete(`/contents/${contentId}`);
    return response.data;
  },
};

export default classroomService;
