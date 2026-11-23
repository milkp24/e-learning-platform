import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import classroomService from "../../../services/classroomService";
import useAuthStore from "../../../store/useAuthStore";
import {
  IOT_101_COURSE,
  IOT_101_CHAPTERS,
  getMockContentsForEpisode,
} from "../../../data/iot101Data";

// Subcomponents
import CourseContentHeader from "./components/CourseContentHeader";
import CurriculumTree from "./components/CurriculumTree";
import ContentBuilder from "./components/ContentBuilder";
import ChapterModal from "./components/ChapterModal";
import EpisodeModal from "./components/EpisodeModal";
import ContentBlockModalManager from "./components/ContentBlockModalManager";
import StudentPreviewModal from "./components/StudentPreviewModal";
import UnsavedChangesDialog from "./components/UnsavedChangesDialog";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { getStatusActions } from "../../../features/courses/utils/courseStatus";
import { notify } from "../../../store/useToastStore";

/**
 * CourseContentManager Page Component (หน้าจัดการเนื้อหาคอร์สเรียน)
 * ตามข้อกำหนดข้อ 3 ถึง 15 ของโจทย์:
 * - โครงสร้าง: คอร์ส -> บทเรียน (Chapter/Lesson) -> ตอนย่อย (Episode) -> เนื้อหา (Content Blocks)
 * - Content Builder: ข้อความ, รูปภาพ, ไฟล์, วิดีโอ YouTube
 * - จัดลำดับเนื้อหา, ทำสำเนา, แก้ไข, ลบ
 * - ดูตัวอย่างสำหรับผู้เรียน (Student Preview)
 * - บันทึกฉบับร่าง & เผยแพร่ พร้อม Toast
 * - Unsaved Changes Guard พร้อม 3 ตัวเลือก
 * - 100% ภาษาไทยตาม Jade Design System
 */
function CourseContentManager() {
  const { classroomId: rawClassroomId, id: rawId } = useParams();
  const classroomId = rawClassroomId || rawId;
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuthStore();

  const isIoT101 = classroomId === "iot-101";

  // ข้อมูลหลัก
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [contents, setContents] = useState([]);

  // สถานะการโหลดและแก้ไข
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCoursePublishing, setIsCoursePublishing] = useState(false);

  // มุมมองแท็บบน Mobile ('tree' | 'builder')
  const [mobileTab, setMobileTab] = useState("builder");

  // Modals state
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [targetChapterForEpisode, setTargetChapterForEpisode] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);

  // Content Block Modal State (Consolidated)
  const [activeBlockModal, setActiveBlockModal] = useState({
    isOpen: false,
    type: null,
    block: null,
    index: null,
  });

  // Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Delete Confirm Dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'chapter' | 'episode' | 'content'
    target: null,
    targetIndex: null,
    title: "",
    message: "",
  });

  // Unsaved Changes Guard
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // แจ้งผลการทำงานผ่านแถบมุมขวาบนกลางของระบบ
  const showToast = (type, text) => {
    notify.show(type, text);
  };

  // 1. ดักจับการปิดแท็บเบราว์เซอร์เมื่อมี Unsaved Changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "ยังไม่ได้บันทึกการเปลี่ยนแปลง";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 2. โหลดข้อมูลคอร์ส โครงสร้างบทเรียน และตอนย่อย
  const loadCurriculumData = useCallback(async () => {
    setIsLoading(true);

    // กรณีเป็นคอร์ส IoT 101
    if (isIoT101) {
      setCourse(IOT_101_COURSE);
      const chs = IOT_101_CHAPTERS.map((ch) => ({
        ...ch,
        lesson_id: ch.id,
      }));
      setChapters(chs);

      if (chs.length > 0) {
        const firstCh = chs[1] || chs[0]; // Chapter 1 หรือ 0
        setSelectedChapter(firstCh);
        if (firstCh.episodes && firstCh.episodes.length > 0) {
          const firstEp = firstCh.episodes[0];
          setSelectedEpisode(firstEp);
          setContents(getMockContentsForEpisode(firstEp.id));
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const courseRes = await classroomService.getClassroom(classroomId);
      const courseData = courseRes.classroom || courseRes.course || courseRes;
      setCourse(courseData);

      // ดึงบทเรียน (Lessons) ทั้งหมด
      const lessonsRes = await classroomService.getLessons(classroomId);
      const rawLessons = Array.isArray(lessonsRes)
        ? lessonsRes
        : lessonsRes.lessons || lessonsRes.chapters || [];

      // จัดระเบียบบทเรียนและตอนย่อย
      const mappedChapters = await Promise.all(
        rawLessons.map(async (lesson) => {
          let episodes = lesson.episodes || [];
          if (episodes.length === 0 && lesson.lesson_id) {
            try {
              const epRes = await classroomService.getEpisodes(lesson.lesson_id);
              episodes = epRes.episodes || [];
            } catch {
              episodes = [];
            }
          }
          return {
            ...lesson,
            episodes,
          };
        })
      );

      setChapters(mappedChapters);

      // เลือกตอนแรกอัตโนมัติถ้ามี
      if (mappedChapters.length > 0) {
        const firstCh = mappedChapters[0];
        setSelectedChapter(firstCh);
        if (firstCh.episodes && firstCh.episodes.length > 0) {
          const firstEp = firstCh.episodes[0];
          setSelectedEpisode(firstEp);
          // ดึงเนื้อหาของตอนแรก
          try {
            const epDetail = await classroomService.getEpisode(firstEp.episode_id);
            setContents(epDetail.episode?.contents || []);
          } catch {
            setContents(firstEp.contents || []);
          }
        }
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "ไม่สามารถโหลดข้อมูลคอร์สเรียนได้");
    } finally {
      setIsLoading(false);
    }
  }, [classroomId, isIoT101]);

  useEffect(() => {
    loadCurriculumData();
  }, [loadCurriculumData]);

  // 3. จัดการเมื่อผู้ใช้เลือกตอนย่อย (Select Episode)
  const handleSelectEpisode = async (chapter, episode) => {
    if (isDirty) {
      // แจ้งเตือนก่อนเปลี่ยนตอน
      setPendingNavigation({ type: "selectEpisode", chapter, episode });
      setIsUnsavedDialogOpen(true);
      return;
    }

    setSelectedChapter(chapter);
    setSelectedEpisode(episode);
    setMobileTab("builder");

    if (isIoT101) {
      setContents(getMockContentsForEpisode(episode.id));
      setIsDirty(false);
      return;
    }

    try {
      const epId = episode.episode_id || episode.id;
      const res = await classroomService.getEpisode(epId);
      setContents(res.episode?.contents || []);
      setIsDirty(false);
    } catch {
      setContents(episode.contents || []);
      setIsDirty(false);
    }
  };

  // 4. การจัดการ Chapter (บทเรียน)
  const handleOpenAddChapter = () => {
    setEditingChapter(null);
    setIsChapterModalOpen(true);
  };

  const handleOpenEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (data) => {
    if (isIoT101) {
      if (editingChapter) {
        setChapters((prev) =>
          prev.map((c) => (c.lesson_id === editingChapter.lesson_id ? { ...c, ...data } : c))
        );
        showToast("success", "แก้ไขบทเรียนเรียบร้อยแล้ว");
      } else {
        const newCh = {
          ...data,
          lesson_id: `ch-custom-${Date.now()}`,
          episodes: [],
        };
        setChapters((prev) => [...prev, newCh]);
        showToast("success", "เพิ่มบทเรียนใหม่เรียบร้อยแล้ว");
      }
      setIsChapterModalOpen(false);
      return;
    }

    try {
      if (editingChapter) {
        const id = editingChapter.lesson_id;
        await classroomService.updateLesson(id, data);
        showToast("success", "แก้ไขบทเรียนเรียบร้อยแล้ว");
      } else {
        await classroomService.createLesson(classroomId, data);
        showToast("success", "เพิ่มบทเรียนใหม่เรียบร้อยแล้ว");
      }
      setIsChapterModalOpen(false);
      loadCurriculumData();
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถบันทึกบทเรียนได้");
    }
  };

  const handleDeleteChapter = (chapter) => {
    setDeleteConfirm({
      isOpen: true,
      type: "chapter",
      target: chapter,
      title: "ยืนยันการลบบทเรียน",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${chapter.title}"? ตอนย่อยและเนื้อหาทั้งหมดในบทนี้จะถูกลบไปด้วย`,
    });
  };

  const handleMoveChapter = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= chapters.length) return;

    const updated = [...chapters];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // ปรับ sequence_no
    updated.forEach((c, idx) => {
      c.sequence_no = idx + 1;
    });

    setChapters(updated);

    if (!isIoT101) {
      try {
        await Promise.all([
          classroomService.updateLesson(updated[index].lesson_id, {
            sequence_no: updated[index].sequence_no,
          }),
          classroomService.updateLesson(updated[newIndex].lesson_id, {
            sequence_no: updated[newIndex].sequence_no,
          }),
        ]);
        showToast("success", "จัดลำดับบทเรียนเรียบร้อยแล้ว");
      } catch {
        showToast("error", "ไม่สามารถบันทึกลำดับบทเรียนได้");
      }
    }
  };

  const handleToggleChapterStatus = async (chapter) => {
    const current = (chapter.status || "active").toLowerCase();
    const newStatus = current === "active" ? "draft" : "active";

    if (isIoT101) {
      setChapters((prev) =>
        prev.map((c) => (c.lesson_id === chapter.lesson_id ? { ...c, status: newStatus } : c))
      );
      return;
    }

    try {
      await classroomService.updateLesson(chapter.lesson_id, { status: newStatus });
      showToast("success", newStatus === "active" ? "เผยแพร่บทเรียนแล้ว" : "ปิดการเผยแพร่บทเรียนแล้ว");
      loadCurriculumData();
    } catch {
      showToast("error", "ไม่สามารถปรับสถานะบทเรียนได้");
    }
  };

  // 5. การจัดการ Episode (ตอนย่อย)
  const handleOpenAddEpisode = (chapter) => {
    setTargetChapterForEpisode(chapter);
    setEditingEpisode(null);
    setIsEpisodeModalOpen(true);
  };

  const handleOpenEditEpisode = (chapter, episode) => {
    setTargetChapterForEpisode(chapter);
    setEditingEpisode(episode);
    setIsEpisodeModalOpen(true);
  };

  const handleSaveEpisode = async (data) => {
    const chapterId = targetChapterForEpisode?.lesson_id || targetChapterForEpisode?.id;

    if (isIoT101) {
      if (editingEpisode) {
        setChapters((prev) =>
          prev.map((ch) =>
            ch.lesson_id === chapterId
              ? {
                  ...ch,
                  episodes: ch.episodes.map((e) =>
                    e.id === editingEpisode.id ? { ...e, ...data } : e
                  ),
                }
              : ch
          )
        );
        showToast("success", "แก้ไขตอนย่อยเรียบร้อยแล้ว");
      } else {
        const newEp = {
          ...data,
          id: `ep-custom-${Date.now()}`,
          contents: [],
        };
        setChapters((prev) =>
          prev.map((ch) =>
            ch.lesson_id === chapterId
              ? { ...ch, episodes: [...(ch.episodes || []), newEp] }
              : ch
          )
        );
        showToast("success", "เพิ่มตอนย่อยใหม่เรียบร้อยแล้ว");
      }
      setIsEpisodeModalOpen(false);
      return;
    }

    try {
      if (editingEpisode) {
        const epId = editingEpisode.episode_id || editingEpisode.id;
        await classroomService.updateEpisode(epId, data);
        showToast("success", "แก้ไขตอนย่อยเรียบร้อยแล้ว");
      } else {
        await classroomService.createEpisode(chapterId, data);
        showToast("success", "เพิ่มตอนย่อยใหม่เรียบร้อยแล้ว");
      }
      setIsEpisodeModalOpen(false);
      loadCurriculumData();
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถบันทึกตอนย่อยได้");
    }
  };

  const handleDeleteEpisode = (chapter, episode) => {
    setDeleteConfirm({
      isOpen: true,
      type: "episode",
      target: episode,
      parent: chapter,
      title: "ยืนยันการลบตอนย่อย",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${episode.title}"? เนื้อหาทั้งหมดในตอนนี้จะถูกลบไปด้วย`,
    });
  };

  const handleMoveEpisode = async (chapter, epIndex, direction) => {
    const episodes = [...(chapter.episodes || [])];
    const targetIdx = epIndex + direction;
    if (targetIdx < 0 || targetIdx >= episodes.length) return;

    const temp = episodes[epIndex];
    episodes[epIndex] = episodes[targetIdx];
    episodes[targetIdx] = temp;

    episodes.forEach((e, idx) => {
      e.sequence_no = idx + 1;
    });

    setChapters((prev) =>
      prev.map((ch) =>
        ch.lesson_id === chapter.lesson_id ? { ...ch, episodes } : ch
      )
    );

    if (!isIoT101) {
      try {
        await Promise.all([
          classroomService.updateEpisode(episodes[epIndex].episode_id, {
            sequence_no: episodes[epIndex].sequence_no,
          }),
          classroomService.updateEpisode(episodes[targetIdx].episode_id, {
            sequence_no: episodes[targetIdx].sequence_no,
          }),
        ]);
        showToast("success", "จัดลำดับตอนย่อยเรียบร้อยแล้ว");
      } catch {
        showToast("error", "ไม่สามารถบันทึกลำดับตอนย่อยได้");
      }
    }
  };

  const handleToggleEpisodeStatus = async (chapter, episode) => {
    const current = (episode.status || "active").toLowerCase();
    const newStatus = current === "active" ? "draft" : "active";
    const epId = episode.episode_id || episode.id;

    if (isIoT101) {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.lesson_id === chapter.lesson_id
            ? {
                ...ch,
                episodes: ch.episodes.map((e) =>
                  e.id === epId ? { ...e, status: newStatus } : e
                ),
              }
            : ch
        )
      );
      return;
    }

    try {
      await classroomService.updateEpisode(epId, { status: newStatus });
      showToast("success", newStatus === "active" ? "เผยแพร่ตอนแล้ว" : "บันทึกเป็นฉบับร่างแล้ว");
      loadCurriculumData();
    } catch {
      showToast("error", "ไม่สามารถปรับสถานะตอนได้");
    }
  };

  // 6. การจัดการ Content Blocks ใน Content Builder
  const handleOpenAddBlock = (type) => {
    setActiveBlockModal({
      isOpen: true,
      type,
      block: null,
      index: null,
    });
  };

  const handleOpenEditBlock = (block, index) => {
    let type = block?.content_type;
    if (type === "pdf") type = "file";
    if (!["text", "image", "file", "video", "youtube"].includes(type)) {
      type = "text";
    }
    setActiveBlockModal({
      isOpen: true,
      type,
      block,
      index,
    });
  };

  const handleCloseBlockModal = () => {
    setActiveBlockModal({
      isOpen: false,
      type: null,
      block: null,
      index: null,
    });
  };

  const handleSaveBlock = (blockData) => {
    setIsDirty(true);
    const targetIndex = activeBlockModal.index;
    if (targetIndex !== null && targetIndex !== undefined) {
      // แก้ไขบล็อกเดิม
      setContents((prev) => {
        const next = [...prev];
        next[targetIndex] = {
          ...next[targetIndex],
          ...blockData,
        };
        return next;
      });
      showToast("success", "อัปเดตบล็อกเนื้อหาแล้ว (ยังไม่ได้กดบันทึกฉบับร่าง)");
    } else {
      // เพิ่มบล็อกใหม่
      const newBlock = {
        ...blockData,
        content_id: `temp-${Date.now()}`,
        sequence_no: contents.length + 1,
      };
      setContents((prev) => [...prev, newBlock]);
      showToast("success", "เพิ่มบล็อกเนื้อหาแล้ว (ยังไม่ได้กดบันทึกฉบับร่าง)");
    }

    handleCloseBlockModal();
  };

  // คำอธิบายบล็อกสำหรับกล่องยืนยันการลบ (ข้อ 38): ประเภท + คำบรรยาย/ชื่อไฟล์
  const describeBlock = (block) => {
    if (!block) return "ไม่ทราบประเภท";
    const typeLabels = { text: "ข้อความ", image: "รูปภาพ", video: "วิดีโอ", youtube: "YouTube", file: "ไฟล์" };
    const typeLabel = typeLabels[block.content_type] || block.content_type || "เนื้อหา";
    const name = block.caption || block.file_name;
    return name ? `${typeLabel}: ${name}` : typeLabel;
  };

  const handleDeleteBlock = (index) => {
    setDeleteConfirm({
      isOpen: true,
      type: "content",
      targetIndex: index,
      title: "ยืนยันการลบบล็อกเนื้อหา",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบบล็อกที่ ${index + 1} (${describeBlock(contents[index])})? การลบจะมีผลเมื่อกดบันทึก`,
    });
  };

  const handleDuplicateBlock = (block, index) => {
    setIsDirty(true);
    const duplicated = {
      ...block,
      content_id: `temp-dup-${Date.now()}`,
      sequence_no: index + 2,
    };
    setContents((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      // ปรับ sequence_no ใหม่
      return next.map((b, idx) => ({ ...b, sequence_no: idx + 1 }));
    });
    showToast("success", `ทำสำเนาบล็อกที่ ${index + 1} เรียบร้อยแล้ว`);
  };

  const handleMoveBlockUp = (index) => {
    if (index === 0) return;
    setIsDirty(true);
    setContents((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next.map((b, idx) => ({ ...b, sequence_no: idx + 1 }));
    });
  };

  const handleMoveBlockDown = (index) => {
    if (index === contents.length - 1) return;
    setIsDirty(true);
    setContents((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next.map((b, idx) => ({ ...b, sequence_no: idx + 1 }));
    });
  };

  const handleReorderBlocks = (startIndex, endIndex) => {
    setIsDirty(true);
    setContents((prev) => {
      const next = [...prev];
      const [moved] = next.splice(startIndex, 1);
      next.splice(endIndex, 0, moved);
      return next.map((b, idx) => ({ ...b, sequence_no: idx + 1 }));
    });
  };

  // 7. กล่องยืนยันการลบแบบรวมศูนย์
  const handleConfirmDelete = async () => {
    const { type, target, targetIndex } = deleteConfirm;
    setDeleteConfirm((prev) => ({ ...prev, isOpen: false }));

    if (type === "content") {
      setIsDirty(true);
      setContents((prev) => {
        const next = prev.filter((_, idx) => idx !== targetIndex);
        return next.map((b, idx) => ({ ...b, sequence_no: idx + 1 }));
      });
      showToast("success", "ลบบล็อกเนื้อหาเรียบร้อยแล้ว");
      return;
    }

    if (type === "chapter") {
      if (isIoT101) {
        setChapters((prev) => prev.filter((c) => c.lesson_id !== target.lesson_id));
        showToast("success", "ลบบทเรียนเรียบร้อยแล้ว");
        return;
      }
      try {
        await classroomService.deleteLesson(target.lesson_id);
        showToast("success", "ลบบทเรียนเรียบร้อยแล้ว");
        loadCurriculumData();
      } catch {
        showToast("error", "ไม่สามารถลบบทเรียนได้");
      }
      return;
    }

    if (type === "episode") {
      if (isIoT101) {
        const epId = target.episode_id || target.id;
        setChapters((prev) =>
          prev.map((ch) => ({
            ...ch,
            episodes: (ch.episodes || []).filter((e) => (e.episode_id || e.id) !== epId),
          }))
        );
        showToast("success", "ลบตอนย่อยเรียบร้อยแล้ว");
        return;
      }
      try {
        const epId = target.episode_id || target.id;
        await classroomService.deleteEpisode(epId);
        showToast("success", "ลบตอนย่อยเรียบร้อยแล้ว");
        loadCurriculumData();
      } catch {
        showToast("error", "ไม่สามารถลบตอนย่อยได้");
      }
    }
  };

  // 8. บันทึกฉบับร่าง (Save Draft)
  const handleSaveDraft = async () => {
    if (!selectedEpisode) {
      showToast("error", "กรุณาเลือกตอนย่อยก่อนทำการบันทึก");
      return;
    }

    setIsSaving(true);

    if (isIoT101) {
      setTimeout(() => {
        setIsSaving(false);
        setIsDirty(false);
        showToast("success", "บันทึกเนื้อหาเรียบร้อยแล้ว");
      }, 500);
      return;
    }

    const episodeId = selectedEpisode.episode_id || selectedEpisode.id;

    try {
      // 1. ซิงค์ Content Blocks เข้าสู่ Episode
      // เพื่อความปลอดภัยและรักษาระดับ Sequence: บันทึกบล็อกทั้งหมด
      await Promise.all(
        contents.map((block, idx) => {
          const payload = {
            content_type: block.content_type,
            content_data: block.content_data,
            caption: block.caption,
            sequence_no: idx + 1,
          };
          if (block.content_id && !block.content_id.startsWith("temp-")) {
            return classroomService.updateContent(block.content_id, payload);
          } else {
            return classroomService.addEpisodeContent(episodeId, payload);
          }
        })
      );

      // 2. ปรับสถานะตอนเป็น draft
      await classroomService.updateEpisode(episodeId, { status: "draft" });

      setIsDirty(false);
      showToast("success", "บันทึกเนื้อหาเรียบร้อยแล้ว");
      // รีโหลดเพื่อดึง ID จริงจากฐานข้อมูล
      const res = await classroomService.getEpisode(episodeId);
      setContents(res.episode?.contents || []);
    } catch (err) {
      showToast("error", err.response?.data?.message || "ไม่สามารถบันทึกเนื้อหาได้");
    } finally {
      setIsSaving(false);
    }
  };

  // 9. เผยแพร่ (Publish)
  const handlePublish = async () => {
    if (!selectedEpisode) {
      showToast("error", "กรุณาเลือกตอนย่อยก่อนทำการเผยแพร่");
      return;
    }

    // Validation: ต้องมีเนื้อหาอย่างน้อย 1 บล็อก
    if (contents.length === 0) {
      showToast("error", "ไม่สามารถเผยแพร่ได้: ตอนนี้ยังไม่มีเนื้อหา กรุณาเพิ่มเนื้อหาอย่างน้อย 1 บล็อก");
      return;
    }

    setIsPublishing(true);

    if (isIoT101) {
      setTimeout(() => {
        setIsPublishing(false);
        setIsDirty(false);
        showToast("success", "เผยแพร่เนื้อหาเรียบร้อยแล้ว");
      }, 500);
      return;
    }

    const episodeId = selectedEpisode.episode_id || selectedEpisode.id;
    const chapterId = selectedChapter?.lesson_id;

    try {
      // 1. ซิงค์เนื้อหาทั้งหมด
      await Promise.all(
        contents.map((block, idx) => {
          const payload = {
            content_type: block.content_type,
            content_data: block.content_data,
            caption: block.caption,
            sequence_no: idx + 1,
          };
          if (block.content_id && !block.content_id.startsWith("temp-")) {
            return classroomService.updateContent(block.content_id, payload);
          } else {
            return classroomService.addEpisodeContent(episodeId, payload);
          }
        })
      );

      // 2. อัปเดตสถานะตอนเป็น active (เผยแพร่)
      await classroomService.updateEpisode(episodeId, { status: "active" });

      // 3. อัปเดตสถานะบทเรียนเป็น active หากยังไม่เปิด
      if (chapterId && (selectedChapter.status || "").toLowerCase() !== "active") {
        await classroomService.updateLesson(chapterId, { status: "active" });
      }

      setIsDirty(false);
      showToast("success", "เผยแพร่เนื้อหาเรียบร้อยแล้ว");
      loadCurriculumData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "ไม่สามารถเผยแพร่เนื้อหาได้");
    } finally {
      setIsPublishing(false);
    }
  };

  // 10. จัดการ Unsaved Changes Navigation
  // ข้อความจากหน้าก่อน (เช่น "ส่งคอร์สให้ผู้ดูแลตรวจสอบแล้ว" หลังสร้างคอร์ส) แสดงครั้งเดียว
  useEffect(() => {
    if (location.state?.notice) {
      showToast("success", location.state.notice);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ปุ่มสถานะคอร์ส (เผยแพร่ / ส่งตรวจ / อนุมัติ / ยกเลิกเผยแพร่ / เก็บถาวร / กู้คืน) ชุดเดียวกับหน้ารายการคอร์ส
  // คอร์สที่สร้างใหม่เป็นฉบับร่าง และระบบพามาหน้านี้ จึงต้องเผยแพร่หรือส่งตรวจจากหน้านี้ได้
  // "ไม่อนุมัติ" ต้องกรอกเหตุผล จึงทำจากหน้าตรวจคอร์สก่อนเผยแพร่เท่านั้น
  const courseActions = isIoT101 ? [] : getStatusActions(course).filter((a) => a.key !== "reject");

  const handleCourseStatusAction = async (action) => {
    if (!course || isIoT101) return;
    setIsCoursePublishing(true);
    try {
      const res =
        action.key === "approve"
          ? await classroomService.reviewClassroom(classroomId, true)
          : await classroomService.changeClassroomStatus(classroomId, action.status);
      const updated = res?.classroom || res?.course;
      if (updated) setCourse((prev) => ({ ...prev, ...updated }));
      showToast("success", res?.message || "บันทึกสถานะคอร์สแล้ว");
    } catch (err) {
      showToast("error", err.response?.data?.message || "เปลี่ยนสถานะคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsCoursePublishing(false);
    }
  };

  const handleBackToCourses = () => {
    if (isDirty) {
      setPendingNavigation({ type: "route", path: "/admin/courses" });
      setIsUnsavedDialogOpen(true);
    } else {
      navigate("/admin/courses");
    }
  };

  const handleStayOnPage = () => {
    setIsUnsavedDialogOpen(false);
    setPendingNavigation(null);
  };

  const handleDiscardAndExit = () => {
    setIsDirty(false);
    setIsUnsavedDialogOpen(false);
    if (pendingNavigation?.type === "route") {
      navigate(pendingNavigation.path);
    } else if (pendingNavigation?.type === "selectEpisode") {
      setSelectedChapter(pendingNavigation.chapter);
      setSelectedEpisode(pendingNavigation.episode);
      if (isIoT101) {
        setContents(getMockContentsForEpisode(pendingNavigation.episode.id));
      } else {
        const epId = pendingNavigation.episode.episode_id || pendingNavigation.episode.id;
        classroomService.getEpisode(epId).then((res) => {
          setContents(res.episode?.contents || []);
        });
      }
    }
    setPendingNavigation(null);
  };

  const handleSaveAndExit = async () => {
    await handleSaveDraft();
    handleDiscardAndExit();
  };

  // ตรวจสอบสิทธิ์เบื้องต้น
  const isAuthorized = hasRole("admin") || hasRole("instructor");
  if (!isAuthorized && !isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-rose-600">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-xs text-[#6B7773]">
          เฉพาะผู้สอนและผู้ดูแลระบบเท่านั้นที่สามารถจัดการเนื้อหาคอร์สเรียนได้
        </p>
        <Link
          to="/"
          className="inline-block rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C]"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. Header Toolbar, Mobile Switcher & Toast */}
      <CourseContentHeader
        courseTitle={course?.title}
        isIoT101={isIoT101}
        classroomId={classroomId}
        mobileTab={mobileTab}
        onTabChange={setMobileTab}
        onBack={handleBackToCourses}
        course={isIoT101 ? null : course}
        courseActions={courseActions}
        onCourseStatusAction={handleCourseStatusAction}
        isPublishing={isCoursePublishing}
      />

      {/* 2. พื้นที่การทำงานหลัก 2 คอลัมน์ (Desktop: ซ้าย-ขวา, Mobile: สลับแท็บ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* คอลัมน์ซ้าย (4 cols): Curriculum Tree */}
        <div
          className={`lg:col-span-4 ${
            mobileTab === "tree" ? "block" : "hidden sm:block"
          }`}
        >
          <CurriculumTree
            course={course}
            chapters={chapters}
            selectedChapterId={selectedChapter?.lesson_id || selectedChapter?.id}
            selectedEpisodeId={selectedEpisode?.episode_id || selectedEpisode?.id}
            onSelectEpisode={handleSelectEpisode}
            onAddChapter={handleOpenAddChapter}
            onEditChapter={handleOpenEditChapter}
            onDeleteChapter={handleDeleteChapter}
            onMoveChapterUp={(idx) => handleMoveChapter(idx, -1)}
            onMoveChapterDown={(idx) => handleMoveChapter(idx, 1)}
            onToggleChapterStatus={handleToggleChapterStatus}
            onAddEpisode={handleOpenAddEpisode}
            onEditEpisode={handleOpenEditEpisode}
            onDeleteEpisode={handleDeleteEpisode}
            onMoveEpisodeUp={(ch, idx) => handleMoveEpisode(ch, idx, -1)}
            onMoveEpisodeDown={(ch, idx) => handleMoveEpisode(ch, idx, 1)}
            onToggleEpisodeStatus={handleToggleEpisodeStatus}
          />
        </div>

        {/* คอลัมน์ขวา (8 cols): Content Builder */}
        <div
          className={`lg:col-span-8 ${
            mobileTab === "builder" ? "block" : "hidden sm:block"
          }`}
        >
          <ContentBuilder
            course={course}
            chapter={selectedChapter}
            episode={selectedEpisode}
            contents={contents}
            isDirty={isDirty}
            onAddBlock={handleOpenAddBlock}
            onEditBlock={handleOpenEditBlock}
            onDeleteBlock={handleDeleteBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onMoveUp={handleMoveBlockUp}
            onMoveDown={handleMoveBlockDown}
            onReorder={handleReorderBlocks}
            onSaveDraft={handleSaveDraft}
            onPublish={handlePublish}
            onOpenPreview={() => setIsPreviewModalOpen(true)}
            isSaving={isSaving}
            isPublishing={isPublishing}
          />
        </div>
      </div>

      {/* 3. Modal ต่างๆ */}

      {/* Chapter Modal */}
      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        initialData={editingChapter}
        nextSequenceNo={chapters.length + 1}
        onSave={handleSaveChapter}
      />

      {/* Episode Modal */}
      <EpisodeModal
        isOpen={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        chapterTitle={targetChapterForEpisode?.title || "บทเรียน"}
        initialData={editingEpisode}
        nextSequenceNo={(targetChapterForEpisode?.episodes?.length || 0) + 1}
        onSave={handleSaveEpisode}
      />

      {/* Content Block Modals (Consolidated) */}
      <ContentBlockModalManager
        activeBlockModal={activeBlockModal}
        onClose={handleCloseBlockModal}
        onSave={handleSaveBlock}
      />

      {/* Student Preview Modal */}
      <StudentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        courseTitle={course?.title}
        chapterTitle={selectedChapter?.title}
        episodeTitle={selectedEpisode?.title}
        contents={contents}
      />

      {/* Unsaved Changes Warning Dialog */}
      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onStay={handleStayOnPage}
        onDiscardAndExit={handleDiscardAndExit}
        onSaveAndExit={handleSaveAndExit}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        variant="danger"
      />
    </div>
  );
}

export default CourseContentManager;
