import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LuBan } from "react-icons/lu";
import useAuthStore from "../../../../store/useAuthStore";

/**
 * ProtectedRoute Component (ผู้พิทักษ์เส้นทาง)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * 1. ตรวจสอบสถานะการ Login (isAuthenticated)
 * 2. ตรวจสอบ Role ของผู้ใช้ (allowedRoles)
 */
function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, hasRole, token } = useAuthStore();
  const location = useLocation();

  // 1. ตรวจสอบการเข้าสู่ระบบ (ต้องมีทั้งสถานะ isAuthenticated และ Token)
  if (!isAuthenticated || !token) {
    const redirectPath = location.pathname.startsWith("/admin")
      ? "/admin/login"
      : "/login";
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 2. ตรวจสอบสิทธิ์ตาม Role (ถ้ามีการระบุ allowedRoles)
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => hasRole(role));

    if (!hasRequiredRole) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center text-center p-6 bg-[#FAFAFA] text-[#26332F]">
          <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-8 max-w-md w-full shadow-2xs space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 mx-auto">
              <LuBan className="h-8 w-8 text-[#004643]" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-[#26332F]">
              คุณไม่มีสิทธิ์เข้าถึงส่วนนี้
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7773] leading-relaxed">
              หน้านี้สงวนสิทธิ์เฉพาะผู้ใช้ที่มีบทบาท:{" "}
              <span className="font-bold text-[#26332F] uppercase">
                {allowedRoles.join(", ")}
              </span>
            </p>
            <div className="pt-2">
              <a
                href="/dashboard"
                className="inline-block rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] transition cursor-pointer shadow-2xs"
              >
                ← กลับสู่หน้าหลัก
              </a>
            </div>
          </div>
        </div>
      );
    }
  }

  // หากผ่านเงื่อนไขทั้งหมด ให้แสดงผล children หรือ Outlet
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
