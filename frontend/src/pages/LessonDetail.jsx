import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import classroomService from "../services/classroomService";
import useAuthStore from "../store/useAuthStore";
import ContentRenderer from "../components/ContentRenderer";
import {
  IOT_101_COURSE,
  getEpisodeById,
  getMockContentsForEpisode,
} from "../data/iot101Data";

// ======================================================
// LessonDetail Page (หน้ารายละเอียดบทเรียนและจัดการเนื้อหา)
// ======================================================
// หน้านี้ทำหน้าที่:
// 1. แสดงข้อมูลบทเรียน (ชื่อบทเรียน, ลำดับ sequence_no, สถานะ draft/published)
// 2. แสดงเนื้อหาทั้งหมดของบทเรียนโดยเรียกใช้ <ContentRenderer />
//    รองรับ 5 ชนิดเนื้อหา: text, video, pdf, image, code
// 3. จัดการเนื้อหา (Content Management):
//    - Instructor (เจ้าของห้องเรียน) หรือ Admin สามารถ เพิ่ม / แก้ไข / ลบ เนื้อหาได้
//    - Student สามารถดูเนื้อหาได้อย่างเดียว (Read-only)
// 4. แก้ไข / ลบบทเรียน (เฉพาะ Instructor เจ้าของห้อง หรือ Admin)
//
// หมายเหตุ Phase 1:
// - ไม่มีการอัปโหลดไฟล์ (File Upload)
// - ข้อมูล content_data จะจัดเก็บเป็น String เสมอ (URL สำหรับ video/pdf/image, ข้อความสำหรับ text/code)

function LessonDetail() {
  // รับพารามิเตอร์ classroomId และ lessonId จาก URL Route
  const { classroomId, lessonId } = useParams();
  const navigate = useNavigate();

  // ดึงข้อมูลผู้ใช้ปัจจุบันและฟังก์ชันตรวจสอบ Role จาก Zustand Store
  const { user, hasRole } = useAuthStore();

  // State สำหรับเก็บข้อมูลหลัก
  const [classroom, setClassroom] = useState(null); // ข้อมูลห้องเรียน เพื่อตรวจสอบความเป็นเจ้าของ
  const [lesson, setLesson] = useState(null); // ข้อมูลบทเรียน
  const [contents, setContents] = useState([]); // รายการเนื้อหาภายในบทเรียน
  const [loading, setLoading] = useState(true); // สถานะกำลังโหลดข้อมูล
  const [error, setError] = useState(null); // ข้อความแจ้งข้อผิดพลาด
  const [actionNotice, setActionNotice] = useState(null); // ข้อความแจ้งเตือนผลการทำงาน (สำเร็จ/ล้มเหลว)
  const [episodeData, setEpisodeData] = useState(null); // ข้อมูล Chapter และ Episode ของ IoT 101

  // State สำหรับ Modal เพิ่มเนื้อหาใหม่ (Add Content Modal)
  const [isAddContentModalOpen, setIsAddContentModalOpen] = useState(false);
  const [contentType, setContentType] = useState("text"); // ค่าเริ่มต้นเป็น 'text'
  const [contentData, setContentData] = useState("");
  const [submittingContent, setSubmittingContent] = useState(false);

  // State สำหรับ Modal แก้ไขเนื้อหา (Edit Content Modal)
  const [editingContent, setEditingContent] = useState(null); // เก็บ Object เนื้อหาที่กำลังแก้ไข
  const [editContentType, setEditContentType] = useState("text");
  const [editContentData, setEditContentData] = useState("");
  const [updatingContent, setUpdatingContent] = useState(false);

  // State สำหรับ Modal แก้ไขบทเรียน (Edit Lesson Modal)
  const [isEditLessonModalOpen, setIsEditLessonModalOpen] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonSeq, setLessonSeq] = useState(1);
  const [lessonStatus, setLessonStatus] = useState("published");

  // ตรวจสอบสิทธิ์: ผู้ใช้เป็น Admin หรือเป็น Instructor เจ้าของห้องเรียนนี้หรือไม่
  const isOwnerOrAdmin =
    classroom &&
    user &&
    (hasRole("admin") ||
      (hasRole("instructor") &&
        String(classroom.instructor_id) === String(user.user_id)));

  // ฟังก์ชันแสดงข้อความแจ้งเตือนชั่วคราว (AutoHide ใน 3.5 วินาที)
  const showNotice = (type, text) => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // โหลดข้อมูลห้องเรียนและบทเรียนจาก Backend API
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
      // 1. ดึงข้อมูลห้องเรียน เพื่อเอาชื่อห้องและตรวจสอบ instructor_id
      const cRes = await classroomService.getClassroom(classroomId);
      setClassroom(cRes.classroom);

      // 2. ดึงข้อมูลบทเรียนพร้อมเนื้อหา (GET /api/v1/lessons/:id)
      const lRes = await classroomService.getLesson(lessonId);
      setLesson(lRes.lesson);
      setLessonTitle(lRes.lesson.title);
      setLessonSeq(lRes.lesson.sequence_no);
      setLessonStatus(lRes.lesson.status || "published");

      // Backend อาจส่ง contents มาพร้อมกับ lesson หรือต้องดึงแยก
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

  // ====================================================
  // จัดการเนื้อหา (Content Management Handlers)
  // ====================================================

  // 1. เพิ่มเนื้อหาใหม่ (POST /api/v1/lessons/:id/contents)
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
      // โหลดข้อมูลเนื้อหาใหม่
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

  // 2. เปิด Modal แก้ไขเนื้อหา
  const handleOpenEditContent = (item) => {
    setEditingContent(item);
    setEditContentType(item.content_type);
    setEditContentData(item.content_data || "");
  };

  // 3. บันทึกการแก้ไขเนื้อหา (PUT /api/v1/contents/:id)
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
      // โหลดข้อมูลเนื้อหาใหม่
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

  // 4. ลบเนื้อหา (DELETE /api/v1/contents/:id)
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

  // ====================================================
  // จัดการบทเรียน (Lesson Handlers)
  // ====================================================

  // บันทึกการแก้ไขบทเรียน (PUT /api/v1/lessons/:id)
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

  // ลบบทเรียน (DELETE /api/v1/lessons/:id)
  const handleDeleteLesson = async () => {
    if (
      !window.confirm(
        "คุณแน่ใจหรือไม่ว่าต้องการลบบทเรียนนี้? ข้อมูลเนื้อหาทั้งหมดจะถูกลบไปด้วย"
      )
    )
      return;

    try {
      await classroomService.deleteLesson(lessonId);
      // เมื่อลบสำเร็จ นำทางกลับไปยังหน้ารายละเอียดห้องเรียน
      navigate(`/classrooms/${classroomId}`);
    } catch (err) {
      showNotice(
        "error",
        err.response?.data?.message || "เกิดข้อผิดพลาดในการลบบทเรียน"
      );
    }
  };

  // ตัวช่วยแสดง Placeholder และคำแนะนำตามชนิดของ Content
  const getContentHelper = (type) => {
    switch (type) {
      case "text":
        return {
          label: "ข้อความเนื้อหา (Text Content)",
          placeholder: "พิมพ์ข้อความคำอธิบายเนื้อหาที่นี่...",
          rows: 6,
        };
      case "video":
        return {
          label: "URL วิดีโอ (Video URL)",
          placeholder: "https://www.youtube.com/watch?v=... หรือ direct link",
          rows: 2,
        };
      case "youtube":
        return {
          label: "URL วิดีโอ YouTube (Safe YouTube Embed)",
          placeholder: "https://www.youtube.com/watch?v=... หรือ https://youtu.be/...",
          rows: 2,
        };
      case "pdf":
        return {
          label: "URL ไฟล์ PDF (PDF Document URL)",
          placeholder: "https://example.com/document.pdf",
          rows: 2,
        };
      case "image":
        return {
          label: "ที่อยู่รูปภาพ (Image Path/URL)",
          placeholder: "/images/classroom-default.svg หรือ URL/Path รูปภาพในโปรเจกต์",
          rows: 2,
        };
      case "code":
        return {
          label: "ซอร์สโค้ดโปรแกรม (Source Code)",
          placeholder: "// วางซอร์สโค้ดที่ต้องการแสดงที่นี่...",
          rows: 8,
        };
      default:
        return { label: "ข้อมูลเนื้อหา", placeholder: "", rows: 4 };
    }
  };

  // กำลังโหลดข้อมูล
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

  // กรณีเกิดข้อผิดพลาด หรือไม่มีสิทธิ์
  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
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
      {/* การแจ้งเตือน (Notice Banner) */}
      {actionNotice && (
        <div
          className={`rounded-xl p-4 text-sm font-medium transition ${
            actionNotice.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {actionNotice.text}
        </div>
      )}

      {/* แถบนำทางด้านบน (Breadcrumb & Header) */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Link to="/classrooms" className="hover:text-gray-600">
            ห้องเรียนทั้งหมด
          </Link>
          <span>/</span>
          <Link
            to={`/classrooms/${classroomId}`}
            className="hover:text-gray-600 truncate max-w-xs"
          >
            {classroom?.title || "ห้องเรียน"}
          </Link>
          <span>/</span>
          <span className="text-[#004643]">
            {episodeData
              ? `${episodeData.chapter.title} / ${episodeData.episode.code}`
              : `บทเรียนที่ ${lesson?.sequence_no}`}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-[#ABD1C6]/30 px-2.5 py-1 font-mono text-xs font-bold text-[#004643]">
                {episodeData ? episodeData.episode.code : `ลำดับที่ #${lesson?.sequence_no}`}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  lesson?.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {lesson?.status === "published" ? "เผยแพร่แล้ว" : "ร่าง (Draft)"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-gray-900 md:text-3xl">
              {lesson?.title}
            </h1>
          </div>

          {/* ปุ่มควบคุมเฉพาะ Instructor หรือ Admin */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddContentModalOpen(true)}
                type="button"
                className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9] shadow-sm flex items-center gap-2"
              >
                <span>+ เพิ่มเนื้อหา (Add Content)</span>
              </button>
              <button
                onClick={() => setIsEditLessonModalOpen(true)}
                type="button"
                className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                แก้ไขบทเรียน
              </button>
              <button
                onClick={handleDeleteLesson}
                type="button"
                className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
              >
                ลบบทเรียน
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ส่วนแสดงเนื้อหาทั้งหมด (Content Items List) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            เนื้อหาในบทเรียน ({contents.length})
          </h2>
          <span className="text-xs text-gray-500">
            รองรับ: Text, Video URL, PDF URL, Image URL, Source Code
          </span>
        </div>

        {contents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
            <div className="text-4xl mb-2">📚</div>
            <h3 className="font-bold text-gray-700">ยังไม่มีเนื้อหาในบทเรียนนี้</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isOwnerOrAdmin
                ? "กดปุ่ม 'เพิ่มเนื้อหา' ด้านบนเพื่อเริ่มต้นสร้างเนื้อหาแรกของคุณ"
                : "ผู้สอนยังไม่ได้เพิ่มเนื้อหาลงในบทเรียนนี้"}
            </p>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsAddContentModalOpen(true)}
                type="button"
                className="mt-4 rounded-xl bg-[#ABD1C6] px-5 py-2 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9]"
              >
                + เพิ่มเนื้อหาทันที
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {contents.map((item, index) => (
              <div
                key={item.content_id}
                className="relative group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                {/* แถบข้อมูลบนของ Content */}
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold uppercase text-gray-600">
                      #{index + 1} ชนิด: {item.content_type}
                    </span>
                  </div>

                  {/* ปุ่มจัดการเนื้อหา (เฉพาะ Instructor หรือ Admin) */}
                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditContent(item)}
                        type="button"
                        className="text-xs font-semibold text-[#004643] hover:underline"
                      >
                        แก้ไข
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => handleDeleteContent(item.content_id)}
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                  )}
                </div>

                {/* ตัวแสดงผลเนื้อหาตามชนิด (ContentRenderer) */}
                <ContentRenderer content={item} />
              </div>
            ))}
          </div>
        )}

        {/* แถบนำทางระหว่างตอน (Episode Navigation: Previous / Next) */}
        {episodeData && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
            {episodeData.prevEpisode ? (
              <Link
                to={`/classrooms/iot-101/lessons/${episodeData.prevEpisode.id}`}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs w-full sm:w-auto justify-center sm:justify-start"
              >
                <span>←</span>
                <span>
                  ตอนก่อนหน้า: <b className="text-gray-900">{episodeData.prevEpisode.code} {episodeData.prevEpisode.title}</b>
                </span>
              </Link>
            ) : (
              <Link
                to="/classrooms/iot-101"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs w-full sm:w-auto justify-center sm:justify-start"
              >
                <span>←</span>
                <span>กลับไปหน้ารายละเอียดคอร์ส</span>
              </Link>
            )}

            {episodeData.nextEpisode ? (
              <Link
                to={`/classrooms/iot-101/lessons/${episodeData.nextEpisode.id}`}
                className="flex items-center gap-2 rounded-xl bg-[#004643] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#003835] transition shadow-xs w-full sm:w-auto justify-center sm:justify-end"
              >
                <span>
                  ตอนถัดไป: <b>{episodeData.nextEpisode.code} {episodeData.nextEpisode.title}</b>
                </span>
                <span>→</span>
              </Link>
            ) : (
              <Link
                to="/classrooms/iot-101"
                className="flex items-center gap-2 rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] transition shadow-xs w-full sm:w-auto justify-center sm:justify-end"
              >
                <span>จบคอร์ส IoT 101 🎉</span>
                <span>→</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ====================================================
          Modal: เพิ่มเนื้อหาใหม่ (Add Content Modal)
      ==================================================== */}
      {isAddContentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">
              เพิ่มเนื้อหาใหม่ (Add Content)
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              เลือกชนิดเนื้อหา และใส่ข้อความหรือ URL ที่ต้องการ (Phase 1 ไม่มีการอัปโหลดไฟล์)
            </p>

            <form onSubmit={handleAddContent} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  ชนิดของเนื้อหา (Content Type)
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                >
                  <option value="text">Text (ข้อความทั่วไป)</option>
                  <option value="youtube">YouTube (วิดีโอ YouTube พร้อม Safe Embed)</option>
                  <option value="video">Video (URL ลิงก์วิดีโอโดยตรง)</option>
                  <option value="pdf">PDF (URL ไฟล์ PDF)</option>
                  <option value="image">Image (URL รูปภาพ)</option>
                  <option value="code">Code (ซอร์สโค้ดโปรแกรม)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  {getContentHelper(contentType).label}
                </label>
                <textarea
                  rows={getContentHelper(contentType).rows}
                  value={contentData}
                  onChange={(e) => setContentData(e.target.value)}
                  placeholder={getContentHelper(contentType).placeholder}
                  required
                  className="mt-1 w-full font-mono rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddContentModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingContent}
                  className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] disabled:opacity-50"
                >
                  {submittingContent ? "กำลังบันทึก..." : "บันทึกเนื้อหา"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          Modal: แก้ไขเนื้อหา (Edit Content Modal)
      ==================================================== */}
      {editingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">
              แก้ไขเนื้อหา (Edit Content)
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              อัปเดตชนิดหรือข้อมูลของเนื้อหานี้
            </p>

            <form onSubmit={handleUpdateContent} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  ชนิดของเนื้อหา (Content Type)
                </label>
                <select
                  value={editContentType}
                  onChange={(e) => setEditContentType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                >
                  <option value="text">Text (ข้อความทั่วไป)</option>
                  <option value="youtube">YouTube (วิดีโอ YouTube พร้อม Safe Embed)</option>
                  <option value="video">Video (URL ลิงก์วิดีโอโดยตรง)</option>
                  <option value="pdf">PDF (URL ไฟล์ PDF)</option>
                  <option value="image">Image (URL รูปภาพ)</option>
                  <option value="code">Code (ซอร์สโค้ดโปรแกรม)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  {getContentHelper(editContentType).label}
                </label>
                <textarea
                  rows={getContentHelper(editContentType).rows}
                  value={editContentData}
                  onChange={(e) => setEditContentData(e.target.value)}
                  placeholder={getContentHelper(editContentType).placeholder}
                  required
                  className="mt-1 w-full font-mono rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={updatingContent}
                  className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] disabled:opacity-50"
                >
                  {updatingContent ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          Modal: แก้ไขบทเรียน (Edit Lesson Modal)
      ==================================================== */}
      {isEditLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">แก้ไขข้อมูลบทเรียน</h3>

            <form onSubmit={handleUpdateLesson} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  ชื่อบทเรียน
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  ลำดับของบทเรียน (Sequence No.)
                </label>
                <input
                  type="number"
                  min="1"
                  value={lessonSeq}
                  onChange={(e) => setLessonSeq(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  สถานะบทเรียน
                </label>
                <select
                  value={lessonStatus}
                  onChange={(e) => setLessonStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
                >
                  <option value="published">เผยแพร่ (Published)</option>
                  <option value="draft">ร่าง (Draft)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditLessonModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9]"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LessonDetail;
