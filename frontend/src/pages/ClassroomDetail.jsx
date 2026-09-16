import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import classroomService from "../services/classroomService";
import useAuthStore from "../store/useAuthStore";
import { IOT_101_COURSE, IOT_101_CHAPTERS } from "../data/iot101Data";

// ======================================================
// ClassroomDetail Page (หน้ารายละเอียดห้องเรียน)
// ======================================================
// หน้านี้ทำหน้าที่:
// 1. แสดงรายละเอียดห้องเรียน (ชื่อ, คำอธิบาย, ผู้สอน, สถานะ)
// 2. จัดการบทเรียน (Lessons Tab):
//    - แสดงรายการบทเรียนเรียงตาม sequence_no
//    - Admin หรือ Instructor เจ้าของห้อง สามารถเพิ่ม, แก้ไข, ลบบทเรียนได้
// 3. จัดการสมาชิก (Members Tab):
//    - แสดงรายชื่อสมาชิกที่เข้าร่วม
//    - Admin หรือ Instructor เจ้าของห้อง สามารถเพิ่มหรือลบสมาชิกได้
// 4. แก้ไขและลบห้องเรียน (เฉพาะ Admin หรือ Instructor เจ้าของห้อง)

function ClassroomDetail() {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();

  const [classroom, setClassroom] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("lessons"); // 'lessons' | 'members'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Modals
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
  const isOwnerOrAdmin =
    classroom &&
    user &&
    (hasRole("admin") ||
      (hasRole("instructor") &&
        String(classroom.instructor_id) === String(user.user_id)));

  // ดึงข้อมูลห้องเรียน บทเรียน และสมาชิก
  const loadClassroomData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // กรณีเป็นคอร์ส IoT 101 ให้โหลดข้อมูลจาก mock data
    if (isIoT101) {
      setClassroom(IOT_101_COURSE);
      setEditTitle(IOT_101_COURSE.title);
      setEditDesc(IOT_101_COURSE.description);
      setLessons([]);
      setMembers([]);
      setLoading(false);
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

      // ดึงสมาชิก
      try {
        const mData = await classroomService.getMembers(classroomId);
        setMembers(mData.members || []);
      } catch {
        setMembers([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "ไม่พบห้องเรียนนี้");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

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
      showNotice("success", "แก้ไขข้อมูลห้องเรียนสำเร็จ");
      loadClassroomData();
    } catch (err) {
      showNotice("error", err.response?.data?.message || "แก้ไขไม่สำเร็จ");
    }
  };

  // ลบห้องเรียน
  const handleDeleteClassroom = async () => {
    if (!window.confirm("คุณแน่ใจหรือไม่ที่จะลบห้องเรียนนี้? ข้อมูลบทเรียนและสมาชิกทั้งหมดจะถูกลบไปด้วย")) {
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
    if (!window.confirm("ยืนยันที่จะลบบทเรียนนี้หรือไม่?")) return;
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
    if (!window.confirm("ยืนยันที่จะนำสมาชิกคนนี้ออกจากห้องเรียนหรือไม่?")) return;
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
      showNotice("error", err.response?.data?.message || "เข้าร่วมไม่สำเร็จ");
    }
  };

  const isEnrolled = members.some((m) => user && String(m.user_id) === String(user.user_id));

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
      {/* ลิงก์ย้อนกลับ */}
      <Link to="/classrooms" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        ← กลับไปหน้ารายการห้องเรียน
      </Link>

      {/* กล่องแจ้งเตือนผลลัพธ์ */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            actionNotice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{actionNotice.type === "success" ? "✓" : "⚠️"}</span>
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* ส่วนหัวของห้องเรียน (Classroom Header) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-lg bg-[#ABD1C6]/30 px-2.5 py-0.5 text-xs font-bold text-[#004643]">
                {isIoT101 ? "IoT & Smart City" : (classroom.status || "active")}
              </span>
              {(isEnrolled || isIoT101) && (
                <span className="rounded-lg bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                  {isIoT101 ? "✓ คุณเป็นสมาชิกห้องนี้แล้ว (65% Completed)" : "✓ คุณเป็นสมาชิกห้องนี้แล้ว"}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">{classroom.title}</h1>
            <p className="mt-2 text-gray-600 max-w-2xl leading-relaxed whitespace-pre-wrap">
              {classroom.description || "ไม่มีคำอธิบายสำหรับห้องเรียนนี้"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-gray-500 font-medium">
              <span>ผู้สอน: <b className="text-gray-800">{classroom.instructor_name || "ไม่ระบุ"}</b></span>
              {isIoT101 ? (
                <>
                  <span>📚 8 บท (Chapters)</span>
                  <span>📖 27 ตอน (Episodes)</span>
                  <span>👥 142 ผู้เรียน</span>
                </>
              ) : (
                <>
                  <span>📖 {lessons.length} บทเรียน</span>
                  <span>👥 {members.length} สมาชิก</span>
                </>
              )}
            </div>
          </div>

          {/* เมนูปุ่มจัดการตามสิทธิ์ */}
          <div className="flex flex-wrap items-center gap-2">
            {/* นักเรียน: แสดงปุ่ม Join ถ้ายังไม่ได้เข้า */}
            {hasRole("student") && !isOwnerOrAdmin && !isEnrolled && (
              <button
                onClick={handleJoin}
                type="button"
                className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9]"
              >
                + เข้าร่วมห้องเรียนนี้ (Join)
              </button>
            )}

            {/* เจ้าของห้อง หรือ Admin: มีปุ่มแก้ไข และปุ่มลบห้องเรียน */}
            {isOwnerOrAdmin && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  type="button"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                >
                  แก้ไขห้องเรียน
                </button>
                <button
                  onClick={handleDeleteClassroom}
                  type="button"
                  className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  ลบห้องเรียน
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* กรณีเป็นคอร์ส IoT 101: แสดงโครงสร้าง Chapter 0-7 และ Episode ทั้งหมด */}
      {isIoT101 ? (
        <div className="space-y-6">
          {/* Banner เรียนต่อล่าสุด */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#004643] via-[#003835] to-[#26332F] p-6 text-white shadow-sm">
            <div className="space-y-1.5">
              <span className="inline-block rounded-full bg-[#ABD1C6]/20 px-3 py-1 text-xs font-bold text-[#ABD1C6]">
                ⏱️ กำลังเรียนอยู่ล่าสุด
              </span>
              <h3 className="text-lg sm:text-xl font-bold">
                Chapter 1: Sensors → EP 1.2: Temperature และ Humidity Sensor
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
                เรียนค้างไว้ 80% • ต่อวงจรเซนเซอร์วัดสภาพอากาศ DHT22 กับไมโครคอนโทรลเลอร์ ESP32
              </p>
            </div>
            <Link
              to="/classrooms/iot-101/lessons/ep-1-2"
              className="inline-flex items-center justify-center rounded-xl bg-[#ABD1C6] px-6 py-3 text-sm font-bold text-[#20302C] shadow-sm hover:bg-[#9CC5B9] transition shrink-0"
            >
              เรียนต่อทันที →
            </Link>
          </div>

          {/* ส่วนหัวโครงสร้างหลักสูตร */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#1F2937]">
                โครงสร้างเนื้อหาบทเรียน (Course Curriculum)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                8 Chapters • 27 Episodes • นำทางผ่านเรื่องราว “สวนเรียนรู้แห่งเมืองนาวา”
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                ขยายทั้งหมด
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                ยุบทั้งหมด
              </button>
            </div>
          </div>

          {/* รายการ Chapter ทั้งหมด (Chapter 0 ถึง 7) */}
          <div className="space-y-4">
            {IOT_101_CHAPTERS.map((chapter) => {
              const isExpanded = !!expandedChapters[chapter.id];

              const getChapterBadge = (status) => {
                switch (status) {
                  case "completed":
                    return (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        ✓ จบแล้ว
                      </span>
                    );
                  case "in_progress":
                    return (
                      <span className="rounded-full bg-[#004643] px-2.5 py-0.5 text-[11px] font-bold text-[#ABD1C6]">
                        ⏱️ กำลังเรียน
                      </span>
                    );
                  case "available":
                    return (
                      <span className="rounded-full bg-[#ABD1C6]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#004643]">
                        พร้อมเรียน
                      </span>
                    );
                  default:
                    return (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                        🔒 ล็อก
                      </span>
                    );
                }
              };

              return (
                <div
                  key={chapter.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition"
                >
                  {/* แถบหัว Chapter (คลิกเพื่อ Expand / Collapse) */}
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition hover:bg-gray-50/80 cursor-pointer"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`mt-0.5 sm:mt-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition duration-200 ${
                          isExpanded
                            ? "bg-[#004643] text-[#ABD1C6] rotate-90"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        ▶
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-gray-900">
                            {chapter.title}
                          </h3>
                          {getChapterBadge(chapter.status)}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {chapter.description}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 shrink-0 text-right">
                      <span className="text-xs font-semibold text-gray-500">
                        {chapter.episodes.length} ตอน
                      </span>
                    </div>
                  </button>

                  {/* รายการ Episodes เมื่อเปิด Chapter */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#FAFAFA]/70 p-3 sm:p-4 space-y-2">
                      {chapter.episodes.map((ep) => {
                        const isEpLocked = ep.status === "locked";
                        const episodeLink = `/classrooms/iot-101/lessons/${ep.id}`;

                        return (
                          <div
                            key={ep.id}
                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3 sm:p-3.5 transition ${
                              ep.status === "in_progress"
                                ? "border-[#004643]/30 bg-white shadow-xs ring-1 ring-[#004643]/10"
                                : isEpLocked
                                ? "border-gray-200/60 bg-gray-50/60 opacity-60"
                                : "border-gray-200 bg-white hover:border-[#ABD1C6]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-8 w-14 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold ${
                                  ep.status === "in_progress"
                                    ? "bg-[#004643] text-white"
                                    : ep.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {ep.code}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900">
                                  {ep.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                  <span>⏱️ {ep.duration}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                              <div>{getChapterBadge(ep.status)}</div>

                              {isEpLocked ? (
                                <span className="text-xs text-gray-400 font-medium px-3 py-1.5">
                                  ยังไม่ปลดล็อก
                                </span>
                              ) : (
                                <Link
                                  to={episodeLink}
                                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                                    ep.status === "in_progress"
                                      ? "bg-[#004643] text-white hover:bg-[#003835]"
                                      : "bg-[#ABD1C6] text-[#20302C] hover:bg-[#9CC5B9]"
                                  }`}
                                >
                                  {ep.status === "in_progress" ? "เรียนต่อ" : "เข้าเรียน"} →
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Tabs สลับระหว่าง Lessons และ Members */}
          <div className="flex border-b border-gray-200 gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("lessons")}
          type="button"
          className={`pb-3 transition ${
            activeTab === "lessons"
              ? "border-b-2 border-[#456F65] text-[#20302C]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          📖 บทเรียนทั้งหมด ({lessons.length})
        </button>
        <button
          onClick={() => setActiveTab("members")}
          type="button"
          className={`pb-3 transition ${
            activeTab === "members"
              ? "border-b-2 border-[#456F65] text-[#20302C]"
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          👥 สมาชิกในห้องเรียน ({members.length})
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. แท็บแสดงบทเรียน (Lessons Tab) */}
      {/* ==================================================== */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">รายการบทเรียน</h3>
            {isOwnerOrAdmin && (
              <button
                onClick={() => {
                  setLessonSeq(lessons.length + 1);
                  setIsAddLessonModalOpen(true);
                }}
                type="button"
                className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9]"
              >
                + เพิ่มบทเรียน (Add Lesson)
              </button>
            )}
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              {isOwnerOrAdmin
                ? "ยังไม่มีบทเรียนในห้องนี้ กดปุ่ม '+ เพิ่มบทเรียน' เพื่อเริ่มสร้าง"
                : isEnrolled
                ? "ยังไม่มีบทเรียนในห้องเรียนนี้"
                : "คุณต้องเข้าร่วมห้องเรียนก่อนเพื่อเข้าถึงบทเรียนและเนื้อหา"}
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((l) => (
                <div
                  key={l.lesson_id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-xs transition hover:border-[#ABD1C6]"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 font-mono text-sm font-bold text-gray-700">
                      #{l.sequence_no}
                    </span>
                    <div>
                      <Link
                        to={`/classrooms/${classroomId}/lessons/${l.lesson_id}`}
                        className="font-bold text-gray-900 hover:text-[#456F65]"
                      >
                        {l.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        เนื้อหาทั้งหมด: {l.content_count || l.contents?.length || 0} รายการ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/classrooms/${classroomId}/lessons/${l.lesson_id}`}
                      className="rounded-xl bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                    >
                      เปิดดูบทเรียน →
                    </Link>

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleDeleteLesson(l.lesson_id)}
                        type="button"
                        className="rounded-xl px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 font-semibold"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. แท็บแสดงสมาชิก (Members Tab) */}
      {/* ==================================================== */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">รายชื่อสมาชิก</h3>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                type="button"
                className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9]"
              >
                + เพิ่มสมาชิกด้วย User ID
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              ยังไม่มีสมาชิกในห้องเรียนนี้
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">ชื่อสมาชิก</th>
                    <th className="px-6 py-3 text-left">User ID</th>
                    <th className="px-6 py-3 text-left">วันที่เข้าร่วม</th>
                    {isOwnerOrAdmin && <th className="px-6 py-3 text-right">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m.classroom_member_id} className="hover:bg-gray-50/60">
                      <td className="px-6 py-3 font-semibold text-gray-900">
                        {m.display_name || "ไม่ระบุชื่อ"}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">
                        {m.user_id}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString("th-TH") : "-"}
                      </td>
                      {isOwnerOrAdmin && (
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            type="button"
                            className="text-xs font-semibold text-red-500 hover:text-red-700"
                          >
                            นำออก
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </>
    )}

      {/* Modal แก้ไขห้องเรียน */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">แก้ไขห้องเรียน</h3>
            <form onSubmit={handleUpdateClassroom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อห้องเรียน *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none focus:border-[#ABD1C6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none focus:border-[#ABD1C6]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C]"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal เพิ่มบทเรียน */}
      {isAddLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">เพิ่มบทเรียนใหม่</h3>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ลำดับบทเรียน (Sequence No.) *</label>
                <input
                  type="number"
                  value={lessonSeq}
                  min={1}
                  onChange={(e) => setLessonSeq(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none focus:border-[#ABD1C6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อบทเรียน (Title) *</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="เช่น การใช้งาน GPIO บน ESP32"
                  required
                  className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none focus:border-[#ABD1C6]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C]"
                >
                  สร้างบทเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal เพิ่มสมาชิกด้วย User ID */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">เพิ่มสมาชิกเข้าห้องเรียน</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">User ID ของผู้ใช้ (UUID) *</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="เช่น c83a992a-..."
                  required
                  className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none font-mono focus:border-[#ABD1C6]"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  สามารถดู User ID ได้จากหน้าโปรไฟล์ของผู้ใช้นั้น
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C]"
                >
                  เพิ่มเข้าห้องเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassroomDetail;
