import { useState, useEffect } from "react";
import adminService from "../../../services/adminService";
import SettingsHeader from "./components/SettingsHeader";
import SettingsFeedback from "./components/SettingsFeedback";
import TimeoutConfigForm from "./components/TimeoutConfigForm";
import SecurityPolicyInfoCard from "./components/SecurityPolicyInfoCard";

/**
 * Settings Page Component (Admin System Settings)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * Supports UAT-015, UAT-020, UAT-035:
 * - Session Idle Timeout (minutes)
 * - Warning Countdown (seconds)
 * - Guest Preview Timeout (minutes)
 */
function Settings() {
  const [sessionTimeout, setSessionTimeout] = useState("15");
  const [guestTimeout, setGuestTimeout] = useState("10");
  const [warningCountdown, setWarningCountdown] = useState("120");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchSettings = async () => {
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
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <SettingsHeader />

      {/* 2. Feedback Notifications */}
      <SettingsFeedback message={message} error={error} />

      {/* 3. Settings Form Card */}
      {isLoading ? (
        <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-16 text-center space-y-3 shadow-2xs">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-3 border-[#E5E9E7] border-t-[#ABD1C6]" />
          <p className="text-xs sm:text-sm font-medium text-[#6B7773]">
            กำลังโหลดการตั้งค่าระบบ...
          </p>
        </div>
      ) : (
        <TimeoutConfigForm
          sessionTimeout={sessionTimeout}
          warningCountdown={warningCountdown}
          guestTimeout={guestTimeout}
          onSessionTimeoutChange={setSessionTimeout}
          onWarningCountdownChange={setWarningCountdown}
          onGuestTimeoutChange={setGuestTimeout}
          onSubmit={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Security Info Card */}
      <SecurityPolicyInfoCard />
    </div>
  );
}

export default Settings;
