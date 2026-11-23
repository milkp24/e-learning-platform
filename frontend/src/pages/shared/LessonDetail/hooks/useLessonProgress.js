import { useCallback, useEffect, useRef, useState } from "react";
import classroomService from "../../../../services/classroomService";
import { notify } from "../../../../store/useToastStore";

// ======================================================
// useLessonProgress — ความคืบหน้าของผู้เรียนในบทเรียนที่เปิดอยู่ (ข้อ 24, 25)
// - progress มาจาก GET /lessons/:id (null = ไม่ใช่ผู้เรียนที่ถูกติดตาม เช่น เจ้าของคอร์ส)
// - เปิดบทครั้งแรก: บันทึกเป็น "กำลังเรียน"
// - วิดีโอ: แสดงเปอร์เซ็นต์ทันทีบนหน้าจอ แต่ส่งไปบันทึกเป็นช่วง ๆ (ทุก 5% / ทุก 15 วินาที
//   / ตอนข้ามเกณฑ์ 90%) เพื่อไม่ยิง API ทุกเสี้ยววินาที
// ======================================================

const SEND_EVERY_PERCENT = 5;
const SEND_EVERY_MS = 15000;

export default function useLessonProgress(lessonId, initialProgress) {
  const [progress, setProgress] = useState(initialProgress || null);
  const [localPercent, setLocalPercent] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const lastSent = useRef({});

  useEffect(() => {
    setProgress(initialProgress || null);
    setLocalPercent({});
    lastSent.current = {};
    if (initialProgress?.status === "not_started") {
      classroomService
        .startLesson(lessonId)
        .then((res) => res?.progress && setProgress(res.progress))
        .catch(() => {});
    }
  }, [lessonId, initialProgress]);

  const required = progress?.required_percent ?? 90;
  const videos = (progress?.videos || []).map((v) => ({
    ...v,
    percent: Math.max(v.percent || 0, localPercent[v.content_id] || 0),
  }));
  const videosDone = videos.filter((v) => v.percent >= required).length;
  const isCompleted = progress?.status === "completed";
  const canComplete = Boolean(progress) && !isCompleted && videosDone === videos.length;

  const percentOf = useCallback(
    (contentId) => videos.find((v) => v.content_id === String(contentId))?.percent,
    [videos]
  );

  const reportVideo = useCallback(
    (contentId, position, duration) => {
      if (!progress || !duration) return;
      const id = String(contentId);
      const pct = Math.min(100, Math.round((position / duration) * 100));
      setLocalPercent((prev) => (pct > (prev[id] || 0) ? { ...prev, [id]: pct } : prev));

      const serverPct = (progress.videos || []).find((v) => v.content_id === id)?.percent || 0;
      const last = lastSent.current[id] || { pct: serverPct, at: 0 };
      const now = Date.now();
      const crossedRequired = pct >= required && last.pct < required;
      const shouldSend =
        crossedRequired || pct >= last.pct + SEND_EVERY_PERCENT || (pct > last.pct && now - last.at > SEND_EVERY_MS);
      if (!shouldSend) return;

      lastSent.current[id] = { pct, at: now };
      classroomService
        .saveVideoProgress(id, position, duration)
        .then((res) => res?.progress && setProgress(res.progress))
        .catch(() => {
          lastSent.current[id] = last; // ส่งไม่สำเร็จ ให้ลองใหม่รอบหน้า
        });
    },
    [progress, required]
  );

  const completeLesson = useCallback(async () => {
    setIsCompleting(true);
    try {
      const res = await classroomService.completeLesson(lessonId);
      setProgress(res.progress);
      notify.success(res.next_lesson_id ? "เรียนจบบทนี้แล้ว ไปต่อบทถัดไปได้เลย" : "เรียนจบบทนี้แล้ว");
      return res;
    } catch (err) {
      notify.error(err.response?.data?.message || "บันทึกการเรียนจบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return null;
    } finally {
      setIsCompleting(false);
    }
  }, [lessonId]);

  return {
    progress,
    isTracked: Boolean(progress),
    isCompleted,
    canComplete,
    isCompleting,
    requiredPercent: required,
    videos,
    videosDone,
    percentOf,
    reportVideo,
    completeLesson,
  };
}
