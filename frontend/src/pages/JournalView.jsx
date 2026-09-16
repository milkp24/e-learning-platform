import React, { useState, useEffect } from "react";
import journalService from "../services/journalService";
import classroomService from "../services/classroomService";

// ======================================================
// JournalView Component (หน้าบันทึกการเรียนรู้ส่วนตัวของผู้เรียน)
// รองรับ UAT-031, UAT-032, UAT-033
// ======================================================

function JournalView() {
  const [journals, setJournals] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State สำหรับสร้าง/แก้ไขบันทึก
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchJournals = async (filterId = selectedCourseFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterId) params.classroom_id = filterId;
      const data = await journalService.getJournals(params);
      setJournals(data.journals || []);
    } catch (err) {
      setError("ไม่สามารถโหลดบันทึกการเรียนรู้ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await classroomService.getClassrooms();
      setCourses(data.classrooms || []);
    } catch {
      // ไม่บล็อกการทำงานหากโหลดคอร์สไม่สำเร็จ
    }
  };

  useEffect(() => {
    fetchJournals();
    fetchCourses();
  }, []);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setSelectedCourseFilter(val);
    fetchJournals(val);
  };

  const openCreateModal = () => {
    setEditingJournal(null);
    setTitle("");
    setContent("");
    setCourseId(selectedCourseFilter || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (journal) => {
    setEditingJournal(journal);
    setTitle(journal.title);
    setContent(journal.content);
    setCourseId(journal.classroom_id || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("กรุณากรอกหัวข้อและเนื้อหาบันทึกให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        classroom_id: courseId || null,
      };

      if (editingJournal) {
        await journalService.updateJournal(editingJournal.journal_id, payload);
      } else {
        await journalService.createJournal(payload);
      }

      setIsModalOpen(false);
      fetchJournals();
    } catch (err) {
      setFormError(
        err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("คุณต้องการลบบันทึกการเรียนรู้นี้ใช่หรือไม่?")) return;
    try {
      await journalService.deleteJournal(id);
      fetchJournals();
    } catch {
      alert("ลบบันทึกไม่สำเร็จ");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            📖 บันทึกการเรียนรู้ (Learning Journal)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            จดบันทึก สรุปเนื้อหาสำคัญ และทบทวนความรู้ส่วนตัวของคุณ
          </p>
        </div>
        <button
          onClick={openCreateModal}
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#004643] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003835] active:scale-98"
        >
          <span>✏️</span>
          <span>เขียนบันทึกใหม่</span>
        </button>
      </div>

      {/* Filter by Course */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <label htmlFor="course-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          กรองตามคอร์สเรียน:
        </label>
        <select
          id="course-filter"
          value={selectedCourseFilter}
          onChange={handleFilterChange}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#6FA99A] focus:outline-none"
        >
          <option value="">ทั้งหมด (ทุกคอร์สเรียน)</option>
          {courses.map((c) => (
            <option key={c.classroom_id} value={c.classroom_id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-sm text-gray-500">
          กำลังโหลดบันทึกการเรียนรู้...
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-600 border border-red-200">
          {error}
        </div>
      ) : journals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="text-4xl">📝</span>
          <h3 className="mt-3 text-base font-bold text-gray-800">
            ยังไม่มีบันทึกการเรียนรู้
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            เริ่มต้นจดบันทึกแรกของคุณเพื่อเก็บเกี่ยวความรู้ที่ได้เรียนมา
          </p>
          <button
            onClick={openCreateModal}
            type="button"
            className="mt-4 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#003835]"
          >
            สร้างบันทึกแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journals.map((j) => (
            <div
              key={j.journal_id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-[#004643]">
                    {j.course_title || "บันทึกทั่วไป"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(j.created_at).toLocaleDateString("th-TH")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                  {j.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-line line-clamp-4">
                  {j.content}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => openEditModal(j)}
                  type="button"
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(j.journal_id)}
                  type="button"
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal เขียน / แก้ไขบันทึก */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              {editingJournal ? "แก้ไขบันทึกการเรียนรู้" : "เขียนบันทึกการเรียนรู้ใหม่"}
            </h3>

            {formError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  หัวข้อบันทึก *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น สรุปเรื่อง Hook ใน React"
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  เกี่ยวข้องกับคอร์สเรียน (ถ้ามี)
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
                >
                  <option value="">-- ไม่ระบุคอร์สเรียน --</option>
                  {courses.map((c) => (
                    <option key={c.classroom_id} value={c.classroom_id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  เนื้อหาบันทึก *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="เขียนสรุปสิ่งที่คุณเข้าใจ โค้ดตัวอย่าง หรือข้อคิดเห็นส่วนตัว..."
                  rows={6}
                  required
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#004643] px-5 py-2 text-xs font-bold text-white hover:bg-[#003835] disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JournalView;
