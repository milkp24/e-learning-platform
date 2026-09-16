import React, { useState, useEffect } from "react";
import adminService from "../services/adminService";

// ======================================================
// AdminSettings Component (หน้าตั้งค่าระบบสำหรับ Admin)
// รองรับ UAT-015, UAT-020, UAT-035:
// - ปรับเวลา Session Idle Timeout (นาที)
// - ปรับเวลา Guest Preview Timeout (นาที)
// - ปรับเวลานับถอยหลังแจ้งเตือน Warning Countdown (วินาที)
// ======================================================

function AdminSettings() {
  const [sessionTimeout, setSessionTimeout] = useState("15");
  const [guestTimeout, setGuestTimeout] = useState("10");
  const [warningCountdown, setWarningCountdown] = useState("120");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminService.getSettings();
      const map = {};
      data.settings?.forEach((s) => {
        map[s.key] = s.value;
      });

      if (map.session_timeout_minutes) setSessionTimeout(map.session_timeout_minutes);
      if (map.guest_timeout_minutes) setGuestTimeout(map.guest_timeout_minutes);
      if (map.warning_countdown_seconds) setWarningCountdown(map.warning_countdown_seconds);
    } catch {
      setError("ไม่สามารถดึงค่าการตั้งค่าจากระบบได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await adminService.updateSettings({
        session_timeout_minutes: String(sessionTimeout),
        guest_timeout_minutes: String(guestTimeout),
        warning_countdown_seconds: String(warningCountdown),
      });

      setMessage("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว การตั้งค่าใหม่จะมีผลทันที");
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-extrabold text-gray-900">
          ⚙️ การตั้งค่าระบบ (System Settings)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ปรับแต่งค่าความปลอดภัย เวลาหมดอายุเซสชัน และระยะเวลาการทดลองดูเนื้อหา
        </p>
      </div>

      {message && (
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-sm text-gray-500">
          กำลังโหลดการตั้งค่าระบบ...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              ⏱️ การตั้งค่าเวลาหมดอายุ (Dynamic Timeout Settings)
            </h2>

            {/* Session Timeout */}
            <div>
              <label className="block text-sm font-bold text-gray-800">
                Session Idle Timeout (นาที)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                ระยะเวลาที่ผู้ใช้ล็อกอินแล้วไม่มีการเคลื่อนไหว ก่อนที่ระบบจะออกจากระบบอัตโนมัติ (UAT-015)
              </p>
              <input
                type="number"
                min="1"
                max="1440"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                required
                className="w-full max-w-xs rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
              />
            </div>

            {/* Warning Countdown */}
            <div>
              <label className="block text-sm font-bold text-gray-800">
                Warning Countdown (วินาที)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                ระยะเวลานับถอยหลังในกล่องแจ้งเตือนก่อนที่เซสชันจะหมดอายุจริง (UAT-015)
              </p>
              <input
                type="number"
                min="10"
                max="600"
                value={warningCountdown}
                onChange={(e) => setWarningCountdown(e.target.value)}
                required
                className="w-full max-w-xs rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
              />
            </div>

            {/* Guest Timeout */}
            <div>
              <label className="block text-sm font-bold text-gray-800">
                Guest Preview Timeout (นาที)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                ระยะเวลาที่ผู้เยี่ยมชม (ยังไม่ล็อกอิน) สามารถทดลองดูตัวอย่างคอร์สได้ฟรี (UAT-020)
              </p>
              <input
                type="number"
                min="1"
                max="120"
                value={guestTimeout}
                onChange={(e) => setGuestTimeout(e.target.value)}
                required
                className="w-full max-w-xs rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#004643] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#003835] active:scale-98 disabled:opacity-50 transition"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdminSettings;
