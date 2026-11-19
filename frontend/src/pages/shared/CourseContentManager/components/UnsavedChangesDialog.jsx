import { LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";

/**
 * UnsavedChangesDialog Component
 * แจ้งเตือนเมื่อผู้สอนแก้ไขเนื้อหาแล้วต้องการออกจากหน้าโดยยังไม่ได้บันทึก
 * ตัวเลือก:
 * 1. บันทึกและออก (Save & Exit)
 * 2. ออกจากหน้านี้ (Discard & Exit)
 * 3. อยู่หน้านี้ต่อ (Stay on Page)
 */
function UnsavedChangesDialog({
  isOpen,
  onStay,
  onDiscardAndExit,
  onSaveAndExit,
  isSaving = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 transition-all">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-fadeIn">
        {/* ไอคอนและหัวเรื่อง */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
            <LuAlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#26332F]">
              ยังไม่ได้บันทึกการเปลี่ยนแปลง
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              คุณมีการแก้ไขเนื้อหาบทเรียนที่ยังไม่ได้บันทึก
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
          หากคุณออกจากหน้านี้ตอนนี้ การเปลี่ยนแปลงทั้งหมดที่ยังไม่ได้บันทึกจะสูญหาย
          คุณต้องการดำเนินการอย่างไร?
        </p>

        {/* 3 ตัวเลือกตามข้อกำหนด 13 */}
        <div className="flex flex-col sm:flex-row-reverse sm:items-center gap-2.5 pt-2">
          {/* 1. บันทึกและออก */}
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveAndExit}
            className="w-full sm:w-auto rounded-xl bg-[#ABD1C6] px-4 py-2.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] disabled:opacity-50 transition cursor-pointer shadow-2xs text-center"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกและออก"}
          </button>

          {/* 2. ออกจากหน้านี้ (ทิ้งการเปลี่ยนแปลง) */}
          <button
            type="button"
            disabled={isSaving}
            onClick={onDiscardAndExit}
            className="w-full sm:w-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer text-center"
          >
            ออกจากหน้านี้
          </button>

          {/* 3. อยู่หน้านี้ต่อ */}
          <button
            type="button"
            disabled={isSaving}
            onClick={onStay}
            className="w-full sm:w-auto rounded-xl border border-[#E5E9E7] bg-white px-4 py-2.5 text-xs font-bold text-[#6B7773] hover:bg-gray-50 hover:text-[#26332F] transition cursor-pointer text-center"
          >
            อยู่หน้านี้ต่อ
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesDialog;
