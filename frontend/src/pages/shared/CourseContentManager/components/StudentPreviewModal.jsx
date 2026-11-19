import { LuX, LuEye, LuBookOpen } from "react-icons/lu";
import ContentRenderer from "../../../../components/ContentRenderer";

/**
 * StudentPreviewModal Component
 * หน้าต่างดูตัวอย่างสำหรับผู้เรียน (Student Preview)
 * เรนเดอร์ด้วย ContentRenderer คอมโพเนนต์เดียวกับที่ผู้เรียนเห็นจริง 100%
 */
function StudentPreviewModal({
  isOpen,
  onClose,
  courseTitle = "คอร์สเรียน",
  chapterTitle = "บทเรียน",
  episodeTitle = "ตอนที่ 1",
  contents = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 transition-all">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-[#FAFAFA] shadow-2xl overflow-hidden animate-fadeIn">
        {/* แถบหัวเรื่อง Preview Bar */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuEye className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#004643] px-2 py-0.5 text-[10px] font-bold text-[#ABD1C6] uppercase">
                  โหมดดูตัวอย่าง (Preview)
                </span>
                <span className="text-xs text-[#6B7773]">{courseTitle}</span>
              </div>
              <h3 className="text-base font-black text-[#26332F]">
                {episodeTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-100 transition cursor-pointer"
          >
            <LuX className="h-4 w-4" />
            <span>ปิดตัวอย่าง</span>
          </button>
        </div>

        {/* เนื้อหาหน้าจอผู้เรียน (Exact Student View) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ส่วนหัวของหน้าบทเรียน */}
          <div className="rounded-2xl border border-[#E5E9E7] bg-white p-6 shadow-xs space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#004643]">
              {chapterTitle}
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-[#26332F]">
              {episodeTitle}
            </h1>
            <p className="text-xs text-[#6B7773]">
              เนื้อหาบทเรียนเรียงตามลำดับสำหรับผู้เรียน
            </p>
          </div>

          {/* รายการ Content Blocks ที่เรนเดอร์ผ่าน ContentRenderer */}
          {contents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-2">
              <LuBookOpen className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm font-bold text-[#26332F]">ยังไม่มีเนื้อหาในตอนนี้</p>
              <p className="text-xs text-[#6B7773]">
                เพิ่มข้อความ รูปภาพ ไฟล์ หรือวิดีโอ YouTube ใน Content Builder เพื่อดูตัวอย่าง
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {contents.map((block, index) => {
                const blockKey = block.content_id || `preview-${index}`;
                return (
                  <div key={blockKey} className="transition">
                    <ContentRenderer content={block} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* แถบท้าย Modal */}
        <div className="flex items-center justify-between border-t border-[#E5E9E7] px-6 py-3.5 bg-white">
          <span className="text-xs text-[#6B7773]">
            จำนวนบล็อกเนื้อหาทั้งหมด: {contents.length} บล็อก
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] transition cursor-pointer shadow-2xs"
          >
            กลับสู่การแก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentPreviewModal;
