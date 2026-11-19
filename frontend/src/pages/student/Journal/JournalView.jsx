import { useState, useEffect, useCallback } from "react";
import journalService from "../../../services/journalService";
import classroomService from "../../../services/classroomService";
import JournalHeader from "./components/JournalHeader";
import JournalFilter from "./components/JournalFilter";
import JournalList from "./components/JournalList";
import JournalModal from "./components/JournalModal";
import { confirmDelete } from "../../../store/useConfirmStore";

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

  const fetchJournals = useCallback(async (filterId = selectedCourseFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterId) params.classroom_id = filterId;
      const data = await journalService.getJournals(params);
      setJournals(data.journals || []);
    } catch {
      setError("ไม่สามารถโหลดบันทึกการเรียนรู้ได้");
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseFilter]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await classroomService.getClassrooms();
        setCourses(data.classrooms || []);
      } catch {
        // ไม่บล็อกการทำงานหากโหลดคอร์สไม่สำเร็จ
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleFilterChange = (e) => {
    setSelectedCourseFilter(e.target.value);
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
    const journal = journals.find((j) => String(j.journal_id || j.id) === String(id));
    if (!(await confirmDelete({ itemType: "บันทึกการเรียนรู้", itemName: journal?.title }))) return;
    try {
      await journalService.deleteJournal(id);
      fetchJournals();
    } catch {
      alert("ลบบันทึกไม่สำเร็จ");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header Section */}
      <JournalHeader onOpenCreateModal={openCreateModal} />

      {/* 2. Filter by Course */}
      <JournalFilter
        selectedCourseFilter={selectedCourseFilter}
        onFilterChange={handleFilterChange}
        courses={courses}
      />

      {/* 3. Content Area: Journal List */}
      <JournalList
        journals={journals}
        isLoading={isLoading}
        error={error}
        onOpenCreateModal={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* 4. Modal เขียน / แก้ไขบันทึก */}
      <JournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingJournal={editingJournal}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        courseId={courseId}
        setCourseId={setCourseId}
        courses={courses}
        isSubmitting={isSubmitting}
        formError={formError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default JournalView;
