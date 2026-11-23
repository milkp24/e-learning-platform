import { useState, useEffect, useCallback } from "react";
import journalService from "../../../services/journalService";
import classroomService from "../../../services/classroomService";
import JournalHeader from "./components/JournalHeader";
import JournalFilter from "./components/JournalFilter";
import JournalList from "./components/JournalList";
import JournalModal from "./components/JournalModal";
import { confirmDelete } from "../../../store/useConfirmStore";
import { notify } from "../../../store/useToastStore";
import useUrlParam from "../../../hooks/useUrlParam";

// ======================================================
// JournalView Component (หน้าบันทึกการเรียนรู้ส่วนตัวของผู้เรียน)
// รองรับ UAT-031, UAT-032, UAT-033 และข้อ 27:
// - บันทึกผูกกับคอร์สและบทเรียนได้ (เลือกบทเรียนในฟอร์ม)
// - กรองตามคอร์ส / บทเรียน และค้นหาจากหัวข้อและเนื้อหา (เก็บค่าไว้ใน URL)
// - เห็นเฉพาะบันทึกของตัวเอง (Backend กรองตามผู้ใช้)
// ======================================================

/** รายชื่อบทเรียนของคอร์ส (ใช้ทั้งตัวกรองและฟอร์ม) */
function useCourseLessons(courseId) {
  const [lessons, setLessons] = useState([]);
  useEffect(() => {
    let cancelled = false;
    if (!courseId) {
      setLessons([]);
      return undefined;
    }
    classroomService
      .getLessons(courseId)
      .then((data) => !cancelled && setLessons(data.lessons || []))
      .catch(() => !cancelled && setLessons([]));
    return () => {
      cancelled = true;
    };
  }, [courseId]);
  return lessons;
}

function JournalView() {
  const [journals, setJournals] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseFilter, setCourseFilter] = useUrlParam("course", "");
  const [lessonFilter, setLessonFilter] = useUrlParam("lesson", "");
  const [search, setSearch] = useUrlParam("q", "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State สำหรับสร้าง/แก้ไขบันทึก
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const filterLessons = useCourseLessons(courseFilter);
  const formLessons = useCourseLessons(isModalOpen ? courseId : "");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchJournals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (courseFilter) params.classroom_id = courseFilter;
      if (lessonFilter) params.lesson_id = lessonFilter;
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
      const data = await journalService.getJournals(params);
      setJournals(data.journals || []);
    } catch {
      setError("ไม่สามารถโหลดบันทึกการเรียนรู้ได้ กรุณารีเฟรชหน้าอีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  }, [courseFilter, lessonFilter, debouncedSearch]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await classroomService.getClassrooms();
        const all = data.classrooms || [];
        // แสดงเฉพาะคอร์สที่ลงทะเบียน/เป็นเจ้าของ ถ้ายังไม่มีเลยค่อยแสดงทั้งหมด
        const mine = all.filter((c) => c.is_enrolled || c.is_owner);
        setCourses(mine.length ? mine : all);
      } catch {
        // ไม่บล็อกการทำงานหากโหลดคอร์สไม่สำเร็จ
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const handleCourseFilterChange = (value) => {
    setCourseFilter(value);
    setLessonFilter("");
  };

  const openCreateModal = () => {
    setEditingJournal(null);
    setTitle("");
    setContent("");
    setCourseId(courseFilter || "");
    setLessonId(lessonFilter || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (journal) => {
    setEditingJournal(journal);
    setTitle(journal.title);
    setContent(journal.content);
    setCourseId(journal.classroom_id || "");
    setLessonId(journal.lesson_id || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleFormCourseChange = (value) => {
    setCourseId(value);
    setLessonId("");
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
        lesson_id: lessonId || null,
      };

      if (editingJournal) {
        await journalService.updateJournal(editingJournal.journal_id, payload);
        notify.success("แก้ไขบันทึกแล้ว");
      } else {
        await journalService.createJournal(payload);
        notify.success("บันทึกการเรียนรู้แล้ว");
      }

      setIsModalOpen(false);
      fetchJournals();
    } catch (err) {
      setFormError(err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const journal = journals.find((j) => String(j.journal_id || j.id) === String(id));
    if (!(await confirmDelete({ itemType: "บันทึกการเรียนรู้", itemName: journal?.title }))) return;
    try {
      await journalService.deleteJournal(id);
      notify.success(`ลบบันทึก "${journal?.title || ""}" แล้ว`);
      fetchJournals();
    } catch (err) {
      notify.error(err.response?.data?.message || "ลบบันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const hasFilter = Boolean(courseFilter || lessonFilter || debouncedSearch.trim());

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header Section */}
      <JournalHeader onOpenCreateModal={openCreateModal} />

      {/* 2. ตัวกรอง: คอร์ส / บทเรียน / ค้นหา */}
      <JournalFilter
        courses={courses}
        courseFilter={courseFilter}
        onCourseChange={handleCourseFilterChange}
        lessons={filterLessons}
        lessonFilter={lessonFilter}
        onLessonChange={setLessonFilter}
        search={search}
        onSearchChange={setSearch}
        onClear={hasFilter ? () => {
          setCourseFilter("");
          setLessonFilter("");
          setSearch("");
        } : null}
      />

      {/* 3. Content Area: Journal List */}
      <JournalList
        journals={journals}
        isLoading={isLoading}
        error={error}
        hasFilter={hasFilter}
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
        setCourseId={handleFormCourseChange}
        courses={courses}
        lessonId={lessonId}
        setLessonId={setLessonId}
        lessons={formLessons}
        isSubmitting={isSubmitting}
        formError={formError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default JournalView;
