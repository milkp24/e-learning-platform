import { useEffect } from "react";
// คอมโพเนนต์แจ้งเตือน Session Timeout
import TimeoutModal from "./features/auth/components/TimeoutModal";
// กล่องแจ้งเตือนเมื่อได้รับการอัปเกรดบทบาทเป็น Admin
import RoleUpgradeNotification from "./components/common/RoleUpgradeNotification";
// กล่องยืนยันกลาง (ใช้แทน window.confirm)
import GlobalConfirmDialog from "./components/common/GlobalConfirmDialog";
// Hook ตรวจจับ Inactivity useIdleTimeout
import useIdleTimeout from "./features/auth/hooks/useIdleTimeout";
import useAuthStore from "./store/useAuthStore";
// ระบบ Routing กลาง
import AppRoutes from "./app/router";

// คอมโพเนนต์หลัก App
function App() {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();

  const {
    isWarningOpen,
    countdown,
    extendSession,
    logoutNow,
    isGuestTimeout,
    closeGuestModal,
  } = useIdleTimeout();

  // ตรวจสอบและอัปเดตสิทธิ์อัตโนมัติเมื่อเปิดหน้าเว็บ (Mount) และเมื่อสลับหน้าจอกลับมา (Session Sync on Focus)
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser();
    }

    const handleSyncSession = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        fetchCurrentUser();
      }
    };

    window.addEventListener("focus", handleSyncSession);
    document.addEventListener("visibilitychange", handleSyncSession);

    return () => {
      window.removeEventListener("focus", handleSyncSession);
      document.removeEventListener("visibilitychange", handleSyncSession);
    };
  }, [isAuthenticated, fetchCurrentUser]);

  return (
    <>
      {/* กล่องแจ้งเตือนเมื่อได้รับการอัปเกรดเป็น Admin */}
      <RoleUpgradeNotification />

      {/* กล่องแจ้งเตือน Session Timeout และ Guest Timeout สำหรับทุกเส้นทาง */}
      <TimeoutModal
        isWarningOpen={isWarningOpen}
        countdown={countdown}
        onExtend={extendSession}
        onLogout={logoutNow}
        isGuestTimeout={isGuestTimeout}
        onCloseGuest={closeGuestModal}
      />

      {/* กล่องยืนยันก่อนลบ / ทำรายการสำคัญ */}
      <GlobalConfirmDialog />

      {/* เส้นทางทั้งหมดของระบบ */}
      <AppRoutes />
    </>
  );
}

export default App;
