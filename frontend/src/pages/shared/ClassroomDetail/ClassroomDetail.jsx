import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { LuEye, LuArrowLeft } from "react-icons/lu";
import classroomService from "../../../services/classroomService";
import useAuthStore from "../../../store/useAuthStore";
import { IOT_101_COURSE, IOT_101_CHAPTERS } from "../../../data/iot101Data";
import ClassroomHero from "./components/ClassroomHero";
import ClassroomActionNotice from "./components/ClassroomActionNotice";
import IoT101Section from "./components/IoT101Section";
import ClassroomTabs from "./components/ClassroomTabs";
import StandardLessonsSection from "./components/StandardLessonsSection";
import MembersSection from "./components/MembersSection";
import EditClassroomModal from "./components/EditClassroomModal";
import AddLessonModal from "./components/AddLessonModal";
import AddMemberModal from "./components/AddMemberModal";
import GuestLockModal from "../../../components/GuestLockModal";
import { confirmDelete } from "../../../store/useConfirmStore";

/**
 * ClassroomDetail Page Component (หน้ารายละเอียดห้องเรียน)
 * Modularized Architecture:
 * - ClassroomHero (Information, owner/admin buttons, student join button, guest start learning)
 * - ClassroomActionNotice (Notice banner)
 * - IoT101Section (When IoT 101 course is viewed)
 * - ClassroomTabs, StandardLessonsSection, MembersSection (When custom course is viewed)
 * - Modals: EditClassroomModal, AddLessonModal, AddMemberModal, GuestLockModal
 */
function ClassroomDetail() {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasRole, isAuthenticated } = useAuthStore();
  const isGuest = !isAuthenticated;

  // โหมด Preview as Student สำหรับ Instructor / Admin
  const isInstructorPreview =
    searchParams.get("preview") === "student" &&
    (hasRole("instructor") || hasRole("admin"));

  const [classroom, setClassroom] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("lessons"); // 'lessons' | 'members'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Guest Lock Modal state
  const [guestModal, setGuestModal] = useState({
    isOpen: false,
    title: "สมัครสมาชิกเพื่อเริ่มเรียน",
    message: "เข้าสู่ระบบหรือสมัครสมาชิกฟรีเพื่อเข้าสู่บทเรียน ทำแบบฝึกหัด และบันทึกความคืบหน้า",
    badge: "สำหรับสมาชิกเท่านั้น",
  });

  const openGuestLockModal = (targetName = "บทเรียนนี้") => {
    setGuestModal({
      isOpen: true,
      title: `เข้าสู่ระบบเพื่อเรียน ${targetName}`,
      message: "สมัครสมาชิกฟรีเพื่อเข้าสู่บทเรียน ใช้งานห้องทดลองเสมือนจริง และสะสมคะแนน",
      badge: "สำหรับสมาชิกเท่านั้น",
    });
  };

  const closeGuestLockModal = () => {
    setGuestModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSeq, setLessonSeq] = useState(1);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");

  // ตรวจสอบว่าเป็นคอร์ส IoT 101 หรือไม่
  const isIoT101 = classroomId === "iot-101";

  // State สำหรับ Expand / Collapse แต่ละ Chapter ของ IoT 101 (เริ่มต้นเปิด Chapter 0 และ 1)
  const [expandedChapters, setExpandedChapters] = useState({
    "ch-0": true,
    "ch-1": true,
  });

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const expandAll = () => {
    const all = {};
    IOT_101_CHAPTERS.forEach((ch) => {
      all[ch.id] = true;
    });
    setExpandedChapters(all);
  };

  const collapseAll = () => {
    setExpandedChapters({});
  };

  // ตรวจสอบสิทธิ์ว่าผู้ใช้คนนี้เป็น Admin หรือเจ้าของห้องนี้หรือไม่
  const rawIsOwnerOrAdmin =
    classroom &&
    user &&
    (hasRole("admin") ||
      (hasRole("instructor") &&
        String(classroom.instructor_id) === String(user.user_id)));

  // หากอยู่ในโหมด Preview as Student ให้ซ่อนเครื่องมือจัดการทั้งหมด
  const isOwnerOrAdmin = isInstructorPreview ? false : rawIsOwnerOrAdmin;

  // ควบคุมการแสดงผล Loading: โหลดครั้งแรกเท่านั้นที่แสดง Full-page Spinner
  // เพื่อป้องกันการ Unmount ทั้งหน้าและป้องกันภาพหน้าปกกระพริบเมื่อมีการ Refresh ข้อมูล
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [classroomId]);

  // ดึงข้อมูลห้องเรียน บทเรียน และสมาชิก
  const loadClassroomData = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    setError(null);

    // กรณีเป็นคอร์ส IoT 101 ให้โหลดข้อมูลจาก mock data
    if (isIoT101) {
      setClassroom(IOT_101_COURSE);
      setEditTitle(IOT_101_COURSE.title);
      setEditDesc(IOT_101_COURSE.description);
      setLessons([]);
      setMembers([]);
      setLoading(false);
      hasLoadedRef.current = true;
      return;
    }

    try {
      const cData = await classroomService.getClassroom(classroomId);
      setClassroom(cData.classroom);
      setEditTitle(cData.classroom.title);
      setEditDesc(cData.classroom.description || "");

      // ดึงบทเรียน (อาจจะ error 403 ถ้า student ยังไม่ได้ enroll)
      try {
        const lData = await classroomService.getLessons(classroomId);
        setLessons(lData.lessons || []);
      } catch {
        setLessons([]);
      }

      // ดึงสมาชิก (เฉพาะสมาชิกที่เข้าสู่ระบบแล้ว)
      if (isAuthenticated) {
        try {
          const mData = await classroomService.getMembers(classroomId);
          setMembers(mData.members || []);
        } catch {
          setMembers([]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "ไม่พบห้องเรียนนี้");
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [classroomId, isIoT101, isAuthenticated]);

  useEffect(() => {
    loadClassroomData();
  }, [loadClassroomData]);

  const showNotice = (type, text) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // บันทึกการแก้ไขห้องเรียน
  const handleUpdateClassroom = async (e) => {
    e.preventDefault();
    try {
      await classroomService.updateClassroom(classroomId, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
      });
      setIsEditModalOpen(false);
      showNotice("success", "แก้ไขข้อมูลคอร์สสำเร็จ");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "แก้ไขไม่สำเร็จ");
    }
  };

  // ปุ่มสถานะคอร์ส (เผยแพร่ / ส่งตรวจ / อนุมัติ / ยกเลิกเผยแพร่ / เก็บถาวร / กู้คืน)
  const [isStatusBusy, setIsStatusBusy] = useState(false);
  const handleCourseStatusAction = async (action) => {
    setIsStatusBusy(true);
    try {
      const res =
        action.key === "approve"
          ? await classroomService.reviewClassroom(classroomId, true)
          : await classroomService.changeClassroomStatus(classroomId, action.status);
      showNotice("success", res?.message || "บันทึกสถานะคอร์สแล้ว");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "เปลี่ยนสถานะคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsStatusBusy(false);
    }
  };

  // ลบห้องเรียน
  const handleDeleteClassroom = async () => {
    const ok = await confirmDelete({
      itemType: "คอร์สเรียน",
      itemName: classroom?.title,
      detail: "บทเรียน เนื้อหา และรายชื่อสมาชิกทั้งหมดในคอร์สนี้จะถูกลบไปด้วย และไม่สามารถย้อนกลับได้",
    });
    if (!ok) {
      return;
    }
    try {
      await classroomService.deleteClassroom(classroomId);
      navigate("/classrooms", { replace: true });
    } catch (err) {
      showNotice("error", err.response?.data?.message || "ลบห้องเรียนไม่สำเร็จ");
    }
  };

  // เพิ่มบทเรียนใหม่
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      await classroomService.createLesson(classroomId, {
        title: lessonTitle.trim(),
        sequence_no: parseInt(lessonSeq, 10),
        status: "active",
      });
      setLessonTitle("");
      setLessonSeq(lessons.length + 2);
      setIsAddLessonModalOpen(false);
      showNotice("success", "สร้างบทเรียนสำเร็จ");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "สร้างบทเรียนไม่สำเร็จ");
    }
  };

  // ลบบทเรียน
  const handleDeleteLesson = async (lessonId) => {
    const lessonToDelete = lessons.find((l) => String(l.lesson_id || l.id) === String(lessonId));
    if (
      !(await confirmDelete({
        itemType: "บทเรียน",
        itemName: lessonToDelete?.title,
        detail: "ตอนย่อยและเนื้อหาทั้งหมดในบทเรียนนี้จะถูกลบไปด้วย และไม่สามารถย้อนกลับได้",
      }))
    )
      return;
    try {
      await classroomService.deleteLesson(lessonId);
      showNotice("success", "ลบบทเรียนสำเร็จ");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "ลบบทเรียนไม่สำเร็จ");
    }
  };

  // เพิ่มสมาชิก
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;
    try {
      await classroomService.addMember(classroomId, targetUserId.trim());
      setTargetUserId("");
      setIsAddMemberModalOpen(false);
      showNotice("success", "เพิ่มสมาชิกสำเร็จ");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "เพิ่มสมาชิกไม่สำเร็จ");
    }
  };

  // ลบสมาชิก
  const handleRemoveMember = async (memberUserId) => {
    const member = members.find((m) => String(m.user_id) === String(memberUserId));
    if (
      !(await confirmDelete({
        itemType: "สมาชิกออกจากคอร์ส",
        itemName: member?.display_name || member?.email,
        detail: "ผู้เรียนจะไม่สามารถเข้าคอร์สนี้ได้จนกว่าจะลงทะเบียนใหม่",
        confirmText: "นำออกจากคอร์ส",
      }))
    )
      return;
    try {
      await classroomService.removeMember(classroomId, memberUserId);
      showNotice("success", "นำสมาชิกออกเรียบร้อยแล้ว");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "ไม่สามารถนำสมาชิกออกได้");
    }
  };

  // นักเรียนขอกด Join เข้าห้องเรียน
  const handleJoin = async () => {
    try {
      await classroomService.joinClassroom(classroomId);
      showNotice("success", "เข้าร่วมห้องเรียนเรียบร้อยแล้ว!");
      loadClassroomData();
    } catch (err) {
      // HTTP 409 Conflict หมายความว่าผู้ใช้ enrolled แล้ว (by design)
      // ให้ Reload ข้อมูลเพื่ออัปเดต isEnrolled State แทนการแสดง Error
      if (err.response?.status === 409) {
        showNotice("success", "คุณเป็นสมาชิกห้องเรียนนี้แล้ว");
        loadClassroomData();
      } else {
        showNotice("error", err.response?.data?.message || "เข้าร่วมไม่สำเร็จ");
      }
    }
  };

  const isEnrolled =
    isInstructorPreview ||
    !!classroom?.is_enrolled ||
    members.some((m) => user && String(m.user_id) === String(user.user_id));

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#ABD1C6] border-r-transparent mb-2"></div>
        <p className="text-sm">กำลังโหลดข้อมูลห้องเรียน...</p>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center text-red-700 max-w-lg mx-auto">
        <p className="font-semibold text-lg">{error || "ไม่พบห้องเรียน"}</p>
        <Link
          to="/classrooms"
          className="mt-4 inline-block rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          ← กลับไปหน้ารายการห้องเรียน
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 0. แบนเนอร์แสดงสถานะโหมดดูตัวอย่างในมุมมองนักเรียน (Student Preview Mode) */}
      {isInstructorPreview && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-[#26332F] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-base shadow-xs">
              <LuEye className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                คุณกำลังดูตัวอย่างหลักสูตรในมุมมองนักเรียน (Student Preview Mode)
              </h4>
              <p className="text-xs text-amber-700">
                หน้านี้แสดงผลตามที่นักเรียนเห็นจริง โดยซ่อนเครื่องมือแก้ไข จัดการ และลบคอร์สทั้งหมด
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/classrooms/${classroomId}/manage`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-white hover:bg-[#003835] transition shadow-xs whitespace-nowrap cursor-pointer"
            >
              <LuArrowLeft className="h-4 w-4" />
              <span>← กลับหน้าจัดการคอร์ส</span>
            </Link>
            <Link
              to={`/classrooms/${classroomId}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span>ออกจากโหมดพรีวิว</span>
            </Link>
          </div>
        </div>
      )}

      {/* ลิงก์ย้อนกลับ */}
      <Link
        to="/classrooms"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        ← กลับไปหน้ารายการห้องเรียน
      </Link>

      {/* กล่องแจ้งเตือนผลลัพธ์ */}
      <ClassroomActionNotice actionNotice={actionNotice} />

      {/* ส่วนหัวของห้องเรียน (Classroom Hero) */}
      <ClassroomHero
        classroom={classroom}
        isIoT101={isIoT101}
        isEnrolled={isEnrolled}
        isOwnerOrAdmin={isOwnerOrAdmin}
        hasRole={hasRole}
        isGuest={isGuest}
        isInstructorPreview={isInstructorPreview}
        firstLessonId={lessons[0]?.lesson_id}
        lessonsCount={lessons.length}
        membersCount={members.length}
        onJoin={handleJoin}
        onOpenLockModal={openGuestLockModal}
        onOpenEditModal={() => setIsEditModalOpen(true)}
        onDeleteClassroom={handleDeleteClassroom}
        onCourseStatusAction={handleCourseStatusAction}
        isStatusBusy={isStatusBusy}
      />

      {/* กรณีเป็นคอร์ส IoT 101: แสดงโครงสร้าง Chapter 0-7 และ Episode ทั้งหมด */}
      {isIoT101 ? (
        <IoT101Section
          expandedChapters={expandedChapters}
          onToggleChapter={toggleChapter}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          isGuest={isGuest}
          onOpenLockModal={openGuestLockModal}
        />
      ) : (
        <>
          {/* Tabs สลับระหว่าง Lessons และ Members */}
          <ClassroomTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            lessonsCount={lessons.length}
            membersCount={members.length}
          />

          {/* แท็บแสดงบทเรียน (Lessons Tab) */}
          {activeTab === "lessons" && (
            <StandardLessonsSection
              lessons={lessons}
              classroomId={classroomId}
              isOwnerOrAdmin={isOwnerOrAdmin}
              isEnrolled={isEnrolled}
              isGuest={isGuest}
              onOpenLockModal={openGuestLockModal}
              onOpenAddLessonModal={() => {
                setLessonSeq(lessons.length + 1);
                setIsAddLessonModalOpen(true);
              }}
              onDeleteLesson={handleDeleteLesson}
              previewMode={isInstructorPreview}
            />
          )}

          {/* แท็บแสดงสมาชิก (Members Tab) */}
          {activeTab === "members" && (
            <MembersSection
              members={members}
              isOwnerOrAdmin={isOwnerOrAdmin}
              onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
              onRemoveMember={handleRemoveMember}
            />
          )}
        </>
      )}

      {/* Modals */}
      <EditClassroomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        editDesc={editDesc}
        onEditDescChange={setEditDesc}
        onSubmit={handleUpdateClassroom}
      />

      <AddLessonModal
        isOpen={isAddLessonModalOpen}
        onClose={() => setIsAddLessonModalOpen(false)}
        lessonSeq={lessonSeq}
        onLessonSeqChange={setLessonSeq}
        lessonTitle={lessonTitle}
        onLessonTitleChange={setLessonTitle}
        onSubmit={handleCreateLesson}
      />

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        targetUserId={targetUserId}
        onTargetUserIdChange={setTargetUserId}
        onSubmit={handleAddMember}
      />

      {/* Guest Lock Modal แจ้งเตือนเมื่อพยายามเข้าเรียนโดยไม่ได้ Login */}
      <GuestLockModal
        isOpen={guestModal.isOpen}
        onClose={closeGuestLockModal}
        title={guestModal.title}
        message={guestModal.message}
        badge={guestModal.badge}
      />
    </div>
  );
}

export default ClassroomDetail;
