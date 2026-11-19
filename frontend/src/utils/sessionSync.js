/**
 * sessionSync.js
 * Multi-Tab Session Synchronization Utility (UAT-037)
 * รองรับการซิงค์สถานะ Session ระหว่างแท็บด้วย BroadcastChannel และ StorageEvent
 * 
 * รองรับ:
 * Case 1: Tab A Logout -> Tab B รับรู้และออกจากระบบตามทันที
 * Case 2: Tab A Session Timeout -> Tab B ได้รับแจ้งเตือน Session Timeout
 * Case 3: Token ถูกลบใน Storage -> Tab อื่นตรวจพบและล้างสถานะ
 * Case 4: Session Warning กำลังแสดง -> การ Logout/Timeout/Extend จากอีกแท็บจะหยุด Warning ทันที
 * Case 5: ป้องกัน Infinite Loop ระหว่างแท็บด้วย Unique Source Tab ID
 */

const CHANNEL_NAME = "elearning_session_sync";
const STORAGE_SYNC_KEY = "elearning_session_sync_event";

// สร้าง ID เฉพาะประจำแท็บนี้ (Tab Instance Identifier)
export const currentTabId =
  typeof window !== "undefined"
    ? `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    : "server";

let broadcastChannel = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn("BroadcastChannel initialization skipped:", err);
  }
}

/**
 * ส่ง Event แจ้งเตือนไปยังแท็บอื่น ๆ ทั้งหมด
 * @param {string} type - ประเภท Event เช่น 'LOGOUT', 'TIMEOUT', 'EXTEND', 'LOGIN'
 * @param {object} payload - ข้อมูลประกอบเพิ่มเติม
 */
export function broadcastSessionEvent(type, payload = {}) {
  const event = {
    type,
    payload,
    sourceTabId: currentTabId,
    timestamp: Date.now(),
  };

  // 1. ส่งผ่าน BroadcastChannel (ทำงานทันทีในเบราว์เซอร์สมัยใหม่)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (err) {
      console.warn("BroadcastChannel postMessage error:", err);
    }
  }

  // 2. ส่งผ่าน LocalStorage เพื่อจุดชนวน StorageEvent ไปยังแท็บอื่น ๆ
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(event));
    } catch (e) {
      void e;
    }
  }
}

/**
 * ลงทะเบียนดักฟัง Session Event จากแท็บอื่น ๆ
 * @param {Function} callback - ฟังก์ชันรับข้อมูล Event
 * @returns {Function} ฟังก์ชันสำหรับยกเลิกการดักฟัง (Unsubscribe)
 */
export function onSessionEvent(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  // ตัวจัดการสำหรับ BroadcastChannel
  const handleBroadcast = (event) => {
    const data = event.data;
    if (!data || data.sourceTabId === currentTabId) {
      return; // ป้องกันการรับ Event ของตัวเอง (Infinite Loop Prevention)
    }
    callback(data);
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleBroadcast);
  }

  // ตัวจัดการสำหรับ StorageEvent
  const handleStorage = (event) => {
    // ก) ได้รับ Event จากแท็บอื่นผ่าน STORAGE_SYNC_KEY
    if (event.key === STORAGE_SYNC_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data.sourceTabId === currentTabId) {
          return; // ป้องกันการวนซ้ำ
        }
        callback(data);
      } catch (e) {
        void e;
      }
    }
    // ข) ตรวจพบ Token หรือ AccessToken ถูกลบออกจาก Storage โดยตรง (Case 3)
    else if ((event.key === "token" || event.key === "accessToken") && !event.newValue) {
      callback({
        type: "TOKEN_REMOVED",
        payload: { key: event.key },
        sourceTabId: "storage_direct",
        timestamp: Date.now(),
      });
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleBroadcast);
    }
    window.removeEventListener("storage", handleStorage);
  };
}
