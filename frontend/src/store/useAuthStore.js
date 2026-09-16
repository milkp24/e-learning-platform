import { create } from "zustand";
import authService from "../services/authService";

// ======================================================
// Auth Store (Zustand State Management)
// ======================================================
// Store ตัวนี้เป็นศูนย์กลางในการเก็บสถานะการเข้าสู่ระบบและข้อมูลผู้ใช้
// เพื่อให้ Component ทุกตัวในระบบสามารถเข้าถึงและใช้งานร่วมกันได้
// โดยอ่าน Token เริ่มต้นจาก localStorage เพื่อให้คงสถานะไว้เมื่อผู้ใช้ Refresh หน้าเว็บ

const savedToken = localStorage.getItem("token");
let savedUser = null;
try {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    savedUser = JSON.parse(userJson);
  }
} catch {
  savedUser = null;
}

export const useAuthStore = create((set, get) => ({
  // State เก็บข้อมูลผู้ใช้ปัจจุบัน (user_id, email, status, profile, role, roles)
  user: savedUser,

  // State เก็บ Role หลักของผู้ใช้ (student, instructor, admin)
  role: savedUser?.role || (savedUser?.roles && savedUser.roles[0]) || null,

  // State เก็บ JWT Token สำหรับใช้ยืนยันตัวตนกับ Backend (รองรับทั้ง token และ accessToken)
  token: savedToken || null,
  accessToken: savedToken || null,

  // สถานะว่าผู้ใช้ Login แล้วหรือไม่ (คำนวณจากความมีอยู่ของ Token)
  isAuthenticated: !!savedToken,

  // สถานะการโหลดข้อมูลของคำสั่งต่าง ๆ
  isLoading: false,

  // ข้อความแจ้งเตือนเมื่อเกิดข้อผิดพลาด
  error: null,

  // ====================================================
  // Actions
  // ====================================================

  // เข้าสู่ระบบ (Login) - UAT-011
  // ส่ง email และ password ไปตรวจสอบที่ Backend (POST /api/v1/auth/login)
  // เมื่อสำเร็จ:
  // 1. บันทึก Token ลงใน localStorage
  // 2. บันทึก User Object ลงใน localStorage (ไม่มีรหัสผ่านเด็ดขาด)
  // 3. อัปเดต State (isAuthenticated, user, role, token, accessToken) ใน Zustand
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      const { access_token, user } = data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      const userRole = user?.role || (user?.roles && user.roles[0]) || "student";

      set({
        token: access_token,
        accessToken: access_token,
        user: user,
        role: userRole,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user, role: userRole };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง";

      set({
        isLoading: false,
        error: errorMsg,
      });

      return { success: false, error: errorMsg };
    }
  },

  // สมัครสมาชิกใหม่ (Register) - UAT-010
  // ส่ง email, password, displayName ไปยัง Backend (POST /api/v1/auth/register)
  // Backend จะทำการตรวจสอบ, แฮชรหัสผ่าน และกำหนด Role 'student'
  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(email, password, displayName);
      set({ isLoading: false, error: null });
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      // ดึง Error Message จาก Backend เช่น 409 Conflict (อีเมลซ้ำ) หรือ 400 Bad Request
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูล";

      set({
        isLoading: false,
        error: errorMsg,
      });

      return { success: false, error: errorMsg };
    }
  },

  // ออกจากระบบ (Logout) - UAT-013
  // 1. เรียก API POST /api/v1/auth/logout เพื่อแจ้ง Backend ให้เพิกถอน Token (Revoke) ในฐานข้อมูล
  // 2. ล้าง Token และ User ออกจาก localStorage
  // 3. รีเซ็ต Authentication State ใน Zustand กลับเป็นค่าเริ่มต้น (isAuthenticated: false)
  // 4. หาก API ฝั่งเซิร์ฟเวอร์ล้มเหลว ยังคงรับประกันการล้างสถานะในเครื่อง (Safe Client Cleanup)
  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      // แม้ API จะเกิดข้อผิดพลาด ยังคงต้องล้างข้อมูลในเครื่องต่อไปเพื่อความปลอดภัยของผู้ใช้
      console.warn("Logout API returned error or network unreachable:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({
        user: null,
        role: null,
        token: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // ล้างข้อมูลและสถานะการยืนยันตัวตนทั้งหมดเมื่อ Session หมดอายุ (UAT-015)
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("user_role");
    set({
      user: null,
      role: null,
      token: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // ดึงข้อมูลผู้ใช้ปัจจุบันล่าสุดจาก Backend (GET /users/me)
  // ใช้เพื่อ Refresh ข้อมูล Profile และ Roles ให้เป็นปัจจุบันที่สุด
  fetchCurrentUser: async () => {
    if (!get().token) return;
    try {
      const data = await authService.getMe();
      if (data && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        const userRole = data.user?.role || (data.user?.roles && data.user.roles[0]) || null;
        set({ user: data.user, role: userRole });
      }
    } catch (err) {
      // หากดึงไม่สำเร็จเนื่องจาก Unauthorized (401 - Invalid/Expired/Revoked Token)
      // ให้ล้างสถานะการเข้าสู่ระบบทันที เพื่อไม่ให้ถือว่าผู้ใช้ยัง Authenticated อยู่ (UAT-014, UAT-015)
      if (err.response?.status === 401) {
        get().clearAuth();
      }
    }
  },

  // แก้ไขข้อมูลโปรไฟล์ (display_name, profile_image)
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateProfile(profileData);
      if (data && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        set({ user: data.user, isLoading: false });
      }
      return { success: true };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "อัปเดตโปรไฟล์ไม่สำเร็จ";
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Helper ตรวจสอบว่าผู้ใช้ปัจจุบันมี Role ตามที่ระบุหรือไม่
  // ใช้สำหรับควบคุมการแสดงผลของ UI เท่านั้น (Backend เป็นตัวตรวจความปลอดภัยจริง)
  hasRole: (roleName) => {
    const { user } = get();
    if (!user || !user.roles) return false;
    return user.roles.some(
      (r) => String(r).toLowerCase() === String(roleName).toLowerCase()
    );
  },
}));

export default useAuthStore;
