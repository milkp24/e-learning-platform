import axios from "axios";

// ======================================================
// API Client (Axios Instance)
// ======================================================
// รองรับ UAT-011, UAT-012, UAT-013:
// - withCredentials: true เพื่อให้ส่ง Cookie (refresh_token) ไปกับ Request อัตโนมัติ
// - Silent Refresh Interceptor เมื่อ Access Token หมดอายุ (401)
// ======================================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// ======================================================
// Request Interceptor
// ======================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// Response Interceptor (Silent Refresh Token & Session Expiry)
// ======================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * ฟังก์ชันจัดการเมื่อการยืนยันตัวตนล้มเหลว (Token หมดอายุ / เพิกถอน / ไม่มีสิทธิ์)
 * ล้างข้อมูล Authentication ทั้งหมดและนำทางไปยังหน้า Login โดยไม่เกิด Redirect Loop
 */
const handleAuthFailure = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("user_role");

  // ล้าง Zustand Auth State แบบ Dynamic Import เพื่อหลีกเลี่ยง Circular Dependency
  import("../store/useAuthStore")
    .then(({ default: useAuthStore, useAuthStore: namedStore }) => {
      const store = namedStore || useAuthStore;
      store?.getState()?.clearAuth?.();
    })
    .catch(() => {});

  // ป้องกัน Redirect Loop: ตรวจสอบว่าไม่ได้อยู่ที่หน้า Login หรือ Register อยู่แล้ว
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/register"
  ) {
    window.location.href = "/login?expired=true";
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // หากได้รับการตอบกลับ 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // 1. กรณี Login ผิดพลาด หรือเปลี่ยนรหัสผ่าน ไม่ต้องดักจับหรือ Redirect ปล่อยให้ Form แสดงข้อความเตือน
      if (
        originalRequest?.url?.includes("/auth/login") ||
        originalRequest?.url?.includes("/auth/change-password")
      ) {
        return Promise.reject(error);
      }

      // 1b. หากผู้ใช้ไม่ได้ Login อยู่แล้ว (Guest ที่ไม่มี Token) ให้ reject ตามปกติ ไม่ต้อง redirect loop ไปยัง login
      const currentToken =
        localStorage.getItem("token") || localStorage.getItem("accessToken");
      if (!currentToken) {
        return Promise.reject(error);
      }

      // 2. กรณีคำขอ Refresh เอง หรือคำขอที่ retry ซ้ำแล้วยังได้ 401
      // ถือว่า Session หมดอายุอย่างสมบูรณ์ ล้างข้อมูลและ Redirect
      if (
        originalRequest?._retry ||
        originalRequest?.url?.includes("/auth/refresh")
      ) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      // 3. หากอยู่ระหว่างการ Refresh คำขออื่น ให้เข้าคิวรอ Token ใหม่
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // พยายามขอ Access Token ใหม่ด้วย Refresh Token (ผ่าน Cookie)
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken =
          refreshResponse.data.access_token || refreshResponse.data.accessToken;

        localStorage.setItem("token", newAccessToken);
        localStorage.setItem("accessToken", newAccessToken);

        // ซิงค์ User และ Role ล่าสุดเข้าสู่ useAuthStore ทันที
        import("../store/useAuthStore")
          .then(({ default: useAuthStore, useAuthStore: namedStore }) => {
            const store = namedStore || useAuthStore;
            store?.getState()?.handleSessionRefreshed?.(refreshResponse.data);
          })
          .catch(() => {});

        // อัปเดต Authorization Header ของ API Instance และ Request เดิม
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // การ Refresh ล้มเหลว (Refresh Token หมดอายุหรือถูกเพิกถอน)
        processQueue(refreshError, null);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
