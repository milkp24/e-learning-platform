import { Navigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

// ======================================================
// Dashboard Page (Redirect Proxy to Role-based Home)
// ======================================================
// ป้องกันการสร้างหน้าซ้ำซ้อนกับ StudentHome:
// - สำหรับ Student -> Redirect ไป /student/home
// - สำหรับ Instructor -> Redirect ไป /instructor/home
// - สำหรับ Admin -> Redirect ไป /admin/home
// คงไฟล์นี้ไว้เพื่อป้องกัน Import หรือ Route Dependency เดิมพัง

function Dashboard() {
  const { user } = useAuthStore();
  const roles = user?.roles || [];

  const isAdmin = roles.some((r) => String(r).toLowerCase() === "admin");
  const isInstructor = roles.some((r) => String(r).toLowerCase() === "instructor");

  const targetHome = isAdmin
    ? "/admin/home"
    : isInstructor
    ? "/instructor/home"
    : "/student/home";

  return <Navigate to={targetHome} replace />;
}

export default Dashboard;
