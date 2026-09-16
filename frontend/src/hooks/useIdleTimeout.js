import { useState, useEffect, useRef, useCallback } from "react";
import useAuthStore from "../store/useAuthStore";
import adminService from "../services/adminService";

// ======================================================
// useIdleTimeout Hook (จัดการ Session Timeout และ Guest Timeout)
// รองรับ UAT-015, UAT-020, UAT-035:
// - ดึงค่าตั้งเวลา Dynamic Timeout จาก Backend (/settings/public)
// - แจ้งเตือนเมื่อใกล้หมดเวลา (Warning Countdown Dialog)
// - สำหรับ Guest แจ้งเตือนเมื่อหมดเวลาดูตัวอย่างฟรี (Guest Limit Dialog)
// ======================================================

export function useIdleTimeout() {
  const { isAuthenticated, logout } = useAuthStore();

  const [settings, setSettings] = useState({
    session_timeout_minutes: 15,
    guest_timeout_minutes: 10,
    warning_countdown_seconds: 120,
  });

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [isGuestTimeout, setIsGuestTimeout] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const guestStartRef = useRef(Date.now());

  // 1. โหลดการตั้งค่า Timeout จาก Backend
  useEffect(() => {
    adminService
      .getPublicSettings()
      .then((data) => {
        if (data) {
          setSettings({
            session_timeout_minutes: data.session_timeout_minutes || 15,
            guest_timeout_minutes: data.guest_timeout_minutes || 10,
            warning_countdown_seconds: data.warning_countdown_seconds || 120,
          });
        }
      })
      .catch(() => {
        // ใช้ค่าเริ่มต้นหากเชื่อมต่อไม่สำเร็จ
      });
  }, []);

  // 2. ดักฟังการขยับของผู้ใช้ (User Activity Listeners)
  const resetUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningOpen) {
      setIsWarningOpen(false);
    }
  }, [isWarningOpen]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

    const handleActivity = () => {
      // อัปเดตเฉพาะเมื่อยังไม่เปิดกล่องเตือน (หากเปิดกล่องเตือนแล้ว ผู้ใช้ต้องกดปุ่มยืนยัน)
      if (!isWarningOpen) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [isWarningOpen]);

  // 3. ตัวจับเวลาตรวจสอบสถานะทุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      if (isAuthenticated) {
        // --- ส่วนของผู้ใช้ที่ล็อกอินแล้ว (Session Idle Timeout) ---
        const totalSessionMs = settings.session_timeout_minutes * 60 * 1000;
        const warningMs = settings.warning_countdown_seconds * 1000;
        const idleMs = now - lastActivityRef.current;

        if (idleMs >= totalSessionMs) {
          // หมดเวลาจริง -> ออกจากระบบ
          setIsWarningOpen(false);
          logout();
          window.location.href = "/login?expired=true";
        } else if (idleMs >= totalSessionMs - warningMs) {
          // เข้าสู่ช่วงนับถอยหลังเตือน
          const remainingSeconds = Math.max(
            1,
            Math.ceil((totalSessionMs - idleMs) / 1000)
          );
          setCountdown(remainingSeconds);
          setIsWarningOpen(true);
        } else {
          setIsWarningOpen(false);
        }
      } else {
        // --- ส่วนของ Guest ที่ยังไม่ได้ล็อกอิน (Guest Preview Timeout) ---
        const totalGuestMs = settings.guest_timeout_minutes * 60 * 1000;
        const guestElapsed = now - guestStartRef.current;

        if (guestElapsed >= totalGuestMs) {
          setIsGuestTimeout(true);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, settings, logout]);

  // ฟังก์ชันสำหรับกดยืดเวลาใช้งานต่อ (Extend Session)
  const extendSession = () => {
    lastActivityRef.current = Date.now();
    setIsWarningOpen(false);
  };

  const closeGuestModal = () => {
    // รีเซ็ตเวลาให้ Guest ดูต่อได้อีกรอบ
    guestStartRef.current = Date.now();
    setIsGuestTimeout(false);
  };

  return {
    isWarningOpen,
    countdown,
    extendSession,
    isGuestTimeout,
    closeGuestModal,
    settings,
  };
}

export default useIdleTimeout;
