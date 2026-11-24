
import { LuClock } from "react-icons/lu";
import { SETTING_LIMITS } from "../../../../utils/formValidation";

/**
 * TimeoutConfigForm Component
 * Form containing session idle, warning countdown, and guest preview timeout settings.
 */
function TimeoutConfigForm({
  sessionTimeout,
  warningCountdown,
  guestTimeout,
  onSessionTimeoutChange,
  onWarningCountdownChange,
  onGuestTimeoutChange,
  onSubmit,
  isSaving,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#26332F] flex items-center gap-2">
              <LuClock className="h-5 w-5 text-[#004643]" aria-hidden="true" />
              <span>การตั้งค่าเวลาหมดอายุ (Dynamic Timeout Settings)</span>
            </h2>
            <p className="text-xs text-[#6B7773] mt-0.5">
              ปรับระยะเวลา Inactivity Timeout และ Preview Time ของระบบ
            </p>
          </div>
          <span className="rounded-full bg-[#FAFAFA] border border-[#E5E9E7] px-3 py-1 font-mono text-xs font-bold text-[#26332F]">
            Security Policy
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Session Timeout */}
          <div className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-4 space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-[#26332F]">
              Session Idle Timeout (นาที)
            </label>
            <p className="text-[11px] text-[#6B7773] min-h-[32px]">
              ระยะเวลาที่ไม่มีการเคลื่อนไหว ก่อนออกจากระบบอัตโนมัติ
            </p>
            <input
              type="number"
              min={SETTING_LIMITS.session_timeout_minutes.min}
              max={SETTING_LIMITS.session_timeout_minutes.max}
              value={sessionTimeout}
              onChange={(e) => onSessionTimeoutChange(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Warning Countdown */}
          <div className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-4 space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-[#26332F]">
              Warning Countdown (วินาที)
            </label>
            <p className="text-[11px] text-[#6B7773] min-h-[32px]">
              เวลานับถอยหลังในกล่องแจ้งเตือนก่อนเซสชันหมดอายุจริง
            </p>
            <input
              type="number"
              min={SETTING_LIMITS.warning_countdown_seconds.min}
              max={SETTING_LIMITS.warning_countdown_seconds.max}
              value={warningCountdown}
              onChange={(e) => onWarningCountdownChange(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs"
            />
          </div>

          {/* Guest Timeout */}
          <div className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-4 space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-[#26332F]">
              Guest Preview Timeout (นาที)
            </label>
            <p className="text-[11px] text-[#6B7773] min-h-[32px]">
              ระยะเวลาที่ Guest ทดลองดูตัวอย่างคอร์สได้ฟรี
            </p>
            <input
              type="number"
              min={SETTING_LIMITS.guest_timeout_minutes.min}
              max={SETTING_LIMITS.guest_timeout_minutes.max}
              value={guestTimeout}
              onChange={(e) => onGuestTimeoutChange(e.target.value)}
              required
              className="w-full rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#26332F] focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-3 border-t border-[#E5E9E7]">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 disabled:opacity-50 transition cursor-pointer shadow-2xs"
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </div>
    </form>
  );
}


export default TimeoutConfigForm;
