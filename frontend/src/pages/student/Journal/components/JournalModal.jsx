function JournalModal({
  isOpen,
  onClose,
  editingJournal,
  title,
  setTitle,
  content,
  setContent,
  courseId,
  setCourseId,
  courses,
  lessonId,
  setLessonId,
  lessons = [],
  isSubmitting,
  formError,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
          {editingJournal ? "แก้ไขบันทึกการเรียนรู้" : "เขียนบันทึกการเรียนรู้ใหม่"}
        </h3>

        {formError && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              หัวข้อบันทึก *
            </label>
            <input
              type="text"
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น สรุปเรื่อง Hook ใน React"
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              เกี่ยวข้องกับคอร์สเรียน (ถ้ามี)
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none cursor-pointer"
            >
              <option value="">-- ไม่ระบุคอร์สเรียน --</option>
              {courses.map((c) => (
                <option key={c.classroom_id} value={c.classroom_id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* ข้อ 27: ผูกบันทึกกับบทเรียน หน้าคอร์สจะแสดงว่าบทนี้มีบันทึก */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              บทเรียน (ถ้ามี)
            </label>
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              disabled={!courseId}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{courseId ? "-- ไม่ระบุบทเรียน --" : "เลือกคอร์สก่อน"}</option>
              {lessons.map((l) => (
                <option key={l.lesson_id} value={l.lesson_id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              เนื้อหาบันทึก *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนสรุปสิ่งที่คุณเข้าใจ โค้ดตัวอย่าง หรือข้อคิดเห็นส่วนตัว..."
              rows={6}
              required
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#004643] px-5 py-2 text-xs font-bold text-white hover:bg-[#003835] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JournalModal;
