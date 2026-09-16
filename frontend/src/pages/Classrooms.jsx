import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import classroomService from "../services/classroomService";
import useAuthStore from "../store/useAuthStore";
import CourseCard from "../components/CourseCard";
import { IOT_101_COURSE } from "../data/iot101Data";

// ======================================================
// Classrooms Page (หน้ารวมห้องเรียน)
// ======================================================
// หน้านี้ทำหน้าที่:
// 1. ดึงรายการห้องเรียนทั้งหมดจาก Backend ผ่าน classroomService.getClassrooms()
// 2. ควบคุมสิทธิ์การแสดงผลตาม Role:
//    - Instructor & Admin: จะมองเห็นปุ่ม "+ สร้างห้องเรียนใหม่" และเปิด Modal สำหรับสร้างห้อง
//    - Student: จะมีปุ่ม "เข้าร่วมห้องเรียน (Join)" ในการ์ดห้องเรียน
// 3. จัดการสถานะ Loading, Error และ Empty State เมื่อยังไม่มีห้องเรียนในระบบ

function Classrooms() {
  const { user, hasRole } = useAuthStore();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // สถานะสำหรับเปิด/ปิด Modal สร้างห้องเรียน
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // สถานะการกด Join Classroom ของแต่ละห้อง
  const [joiningId, setJoiningId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // โหลดรายการห้องเรียนเมื่อเปิดหน้า
  const fetchClassrooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classroomService.getClassrooms();
      setClassrooms(data.classrooms || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "ไม่สามารถดึงข้อมูลห้องเรียนได้"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // ฟังก์ชันสร้างห้องเรียนใหม่ (เฉพาะ Instructor หรือ Admin)
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      await classroomService.createClassroom({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      });
      setNewTitle("");
      setNewDescription("");
      setIsCreateModalOpen(false);
      setActionMessage({ type: "success", text: "สร้างห้องเรียนสำเร็จ!" });
      fetchClassrooms(); // รีเฟรชรายการห้องเรียนใหม่
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "สร้างห้องเรียนไม่สำเร็จ",
      });
    } finally {
      setCreating(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // ฟังก์ชันขอเข้าร่วมห้องเรียน (เฉพาะ Student)
  const handleJoinClassroom = async (classroomId) => {
    setJoiningId(classroomId);
    try {
      await classroomService.joinClassroom(classroomId);
      setActionMessage({ type: "success", text: "เข้าร่วมห้องเรียนเรียบร้อยแล้ว!" });
      fetchClassrooms();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "ไม่สามารถเข้าร่วมห้องเรียนได้",
      });
    } finally {
      setJoiningId(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ส่วนหัวของหน้า */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {hasRole("student") && !hasRole("instructor") && !hasRole("admin")
              ? "My Courses (คอร์สของฉัน)"
              : "รายการห้องเรียน (Classrooms)"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasRole("student") && !hasRole("instructor") && !hasRole("admin")
              ? "รายวิชาและห้องเรียนที่คุณกำลังศึกษา เข้าสู่บทเรียนเพื่อเรียนรู้ต่อได้ทันที"
              : "เลือกห้องเรียนเพื่อเข้าสู่บทเรียนและเนื้อหาการเรียนรู้"}
          </p>
        </div>

        {/* ปุ่มสร้างห้องเรียน: แสดงเฉพาะ Instructor หรือ Admin เท่านั้น */}
        {(hasRole("instructor") || hasRole("admin")) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
            className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9] shadow-sm cursor-pointer"
          >
            + สร้างห้องเรียนใหม่
          </button>
        )}
      </div>

      {/* แจ้งเตือนข้อความสถานะ */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{actionMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center text-gray-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#ABD1C6] border-r-transparent mb-2"></div>
          <p className="text-sm">กำลังโหลดข้อมูลห้องเรียน...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchClassrooms}
            className="mt-3 text-xs underline hover:text-red-900 font-medium"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}

      {/* ตารางแสดงการ์ดห้องเรียน (Classrooms Grid) */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. คอร์สหลักตามหลักสูตร: IoT 101 — ภารกิจปลุกเมืองให้ฉลาด */}
          <CourseCard
            course={IOT_101_COURSE}
            role={hasRole("student") ? "student" : "guest"}
            continueLink="/classrooms/iot-101"
          />

          {/* 2. รายการห้องเรียนเพิ่มเติมจากฐานข้อมูล (ถ้ามี) */}
          {classrooms
            .filter((c) => c.classroom_id !== "iot-101")
            .map((c) => {
            const isOwner = user && String(c.instructor_id) === String(user.user_id);
            const isStudent = hasRole("student") && !hasRole("instructor") && !hasRole("admin");

            return (
              <div
                key={c.classroom_id}
                className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div>
                  {/* ภาพหน้าปกห้องเรียนเริ่มต้นจากไฟล์ภายในโปรเจกต์ */}
                  <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-[#FAFAFA]">
                    <img
                      src="/images/classroom-default.svg"
                      alt="Classroom Thumbnail"
                      className="h-32 w-full object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      {c.status || "active"}
                    </span>
                    {isOwner && (
                      <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                        ห้องของคุณ (Owner)
                      </span>
                    )}
                  </div>

                  {/* ชื่อห้องเรียน ลิงก์เข้าไปดูรายละเอียด */}
                  <Link
                    to={`/classrooms/${c.classroom_id}`}
                    className="mt-3 block text-lg font-bold text-gray-900 hover:text-[#456F65]"
                  >
                    {c.title}
                  </Link>

                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {c.description || "ไม่มีคำอธิบายห้องเรียน"}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>ผู้สอน: <b className="text-gray-700">{c.instructor_name || "ไม่ระบุ"}</b></span>
                    <span>📖 {c.lesson_count || 0} บทเรียน</span>
                    <span>👥 {c.member_count || 0} คน</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/classrooms/${c.classroom_id}`}
                      className="flex-1 rounded-xl border border-gray-300 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      ดูรายละเอียด
                    </Link>

                    {/* ปุ่ม Join สำหรับ Student เท่านั้น */}
                    {isStudent && (
                      <button
                        onClick={() => handleJoinClassroom(c.classroom_id)}
                        disabled={joiningId === c.classroom_id}
                        className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9] transition disabled:opacity-50 cursor-pointer"
                      >
                        {joiningId === c.classroom_id ? "กำลังเข้า..." : "เข้าร่วมห้อง (Join)"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal สำหรับสร้างห้องเรียนใหม่ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สร้างห้องเรียนใหม่</h2>
            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  ชื่อห้องเรียน (Title) *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น IoT Embedded Systems"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#ABD1C6]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  คำอธิบายห้องเรียน (Description)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="รายละเอียดเกี่ยวกับหลักสูตรและเป้าหมายการเรียนรู้..."
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#ABD1C6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] disabled:opacity-50"
                >
                  {creating ? "กำลังสร้าง..." : "ยืนยันสร้างห้องเรียน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Classrooms;
