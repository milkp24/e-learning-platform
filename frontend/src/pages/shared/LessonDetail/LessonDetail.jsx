import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuTriangleAlert as LuAlertTriangle, LuLayers, LuCpu, LuX, LuCompass } from "react-icons/lu";
import classroomService from "../../../services/classroomService";
import useAuthStore from "../../../store/useAuthStore";
import useIoT101Store from "../../../store/useIoT101Store";
import {
  IOT_101_COURSE,
  getEpisodeById,
  getMockContentsForEpisode,
} from "../../../data/iot101Data";
import { EPISODE_INTERACTIVE_DATA } from "../../../data/iot101InteractiveData";
import LessonNoticeBanner from "./components/LessonNoticeBanner";
import LessonBreadcrumbHeader from "./components/LessonBreadcrumbHeader";
import ContentListSection from "./components/ContentListSection";
import EpisodeNavigation from "./components/EpisodeNavigation";
import AddContentModal from "./components/AddContentModal";
import EditContentModal from "./components/EditContentModal";
import EditLessonModal from "./components/EditLessonModal";
import {
  StoryScene,
  MissionCard,
  SimulationWidget,
  InteractiveActivity,
  UnlockModal,
  SystemBlueprint,
  ComponentCollection,
} from "../../../features/courses/iot101";

/**
 * LessonDetail Page Component (หน้ารายละเอียดบทเรียนและจัดการเนื้อหา)
 * ยกระดับเป็น Interactive E-learning:
 * - Story Scene (ฉากสวนนาวาและบทสนทนาตัวละครไอโอ)
 * - Mission Card (การ์ดภารกิจ 5 มิติ)
 * - Interactive Activity (กิจกรรมทดลองปักเซนเซอร์)
 * - Simulation Widget (จำลองระบบรดน้ำอัตโนมัติ)
 * - Companion Bar & Modals (ดูพิมพ์เขียวและคลังอุปกรณ์โดยไม่ต้องออกจากหน้า)
 * - Unlock Modal (ฉลองความสำเร็จและปลดล็อกอุปกรณ์)
 */
function LessonDetail() {
  const { classroomId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const { completedEpisodes, completeEpisode } = useIoT101Store();

  const [classroom, setClassroom] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [episodeData, setEpisodeData] = useState(null);

  // Companion Modal inside lesson (Blueprint or Collection)
  const [companionModal, setCompanionModal] = useState(null);

  const missionRef = useRef(null);

  // Add Content Modal State
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [contentType, setContentType] = useState("text");
  const [contentData, setContentData] = useState("");
  const [submittingContent, setSubmittingContent] = useState(false);

  // Edit Content Modal State
  const [editingContent, setEditingContent] = useState(null);
  const [editContentType, setEditContentType] = useState("text");
  const [editContentData, setEditContentData] = useState("");
  const [updatingContent, setUpdatingContent] = useState(false);

  // Edit Lesson Modal State
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSeq, setLessonSeq] = useState(1);
  const [lessonStatus, setLessonStatus] = useState("published");

  // ตรวจสอบว่าเป็นบทเรียน IoT 101 หรือไม่
  const isIoT101 = classroomId === "iot-101" || String(lessonId).startsWith("ep-");
  const interactiveMeta = isIoT101 ? EPISODE_INTERACTIVE_DATA[lessonId] : null;
  const isCompleted = isIoT101 && completedEpisodes.includes(lessonId);

  // โหมดดูตัวอย่างมุมมองนักเรียน (ข้อ 20): ซ่อนปุ่มเพิ่มเนื้อหา แก้ไข และลบบทเรียนทั้งหมด
  const [searchParams] = useSearchParams();
  const isStudentPreview =
    searchParams.get("preview") === "student" && (hasRole("instructor") || hasRole("admin"));

  // ตรวจสอบสิทธิ์: ผู้ใช้เป็น Admin หรือเป็น Instructor เจ้าของห้องเรียนนี้หรือไม่
  const isOwnerOrAdmin =
    !isStudentPreview &&
    classroom &&
    user &&
    (hasRole("admin") ||
      (hasRole("instructor") &&
        String(classroom.instructor_id) === String(user.user_id)));

  const showNotice = (type, text) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // กรณีเป็นบทเรียน (Episode) ของ IoT 101 หรือ lessonId ขึ้นต้นด้วย ep-
    if (classroomId === "iot-101" || String(lessonId).startsWith("ep-")) {
      const epInfo = getEpisodeById(lessonId);
      if (epInfo) {
        setClassroom(IOT_101_COURSE);
        setLesson({
          lesson_id: epInfo.episode.id,
          title: `${epInfo.episode.code}: ${epInfo.episode.title}`,
          sequence_no: epInfo.chapter.sequence_no,
          status: "published",
        });
        setLessonTitle(`${epInfo.episode.code}: ${epInfo.episode.title}`);
        setLessonSeq(epInfo.chapter.sequence_no);
        setLessonStatus("published");
        setEpisodeData(epInfo);
        setContents(getMockContentsForEpisode(lessonId));
        setLoading(false);
        return;
      }
    }

    try {
      const cRes = await classroomService.getClassroom(classroomId);
      setClassroom(cRes.classroom);

      const lRes = await classroomService.getLesson(lessonId);
      setLesson(lRes.lesson);
      setLessonTitle(lRes.lesson.title);
      setLessonSeq(lRes.lesson.sequence_no);
      setLessonStatus(lRes.lesson.status || "published");

      if (lRes.lesson.contents) {
        setContents(lRes.lesson.contents);
      } else {
        const cntRes = await classroomService.getContents(lessonId);
        setContents(cntRes.contents || []);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "ไม่สามารถโหลดข้อมูลบทเรียนได้ หรือคุณไม่มีสิทธิ์เข้าถึง";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [classroomId, lessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleContinueStory = () => {
    if (missionRef.current) {
      missionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCompleteMission = () => {
    if (isIoT101) {
      completeEpisode(lessonId);
      showNotice("success", "ยินดีด้วย! คุณทำภารกิจในตอนนี้สำเร็จแล้ว");
    }
  };

  // Handlers for Content Management
  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!contentData.trim()) {
      showNotice("error", "กรุณากรอกข้อมูลเนื้อหา");
      return;
    }

    setSubmittingContent(true);
    try {
      await classroomService.addContent(lessonId, {
        content_type: contentType,
        content_data: contentData.trim(),
      });
      showNotice("success", "เพิ่มเนื้อหาเรียบร้อยแล้ว");
      setIsAddContentModalOpen(false);
      setContentData("");
      setContentType("text");
      loadData();
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มเนื้อหา"
      );
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleOpenEditContent = (item) => {
    setEditingContent(item);
    setEditContentType(item.content_type);
    setEditContentData(item.content_data || "");
  };

  const handleUpdateContent = async (e) => {
    e.preventDefault();
    if (!editContentData.trim()) {
      showNotice("error", "กรุณากรอกข้อมูลเนื้อหา");
      return;
    }

    setUpdatingContent(true);
    try {
      await classroomService.updateContent(editingContent.content_id, {
        content_type: editContentType,
        content_data: editContentData.trim(),
      });
      showNotice("success", "แก้ไขเนื้อหาเรียบร้อยแล้ว");
      setEditingContent(null);
      loadData();
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขเนื้อหา"
      );
    } finally {
      setUpdatingContent(false);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเนื้อหานี้?")) return;
    try {
      await classroomService.deleteContent(contentId);
      showNotice("success", "ลบเนื้อหาเรียบร้อยแล้ว");
      loadData();
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "เกิดข้อผิดพลาดในการลบเนื้อหา"
      );
    }
  };

  // Handlers for Lesson Management
  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      await classroomService.updateLesson(lessonId, {
        title: lessonTitle.trim(),
        sequence_no: parseInt(lessonSeq, 10),
        status: lessonStatus,
      });
      showNotice("success", "แก้ไขบทเรียนเรียบร้อยแล้ว");
      setIsEditLessonModalOpen(false);
      loadData();
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขบทเรียน"
      );
    }
  };

  const handleDeleteLesson = async () => {
    if (
      !window.confirm(
        "คุณแน่ใจหรือไม่ว่าต้องการลบบทเรียนนี้? ข้อมูลเนื้อหาทั้งหมดจะถูกลบไปด้วย"
      )
    )
      return;

    try {
      await classroomService.deleteLesson(lessonId);
      navigate(`/classrooms/${classroomId}`);
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "เกิดข้อผิดพลาดในการลบบทเรียน"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>กำลังโหลดข้อมูลบทเรียน...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="flex justify-center mb-3">
          <LuAlertTriangle className="h-10 w-10 text-red-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-red-800">
          ไม่สามารถเข้าถึงบทเรียนได้
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Link
          to={`/classrooms/${classroomId}`}
          className="mt-6 inline-block rounded-xl bg-white px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50"
        >
          ← กลับไปยังห้องเรียน
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Notice Banner */}
      <LessonNoticeBanner actionNotice={actionNotice} />

      {isStudentPreview && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="font-bold text-amber-900">
            คุณกำลังดูบทเรียนในมุมมองนักเรียน (Student Preview)
          </span>
          <Link
            to={`/classrooms/${classroomId}/lessons/${lessonId}`}
            className="rounded-xl bg-white border border-amber-300 px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
          >
            ออกจากมุมมองนักเรียน
          </Link>
        </div>
      )}

      {/* Header & Breadcrumbs */}
      <LessonBreadcrumbHeader
        previewQuery={isStudentPreview ? "?preview=student" : ""}
        classroomId={classroomId}
        classroom={classroom}
        lesson={lesson}
        episodeData={episodeData}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onOpenAddContentModal={() => setIsAddContentModalOpen(true)}
        onOpenEditLessonModal={() => setIsEditLessonModalOpen(true)}
        onDeleteLesson={handleDeleteLesson}
      />

      {/* Companion Bar สำหรับ IoT 101 (เปิดดูพิมพ์เขียวหรือคลังอุปกรณ์ได้ทันที) */}
      {isIoT101 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5E9E7] bg-white p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#004643]">
            <LuCompass className="h-4 w-4" />
            <span>เครื่องมือช่วยเรียนรู้ IoT 101:</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompanionModal("blueprint")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-[#ABD1C6]/20 hover:border-[#ABD1C6] transition cursor-pointer"
            >
              <LuLayers className="h-3.5 w-3.5 text-[#004643]" />
              <span>พิมพ์เขียวระบบ</span>
            </button>

            <button
              type="button"
              onClick={() => setCompanionModal("collection")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-[#ABD1C6]/20 hover:border-[#ABD1C6] transition cursor-pointer"
            >
              <LuCpu className="h-3.5 w-3.5 text-[#004643]" />
              <span>คลังอุปกรณ์</span>
            </button>

            <Link
              to="/classrooms/iot-101"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-1.5 text-xs font-bold text-[#6B7773] hover:text-[#26332F] transition"
            >
              <span>แผนที่สวน ↗</span>
            </Link>
          </div>
        </div>
      )}

      {/* 1. Story Scene (หากมีเรื่องราวในตอนนี้) */}
      {interactiveMeta?.story && (
        <StoryScene
          sceneName={interactiveMeta.story.sceneName}
          sceneSubtitle={interactiveMeta.story.sceneSubtitle}
          characterName={interactiveMeta.story.characterName}
          characterAvatar={interactiveMeta.story.characterAvatar}
          characterRole={interactiveMeta.story.characterRole}
          dialogue={interactiveMeta.story.dialogue}
          environmentElements={interactiveMeta.story.environmentElements}
          onContinue={handleContinueStory}
        />
      )}

      {/* 2. Mission Card (การ์ดภารกิจประจำตอน) */}
      <div ref={missionRef}>
        {interactiveMeta?.mission ? (
          <MissionCard
            title={interactiveMeta.mission.title}
            target={interactiveMeta.mission.target}
            problem={interactiveMeta.mission.problem}
            searchFor={interactiveMeta.mission.searchFor}
            actions={interactiveMeta.mission.actions}
            status={isCompleted ? "completed" : "in_progress"}
          />
        ) : isIoT101 ? (
          <MissionCard
            title={`ภารกิจประจำ ${episodeData?.episode?.code || "บทเรียน"}: ${episodeData?.episode?.title || ""}`}
            target="ศึกษาและทำความเข้าใจเนื้อหาบทเรียนประจำหลักสูตร IoT 101"
            problem="ระบบในสวนต้องการการตั้งค่าและเชื่อมต่ออุปกรณ์ที่ถูกต้อง"
            searchFor="แนวทางการต่อวงจร โค้ดตัวอย่าง และขั้นตอนการทดสอบ"
            actions="อ่านเนื้อหา ทดลองรันโค้ด และบันทึกผลการเรียนรู้"
            status={isCompleted ? "completed" : "in_progress"}
          />
        ) : null}
      </div>

      {/* 3. Interactive Activity (กิจกรรมปักเซนเซอร์หรือทดสอบ) */}
      {interactiveMeta?.activity && (
        <InteractiveActivity
          activityData={interactiveMeta.activity}
          onComplete={handleCompleteMission}
        />
      )}

      {/* 4. Interactive Simulation Widget (จำลองระบบปั๊มน้ำอัตโนมัติ) */}
      {interactiveMeta?.simulation && (
        <SimulationWidget onSimulationComplete={handleCompleteMission} />
      )}

      {/* 5. Standard Content List Section */}
      <ContentListSection
        contents={contents}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onOpenAddContentModal={() => setIsAddContentModalOpen(true)}
        onOpenEditContent={handleOpenEditContent}
        onDeleteContent={handleDeleteContent}
      />

      {/* 6. Episode Navigation */}
      <EpisodeNavigation
        episodeData={episodeData}
        isCompleted={isCompleted}
        onCompleteMission={handleCompleteMission}
      />

      {/* Modals */}
      <AddContentModal
        isOpen={isAddContentModalOpen}
        onClose={() => setIsAddContentModalOpen(false)}
        contentType={contentType}
        onContentTypeChange={setContentType}
        contentData={contentData}
        onContentDataChange={setContentData}
        onSubmit={handleAddContent}
        submittingContent={submittingContent}
      />

      <EditContentModal
        editingContent={editingContent}
        onClose={() => setEditingContent(null)}
        editContentType={editContentType}
        onEditContentTypeChange={setEditContentType}
        editContentData={editContentData}
        onEditContentDataChange={setEditContentData}
        onSubmit={handleUpdateContent}
        updatingContent={updatingContent}
      />

      <EditLessonModal
        isOpen={isEditLessonModalOpen}
        onClose={() => setIsEditLessonModalOpen(false)}
        lessonTitle={lessonTitle}
        onLessonTitleChange={setLessonTitle}
        lessonSeq={lessonSeq}
        onLessonSeqChange={setLessonSeq}
        lessonStatus={lessonStatus}
        onLessonStatusChange={setLessonStatus}
        onSubmit={handleUpdateLesson}
      />

      {/* Modal แจ้งเตือนเมื่อปลดล็อกอุปกรณ์ / ความสามารถใหม่ */}
      <UnlockModal onNavigateTab={() => navigate("/classrooms/iot-101")} />

      {/* Companion Quick-View Modal (พิมพ์เขียว หรือ คลังอุปกรณ์) */}
      {companionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs animate-fadeIn"
            onClick={() => setCompanionModal(null)}
          />
          <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-scaleUp">
            <button
              type="button"
              onClick={() => setCompanionModal(null)}
              aria-label="ปิด"
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition cursor-pointer"
            >
              <LuX className="h-5 w-5" />
            </button>

            {companionModal === "blueprint" && <SystemBlueprint />}
            {companionModal === "collection" && <ComponentCollection />}
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonDetail;
