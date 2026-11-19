
import { LuCheck, LuTriangleAlert as LuAlertTriangle } from "react-icons/lu";

/**
 * SettingsFeedback Component
 * Displays success and error feedback alerts.
 */
function SettingsFeedback({ message, error }) {
  return (
    <>
      {message && (
        <div className="rounded-[16px] bg-[#ABD1C6]/25 border border-[#ABD1C6] p-4 text-xs sm:text-sm font-semibold text-[#26332F] flex items-center gap-2.5 shadow-2xs">
          <LuCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-[16px] bg-rose-50 border border-rose-200 p-4 text-xs sm:text-sm font-semibold text-rose-700 flex items-center gap-2.5 shadow-2xs">
          <LuAlertTriangle className="h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}


export default SettingsFeedback;
