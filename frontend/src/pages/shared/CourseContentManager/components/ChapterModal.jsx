import { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";

/**
 * ChapterModal Component
 * เพิ่มและแก้ไขบทเรียน (Chapter / Lesson)
 */
function ChapterModal({
  isOpen,
  onClose,
  initialData = null,
  nextSequenceNo = 1,
  onSave,
  isSubmitting = false,
}) {
  const [title, setTitle] = useState("");
  const [sequenceNo, setSequenceNo] = useState(1);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setSequenceNo(initialData.sequence_no || 1);
      setDescription(initialData.description || "");
      setStatus(initialData.status || "active");
    } else {
      setTitle("");
      setSequenceNo(nextSequenceNo);
      setDescription("");
      setStatus("active");
    }
  }, [initialData, nextSequenceNo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      sequence_no: parseInt(sequenceNo, 10) || 1,
      description: description.trim() || null,
      status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white p-6 shadow-2xl space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-3">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              {initialData ? "แก้ไขบทเรียน" : "เพิ่มบทเรียนใหม่"}
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              กำหนดชื่อบทเรียนและลำดับในโครงสร้างคอร์ส
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] hover:bg-gray-100 transition cursor-pointer"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              ชื่อบทเรียน <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น บทที่ 1: เซนเซอร์และอุปกรณ์ตรวจจับ"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                ลำดับบทเรียน
              </label>
              <input
                type="number"
                min="0"
                value={sequenceNo}
                onChange={(e) => setSequenceNo(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                สถานะ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
              >
                <option value="active">เผยแพร่แล้ว</option>
                <option value="draft">ฉบับร่าง</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำอธิบายบทเรียน (ไม่บังคับ)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายภาพรวมและเป้าหมายของบทเรียนนี้..."
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 disabled:opacity-50 transition cursor-pointer shadow-sm"
            >
              {isSubmitting ? "กำลังบันทึก..." : initialData ? "บันทึกการแก้ไข" : "เพิ่มบทเรียน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChapterModal;
