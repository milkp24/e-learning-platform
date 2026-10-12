import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LuBookOpen,
  LuCirclePlay,
  LuClock,
  LuChevronDown,
  LuChevronRight,
  LuLock,
  LuListTree,
} from "react-icons/lu";

/**
 * StandardLessonsSection Component
 * Displays the real course curriculum structure from PostgreSQL:
 * Course -> Chapter -> Lesson -> Episode
 * - Supports expandable/collapsible Chapter and Lesson accordions
 * - Guest cannot start learning (triggers onOpenLockModal on "เริ่มเรียน", "เริ่มบทเรียน", "เริ่ม Episode", "เข้าเรียน")
 * - Enrolled Student can click to start/continue learning
 * - Un-enrolled Student is prompted to join first
 * - Empty states for chapters, lessons, and episodes without breaking
 */
function StandardLessonsSection({
  lessons = [],
  classroomId,
  isOwnerOrAdmin,
  isEnrolled,
  isGuest = false,
  onOpenLockModal,
  onOpenAddLessonModal,
  onDeleteLesson,
}) {
  // Track open/collapsed state of chapters and lessons (default open)
  const [collapsedItems, setCollapsedItems] = useState({});

  const toggleCollapse = (id) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) return `${mins} นาที ${secs} วินาที`;
    if (mins > 0) return `${mins} นาที`;
    return `${secs} วินาที`;
  };

  // Helper to render an Episode item
  const renderEpisodeItem = (ep, parentLessonId) => {
    const epId = ep.episode_id || ep.id;
    const durationText = formatDuration(ep.duration_seconds);

    return (
      <div
        key={epId}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-white border border-[#E5E9E7] hover:border-[#ABD1C6] transition shadow-2xs"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ABD1C6]/30 text-[#004643] text-xs font-bold font-mono">
            #{ep.sequence_no}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm text-[#26332F] truncate">
                {ep.title}
              </span>
              {ep.status && ep.status !== "active" && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 font-medium">
                  {ep.status}
                </span>
              )}
            </div>
            {ep.description && (
              <p className="text-[11px] text-[#6B7773] line-clamp-1 mt-0.5">
                {ep.description}
              </p>
            )}
            {durationText && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#6B7773] mt-0.5">
                <LuClock className="h-3 w-3 text-[#004643]" aria-hidden="true" />
                <span>{durationText}</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Button for Episode */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isGuest ? (
            <button
              type="button"
              onClick={() => onOpenLockModal?.(ep.title)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#ABD1C6] bg-white px-3 py-1.5 text-xs font-semibold text-[#004643] hover:bg-[#004643] hover:text-white transition cursor-pointer shadow-2xs"
            >
              <LuLock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>เริ่ม Episode</span>
            </button>
          ) : isEnrolled ? (
            ep.is_locked ? (
              <span
                title="ต้องผ่านบทเรียนก่อนหน้าก่อนเข้าเรียน"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 cursor-not-allowed"
              >
                <LuLock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>ล็อก</span>
              </span>
            ) : (
              <Link
                to={`/classrooms/${classroomId}/lessons/${parentLessonId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#004643] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#003835] transition shadow-2xs"
              >
                <LuCirclePlay className="h-3.5 w-3.5" aria-hidden="true" />
                <span>เข้าเรียน</span>
              </Link>
            )
          ) : (
            <span className="text-[11px] text-gray-400 italic">
              ต้องลงทะเบียนเรียน
            </span>
          )}
        </div>
      </div>
    );
  };

  // Helper to render a Lesson (which may contain episodes)
  const renderLessonItem = (lesson, chIndex) => {
    const lessonId = lesson.lesson_id || lesson.id;
    const isCollapsed = Boolean(collapsedItems[lessonId]);
    const episodes = lesson.episodes || [];

    return (
      <div
        key={lessonId}
        className="rounded-2xl border border-[#E5E9E7] bg-[#FAFAFA] overflow-hidden transition shadow-2xs"
      >
        {/* Lesson Header */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => toggleCollapse(lessonId)}
              className="p-1 text-[#6B7773] hover:text-[#26332F] transition cursor-pointer shrink-0"
              aria-label="Toggle lesson"
            >
              {isCollapsed ? (
                <LuChevronRight className="h-4 w-4" />
              ) : (
                <LuChevronDown className="h-4 w-4" />
              )}
            </button>

            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 font-mono text-xs font-bold text-gray-700">
              #{lesson.sequence_no ?? chIndex + 1}
            </span>

            <div className="min-w-0 flex-1">
              <h4
                onClick={() => toggleCollapse(lessonId)}
                className="text-sm font-bold text-[#26332F] truncate cursor-pointer hover:text-[#004643] transition"
              >
                {lesson.title}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#6B7773] mt-0.5">
                <span>
                  {episodes.length > 0
                    ? `${episodes.length} ตอนย่อย`
                    : "ไม่มีตอนย่อย"}
                </span>
                {lesson.description && (
                  <span className="hidden sm:inline text-gray-400 truncate max-w-md">
                    • {lesson.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isGuest ? (
              <button
                type="button"
                onClick={() => onOpenLockModal?.(lesson.title)}
                className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-[#004643] hover:bg-[#ABD1C6]/30 transition cursor-pointer"
              >
                <LuLock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>เริ่มบทเรียน</span>
              </button>
            ) : isEnrolled ? (
              lesson.is_locked ? (
                <span
                  title="ต้องผ่านบทเรียนก่อนหน้าก่อนเข้าเรียน"
                  className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 cursor-not-allowed"
                >
                  <LuLock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ล็อก</span>
                </span>
              ) : (
                <Link
                  to={`/classrooms/${classroomId}/lessons/${lessonId}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#004643] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#003835] transition shadow-2xs"
                >
                  <LuCirclePlay className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>เข้าเรียน</span>
                </Link>
              )
            ) : null}

            {isOwnerOrAdmin && (
              <div className="flex items-center gap-1">
                <Link
                  to={`/classrooms/${classroomId}/manage`}
                  className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 font-semibold shadow-2xs"
                  title="จัดการเนื้อหาในบทเรียนนี้"
                >
                  <LuListTree className="h-3.5 w-3.5 inline mr-1" />
                  <span>จัดการ</span>
                </Link>
                {onDeleteLesson && (
                  <button
                    onClick={() => onDeleteLesson(lessonId)}
                    type="button"
                    className="rounded-xl px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50 font-semibold cursor-pointer"
                  >
                    ลบ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Episodes List (when expanded) */}
        {!isCollapsed && (
          <div className="p-3 sm:p-4 space-y-2.5 bg-[#FAFAFA]">
            {episodes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-500">
                ยังไม่มีตอนย่อยในบทเรียนนี้
              </div>
            ) : (
              episodes.map((ep) => renderEpisodeItem(ep, lessonId))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Lesson Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#26332F]">โครงสร้างหลักสูตรและบทเรียน</h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            {lessons.length > 0
              ? `ทั้งหมด ${lessons.length} บทเรียน`
              : "ยังไม่มีบทเรียนในคอร์สนี้"}
          </p>
        </div>
        {isOwnerOrAdmin && (
          <button
            onClick={onOpenAddLessonModal}
            type="button"
            className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9] cursor-pointer shadow-2xs transition"
          >
            + เพิ่มบทเรียน (Add Lesson)
          </button>
        )}
      </div>

      {/* Empty State for Course with No Lessons */}
      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#ABD1C6] bg-white p-12 text-center space-y-3 shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-[#ABD1C6]/20 text-[#004643] flex items-center justify-center mx-auto">
            <LuBookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-[#26332F]">
              ยังไม่มีบทเรียนในคอร์สนี้
            </h4>
            <p className="text-xs text-[#6B7773] max-w-sm mx-auto leading-relaxed">
              {isOwnerOrAdmin
                ? "กดปุ่ม '+ เพิ่มบทเรียน' ด้านบนเพื่อเริ่มต้นสร้างเนื้อหาแรก"
                : "เนื้อหาบทเรียนกำลังอยู่ระหว่างการจัดเตรียมจากผู้สอน"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((item, idx) => {
            // Check if item is a Chapter containing child lessons (Multi-level Chapter -> Lesson -> Episode)
            if (item.lessons && Array.isArray(item.lessons)) {
              const chapterId = item.chapter_id || item.id || `ch-${idx}`;
              const isChapterCollapsed = Boolean(collapsedItems[chapterId]);
              const childLessons = item.lessons || [];

              return (
                <div
                  key={chapterId}
                  className="rounded-3xl border border-[#ABD1C6]/60 bg-white overflow-hidden shadow-2xs space-y-2 p-4"
                >
                  <div
                    onClick={() => toggleCollapse(chapterId)}
                    className="flex items-center justify-between cursor-pointer border-b border-gray-100 pb-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#004643] text-white text-[11px] font-bold">
                        {item.sequence_no ?? idx + 1}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-[#26332F]">
                        {item.title}
                      </h3>
                      <span className="text-xs text-[#6B7773]">
                        ({childLessons.length} บท)
                      </span>
                    </div>
                    <button type="button" className="p-1 text-gray-500">
                      {isChapterCollapsed ? (
                        <LuChevronRight className="h-4 w-4" />
                      ) : (
                        <LuChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {!isChapterCollapsed && (
                    <div className="space-y-3 pt-2">
                      {childLessons.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-500">
                          ยังไม่มีบทเรียนในบทนี้
                        </div>
                      ) : (
                        childLessons.map((l, lIdx) => renderLessonItem(l, lIdx))
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Normal Lesson -> Episode hierarchy
            return renderLessonItem(item, idx);
          })}
        </div>
      )}
    </div>
  );
}

export default StandardLessonsSection;
