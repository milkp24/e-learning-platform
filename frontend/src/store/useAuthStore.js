import { create } from "zustand";
import authService from "../services/authService";
import { broadcastSessionEvent } from "../utils/sessionSync";

// ======================================================
// Auth Store (Zustand State Management)
// ======================================================
// Store ตัวนี้เป็นศูนย์กลางในการเก็บสถานะการเข้าสู่ระบบและข้อมูลผู้ใช้
// เพื่อให้ Component ทุกตัวในระบบสามารถเข้าถึงและใช้งานร่วมกันได้
// โดยอ่าน Token เริ่มต้นจาก localStorage เพื่อให้คงสถานะไว้เมื่อผู้ใช้ Refresh หน้าเว็บ

const savedToken = localStorage.getItem("token") || localStorage.getItem("accessToken");
let savedUser = null;
try {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    savedUser = JSON.parse(userJson);
  }
} catch {
  savedUser = null;
}

const savedRole =
  localStorage.getItem("role") ||
  savedUser?.role ||
  (savedUser?.roles && (
    savedUser.roles.includes("super_admin") ? "super_admin" :
    savedUser.roles.includes("admin") ? "admin" :
    savedUser.roles.includes("instructor") ? "instructor" :
    savedUser.roles[0]
  )) ||
  null;

let savedNotification = null;
try {
  if (typeof window !== "undefined" && window.sessionStorage) {
    const notifJson = window.sessionStorage.getItem("activeRoleNotification");
    if (notifJson) {
      savedNotification = JSON.parse(notifJson);
    }
  }
} catch {
  savedNotification = null;
}

function saveSessionNotification(notif) {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      if (notif) {
        window.sessionStorage.setItem("activeRoleNotification", JSON.stringify(notif));
      } else {
        window.sessionStorage.removeItem("activeRoleNotification");
      }
    }
  } catch (e) {
    void e;
  }
}

/**
 * Helper: สร้างข้อความ Notification ตามการเปลี่ยนบทบาท (Role Transition)
 * รองรับทุกคู่สถานะ:
 * - Student -> Instructor
 * - Student -> Admin
 * - Instructor -> Admin
 * - Admin -> Instructor
 * - Admin -> Student
 * - Instructor -> Student
 * กฎ: Super Admin ที่เป็นผู้เปลี่ยนสิทธิ์ให้ผู้อื่น ไม่ต้องได้รับ Notification
 */
export function getRoleChangeNotification(previousRole, newRole) {
  if (!previousRole || !newRole) return null;
  const prev = String(previousRole).toLowerCase().trim();
  const next = String(newRole).toLowerCase().trim();

  // หากบทบาทไม่เปลี่ยนแปลง ไม่ต้องแจ้งเตือน
  if (prev === next) return null;

  // Super Admin ไม่ต้องได้รับ Notification
  if (prev === "super_admin" || next === "super_admin") return null;

  const baseTitle = "สิทธิ์ของคุณได้รับการอัปเดตแล้ว";

  // 1. Student -> Instructor
  if (prev === "student" && next === "instructor") {
    return {
      title: baseTitle,
      subtitle: "บัญชีของคุณได้รับสิทธิ์เป็น Instructor",
      description: "ตอนนี้คุณสามารถใช้งานฟีเจอร์สำหรับผู้สอนได้แล้ว",
      targetRole: next,
      hasAdminAccess: false,
    };
  }

  // 2. Student -> Admin
  if (prev === "student" && next === "admin") {
    return {
      title: baseTitle,
      subtitle: "บัญชีของคุณได้รับสิทธิ์เป็น Admin",
      description: "ตอนนี้คุณสามารถเข้าสู่หน้าผู้ดูแลระบบเพื่อจัดการผู้ใช้ คอร์ส และระบบได้",
      targetRole: next,
      hasAdminAccess: true,
    };
  }

  // 3. Instructor -> Admin
  if (prev === "instructor" && next === "admin") {
    return {
      title: baseTitle,
      subtitle: "บัญชีของคุณได้รับสิทธิ์เป็น Admin",
      description: "ตอนนี้คุณสามารถเข้าสู่หน้าผู้ดูแลระบบเพื่อจัดการผู้ใช้ คอร์ส และระบบได้",
      targetRole: next,
      hasAdminAccess: true,
    };
  }

  // 4. Admin -> Instructor
  if (prev === "admin" && next === "instructor") {
    return {
      title: baseTitle,
      subtitle: "บัญชีของคุณได้รับการเปลี่ยนสิทธิ์เป็น Instructor",
      description: "สิทธิ์การใช้งานระบบได้รับการอัปเดตตามบทบาทใหม่ของคุณแล้ว",
      targetRole: next,
      hasAdminAccess: false,
    };
  }

  // 5. Admin -> Student
  if (prev === "admin" && next === "student") {
    return {
      title: baseTitle,
      subtitle: "บัญชีของคุณได้รับการเปลี่ยนสิทธิ์เป็น Student",
      description: "สิทธิ์การใช้งานระบบได้รับการอัปเดตตามบทบาทใหม่ของคุณแล้ว",
      targetRole: next,
      hasAdminAccess: false,
    };
  }

  // 6. Instructor -> Student
  if (prev === "instructor" && next === "student") {
    return {
      title: baseTitle,
      subtitle: "บัญชีของคุณได้รับการเปลี่ยนสิทธิ์เป็น Student",
      description: "สิทธิ์การใช้งานระบบได้รับการอัปเดตตามบทบาทใหม่ของคุณแล้ว",
      targetRole: next,
      hasAdminAccess: false,
    };
  }

  // Generic fallback สำหรับการเปลี่ยนผ่านอื่น ๆ
  const isTargetAdmin = next === "admin";
  const roleNameMap = {
    admin: "Admin",
    instructor: "Instructor",
    student: "Student",
  };
  const roleLabel = roleNameMap[next] || next;

  return {
    title: baseTitle,
    subtitle: `บัญชีของคุณได้รับการเปลี่ยนสิทธิ์เป็น ${roleLabel}`,
    description: isTargetAdmin
      ? "ตอนนี้คุณสามารถเข้าสู่หน้าผู้ดูแลระบบเพื่อจัดการผู้ใช้ คอร์ส และระบบได้"
      : "สิทธิ์การใช้งานระบบได้รับการอัปเดตตามบทบาทใหม่ของคุณแล้ว",
    targetRole: next,
    hasAdminAccess: isTargetAdmin,
  };
}

export const useAuthStore = create((set, get) => ({
  // State เก็บข้อมูลผู้ใช้ปัจจุบัน (user_id, email, status, profile, role, roles)
  user: savedUser,

  // State เก็บ Role หลักของผู้ใช้ (student, instructor, admin)
  role: savedRole,

  // State เก็บ JWT Token สำหรับใช้ยืนยันตัวตนกับ Backend (รองรับทั้ง token และ accessToken)
  token: savedToken || null,
  accessToken: savedToken || null,

  // สถานะว่าผู้ใช้ Login แล้วหรือไม่ (คำนวณจากความมีอยู่ของ Token)
  isAuthenticated: !!savedToken,

  // สถานะการโหลดข้อมูลของคำสั่งต่าง ๆ
  isLoading: false,

  // State เก็บข้อความแจ้งเตือนเมื่อได้รับการอัปเกรดบทบาทหรือเปลี่ยนบทบาท
  roleUpgradeNotification: savedNotification,

  // Actions สำหรับควบคุมกล่องแจ้งเตือนการอัปเกรดบทบาท
  dismissRoleNotification: () => {
    saveSessionNotification(null);
    set({ roleUpgradeNotification: null });
  },
  setRoleUpgradeNotification: (notification) => {
    saveSessionNotification(notification);
    set({ roleUpgradeNotification: notification });
  },

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
      const accessToken = data.access_token || data.accessToken;
      const user = data.user;

      // กำหนด Role หลักจาก Backend หรือคำนวณตามสิทธิ์จริงจาก Database (super_admin > admin > instructor > student)
      const userRole =
        user?.role ||
        data?.role ||
        (user?.roles && (
          user.roles.includes("super_admin") ? "super_admin" :
          user.roles.includes("admin") ? "admin" :
          user.roles.includes("instructor") ? "instructor" :
          user.roles[0]
        )) ||
        "student";

      const currentUserId = user?.user_id ? String(user.user_id) : null;
      const lastKnownUserId = localStorage.getItem("lastKnownUserId");
      const lastKnownRole = localStorage.getItem("lastKnownRole");

      // ตรวจสอบว่าเป็นผู้ใช้เดิมและมีบทบาทที่บันทึกไว้หรือไม่
      const isSameUser = lastKnownUserId && currentUserId && lastKnownUserId === currentUserId;
      const previousStoredRole = isSameUser ? lastKnownRole : null;

      let notification = null;
      if (previousStoredRole && previousStoredRole.toLowerCase() !== userRole.toLowerCase()) {
        notification = getRoleChangeNotification(previousStoredRole, userRole);
      }

      localStorage.setItem("token", accessToken);
      // เริ่มนับเวลา Session ใหม่ตั้งแต่ Login (ข้อ 7)
      localStorage.setItem("lastActivityAt", String(Date.now()));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", userRole);
      localStorage.setItem("lastKnownRole", userRole);
      if (currentUserId) {
        localStorage.setItem("lastKnownUserId", currentUserId);
      }

      saveSessionNotification(notification);

      set({
        token: accessToken,
        accessToken: accessToken,
        user: user,
        role: userRole,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        roleUpgradeNotification: notification,
      });

      return { success: true, accessToken, user, role: userRole };
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
  // ส่งข้อมูลสมัครสมาชิกไปยัง Backend (POST /api/v1/auth/register)
  // Backend จะทำการตรวจสอบ, แฮชรหัสผ่าน และกำหนด Role 'student'
  register: async (payloadOrEmail, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const data =
        typeof payloadOrEmail === "object" && payloadOrEmail !== null
          ? await authService.register(payloadOrEmail)
          : await authService.register(payloadOrEmail, password, displayName);
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
  // 2. ล้าง Token และสถานะทั้งหมดผ่าน clearAuth()
  logout: async () => {
    try {
      broadcastSessionEvent("LOGOUT");
      await authService.logout();
    } catch (err) {
      console.warn("Logout API returned error or network unreachable:", err);
    } finally {
      get().clearAuth();
    }
  },

  // ล้างข้อมูลและสถานะการยืนยันตัวตนทั้งหมดเมื่อ Session หมดอายุ (UAT-015)
  clearAuth: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("user_role");
    localStorage.removeItem("lastKnownRole");
    localStorage.removeItem("lastKnownUserId");
    localStorage.removeItem("lastActivityAt");
    saveSessionNotification(null);
    set({
      user: null,
      role: null,
      token: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      roleUpgradeNotification: null,
    });
  },

  // จัดการเมื่อเกิด Session Silent Refresh จาก Backend
  handleSessionRefreshed: (data) => {
    if (!data) return;
    const user = data.user;
    const currentUserId = user?.user_id ? String(user.user_id) : null;
    const lastKnownUserId = localStorage.getItem("lastKnownUserId");
    const lastKnownRole = localStorage.getItem("lastKnownRole");

    const isSameUser = !lastKnownUserId || !currentUserId || lastKnownUserId === currentUserId;
    const previousRole = isSameUser
      ? (lastKnownRole || get().role || localStorage.getItem("role") || user?.role)
      : null;

    const newRole =
      data.role ||
      user?.role ||
      (user?.roles && (
        user.roles.includes("super_admin") ? "super_admin" :
        user.roles.includes("admin") ? "admin" :
        user.roles.includes("instructor") ? "instructor" :
        user.roles[0]
      )) ||
      previousRole;

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    if (newRole) {
      localStorage.setItem("role", newRole);
      localStorage.setItem("lastKnownRole", newRole);
    }
    if (currentUserId) {
      localStorage.setItem("lastKnownUserId", currentUserId);
    }

    const prevLower = String(previousRole || "").toLowerCase().trim();
    const newLower = String(newRole || "").toLowerCase().trim();

    let notification = null;
    if (prevLower && newLower && prevLower !== newLower) {
      notification = getRoleChangeNotification(previousRole, newRole);
    }

    if (notification) {
      saveSessionNotification(notification);
      set((state) => ({
        user: user || state.user,
        role: newRole,
        roleUpgradeNotification: notification,
      }));
    } else {
      set((state) => ({
        user: user || state.user,
        role: newRole,
      }));
    }
  },

  // ดึงข้อมูลผู้ใช้ปัจจุบันล่าสุดจาก Backend (GET /api/v1/auth/me)
  // ใช้เพื่อ Refresh ข้อมูล Profile และ Roles ให้เป็นปัจจุบันที่สุด
  fetchCurrentUser: async () => {
    const currentToken =
      get().token ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");
    if (!currentToken) return;

    try {
      const data = await authService.getMe();
      if (data && data.user) {
        const currentUser = data.user;
        const currentUserId = currentUser.user_id ? String(currentUser.user_id) : null;
        const lastKnownUserId = localStorage.getItem("lastKnownUserId");
        const lastKnownRole = localStorage.getItem("lastKnownRole");

        // ระบุ previousRole จาก lastKnownRole ของผู้ใช้นี้ หรือ role ใน Store ก่อนหน้า
        const isSameUser = !lastKnownUserId || !currentUserId || lastKnownUserId === currentUserId;
        const previousRole = isSameUser
          ? (lastKnownRole || get().role || localStorage.getItem("role") || currentUser.role)
          : null;

        const newRole =
          data.role ||
          currentUser.role ||
          (currentUser.roles && (
            currentUser.roles.includes("super_admin") ? "super_admin" :
            currentUser.roles.includes("admin") ? "admin" :
            currentUser.roles.includes("instructor") ? "instructor" :
            currentUser.roles[0]
          )) ||
          previousRole;

        localStorage.setItem("user", JSON.stringify(currentUser));
        if (newRole) {
          localStorage.setItem("role", newRole);
          localStorage.setItem("lastKnownRole", newRole);
        }
        if (currentUserId) {
          localStorage.setItem("lastKnownUserId", currentUserId);
        }

        const prevLower = String(previousRole || "").toLowerCase().trim();
        const newLower = String(newRole || "").toLowerCase().trim();

        // ตรวจสอบการเปลี่ยน Role (Role Transition)
        let notification = null;
        if (prevLower && newLower && prevLower !== newLower) {
          notification = getRoleChangeNotification(previousRole, newRole);
        }

        if (notification) {
          saveSessionNotification(notification);
          set({
            user: currentUser,
            role: newRole,
            roleUpgradeNotification: notification,
          });
        } else {
          set({ user: currentUser, role: newRole });
        }

        return { user: currentUser, role: newRole };
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

  // เปลี่ยนรหัสผ่านของผู้ใช้ (Change Password)
  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );
      set({ isLoading: false, error: null });
      return { success: true, message: data?.message || "เปลี่ยนรหัสผ่านสำเร็จ" };
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  // Helper ตรวจสอบว่าผู้ใช้ปัจจุบันมี Role ตามที่ระบุหรือไม่ (รองรับทั้ง role หลัก และ roles array)
  hasRole: (roleName) => {
    if (!roleName) return false;
    const { user, role } = get();
    const target = String(roleName).toLowerCase();

    // Super admin inherits normal admin and instructor capabilities
    if (target === "admin" || target === "instructor") {
      if (get().isSuperAdmin()) return true;
    }

    if (role && String(role).toLowerCase() === target) {
      return true;
    }
    if (user?.role && String(user.role).toLowerCase() === target) {
      return true;
    }
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles.some(
        (r) => String(r).toLowerCase() === target
      );
    }
    return false;
  },

  // Helper ตรวจสอบว่าผู้ใช้เป็น Super Admin หรือไม่
  isSuperAdmin: () => {
    const { user, role } = get();
    return (
      user?.isSuperAdmin === true ||
      String(role).toLowerCase() === "super_admin" ||
      (Array.isArray(user?.roles) &&
        user.roles.some((r) => String(r).toLowerCase() === "super_admin"))
    );
  },

  // Helper ตรวจสอบว่าผู้ใช้ปัจจุบันมีสิทธิ์ (Permission) ตามที่ระบุหรือไม่ (Dynamic Permission Matrix)
  hasPermission: (permKey) => {
    if (!permKey) return false;

    // Super Admin มีสิทธิ์ครอบคลุมทั้งหมดเสมอ
    if (get().isSuperAdmin()) return true;

    const { user, role } = get();
    if (!user) return false;

    // 1. ตรวจสอบจาก user.permissions ที่ส่งมาจาก Backend DB
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permKey);
    }

    // 2. Fallback ตรวจสอบจาก Dynamic Permission Matrix ใน localStorage เมื่อยังไม่ได้ดึง permissions ล่าสุด
    try {
      const activeRole = role || user.role || (user.roles && user.roles[0]);
      if (activeRole) {
        const storedPermissions = JSON.parse(
          localStorage.getItem("elearning_admin_permissions_v1") || "{}"
        );
        const rolesList = storedPermissions.state?.roles;
        if (Array.isArray(rolesList)) {
          const matched = rolesList.find(
            (r) => r.id === activeRole || r.name?.toLowerCase() === activeRole.toLowerCase()
          );
          if (matched && Array.isArray(matched.permissions)) {
            return matched.permissions.includes(permKey);
          }
        }
      }
    } catch {
      // ignore
    }

    return false;
  },
}));

export default useAuthStore;
