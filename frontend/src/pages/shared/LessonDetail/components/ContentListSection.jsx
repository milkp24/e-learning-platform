import { LuBookOpen } from "react-icons/lu";
import ContentRenderer from "../../../../features/lessons/components/ContentRenderer";

/**
 * ContentListSection Component
 * Displays the list of lesson contents, empty state, and content management triggers.
 */
function ContentListSection({
  contents,
  isOwnerOrAdmin,
  onOpenAddContentModal,
  onOpenEditContent,
  onDeleteContent,
  lessonProgress = null,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          เนื้อหาในบทเรียน ({contents.length})
        </h2>
        <span className="text-xs text-gray-500">
          รองรับ: Text, Video URL, PDF URL, Image URL, Source Code
        </span>
      </div>

      {contents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="flex justify-center mb-2">
            <LuBookOpen className="h-10 w-10 text-[#004643]" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-gray-700">ยังไม่มีเนื้อหาในบทเรียนนี้</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isOwnerOrAdmin
              ? "กดปุ่ม 'เพิ่มเนื้อหา' ด้านบนเพื่อเริ่มต้นสร้างเนื้อหาแรกของคุณ"
              : "ผู้สอนยังไม่ได้เพิ่มเนื้อหาลงในบทเรียนนี้"}
          </p>
          {isOwnerOrAdmin && (
            <button
              onClick={onOpenAddContentModal}
              type="button"
              className="mt-4 rounded-xl bg-[#ABD1C6] px-5 py-2 text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] cursor-pointer"
            >
              + เพิ่มเนื้อหาทันที
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {contents.map((item, index) => (
            <div
              key={item.content_id}
              className="relative group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {/* แถบข้อมูลบนของ Content */}
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-semibold uppercase text-gray-600">
                    #{index + 1} ชนิด: {item.content_type}
                  </span>
                </div>

                {/* ปุ่มจัดการเนื้อหา (เฉพาะ Instructor หรือ Admin) */}
                {isOwnerOrAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEditContent(item)}
                      type="button"
                      className="text-xs font-semibold text-[#004643] hover:underline cursor-pointer"
                    >
                      แก้ไข
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      onClick={() => onDeleteContent(item.content_id)}
                      type="button"
                      className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>

              {/* ตัวแสดงผลเนื้อหาตามชนิด (ContentRenderer) */}
              <ContentRenderer
                content={item}
                videoProgress={
                  lessonProgress && lessonProgress.percentOf(item.content_id) !== undefined
                    ? {
                        percent: lessonProgress.percentOf(item.content_id),
                        requiredPercent: lessonProgress.requiredPercent,
                      }
                    : null
                }
                onVideoProgress={
                  lessonProgress
                    ? (position, duration) => lessonProgress.reportVideo(item.content_id, position, duration)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentListSection;
