import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

// ======================================================
// ProtectedRoute Component (ผู้พิทักษ์เส้นทาง)
// ======================================================
// คอมโพเนนต์นี้ทำหน้าที่ตรวจสอบสิทธิ์ของผู้ใช้ก่อนอนุญาตให้เข้าถึงหน้านั้น ๆ
// 1. ตรวจสอบว่า Login แล้วหรือยัง (isAuthenticated)
//    - ถ้ายังไม่ได้ Login -> ส่งกลับไปหน้า /login พร้อมจำหน้าที่ผู้ใช้พยายามเข้าไว้
// 2. ตรวจสอบ Role ของผู้ใช้ (allowedRoles) ถ้ามีการกำหนด
//    - ถ้า Role ไม่ตรงตามที่อนุญาต -> แสดงหน้าแจ้งเตือนว่าไม่มีสิทธิ์เข้าถึง (Access Denied)

function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, user, hasRole } = useAuthStore();
  const location = useLocation();

  // ตรวจสอบการ Login
  // ข้อมูลไหลจาก Zustand Store (useAuthStore)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ตรวจสอบสิทธิ์ตาม Role (ถ้ามีการระบุ allowedRoles ไว้)
  // ตัวอย่างเช่น หน้า Admin กำหนด allowedRoles={['admin']}
  if (allowedRoles.length > 0) {
    const hasRequiredRole = allowedRoles.some((role) => hasRole(role));

    if (!hasRequiredRole) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
          <div className="rounded-full bg-red-100 p-4 text-red-600 mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            ไม่มีสิทธิ์เข้าถึงหน้านี้ (Access Denied)
          </h2>
          <p className="mt-2 text-gray-600 max-w-md">
            หน้านี้สงวนสิทธิ์เฉพาะผู้ใช้ที่มีบทบาท:{" "}
            <span className="font-semibold text-red-600">
              {allowedRoles.join(", ")}
            </span>
          </p>
          <a
            href="/classrooms"
            className="mt-6 inline-block rounded-xl bg-[#ABD1C6] px-6 py-2.5 font-semibold text-[#20302C] hover:bg-[#9CC5B9]"
          >
            ← กลับไปหน้ารายการห้องเรียน
          </a>
        </div>
      );
    }
  }

  // หากผ่านเงื่อนไขทั้งหมด ให้แสดงผล children หรือ Outlet
  return children ? children : <Outlet />;
}

export default ProtectedRoute;
