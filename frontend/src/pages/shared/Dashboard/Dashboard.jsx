import { Navigate } from "react-router-dom";
import useAuthStore from "../../../store/useAuthStore";

/**
 * Dashboard Page (Redirect Proxy to Role-based Home)
 * Redirects user to their role-specific dashboard:
 * - Student -> /student/home
 * - Instructor -> /instructor/home
 * - Admin -> /admin/home
 */
function Dashboard() {
  const { user, role, hasRole, isSuperAdmin } = useAuthStore();
  const primaryRole = String(user?.role || role || "").toLowerCase();

  const isSuper = isSuperAdmin?.() || primaryRole === "super_admin" || hasRole("super_admin");
  const isAdmin = primaryRole === "admin" || hasRole("admin");
  const isInstructor = primaryRole === "instructor" || hasRole("instructor");

  const targetHome = isSuper
    ? "/admin/home"
    : isAdmin
    ? "/admin/dashboard"
    : isInstructor
    ? "/instructor/home"
    : "/student/home";

  return <Navigate to={targetHome} replace />;
}

export default Dashboard;
