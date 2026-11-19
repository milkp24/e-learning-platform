import {
  LuFileText,
  LuImage,
  LuVideo,
  LuFile,
  LuCode,
  LuChevronUp,
  LuChevronDown,
  LuPencil as LuEdit3,
  LuCopy,
  LuTrash2,
  LuGripVertical,
} from "react-icons/lu";

/**
 * ContentBlockCard Component
 * การ์ดแสดงผลบล็อกเนื้อหาใน Content Builder
 * แสดงข้อมูลประเภท ลำดับตัวเลข และเครื่องมือจัดการ:
 * - เลื่อนขึ้น (Move Up)
 * - เลื่อนลง (Move Down)
 * - แก้ไข (Edit)
 * - ทำสำเนา (Duplicate)
 * - ลบ (Delete)
 * - Drag Handle สำหรับลากสลับลำดับ
 */
function ContentBlockCard({
  block,
  index,
  totalBlocks,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}) {
  const { content_type, content_data, caption } = block;

  // ประเภทบล็อกและสีประจำแต่ละประเภท
  const getTypeConfig = () => {
    switch (content_type) {
      case "text":
        return {
          title: "ข้อความ",
          icon: LuFileText,
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
          iconBg: "bg-emerald-100 text-emerald-700",
        };
      case "image":
        return {
          title: "รูปภาพ",
          icon: LuImage,
          badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
          iconBg: "bg-sky-100 text-sky-700",
        };
      case "youtube":
        return {
          title: "วิดีโอ YouTube",
          icon: LuVideo,
          badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
          iconBg: "bg-rose-100 text-rose-700",
        };
      case "video":
        return {
          title: "วิดีโอ (MP4)",
          icon: LuVideo,
          badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
          iconBg: "bg-purple-100 text-purple-700",
        };
      case "pdf":
      case "file":
        return {
          title: "เอกสารแนบ",
          icon: LuFile,
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          iconBg: "bg-amber-100 text-amber-700",
        };
      case "code":
        return {
          title: "โค้ดโปรแกรม",
          icon: LuCode,
          badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
          iconBg: "bg-purple-100 text-purple-700",
        };
      default:
        return {
          title: "เนื้อหา",
          icon: LuFileText,
          badgeColor: "bg-gray-50 text-gray-800 border-gray-200",
          iconBg: "bg-gray-100 text-gray-700",
        };
    }
  };

  const { title: typeTitle, icon: Icon, badgeColor } = getTypeConfig();

  // สร้าง Preview Snippet ตามประเภท
  const renderPreview = () => {
    switch (content_type) {
      case "text":
        return (
          <div className="text-xs text-[#6B7773] line-clamp-2 leading-relaxed">
            {content_data ? content_data.replace(/[#*`_~[\]]/g, "") : "ไม่มีเนื้อหาข้อความ"}
          </div>
        );

      case "image":
        return (
          <div className="flex items-center gap-3">
            {content_data ? (
              <img
                src={content_data}
                alt={caption || "ตัวอย่างรูปภาพ"}
                className="h-14 w-20 rounded-lg object-cover border border-gray-200 shrink-0 bg-gray-50"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#26332F] truncate">
                {caption || "รูปภาพไม่มีคำบรรยาย"}
              </p>
              <p className="text-[11px] text-[#6B7773] truncate">
                {content_data?.startsWith("data:") ? "[รูปภาพที่อัปโหลด]" : content_data}
              </p>
            </div>
          </div>
        );

      case "youtube":
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 font-bold text-[10px]">
              ▶ YOUTUBE
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#26332F] truncate">
                {caption || "วิดีโอ YouTube"}
              </p>
              <p className="text-[11px] text-[#6B7773] truncate font-mono">
                {content_data}
              </p>
            </div>
          </div>
        );

      case "video":
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold text-[10px]">
              ▶ MP4
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#26332F] truncate">
                {caption || block.file_name || "วิดีโอ (MP4)"}
              </p>
              <p className="text-[11px] text-[#6B7773] truncate font-mono">
                {content_data?.startsWith("data:") || content_data?.startsWith("blob:")
                  ? `[พรีวิวจากเครื่อง: ${block.file_name || "video.mp4"}]`
                  : content_data}
              </p>
            </div>
          </div>
        );

      case "pdf":
      case "file":
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-bold">
              <LuFile className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#26332F] truncate">
                {caption || block.file_name || "เอกสารแนบ"}
              </p>
              <p className="text-[11px] text-[#6B7773]">
                {block.file_size ? `${block.file_size} • ` : ""}เอกสารแนบ
              </p>
            </div>
          </div>
        );

      case "code":
        return (
          <pre className="rounded-lg bg-gray-900 text-emerald-400 p-2.5 text-[11px] font-mono line-clamp-2 overflow-hidden">
            {content_data}
          </pre>
        );

      default:
        return (
          <p className="text-xs text-[#6B7773] truncate">
            {content_data || "ไม่มีข้อมูล"}
          </p>
        );
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, index)}
      onDragOver={(e) => onDragOver?.(e, index)}
      onDrop={(e) => onDrop?.(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl border bg-white p-4 transition duration-150 shadow-2xs hover:shadow-md ${
        isDragging
          ? "opacity-40 border-dashed border-[#ABD1C6]"
          : "border-[#E5E9E7] hover:border-[#ABD1C6]"
      }`}
    >
      {/* ส่วนหัวของการ์ดบล็อก */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Drag Handle */}
          <div
            className="flex h-7 w-5 items-center justify-center text-[#6B7773] hover:text-[#26332F] cursor-grab active:cursor-grabbing shrink-0"
            title="ลากเพื่อสลับลำดับ"
          >
            <LuGripVertical className="h-4 w-4" />
          </div>

          {/* ลำดับตัวเลข เช่น 1. ข้อความ */}
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#20302C] text-xs font-black text-white">
            {index + 1}
          </span>

          {/* ป้ายประเภทบล็อก */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{typeTitle}</span>
          </span>

          {/* หัวข้อ (ถ้ามี) */}
          {caption && content_type === "text" && (
            <span className="text-xs font-bold text-[#26332F] truncate">
              : {caption}
            </span>
          )}
        </div>

        {/* แผงเครื่องมือการจัดการบล็อก (Reorder, Edit, Duplicate, Delete) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* เลื่อนขึ้น */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="เลื่อนขึ้น"
          >
            <LuChevronUp className="h-4 w-4" />
          </button>

          {/* เลื่อนลง */}
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMoveDown(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="เลื่อนลง"
          >
            <LuChevronDown className="h-4 w-4" />
          </button>

          <span className="h-3.5 w-[1px] bg-gray-200 mx-0.5" />

          {/* แก้ไข */}
          <button
            type="button"
            onClick={() => onEdit(block, index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#004643] hover:bg-[#ABD1C6]/30 transition cursor-pointer"
            title="แก้ไขเนื้อหา"
          >
            <LuEdit3 className="h-3.5 w-3.5" />
          </button>

          {/* ทำสำเนา */}
          <button
            type="button"
            onClick={() => onDuplicate(block, index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
            title="ทำสำเนาบล็อกนี้"
          >
            <LuCopy className="h-3.5 w-3.5" />
          </button>

          {/* ลบ */}
          <button
            type="button"
            onClick={() => onDelete(index)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="ลบบล็อกนี้"
          >
            <LuTrash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* พรีวิวเนื้อหาภายในบล็อก */}
      <div className="pl-8">{renderPreview()}</div>
    </div>
  );
}

export default ContentBlockCard;
