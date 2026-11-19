import { useState } from "react";
import {
  LuPlus,
  LuChevronDown,
  LuChevronRight,
  LuChevronUp,
  LuPencil as LuEdit3,
  LuTrash2,
  LuGlobe,
  LuEyeOff,
  LuLayers,
  LuFileText,
} from "react-icons/lu";

/**
 * CurriculumTree Component
 * โครงสร้างต้นไม้ของคอร์สเรียน: คอร์ส -> บทเรียน (Chapters) -> ตอนย่อย (Episodes)
 * รองรับ:
 * - เพิ่มบท, แก้ไขบท, ลบบท, จัดลำดับบท (เลื่อนขึ้น/ลง), เปิด/ปิดเผยแพร่บท
 * - เพิ่มตอน, แก้ไขตอน, ลบตอน, จัดลำดับตอน (เลื่อนขึ้น/ลง), เปิด/ปิดเผยแพร่ตอน
 * - เลือกตอนเพื่อส่งเข้าสู่ Content Builder
 */
function CurriculumTree({
  course,
  chapters = [],
  selectedEpisodeId,
  onSelectEpisode,
  onAddChapter,
  onEditChapter,
  onDeleteChapter,
  onMoveChapterUp,
  onMoveChapterDown,
  onToggleChapterStatus,
  onAddEpisode,
  onEditEpisode,
  onDeleteEpisode,
  onMoveEpisodeUp,
  onMoveEpisodeDown,
  onToggleEpisodeStatus,
}) {
  // ควบคุมการยุบ/ขยายบทเรียน (เริ่มต้นเปิดทุกบท)
  const [collapsedChapters, setCollapsedChapters] = useState({});

  const toggleCollapse = (chapterId) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  return (
    <div className="rounded-3xl border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden flex flex-col h-full">
      {/* ส่วนหัวของผังหลักสูตร */}
      <div className="border-b border-[#E5E9E7] p-4 sm:p-5 bg-[#FAFAFA] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-bold text-[#004643] uppercase tracking-wider block">
            โครงสร้างหลักสูตร
          </span>
          <h3 className="text-sm font-black text-[#26332F] truncate">
            {course?.title || "คอร์สเรียน"}
          </h3>
        </div>

        {/* ปุ่ม + เพิ่มบท */}
        <button
          type="button"
          onClick={onAddChapter}
          className="inline-flex items-center gap-1 rounded-xl bg-[#ABD1C6] px-3 py-1.5 text-xs font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-2xs shrink-0"
        >
          <LuPlus className="h-4 w-4" />
          <span>เพิ่มบท</span>
        </button>
      </div>

      {/* รายการต้นไม้ (Tree List) */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {chapters.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <LuLayers className="mx-auto h-8 w-8 text-gray-400" />
            <p className="text-xs font-bold text-[#26332F]">ยังไม่มีบทเรียน</p>
            <p className="text-[11px] text-[#6B7773]">
              คลิกปุ่ม "+ เพิ่มบท" ด้านบนเพื่อเริ่มต้นสร้างบทเรียนแรก
            </p>
          </div>
        ) : (
          chapters.map((chapter, chIndex) => {
            const chapterId = chapter.lesson_id || chapter.chapter_id || chapter.id;
            const isCollapsed = Boolean(collapsedChapters[chapterId]);
            const isChapterPublished = (chapter.status || "active").toLowerCase() === "active";
            const episodes = chapter.episodes || [];

            return (
              <div
                key={chapterId}
                className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] overflow-hidden transition"
              >
                {/* แถวหัวข้อบทเรียน (Chapter Row) */}
                <div className="p-3 bg-white border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* ปุ่มยุบ/ขยาย */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(chapterId)}
                      className="p-1 text-[#6B7773] hover:text-[#26332F] transition cursor-pointer shrink-0"
                    >
                      {isCollapsed ? (
                        <LuChevronRight className="h-4 w-4" />
                      ) : (
                        <LuChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {/* ลำดับและชื่อบท */}
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#ABD1C6]/40 text-[10px] font-bold text-[#004643]">
                      {chapter.sequence_no ?? chIndex + 1}
                    </span>
                    <span
                      onClick={() => toggleCollapse(chapterId)}
                      className="text-xs font-bold text-[#26332F] truncate cursor-pointer hover:text-[#004643] transition"
                      title={chapter.title}
                    >
                      {chapter.title}
                    </span>
                  </div>

                  {/* เครื่องมือจัดการบทเรียน */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* เลื่อนขึ้น */}
                    <button
                      type="button"
                      disabled={chIndex === 0}
                      onClick={() => onMoveChapterUp(chIndex)}
                      className="p-1 text-[#6B7773] hover:text-[#26332F] disabled:opacity-20 cursor-pointer"
                      title="เลื่อนบทขึ้น"
                    >
                      <LuChevronUp className="h-3.5 w-3.5" />
                    </button>

                    {/* เลื่อนลง */}
                    <button
                      type="button"
                      disabled={chIndex === chapters.length - 1}
                      onClick={() => onMoveChapterDown(chIndex)}
                      className="p-1 text-[#6B7773] hover:text-[#26332F] disabled:opacity-20 cursor-pointer"
                      title="เลื่อนบทลง"
                    >
                      <LuChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {/* แก้ไขบท */}
                    <button
                      type="button"
                      onClick={() => onEditChapter(chapter)}
                      className="p-1 text-[#6B7773] hover:text-[#004643] cursor-pointer"
                      title="แก้ไขบทเรียน"
                    >
                      <LuEdit3 className="h-3.5 w-3.5" />
                    </button>

                    {/* สลับสถานะเผยแพร่ */}
                    <button
                      type="button"
                      onClick={() => onToggleChapterStatus(chapter)}
                      className={`p-1 cursor-pointer transition ${
                        isChapterPublished ? "text-emerald-700 hover:text-emerald-800" : "text-gray-400 hover:text-gray-600"
                      }`}
                      title={isChapterPublished ? "เผยแพร่แล้ว (คลิกเพื่อปิด)" : "ฉบับร่าง (คลิกเพื่อเผยแพร่)"}
                    >
                      {isChapterPublished ? (
                        <LuGlobe className="h-3.5 w-3.5" />
                      ) : (
                        <LuEyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* ลบบท */}
                    <button
                      type="button"
                      onClick={() => onDeleteChapter(chapter)}
                      className="p-1 text-[#6B7773] hover:text-rose-600 cursor-pointer"
                      title="ลบบทเรียน"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* รายการตอนย่อย (Episodes) ภายใต้บท */}
                {!isCollapsed && (
                  <div className="p-2 space-y-1.5">
                    {episodes.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-[11px] text-[#6B7773]">ยังไม่มีตอนในบทนี้</p>
                      </div>
                    ) : (
                      episodes.map((episode, epIndex) => {
                        const epId = episode.episode_id || episode.id;
                        const isSelected = epId === selectedEpisodeId;
                        const isEpPublished = (episode.status || "active").toLowerCase() === "active";

                        return (
                          <div
                            key={epId}
                            onClick={() => onSelectEpisode(chapter, episode)}
                            className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-[#ABD1C6] text-[#20302C] font-bold shadow-xs"
                                : "bg-white hover:bg-gray-100 text-[#26332F] border border-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <LuFileText
                                className={`h-3.5 w-3.5 shrink-0 ${
                                  isSelected ? "text-[#004643]" : "text-[#6B7773]"
                                }`}
                              />
                              <span className="truncate">
                                {episode.title}
                              </span>
                            </div>

                            {/* เครื่องมือจัดการตอนย่อย */}
                            <div
                              className="flex items-center gap-0.5 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* เลื่อนตอนขึ้น */}
                              <button
                                type="button"
                                disabled={epIndex === 0}
                                onClick={() => onMoveEpisodeUp(chapter, epIndex)}
                                className={`p-1 rounded hover:bg-black/10 disabled:opacity-20 transition ${
                                  isSelected ? "text-[#20302C]" : "text-[#6B7773]"
                                }`}
                                title="เลื่อนตอนขึ้น"
                              >
                                <LuChevronUp className="h-3 w-3" />
                              </button>

                              {/* เลื่อนตอนลง */}
                              <button
                                type="button"
                                disabled={epIndex === episodes.length - 1}
                                onClick={() => onMoveEpisodeDown(chapter, epIndex)}
                                className={`p-1 rounded hover:bg-black/10 disabled:opacity-20 transition ${
                                  isSelected ? "text-[#20302C]" : "text-[#6B7773]"
                                }`}
                                title="เลื่อนตอนลง"
                              >
                                <LuChevronDown className="h-3 w-3" />
                              </button>

                              {/* แก้ไขตอน */}
                              <button
                                type="button"
                                onClick={() => onEditEpisode(chapter, episode)}
                                className={`p-1 rounded hover:bg-black/10 transition ${
                                  isSelected ? "text-[#20302C]" : "text-[#6B7773]"
                                }`}
                                title="แก้ไขข้อมูลตอน"
                              >
                                <LuEdit3 className="h-3 w-3" />
                              </button>

                              {/* สลับสถานะตอน */}
                              <button
                                type="button"
                                onClick={() => onToggleEpisodeStatus(chapter, episode)}
                                className={`p-1 rounded hover:bg-black/10 transition ${
                                  isEpPublished ? "text-emerald-700" : "text-gray-400"
                                }`}
                                title={isEpPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
                              >
                                <LuGlobe className="h-3 w-3" />
                              </button>

                              {/* ลบตอน */}
                              <button
                                type="button"
                                onClick={() => onDeleteEpisode(chapter, episode)}
                                className="p-1 rounded hover:bg-rose-100 hover:text-rose-600 text-[#6B7773] transition"
                                title="ลบตอนนี้"
                              >
                                <LuTrash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* ปุ่ม + เพิ่มตอน ภายใต้บทนี้ */}
                    <button
                      type="button"
                      onClick={() => onAddEpisode(chapter)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#ABD1C6] py-1.5 text-[11px] font-bold text-[#004643] hover:bg-[#ABD1C6]/15 transition cursor-pointer mt-1"
                    >
                      <LuPlus className="h-3 w-3" />
                      <span>เพิ่มตอนในบทนี้</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CurriculumTree;
