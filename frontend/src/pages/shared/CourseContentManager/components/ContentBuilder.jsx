import { useState } from "react";
import {
  LuPlus,
  LuFileText,
  LuImage,
  LuVideo,
  LuFile,
  LuEye,
  LuSave,
  LuGlobe,
  LuLayers,
} from "react-icons/lu";
import ContentBlockCard from "./ContentBlockCard";

/**
 * ContentBuilder Component
 * พื้นที่สร้างและจัดเรียงเนื้อหาของตอน (Episode Content Builder)
 * รองรับ:
 * - เพิ่มเนื้อหา 4 ประเภท: ข้อความ, รูปภาพ, ไฟล์, วิดีโอ YouTube
 * - จัดลำดับผ่านปุ่มเลื่อนและ HTML5 Drag & Drop
 * - แสดงสถานะ และการเชื่อมโยงบล็อกแบบสายธาร (Stream Flow)
 * - ปุ่ม ดูตัวอย่าง, บันทึกฉบับร่าง, เผยแพร่
 */
function ContentBuilder({
  chapter,
  episode,
  contents = [],
  isDirty = false,
  onAddBlock,
  onEditBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveUp,
  onMoveDown,
  onReorder,
  onSaveDraft,
  onPublish,
  onOpenPreview,
  isSaving = false,
  isPublishing = false,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  if (!episode) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
          <LuLayers className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#26332F]">
          กรุณาเลือกตอนย่อยจากเมนูด้านซ้าย
        </h3>
        <p className="text-xs text-[#6B7773] max-w-sm">
          เลือกตอนที่ต้องการ หรือคลิก "+ เพิ่มตอน" ภายใต้บทเรียน เพื่อเริ่มต้นสร้างและจัดการเนื้อหา
        </p>
      </div>
    );
  }

  // Drag & Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    onReorder?.(draggedIndex, targetIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const isPublished = (episode.status || "active").toLowerCase() === "active";

  return (
    <div className="space-y-6">
      {/* 1. ส่วนหัวของตอนที่กำลังแก้ไข (Episode Header & Actions) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#004643] uppercase tracking-wider">
              {chapter?.title || "บทเรียน"}
            </span>
            <span>•</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isPublished
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 border border-gray-300"
              }`}
            >
              {isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
            </span>
            {isDirty && (
              <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-bold animate-pulse">
                มีการแก้ไขยังไม่บันทึก
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#26332F]">
            {episode.title}
          </h2>
          {episode.description && (
            <p className="text-xs text-[#6B7773] line-clamp-1">
              {episode.description}
            </p>
          )}
        </div>

        {/* แถบปุ่ม Action หลัก: ดูตัวอย่าง, บันทึกฉบับร่าง, เผยแพร่ */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* ปุ่มดูตัวอย่างสำหรับผู้เรียน */}
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2 text-xs font-bold text-[#26332F] hover:bg-gray-50 transition cursor-pointer shadow-2xs"
            title="ดูตัวอย่างมุมมองของผู้เรียน"
          >
            <LuEye className="h-4 w-4 text-[#004643]" />
            <span>ดูตัวอย่าง</span>
          </button>

          {/* ปุ่มบันทึกฉบับร่าง */}
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ABD1C6] bg-white px-4 py-2 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/15 disabled:opacity-50 transition cursor-pointer shadow-2xs"
          >
            <LuSave className="h-4 w-4" />
            <span>{isSaving ? "กำลังบันทึก..." : "บันทึกฉบับร่าง"}</span>
          </button>

          {/* ปุ่มเผยแพร่ */}
          <button
            type="button"
            disabled={isPublishing}
            onClick={onPublish}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 disabled:opacity-50 transition cursor-pointer shadow-2xs"
          >
            <LuGlobe className="h-4 w-4" />
            <span>{isPublishing ? "กำลังเผยแพร่..." : "เผยแพร่"}</span>
          </button>
        </div>
      </div>

      {/* 2. แถบปุ่มเพิ่มเนื้อหา 5 ประเภทหลัก (Core Content Blocks) */}
      <div className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-[#6B7773] mb-3">
          เพิ่มเนื้อหาใหม่ในตอนนี้
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* 1. + เพิ่มข้อความ */}
          <button
            type="button"
            onClick={() => onAddBlock("text")}
            className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
          >
            <LuFileText className="h-4 w-4 text-emerald-700" />
            <span>+ เพิ่มข้อความ</span>
          </button>

          {/* 2. + เพิ่มรูปภาพ */}
          <button
            type="button"
            onClick={() => onAddBlock("image")}
            className="flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs font-bold text-sky-800 hover:bg-sky-100 hover:border-sky-300 transition cursor-pointer shadow-2xs"
          >
            <LuImage className="h-4 w-4 text-sky-700" />
            <span>+ เพิ่มรูปภาพ</span>
          </button>

          {/* 3. + เพิ่มเอกสารแนบ */}
          <button
            type="button"
            onClick={() => onAddBlock("file")}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition cursor-pointer shadow-2xs"
          >
            <LuFile className="h-4 w-4 text-amber-700" />
            <span>+ เพิ่มเอกสารแนบ</span>
          </button>

          {/* 4. + เพิ่มวิดีโอ (MP4) */}
          <button
            type="button"
            onClick={() => onAddBlock("video")}
            className="flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs font-bold text-purple-800 hover:bg-purple-100 hover:border-purple-300 transition cursor-pointer shadow-2xs"
          >
            <LuVideo className="h-4 w-4 text-purple-700" />
            <span>+ เพิ่มวิดีโอ (MP4)</span>
          </button>

          {/* 5. + เพิ่มวิดีโอ YouTube */}
          <button
            type="button"
            onClick={() => onAddBlock("youtube")}
            className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs font-bold text-rose-800 hover:bg-rose-100 hover:border-rose-300 transition cursor-pointer shadow-2xs col-span-2 sm:col-span-1"
          >
            <LuVideo className="h-4 w-4 text-rose-700" />
            <span>+ เพิ่ม YouTube</span>
          </button>
        </div>
      </div>

      {/* 3. รายการบล็อกเนื้อหาทั้งหมด (Stream Flow & Visual Order) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7773]">
            ลำดับเนื้อหาในตอนนี้ ({contents.length} บล็อก)
          </span>
          <span className="text-[11px] text-[#6B7773]">
            * สามารถลากที่ไอคอนจุด หรือใช้ปุ่มลูกศรเพื่อสลับลำดับ
          </span>
        </div>

        {contents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuPlus className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-[#26332F]">
              ตอนนี้ยังไม่มีเนื้อหา
            </h4>
            <p className="text-xs text-[#6B7773] max-w-sm">
              เริ่มต้นด้วยการคลิกปุ่มด้านบนเพื่อเพิ่มข้อความ รูปภาพ เอกสารแนบ วิดีโอ MP4 หรือ YouTube
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contents.map((block, index) => (
              <div key={block.content_id || `block-${index}`} className="relative">
                {/* Visual Connector Line between blocks */}
                {index > 0 && (
                  <div className="flex justify-center -my-1 py-1">
                    <div className="h-4 w-[2px] bg-gray-200" />
                  </div>
                )}

                <ContentBlockCard
                  block={block}
                  index={index}
                  totalBlocks={contents.length}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onEdit={onEditBlock}
                  onDuplicate={onDuplicateBlock}
                  onDelete={onDeleteBlock}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                />
              </div>
            ))}

            {/* ปุ่มเพิ่มเนื้อหาต่อท้ายลำดับ */}
            <div className="pt-2 flex justify-center">
              <div className="dropdown relative group">
                <button
                  type="button"
                  onClick={() => onAddBlock("text")}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-[#ABD1C6] bg-white px-6 py-2.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/15 transition cursor-pointer shadow-2xs"
                >
                  <LuPlus className="h-4 w-4" />
                  <span>+ เพิ่มเนื้อหาต่อท้าย</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentBuilder;
