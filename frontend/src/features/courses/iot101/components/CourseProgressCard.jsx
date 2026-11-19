import { Link } from "react-router-dom";
import { LuClock, LuCheck, LuArrowRight, LuLock, LuSparkles } from "react-icons/lu";
import useIoT101Store from "../../../../store/useIoT101Store";
import { IOT_101_CHAPTERS } from "../../../../data/iot101Data";

/**
 * CourseProgressCard Component
 * แสดง Visual Progress ของหลักสูตร IoT 101:
 * - แถบความคืบหน้า (Progress Bar)
 * - Chapter และ Episode ปัจจุบัน
 * - สถานะตอนที่สำเร็จแล้ว vs ล็อกอยู่
 */
function CourseProgressCard({ className = "" }) {
  const { completedEpisodes, currentEpisodeId } = useIoT101Store();

  const totalEpisodes = IOT_101_CHAPTERS.reduce(
    (sum, ch) => sum + ch.episodes.length,
    0
  );
  const completedCount = completedEpisodes.length;
  const progressPercent = Math.min(
    Math.round((completedCount / totalEpisodes) * 100),
    100
  );

  return (
    <div
      className={`rounded-3xl border border-[#004643] bg-gradient-to-r from-[#004643] via-[#003835] to-[#26332F] p-6 sm:p-7 text-white shadow-md ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ABD1C6]/20 px-3 py-1 text-xs font-bold text-[#ABD1C6]">
              <LuSparkles className="h-3.5 w-3.5" />
              <span>ความก้าวหน้าการเรียนรู้</span>
            </span>
            <span className="text-xs text-gray-300">
              {completedCount} จาก {totalEpisodes} ตอนสำเร็จแล้ว
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            IoT 101 — ภารกิจปลุกเมืองให้ฉลาด
          </h3>

          <p className="text-xs sm:text-sm text-gray-300">
            ตอนปัจจุบัน:{" "}
            <span className="font-extrabold text-[#ABD1C6]">
              {currentEpisodeId ? currentEpisodeId.toUpperCase() : "EP 1.2"}
            </span>{" "}
            • เรียนรู้การต่อวงจรและอ่านค่าจากเซนเซอร์สู่ระบบอัตโนมัติ
          </p>

          {/* Visual Progress Bar */}
          <div className="pt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-300">ความคืบหน้าภาพรวม:</span>
              <span className="font-mono text-[#ABD1C6] text-sm font-extrabold">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ABD1C6] to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch md:items-end gap-3 shrink-0">
          <Link
            to={`/classrooms/iot-101/lessons/${currentEpisodeId || "ep-1-2"}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#ABD1C6] px-6 py-3.5 text-sm font-black text-[#20302C] shadow-md hover:bg-[#9CC5B9] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
          >
            <span>เรียนต่อทันที</span>
            <LuArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center justify-center gap-3 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <LuCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{completedCount} สำเร็จ</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <LuClock className="h-3.5 w-3.5 text-[#ABD1C6]" />
              <span>1 กำลังเรียน</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <LuLock className="h-3.5 w-3.5 text-gray-400" />
              <span>{totalEpisodes - completedCount - 1} ยังไม่ปลดล็อก</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseProgressCard;
