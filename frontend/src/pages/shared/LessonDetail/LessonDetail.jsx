import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { LuTriangleAlert as LuAlertTriangle, LuLayers, LuCpu, LuX, LuCompass, LuCode, LuAward, LuClock, LuLock } from "react-icons/lu";
import classroomService from "../../../features/classrooms/services/classroomService";
import exerciseService from "../../../features/exercises/services/exerciseService";
import useAuthStore from "../../../app/store/useAuthStore";
import useIoT101Store from "../../../features/courses/store/useIoT101Store";
import {
  IOT_101_COURSE,
  getEpisodeById,
  getMockContentsForEpisode,
} from "../../../features/courses/iot101/data/iot101Data";
import { EPISODE_INTERACTIVE_DATA } from "../../../features/courses/iot101/data/iot101InteractiveData";
import LessonNoticeBanner from "./components/LessonNoticeBanner";
import LessonBreadcrumbHeader from "./components/LessonBreadcrumbHeader";
import ContentListSection from "./components/ContentListSection";
import EpisodeNavigation from "./components/EpisodeNavigation";
import AddContentModal from "./components/AddContentModal";
import EditContentModal from "./components/EditContentModal";
import EditLessonModal from "./components/EditLessonModal";
import {
  StoryScene,
  LearningMissionCard,
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
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

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

  // ตรวจสอบสิทธิ์: ผู้ใช้เป็น Admin หรือเป็น Instructor เจ้าของห้องเรียนนี้หรือไม่
  const isOwnerOrAdmin =
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

      // ดึงแบบฝึกหัดที่เชื่อมโยงกับบทเรียนนี้จาก Backend จริง
      try {
        const exRes = await exerciseService.getExercises({ lesson_id: lessonId });
        setExercises(exRes.exercises || []);
      } catch {
        setExercises([]);
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

  const handleGoToExercise = () => {
    if (exercises && exercises.length > 0) {
      const firstEx = exercises[0];
      navigate(
        classroomId
          ? `/classrooms/${classroomId}/exercises/${firstEx.exercise_id}`
          : `/exercises/${firstEx.exercise_id}`
      );
    } else {
      const el = document.getElementById("lesson-exercises");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      showNotice("error", "ยังไม่มีแบบฝึกหัดสำหรับบทเรียนนี้");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Notice Banner */}
      <LessonNoticeBanner actionNotice={actionNotice} />

      {/* Sequential Lock Banner if locked */}
      {lesson?.is_locked && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3 text-amber-800 shadow-2xs">
          <LuLock className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">บทเรียนนี้ถูกล็อกตามลำดับก่อนหลัง</p>
            <p className="text-xs text-amber-700 mt-0.5">
              คุณจำเป็นต้องเรียนและทำแบบทดสอบในบทเรียนก่อนหน้าให้ผ่านก่อน จึงจะสามารถปลดล็อกเนื้อหาในบทเรียนนี้ได้
            </p>
          </div>
        </div>
      )}

      {/* Header & Breadcrumbs */}
      <LessonBreadcrumbHeader
        classroomId={classroomId}
        classroom={classroom}
        lesson={lesson}
        episodeData={episodeData}
        isOwnerOrAdmin={isOwnerOrAdmin}
        onOpenAddContentModal={() => setIsAddContentModalOpen(true)}
        onOpenEditLessonModal={() => setIsEditLessonModalOpen(true)}
        onDeleteLesson={handleDeleteLesson}
        onGoToExercise={handleGoToExercise}
        exerciseCount={exercises.length}
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
          <LearningMissionCard
            title={interactiveMeta.mission.title}
            target={interactiveMeta.mission.target}
            problem={interactiveMeta.mission.problem}
            searchFor={interactiveMeta.mission.searchFor}
            actions={interactiveMeta.mission.actions}
            status={isCompleted ? "completed" : "in_progress"}
          />
        ) : isIoT101 ? (
          <LearningMissionCard
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

      {/* 5.5 แบบฝึกหัดประจำบทเรียน (Interactive Exercises) */}
      <section className="space-y-4" id="lesson-exercises">
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuCode className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#26332F]">
                แบบฝึกหัดประจำบทเรียน
              </h3>
              <p className="text-xs text-[#6B7773]">
                ฝึกปฏิบัติและทดสอบทักษะด้วยกิจกรรมเติมโค้ด ดีบักโค้ด และภารกิจเชิงโต้ตอบ
              </p>
            </div>
          </div>

          {isOwnerOrAdmin && (
            <Link
              to={`/instructor/exercises/new?lesson_id=${lessonId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-[#9cc4b9] transition shadow-2xs"
            >
              <span>+ สร้างแบบฝึกหัดใหม่</span>
            </Link>
          )}
        </div>

        {exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E9E7] bg-white p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuCode className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-[#26332F]">
              ยังไม่มีแบบฝึกหัดสำหรับบทเรียนนี้
            </h4>
            <p className="text-xs text-[#6B7773] max-w-sm mx-auto">
              ยังไม่มีแบบฝึกหัดที่เชื่อมโยงกับบทเรียนนี้ในระบบ
            </p>
            {isOwnerOrAdmin && (
              <Link
                to={`/instructor/exercises/new?lesson_id=${lessonId}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9cc4b9] transition shadow-2xs"
              >
                <span>+ สร้างแบบฝึกหัดสำหรับบทเรียนนี้</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex) => (
              <div
                key={ex.exercise_id}
                className="rounded-2xl border border-[#E5E9E7] bg-white p-5 shadow-xs hover:border-[#ABD1C6] transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[#FAFAFA] border border-[#E5E9E7] px-2 py-0.5 text-[10px] font-bold font-mono text-[#6B7773] uppercase">
                      {ex.exercise_type || "practice"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-800">
                      <LuAward className="h-3.5 w-3.5" />
                      +{ex.xp_reward || 0} XP
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#26332F]">
                    {ex.title}
                  </h4>

                  {ex.instructions && (
                    <p className="text-xs text-[#6B7773] line-clamp-2 leading-relaxed">
                      {ex.instructions}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[#6B7773] pt-1">
                    <span className="font-mono font-bold text-[#26332F]">
                      {ex.total_score} คะแนน
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <LuClock className="h-3.5 w-3.5 text-[#004643]" />
                      {ex.time_limit > 0 ? `${ex.time_limit} นาที` : "ไม่จำกัดเวลา"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E9E7]/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6B7773]">
                    {ex.max_attempts ? `ทำได้สูงสุด ${ex.max_attempts} ครั้ง` : "ทำได้ไม่จำกัดครั้ง"}
                  </span>
                  <Link
                    to={
                      classroomId
                        ? `/classrooms/${classroomId}/exercises/${ex.exercise_id}`
                        : `/exercises/${ex.exercise_id}`
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9cc4b9] transition shadow-2xs"
                  >
                    <span>ทำแบบฝึกหัด</span>
                    <span>↗</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
