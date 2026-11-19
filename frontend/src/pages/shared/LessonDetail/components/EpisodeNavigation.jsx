import { Link } from "react-router-dom";
import { LuPartyPopper, LuCheck, LuSparkles } from "react-icons/lu";

/**
 * EpisodeNavigation Component
 * Previous and Next episode navigation controls for IoT 101 curriculum,
 * with mission completion action.
 */
function EpisodeNavigation({
  episodeData,
  isCompleted = false,
  onCompleteMission,
}) {
  if (!episodeData) return null;

  return (
    <div className="mt-8 space-y-4 pt-6 border-t border-gray-200">
      {/* Complete Mission Action Bar */}
      {onCompleteMission && !isCompleted && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-emerald-950">
            <LuSparkles className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>พร้อมบันทึกความก้าวหน้าและปลดล็อกอุปกรณ์ประจำตอนนี้หรือยัง?</span>
          </div>

          <button
            type="button"
            onClick={onCompleteMission}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 transition cursor-pointer"
          >
            <LuCheck className="h-4 w-4" />
            <span>ทำภารกิจสำเร็จแล้ว</span>
          </button>
        </div>
      )}

      {/* Prev / Next Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {episodeData.prevEpisode ? (
          <Link
            to={`/classrooms/iot-101/lessons/${episodeData.prevEpisode.id}`}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs w-full sm:w-auto justify-center sm:justify-start"
          >
            <span>←</span>
            <span>
              ตอนก่อนหน้า:{" "}
              <b className="text-gray-900">
                {episodeData.prevEpisode.code} {episodeData.prevEpisode.title}
              </b>
            </span>
          </Link>
        ) : (
          <Link
            to="/classrooms/iot-101"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs w-full sm:w-auto justify-center sm:justify-start"
          >
            <span>←</span>
            <span>กลับไปหน้ารายละเอียดคอร์ส</span>
          </Link>
        )}

        {episodeData.nextEpisode ? (
          <Link
            to={`/classrooms/iot-101/lessons/${episodeData.nextEpisode.id}`}
            className="flex items-center gap-2 rounded-xl bg-[#004643] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#003835] transition shadow-xs w-full sm:w-auto justify-center sm:justify-end"
          >
            <span>
              ตอนถัดไป:{" "}
              <b>
                {episodeData.nextEpisode.code} {episodeData.nextEpisode.title}
              </b>
            </span>
            <span>→</span>
          </Link>
        ) : (
          <Link
            to="/classrooms/iot-101"
            className="flex items-center gap-2 rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#20302C] hover:bg-[#9CC5B9] transition shadow-xs w-full sm:w-auto justify-center sm:justify-end"
          >
            <span className="inline-flex items-center gap-1.5">
              <span>จบคอร์ส IoT 101</span>
              <LuPartyPopper className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>→</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default EpisodeNavigation;
