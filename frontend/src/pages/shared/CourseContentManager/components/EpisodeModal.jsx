import { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";

/**
 * EpisodeModal Component
 * เพิ่มและแก้ไขตอนย่อย (Episode) ภายใต้บทเรียน
 */
function EpisodeModal({
  isOpen,
  onClose,
  chapterTitle = "บทเรียน",
  initialData = null,
  nextSequenceNo = 1,
  onSave,
  isSubmitting = false,
}) {
  const [title, setTitle] = useState("");
  const [sequenceNo, setSequenceNo] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setSequenceNo(initialData.sequence_no || 1);
      setDurationMinutes(
        initialData.duration_seconds
          ? Math.round(initialData.duration_seconds / 60)
          : 15
      );
      setDescription(initialData.description || "");
      setStatus(initialData.status || "active");
    } else {
      setTitle("");
      setSequenceNo(nextSequenceNo);
      setDurationMinutes(15);
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
      duration_seconds: (parseInt(durationMinutes, 10) || 0) * 60,
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
              {initialData ? "แก้ไขตอนย่อย" : "เพิ่มตอนย่อยใหม่"}
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5 truncate max-w-xs">
              ภายใต้: {chapterTitle}
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
              ชื่อตอน <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              maxLength={255}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ตอนที่ 1.1: เซนเซอร์รอบตัวเรา"
              className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2.5 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                ลำดับตอน
              </label>
              <input
                type="number"
                min="0"
                value={sequenceNo}
                onChange={(e) => setSequenceNo(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                เวลา (นาที)
              </label>
              <input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3 py-2 text-sm text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
                สถานะ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-2.5 py-2 text-xs font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition shadow-2xs cursor-pointer"
              >
                <option value="active">เผยแพร่</option>
                <option value="draft">ฉบับร่าง</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#26332F]">
              คำอธิบายตอน (ไม่บังคับ)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายสรุปเนื้อหาและสิ่งที่จะได้เรียนรู้ในตอนนี้..."
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
              {isSubmitting ? "กำลังบันทึก..." : initialData ? "บันทึกการแก้ไข" : "เพิ่มตอนย่อย"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EpisodeModal;
