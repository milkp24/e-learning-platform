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
// Request Interceptor
// ======================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// Response Interceptor (Silent Refresh Token Mechanism)
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // หากได้ 401 และไม่ใช่คำขอ refresh หรือ login เอง
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        // หากกำลังทำการ Refresh อยู่ ให้เข้าคิวรอ Token ใหม่
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
        // พยายามขอ Access Token ใหม่ด้วย Refresh Token (ผ่าน Cookie หรือ storage)
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.access_token;
        localStorage.setItem("token", newAccessToken);

        // อัปเดต Authorization Header ของ API Instance และ Request เดิม
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // การ Refresh ล้มเหลว (Refresh Token หมดอายุหรือถูก Revoke แล้ว) - UAT-015
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("user_role");

        // ล้าง Zustand Auth State แบบ Dynamic Import เพื่อหลีกเลี่ยง Circular Dependency
        import("../store/useAuthStore")
          .then(({ useAuthStore }) => {
            useAuthStore.getState().clearAuth?.();
          })
          .catch(() => {});

        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register"
        ) {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
