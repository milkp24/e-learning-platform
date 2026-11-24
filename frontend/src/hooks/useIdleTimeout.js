import { useState, useEffect, useRef } from "react";
import useAuthStore from "../store/useAuthStore";
import adminService from "../services/adminService";
import authService from "../services/authService";
import { onSessionEvent, broadcastSessionEvent } from "../utils/sessionSync";

// เวลาใช้งานล่าสุดของสมาชิก (ms) ใช้ร่วมกันทุกแท็บ และอยู่รอดหลังปิดเบราว์เซอร์
const LAST_ACTIVITY_KEY = "lastActivityAt";
// เขียน localStorage ไม่ถี่เกินทุก 5 วินาที (mousemove ยิงบ่อยมาก)
const ACTIVITY_WRITE_INTERVAL_MS = 5000;

function readStoredActivity() {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeStoredActivity(timestamp) {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  } catch {
    // localStorage ใช้ไม่ได้ (เช่นโหมดส่วนตัวบางเบราว์เซอร์) ใช้ค่าในหน่วยความจำแทน
  }
}

/**
 * คำนวณช่วงของ Session จากเวลาใช้งานล่าสุด (แยกเป็นฟังก์ชันล้วนเพื่อทดสอบได้)
 * คืน { phase: "active" | "warning" | "expired", remainingSeconds }
 */
export function getSessionPhase(lastActivityAt, now, timeoutMinutes, warningSeconds) {
  const timeoutMs = Math.max(1, timeoutMinutes) * 60 * 1000;
  const warningMs = Math.min(Math.max(0, warningSeconds) * 1000, timeoutMs);
  const remainingMs = lastActivityAt + timeoutMs - now;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  if (remainingMs <= 0) return { phase: "expired", remainingSeconds: 0 };
  if (remainingMs <= warningMs) return { phase: "warning", remainingSeconds };
  return { phase: "active", remainingSeconds };
}

/**
 * useIdleTimeout Hook
 * จัดการวงจรชีวิตของ Session ผู้ใช้งาน และระบบ Inactivity Detection
 * 
 * ข้อกำหนด UAT-015, UAT-017, UAT-035, UAT-037:
 * 1. สมาชิก (Authenticated User) (ข้อ 7):
 *    - Session หมดอายุเมื่อไม่มีการใช้งานครบตามเวลาที่ตั้ง (ค่าเริ่มต้น 30 นาทีจาก System Settings)
 *    - แจ้งเตือน "ก่อน" หมดอายุ: แสดง Warning Modal เมื่อเหลือเวลา warning_countdown_seconds (ค่าเริ่มต้น 120 วินาที)
 *      ผู้ใช้เลือก "ขยายเวลา" (ขอ Access Token ใหม่จาก Backend ด้วย) หรือ "ออกจากระบบทันที"
 *    - นับถอยหลังถึง 0 = ครบเวลาที่ตั้งพอดี ระบบ Logout อัตโนมัติและนำทางไปยัง /login?expired=true
 *    - เวลาใช้งานล่าสุดเก็บใน localStorage (ใช้ร่วมกันทุกแท็บ) ปิดเบราว์เซอร์แล้วกลับมาหลังเกินเวลา
 *      จะถูก Logout ทันที ไม่ต่อ Session ให้เอง
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
    const now = Date.now();
    // สมาชิก: ใช้เวลาใช้งานล่าสุดที่เก็บไว้ (ถ้ามี) เพื่อให้เปิดหน้าใหม่แล้วยังนับต่อจากเดิม
    // ถ้าเพิ่ง Login (ไม่มีค่าเก็บไว้) เริ่มนับจากตอนนี้
    const stored = isAuthenticated ? readStoredActivity() : 0;
    lastActivityRef.current = stored || now;
    if (isAuthenticated && !stored) writeStoredActivity(now);
    guestStartRef.current = now;
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
        lastActivityRef.current = readStoredActivity() || Date.now();
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
          const now = Date.now();
          if (now - lastActivityRef.current >= ACTIVITY_WRITE_INTERVAL_MS) {
            writeStoredActivity(now);
          }
          lastActivityRef.current = now;
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

  // Logout เมื่อ Session หมดอายุ (เรียกครั้งเดียว)
  const expireSession = () => {
    setIsCountdownActive(false);
    isCountdownActiveRef.current = false;
    setIsWarningOpen(false);
    isWarningOpenRef.current = false;
    setCountdown(0);
    if (logoutTriggeredRef.current) return;
    logoutTriggeredRef.current = true;
    broadcastSessionEvent("TIMEOUT");
    try {
      logout();
    } catch (err) {
      console.error("Logout on timeout error:", err);
    }
    // ล้าง Token และ User ออกจาก localStorage ทันทีก่อนเปลี่ยนเส้นทาง
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    window.location.href = "/login?expired=true";
  };
  const expireSessionRef = useRef(expireSession);
  expireSessionRef.current = expireSession;

  // 4. ตรวจสอบสถานะ Session ทุก 1 วินาที (ข้อ 7)
  // - สมาชิก: active → warning (เหลือ warning_countdown_seconds) → expired (ครบเวลาที่ตั้ง)
  //   ตัวเลขนับถอยหลังคำนวณจากเวลาจริงทุกวินาที จึงไม่คลาดแม้แท็บถูกพักไว้
  // - Guest: ครบเวลาแสดง Modal ให้ Login / Register
  useEffect(() => {
    const tick = () => {
      const now = Date.now();

      if (isAuthenticatedRef.current) {
        // แท็บอื่นอาจมีการใช้งานล่าสุดกว่า (ยกเว้นตอนกำลังเตือน ต้องกด "ขยายเวลา" เท่านั้น)
        if (!isCountdownActiveRef.current) {
          lastActivityRef.current = Math.max(lastActivityRef.current, readStoredActivity());
        }
        const { phase, remainingSeconds } = getSessionPhase(
          lastActivityRef.current || now,
          now,
          settings.session_timeout_minutes,
          settings.warning_countdown_seconds
        );

        if (phase === "expired") {
          expireSessionRef.current();
          return;
        }
        if (phase === "warning") {
          setCountdown(remainingSeconds);
          if (!isCountdownActiveRef.current) {
            setIsCountdownActive(true);
            isCountdownActiveRef.current = true;
            setIsWarningOpen(true);
            isWarningOpenRef.current = true;
            logoutTriggeredRef.current = false;
          }
        }
      } else {
        // --- ส่วนของ Guest ที่ยังไม่ได้ Login (Guest Timeout) ---
        if (isGuestTimeoutRef.current) {
          return;
        }
        const totalGuestMs = settings.guest_timeout_minutes * 60 * 1000;
        const guestElapsed = now - (guestStartRef.current || now);
        if (guestElapsed >= totalGuestMs) {
          setIsGuestTimeout(true);
          isGuestTimeoutRef.current = true;
        }
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [settings]);

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

    // เริ่มจับเวลาใหม่ตามเวลาที่ตั้ง และบันทึกให้แท็บอื่นเห็น
    const now = Date.now();
    lastActivityRef.current = now;
    writeStoredActivity(now);

    // ขอ Access Token ใหม่ เพื่อให้ฝั่ง Backend ต่ออายุ Session ด้วย
    authService
      .refreshToken()
      .then((data) => {
        const newToken = data?.access_token || data?.accessToken;
        if (newToken) {
          localStorage.setItem("token", newToken);
          localStorage.setItem("accessToken", newToken);
        }
        useAuthStore.getState()?.handleSessionRefreshed?.(data);
      })
      .catch(() => {
        // ถ้า Refresh ไม่ได้ Interceptor ของ api.js จะพาไปหน้า Login เอง
      });

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
    localStorage.removeItem(LAST_ACTIVITY_KEY);
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
