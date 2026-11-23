// ======================================================
// lessonProgress — สถานะการเรียนต่อบทเรียน (ข้อ 24)
// ค่า status มาจาก Backend: not_started / in_progress / completed
// ======================================================

export const LESSON_PROGRESS = {
  not_started: {
    label: "ยังไม่เรียน",
    className: "border-gray-200 bg-gray-50 text-gray-600",
  },
  in_progress: {
    label: "กำลังเรียน",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  completed: {
    label: "เรียนจบแล้ว",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

export function getLessonProgress(status) {
  return LESSON_PROGRESS[status] || null;
}
