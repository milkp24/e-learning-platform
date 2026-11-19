import { useState, useEffect, useRef } from "react";
import useAuthStore from "../store/useAuthStore";
import adminService from "../services/adminService";
import { onSessionEvent, broadcastSessionEvent } from "../utils/sessionSync";

/**
 * useIdleTimeout Hook
 * จัดการวงจรชีวิตของ Session ผู้ใช้งาน และระบบ Inactivity Detection
 * 
 * ข้อกำหนด UAT-015, UAT-017, UAT-035, UAT-037:
 * 1. สมาชิก (Authenticated User):
 *    - เมื่อไม่มี Inactivity ครบตามเวลา (ค่าเริ่มต้น 30 นาทีจาก System Settings) จะแสดง Warning Modal
 *    - มีเวลานับถอยหลัง 120 วินาที ให้ผู้ใช้เลือก "ขยายเวลา (Extend Session)" หรือ "ออกจากระบบทันที (Logout)"
 *    - หากนับถอยหลังถึง 0 ระบบจะบังคับ Logout อัตโนมัติและนำทางไปยัง /login?expired=true
 * 2. Multi-Tab Synchronization (UAT-037):
 *    - Tab A Logout -> Tab B ซิงค์ออกจากระบบทันที
 *    - Tab A Timeout -> Tab B ได้รับแจ้งเตือน Session Timeout
 *    - Token ถูกลบใน Storage -> Tab อื่นตรวจพบและล้างสถานะ
 *    - การ Logout/Timeout/Extend จากแท็บอื่นจะหยุด Warning Modal ในแท็บปัจจุบัน
 *    - ป้องกัน Infinite Loop ระหว่างแท็บ
 * 3. ผู้เข้าชมทั่วไป (Guest User):
 *    - เมื่อเปิดหน้าทิ้งไว้เกินเวลา (ค่าเริ่มต้น 15 นาที) จะแสดง Guest Timeout Modal
 */

export function useIdleTimeout() {
  // ดึงสถานะการเข้าสู่ระบบและฟังก์ชันออกจากระบบจาก Auth Store
  const { isAuthenticated, logout, clearAuth } = useAuthStore();

  // กำหนด State สำหรับเก็บค่าตั้งเวลาตาม Requirement (สมาชิก 30 นาที, Guest 15 นาที, เตือน 120 วินาที)
  const [settings, setSettings] = useState({
    session_timeout_minutes: 30,
    guest_timeout_minutes: 15,
    warning_countdown_seconds: 120,
  });

  // State ควบคุมการแสดงกล่อง Warning สำหรับสมาชิก
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  // State นับถอยหลัง (Countdown) สำหรับสมาชิก
  const [countdown, setCountdown] = useState(120);
  // State ควบคุมการแสดงกล่อง Timeout สำหรับ Guest
  const [isGuestTimeout, setIsGuestTimeout] = useState(false);
  // State ระบุว่ากำลังอยู่ในช่วง Countdown หรือไม่
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // Refs เก็บ Timestamp ล่าสุดเพื่อป้องกันปัญหา Stale Closures
  const lastActivityRef = useRef(0);
  const guestStartRef = useRef(0);
  const logoutTriggeredRef = useRef(false);

  // Refs เก็บสถานะ Active ปัจจุบันเพื่อให้ Event Listener อ่านค่าล่าสุดได้เสมอ
  const isWarningOpenRef = useRef(false);
  const isCountdownActiveRef = useRef(false);
  const isGuestTimeoutRef = useRef(false);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // ซิงค์ Refs ให้ตรงกับ State ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  useEffect(() => {
    isCountdownActiveRef.current = isCountdownActive;
  }, [isCountdownActive]);

  useEffect(() => {
    isGuestTimeoutRef.current = isGuestTimeout;
  }, [isGuestTimeout]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // 1. โหลดการตั้งค่า Timeout จาก Backend (/api/v1/settings/public)
  useEffect(() => {
    adminService
      .getPublicSettings()
      .then((data) => {
        if (data) {
          setSettings({
            session_timeout_minutes:
              data.session_timeout_minutes || 30,
            guest_timeout_minutes:
              data.guest_timeout_minutes || 15,
            warning_countdown_seconds:
              data.warning_countdown_seconds || 120,
          });
          // อัปเดตตัวนับถอยหลังตามค่าที่ได้จาก Backend หากยังไม่ได้เริ่มนับ
          if (!isCountdownActiveRef.current) {
            setCountdown(data.warning_countdown_seconds || 120);
          }
        }
      })
      .catch(() => {
        // ใช้ค่าเริ่มต้นมาตรฐาน (30 นาที, 15 นาที, 120 วินาที) หากเชื่อมต่อ Backend ไม่สำเร็จ
      });
  }, []);

  // 2. รีเซ็ตตัวจับเวลาเมื่อมีการสลับสถานะ Login / Logout
  useEffect(() => {
    lastActivityRef.current = Date.now();
    guestStartRef.current = Date.now();
    setIsWarningOpen(false);
    isWarningOpenRef.current = false;
    setIsCountdownActive(false);
    isCountdownActiveRef.current = false;
    setIsGuestTimeout(false);
    isGuestTimeoutRef.current = false;
    logoutTriggeredRef.current = false;
    setCountdown(settings.warning_countdown_seconds);
  }, [isAuthenticated, settings.warning_countdown_seconds]);

  // 2b. Multi-Tab Session Synchronization (UAT-037)
  // ซิงค์สถานะระหว่างแท็บผ่าน BroadcastChannel และ StorageEvent
  useEffect(() => {
    const unsubscribe = onSessionEvent((event) => {
      // Case 1: Tab A สั่ง Logout -> Tab B ซิงค์ออกจากระบบทันที
      if (event.type === "LOGOUT") {
        setIsCountdownActive(false);
        isCountdownActiveRef.current = false;
        setIsWarningOpen(false);
        isWarningOpenRef.current = false;
        logoutTriggeredRef.current = true;
        clearAuth();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      // Case 2: Tab A เกิด Session Timeout -> Tab B ต้องถูกแจ้ง Session Timeout
      else if (event.type === "TIMEOUT") {
        setIsCountdownActive(false);
        isCountdownActiveRef.current = false;
        setIsWarningOpen(false);
        isWarningOpenRef.current = false;
        logoutTriggeredRef.current = true;
        clearAuth();
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login?expired=true";
        }
      }
      // Case 3: Token ถูกลบใน Storage -> Tab อื่นตรวจพบและล้างสถานะ
      else if (event.type === "TOKEN_REMOVED") {
        if (isAuthenticatedRef.current) {
          setIsCountdownActive(false);
          isCountdownActiveRef.current = false;
          setIsWarningOpen(false);
          isWarningOpenRef.current = false;
          logoutTriggeredRef.current = true;
          clearAuth();
          if (typeof window !== "undefined" && window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }
      // Case 4: มีการขยายเวลา Session จากแท็บอื่น -> หยุด Warning ในแท็บนี้ทันที
      else if (event.type === "EXTEND") {
        setIsCountdownActive(false);
        isCountdownActiveRef.current = false;
        setIsWarningOpen(false);
        isWarningOpenRef.current = false;
        lastActivityRef.current = Date.now();
        setCountdown(settings.warning_countdown_seconds);
      }
    });

    return unsubscribe;
  }, [clearAuth, settings.warning_countdown_seconds]);

  // 3. ดักฟัง Event การเคลื่อนไหวของผู้ใช้ (User Activity Listeners)
  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    // ฟังก์ชันจัดการเมื่อตรวจพบการขยับของผู้ใช้
    const handleActivity = () => {
      // ตรวจสอบสถานะการล็อกอินจาก Ref ล่าสุด
      if (isAuthenticatedRef.current) {
        // สำหรับสมาชิก: รีเซ็ตเวลา Activity ล่าสุดเฉพาะเมื่อยังไม่เข้าสู่ช่วง Warning หรือ Countdown
        if (!isWarningOpenRef.current && !isCountdownActiveRef.current) {
          lastActivityRef.current = Date.now();
        }
      } else {
        // สำหรับ Guest: รีเซ็ตเวลาการใช้งานเฉพาะเมื่อยังไม่แสดง Popup Guest Timeout
        if (!isGuestTimeoutRef.current) {
          guestStartRef.current = Date.now();
        }
      }
    };

    // ลงทะเบียน Event Listeners บนหน้าจอ
    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // ยกเลิก Event Listeners เมื่อ Component Unmount
    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, []);

  // 4. ตรวจสอบสถานะ Inactivity ทุก ๆ 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();

      if (isAuthenticatedRef.current) {
        // --- ส่วนของผู้เรียนที่ Login แล้ว (Student Session Idle Timeout) ---

        // หากกำลังนับถอยหลัง Countdown ไม่ต้องตรวจสอบ Idle ซ้ำ
        if (isCountdownActiveRef.current) {
          return;
        }

        // คำนวณขีดจำกัดเวลา Timeout ตามการตั้งค่าระบบ (30 นาที)
        const totalSessionMs =
          settings.session_timeout_minutes * 60 * 1000;

        // คำนวณเวลาที่ไม่มี Activity
        const idleMs = now - (lastActivityRef.current || now);

        // หากไม่มี Activity ครบ 30 นาที ให้แสดง Warning ทันที
        if (idleMs >= totalSessionMs) {
          setCountdown(settings.warning_countdown_seconds);
          setIsCountdownActive(true);
          isCountdownActiveRef.current = true;
          setIsWarningOpen(true);
          isWarningOpenRef.current = true;
          logoutTriggeredRef.current = false;
        }
      } else {
        // --- ส่วนของ Guest ที่ยังไม่ได้ Login (Guest Timeout) ---

        // หากแสดง Popup อยู่แล้ว ไม่ต้องคำนวณซ้ำ
        if (isGuestTimeoutRef.current) {
          return;
        }

        // คำนวณขีดจำกัดเวลา Guest ตามการตั้งค่าระบบ (15 นาที)
        const totalGuestMs =
          settings.guest_timeout_minutes * 60 * 1000;

        // คำนวณเวลาที่ Guest ไม่มี Activity
        const guestElapsed = now - (guestStartRef.current || now);

        // หาก Guest ไม่มี Activity ครบ 15 นาที ให้แสดง Modal สำหรับ Login / Register
        if (guestElapsed >= totalGuestMs) {
          setIsGuestTimeout(true);
          isGuestTimeoutRef.current = true;
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  // 5. ตัวจัดการนับถอยหลัง Countdown ก่อน Logout อัตโนมัติ (120 วินาที)
  useEffect(() => {
    // หากไม่อยู่ในสถานะ Countdown ไม่ต้องเริ่ม Timer
    if (!isCountdownActive) {
      return;
    }

    const countdownTimer = setInterval(() => {
      setCountdown((currentCountdown) => {
        // เมื่อ Countdown ถึง 1 หรือน้อยกว่า ในรอบถัดไปจะกลายเป็น 0
        if (currentCountdown <= 1) {
          setIsCountdownActive(false);
          isCountdownActiveRef.current = false;
          setIsWarningOpen(false);
          isWarningOpenRef.current = false;

          // ดำเนินการ Logout และ Redirect ไปหน้า Login
          if (!logoutTriggeredRef.current) {
            logoutTriggeredRef.current = true;
            broadcastSessionEvent("TIMEOUT");
            try {
              logout();
            } catch (err) {
              console.error("Logout on timeout error:", err);
            }
            // ล้าง Token และ User ออกจาก localStorage ทันทีก่อนเปลี่ยนเส้นทาง
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login?expired=true";
          }
          return 0;
        }

        return currentCountdown - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [isCountdownActive, logout]);

  // 6. ฟังก์ชันกดยืดเวลาใช้งานต่อ (Extend Session)
  const extendSession = () => {
    // ปิดสถานะ Countdown
    setIsCountdownActive(false);
    isCountdownActiveRef.current = false;

    // ปิดกล่อง Warning ทันที
    setIsWarningOpen(false);
    isWarningOpenRef.current = false;

    // รีเซ็ตสถานะการเรียก Logout
    logoutTriggeredRef.current = false;

    // เริ่มจับเวลา Idle ใหม่ 30 นาที
    lastActivityRef.current = Date.now();

    // รีเซ็ตตัวนับถอยหลังกลับสู่ค่าเริ่มต้น
    setCountdown(settings.warning_countdown_seconds);

    // ซิงค์การยืดเวลาไปยังแท็บอื่น ๆ (Case 4)
    broadcastSessionEvent("EXTEND");
  };

  // 7. ฟังก์ชันสำหรับ Logout ทันที (Logout Now)
  const logoutNow = async () => {
    // ป้องกันการ Logout ซ้ำ
    logoutTriggeredRef.current = true;

    // ปิดสถานะ Countdown และกล่อง Warning
    setIsCountdownActive(false);
    isCountdownActiveRef.current = false;
    setIsWarningOpen(false);
    isWarningOpenRef.current = false;

    // ซิงค์คำสั่ง Logout ไปยังแท็บอื่น ๆ ทันที (Case 1)
    broadcastSessionEvent("LOGOUT");

    // สั่ง Logout จากระบบ
    try {
      await logout();
    } catch (err) {
      console.error("Manual logout error:", err);
    }

    // ล้าง localStorage และนำทางไปยังหน้า Login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // 8. ฟังก์ชันสำหรับปิด Guest Timeout Modal เพื่อดูต่อ
  const closeGuestModal = () => {
    // รีเซ็ตเวลา Guest ให้เริ่มนับ 15 นาทีใหม่อีกครั้ง
    guestStartRef.current = Date.now();

    // ปิด Popup Guest Timeout
    setIsGuestTimeout(false);
    isGuestTimeoutRef.current = false;
  };

  // 9. ส่งค่าสถานะและฟังก์ชันกลับไปให้ Component ใช้งาน
  return {
    isWarningOpen,
    countdown,
    extendSession,
    logoutNow,
    isGuestTimeout,
    closeGuestModal,
    settings,
  };
}

export default useIdleTimeout;
