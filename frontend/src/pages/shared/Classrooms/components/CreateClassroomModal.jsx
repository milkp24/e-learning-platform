/**
 * CreateClassroomModal Component
 * Dialog modal for instructors/admins to create a new classroom.
 */
function CreateClassroomModal({
  isOpen,
  onClose,
  newTitle,
  onTitleChange,
  newDescription,
  onDescriptionChange,
  onSubmit,
  creating,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">สร้างห้องเรียนใหม่</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ชื่อห้องเรียน (Title) *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="เช่น IoT Embedded Systems"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#ABD1C6]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              คำอธิบายห้องเรียน (Description)
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="รายละเอียดเกี่ยวกับหลักสูตรและเป้าหมายการเรียนรู้..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#ABD1C6]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] disabled:opacity-50 cursor-pointer"
            >
              {creating ? "กำลังสร้าง..." : "ยืนยันสร้างห้องเรียน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClassroomModal;
