/**
 * AddMemberModal Component
 * Dialog modal for adding a new member by User UUID.
 */
function AddMemberModal({
  isOpen,
  onClose,
  targetUserId,
  onTargetUserIdChange,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">เพิ่มสมาชิกเข้าห้องเรียน</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              User ID ของผู้ใช้ (UUID) *
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => onTargetUserIdChange(e.target.value)}
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
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C] cursor-pointer"
            >
              เพิ่มเข้าห้องเรียน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberModal;
