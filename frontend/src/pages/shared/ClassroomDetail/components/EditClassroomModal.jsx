/**
 * EditClassroomModal Component
 * Dialog modal for editing classroom title and description.
 */
function EditClassroomModal({
  isOpen,
  onClose,
  editTitle,
  onEditTitleChange,
  editDesc,
  onEditDescChange,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">แก้ไขห้องเรียน</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ชื่อห้องเรียน *
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none focus:border-[#ABD1C6]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              คำอธิบาย
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => onEditDescChange(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-300 p-2 text-sm outline-none focus:border-[#ABD1C6]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C] cursor-pointer"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditClassroomModal;
