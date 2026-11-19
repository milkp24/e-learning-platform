import { Routes, Route, Navigate } from "react-router-dom";

// ProtectedRoute
import ProtectedRoute from "../../features/auth/components/ProtectedRoute";

// Layouts
import GuestLayout from "../../layouts/GuestLayout";
import StudentLayout from "../../layouts/StudentLayout";
import InstructorLayout from "../../layouts/InstructorLayout";
import AdminLayout from "../../layouts/AdminLayout";
import RoleAdaptiveLayout from "../../layouts/RoleAdaptiveLayout";

// Guest / Public / Auth Pages
import Home from "../../pages/guest/Home";
import Login from "../../pages/guest/Login";
import Register from "../../pages/guest/Register";
import ForgotPassword from "../../pages/guest/ForgotPassword";
import ResetPassword from "../../pages/guest/ResetPassword";

// Student Pages
import StudentHome from "../../pages/student/StudentHome";
import JournalView from "../../pages/student/Journal";

// Instructor Pages
import InstructorHome from "../../pages/instructor/InstructorHome";

// Admin Pages
import AdminLogin from "../../pages/admin/AdminLogin";
import AdminDashboard from "../../pages/admin/Dashboard";
import AdminUsers from "../../pages/admin/Users";
import AdminSchools from "../../pages/admin/AdminSchools";
import AdminStaff from "../../pages/admin/Staff";
import AdminRoles from "../../pages/admin/Roles";
import AdminCourses from "../../pages/admin/Courses";
import AdminLessons from "../../pages/admin/Lessons";
import AdminQuizzes from "../../pages/admin/Quizzes";
import AdminMissions from "../../pages/admin/Missions";
import AdminSettings from "../../pages/admin/Settings";
import AdminSecurity from "../../pages/admin/Security";
import AdminReports from "../../pages/admin/Reports";

// Shared Pages
import Dashboard from "../../pages/shared/Dashboard";
import Classrooms from "../../pages/shared/Classrooms";
import ClassroomDetail from "../../pages/shared/ClassroomDetail";
import LessonDetail from "../../pages/shared/LessonDetail";
import CourseContentManager from "../../pages/shared/CourseContentManager";
import Profile from "../../pages/shared/Profile";
import InfoPage from "../../pages/shared/InfoPage";

/**
 * AppRoutes Component
 * Centralized declarative routing table for the application.
 * Manages role-based layouts and protected route wrappers.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Guest Route (GuestLayout) */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Standalone Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* 2. Student Routes (StudentLayout) */}
      <Route element={<ProtectedRoute allowedRoles={["student", "admin", "super_admin"]} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/home" element={<StudentHome />} />
          <Route path="/journals" element={<JournalView />} />
        </Route>
      </Route>

      {/* 3. Instructor Routes (InstructorLayout) */}
      <Route element={<ProtectedRoute allowedRoles={["instructor", "admin", "super_admin"]} />}>
        <Route element={<InstructorLayout />}>
          <Route path="/instructor/home" element={<InstructorHome />} />
        </Route>
      </Route>

      {/* 4. Super Admin Exclusive Routes (AdminLayout) */}
      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* 5. Admin + Super Admin Shared Operational Routes (AdminLayout) */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "super_admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/home" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/schools" element={<AdminSchools />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route
            path="/admin/courses/:classroomId/manage"
            element={<CourseContentManager />}
          />
          <Route path="/admin/lessons" element={<AdminLessons />} />
          <Route path="/admin/quizzes" element={<AdminQuizzes />} />
          <Route path="/admin/missions" element={<AdminMissions />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Route>

      {/* 5. Role-based Redirect Proxy Route */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>

      {/* 6. Public & Shared Course Discovery Routes (RoleAdaptiveLayout) */}
      <Route element={<RoleAdaptiveLayout />}>
        <Route path="/classrooms" element={<Classrooms />} />
        <Route path="/classrooms/:id" element={<ClassroomDetail />} />
        <Route path="/courses/:id" element={<ClassroomDetail />} />
        <Route path="/privacy" element={<InfoPage page="privacy" />} />
        <Route path="/terms" element={<InfoPage page="terms" />} />
        <Route path="/help" element={<InfoPage page="help" />} />
      </Route>

      {/* 7. Protected Learning & Management Routes (Strictly Authenticated) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleAdaptiveLayout />}>
          <Route
            path="/classrooms/:classroomId/manage"
            element={<CourseContentManager />}
          />
          <Route
            path="/classrooms/:classroomId/lessons/:lessonId"
            element={<LessonDetail />}
          />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
