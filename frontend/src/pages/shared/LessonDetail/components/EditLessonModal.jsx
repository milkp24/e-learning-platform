/**
 * EditLessonModal Component
 * Dialog modal for modifying lesson title, sequence_no, and status.
 */
function EditLessonModal({
  isOpen,
  onClose,
  lessonTitle,
  onLessonTitleChange,
  lessonSeq,
  onLessonSeqChange,
  lessonStatus,
  onLessonStatusChange,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900">แก้ไขข้อมูลบทเรียน</h3>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              ชื่อบทเรียน
            </label>
            <input
              type="text"
              value={lessonTitle}
              onChange={(e) => onLessonTitleChange(e.target.value)}
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
              onChange={(e) => onLessonSeqChange(e.target.value)}
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
              onChange={(e) => onLessonStatusChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none cursor-pointer"
            >
              <option value="published">เผยแพร่แล้ว</option>
              <option value="draft">ฉบับร่าง</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] cursor-pointer"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLessonModal;
