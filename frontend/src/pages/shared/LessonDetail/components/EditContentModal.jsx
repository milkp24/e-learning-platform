import { getContentHelper } from "../utils/contentHelpers";

/**
 * EditContentModal Component
 * Dialog modal for modifying existing content block data or content type.
 */
function EditContentModal({
  editingContent,
  onClose,
  editContentType,
  onEditContentTypeChange,
  editContentData,
  onEditContentDataChange,
  onSubmit,
  updatingContent,
}) {
  if (!editingContent) return null;

  const helper = getContentHelper(editContentType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900">
          แก้ไขเนื้อหา (Edit Content)
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          อัปเดตชนิดหรือข้อมูลของเนื้อหานี้
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
              ชนิดของเนื้อหา (Content Type)
            </label>
            <select
              value={editContentType}
              onChange={(e) => onEditContentTypeChange(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none cursor-pointer"
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
              {helper.label}
            </label>
            <textarea
              rows={helper.rows}
              value={editContentData}
              onChange={(e) => onEditContentDataChange(e.target.value)}
              placeholder={helper.placeholder}
              required
              className="mt-1 w-full font-mono rounded-xl border border-gray-300 p-3 text-sm focus:border-[#004643] focus:outline-none"
            />
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
              disabled={updatingContent}
              className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] disabled:opacity-50 cursor-pointer"
            >
              {updatingContent ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditContentModal;
