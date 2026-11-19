import { Link } from "react-router-dom";
import { LuCheck, LuClock, LuLock, LuTarget, LuSparkles, LuZap } from "react-icons/lu";
import { IOT_101_CHAPTERS } from "../../../../data/iot101Data";
import { EPISODE_INTERACTIVE_DATA } from "../../../../data/iot101InteractiveData";
import useIoT101Store from "../../../../store/useIoT101Store";

/**
 * IoTChapterAccordion Component
 * Renders the 8 chapters of IoT 101 curriculum with collapse/expand capabilities,
 * dynamic progress from useIoT101Store, and mission badges.
 */
function IoTChapterAccordion({
  expandedChapters,
  onToggleChapter,
  onExpandAll,
  onCollapseAll,
  isGuest = false,
  onOpenLockModal,
}) {
  const { completedEpisodes, currentEpisodeId } = useIoT101Store();

  const getChapterBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 inline-flex items-center gap-1">
            <LuCheck className="h-3 w-3" aria-hidden="true" />
            <span>จบแล้ว</span>
          </span>
        );
      case "in_progress":
        return (
          <span className="rounded-full bg-[#004643] px-2.5 py-0.5 text-[11px] font-bold text-[#ABD1C6] inline-flex items-center gap-1">
            <LuClock className="h-3 w-3" aria-hidden="true" />
            <span>กำลังเรียน</span>
          </span>
        );
      case "available":
        return (
          <span className="rounded-full bg-[#ABD1C6]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#004643]">
            พร้อมเรียน
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 inline-flex items-center gap-1">
            <LuLock className="h-3 w-3" aria-hidden="true" />
            <span>ล็อก</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* ส่วนหัวโครงสร้างหลักสูตร */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#1F2937]">
            โครงสร้างเนื้อหาและภารกิจ (Curriculum & Missions)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            8 Chapters • 27 Episodes • นำทางผ่านเรื่องราว “สวนเรียนรู้แห่งเมืองนาวา”
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            ขยายทั้งหมด
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
          >
            ยุบทั้งหมด
          </button>
        </div>
      </div>

      {/* รายการ Chapter ทั้งหมด (Chapter 0 ถึง 7) */}
      <div className="space-y-4">
        {IOT_101_CHAPTERS.map((chapter) => {
          const isExpanded = !!expandedChapters[chapter.id];

          // คำนวณสถานะ Chapter จากสถานะ Episodes ภายใน
          const chapterCompleted = chapter.episodes.every((ep) =>
            completedEpisodes.includes(ep.id)
          );
          const chapterInProgress = chapter.episodes.some(
            (ep) => ep.id === currentEpisodeId || completedEpisodes.includes(ep.id)
          );
          const effectiveChapterStatus = chapterCompleted
            ? "completed"
            : chapterInProgress
            ? "in_progress"
            : chapter.status;

          return (
            <div
              key={chapter.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition"
            >
              {/* แถบหัว Chapter (คลิกเพื่อ Expand / Collapse) */}
              <button
                type="button"
                onClick={() => onToggleChapter(chapter.id)}
                className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition hover:bg-gray-50/80 cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`mt-0.5 sm:mt-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition duration-200 ${
                      isExpanded
                        ? "bg-[#004643] text-[#ABD1C6] rotate-90"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    ▶
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {chapter.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="hidden sm:inline-block text-xs font-semibold text-gray-400">
                    {chapter.episodes.length} ตอน
                  </span>
                  {getChapterBadge(effectiveChapterStatus)}
                </div>
              </button>

              {/* รายการ Episodes เมื่อเปิด Chapter */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-[#FAFAFA]/70 p-3 sm:p-4 space-y-2">
                  {chapter.episodes.map((ep) => {
                    const isCompleted = completedEpisodes.includes(ep.id);
                    const isCurrent = currentEpisodeId === ep.id;
                    const effectiveStatus = isCompleted
                      ? "completed"
                      : isCurrent
                      ? "in_progress"
                      : ep.status;

                    const isEpLocked = effectiveStatus === "locked";
                    const episodeLink = `/classrooms/iot-101/lessons/${ep.id}`;
                    const interactiveMeta = EPISODE_INTERACTIVE_DATA[ep.id];

                    return (
                      <div
                        key={ep.id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-3 sm:p-3.5 transition ${
                          effectiveStatus === "in_progress"
                            ? "border-[#004643]/30 bg-white shadow-xs ring-1 ring-[#004643]/10"
                            : isEpLocked
                            ? "border-gray-200/60 bg-gray-50/60 opacity-60"
                            : "border-gray-200 bg-white hover:border-[#ABD1C6]"
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span
                            className={`flex h-8 w-14 shrink-0 items-center justify-center rounded-lg text-xs font-mono font-bold ${
                              effectiveStatus === "in_progress"
                                ? "bg-[#004643] text-white"
                                : effectiveStatus === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {ep.code}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900">
                                {ep.title}
                              </h4>
                              {interactiveMeta?.story && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-[#ABD1C6]/30 px-2 py-0.5 text-[10px] font-bold text-[#004643]">
                                  <LuSparkles className="h-3 w-3" />
                                  <span>เรื่องราว</span>
                                </span>
                              )}
                              {interactiveMeta?.mission && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                  <LuTarget className="h-3 w-3" />
                                  <span>ภารกิจ</span>
                                </span>
                              )}
                              {interactiveMeta?.simulation && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-900">
                                  <LuZap className="h-3 w-3" />
                                  <span>จำลองระบบ</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <LuClock className="h-3 w-3" aria-hidden="true" />
                                <span>{ep.duration}</span>
                              </span>
                              {interactiveMeta?.mission?.title && (
                                <span className="text-gray-400">
                                  • {interactiveMeta.mission.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <div>{getChapterBadge(effectiveStatus)}</div>

                          {isEpLocked ? (
                            <span className="text-xs text-gray-400 font-medium px-3 py-1.5">
                              ยังไม่ปลดล็อก
                            </span>
                          ) : isGuest ? (
                            <button
                              type="button"
                              onClick={() => onOpenLockModal?.(ep.title)}
                              className="rounded-lg bg-[#ABD1C6] px-3.5 py-1.5 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9] transition shadow-xs cursor-pointer"
                            >
                              เข้าเรียน →
                            </button>
                          ) : (
                            <Link
                              to={episodeLink}
                              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                                effectiveStatus === "in_progress"
                                  ? "bg-[#004643] text-white hover:bg-[#003835]"
                                  : "bg-[#ABD1C6] text-[#20302C] hover:bg-[#9CC5B9]"
                              }`}
                            >
                              {effectiveStatus === "in_progress" ? "เรียนต่อ" : "เข้าเรียน"} →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IoTChapterAccordion;
