// นำเข้าคอมโพเนนต์ Routing พื้นฐานจาก React Router
import { Routes, Route, Navigate } from "react-router-dom";

// นำเข้าคอมโพเนนต์ตรวจสอบสิทธิ์ ProtectedRoute
import ProtectedRoute from "./components/ProtectedRoute";
// นำเข้าเลย์เอาต์ DashboardLayout สำหรับหน้า Dashboard
import DashboardLayout from "./layouts/DashboardLayout";
// นำเข้าคอมโพเนนต์แจ้งเตือน Session Timeout
import TimeoutModal from "./components/TimeoutModal";
// นำเข้า Hook ตรวจจับ Inactivity useIdleTimeout
import useIdleTimeout from "./hooks/useIdleTimeout";

// นำเข้าหน้าแรกของระบบ (Home)
import Home from "./pages/Home";
// นำเข้าหน้าเข้าสู่ระบบ (Login)
import Login from "./pages/Login";
// นำเข้าหน้าสมัครสมาชิก (Register)
import Register from "./pages/Register";
// นำเข้าหน้าลืมรหัสผ่าน (ForgotPassword)
import ForgotPassword from "./pages/ForgotPassword";
// นำเข้าหน้าตั้งรหัสผ่านใหม่ (ResetPassword)
import ResetPassword from "./pages/ResetPassword";
// นำเข้าหน้าแดชบอร์ดทั่วไป (Dashboard)
import Dashboard from "./pages/Dashboard";
// นำเข้าหน้าโปรไฟล์ผู้ใช้ (Profile)
import Profile from "./pages/Profile";
// นำเข้าหน้ารายการห้องเรียน (Classrooms)
import Classrooms from "./pages/Classrooms";
// นำเข้าหน้ารายละเอียดห้องเรียน (ClassroomDetail)
import ClassroomDetail from "./pages/ClassroomDetail";
// นำเข้าหน้ารายละเอียดบทเรียน (LessonDetail)
import LessonDetail from "./pages/LessonDetail";
// นำเข้าหน้าบันทึกการเรียนรู้ (JournalView)
import JournalView from "./pages/JournalView";
// นำเข้าหน้าจัดการบทบาทสำหรับ Admin (AdminRoles)
import AdminRoles from "./pages/AdminRoles";
// นำเข้าหน้าจัดการผู้ใช้งานสำหรับ Admin (AdminUsers)
import AdminUsers from "./pages/AdminUsers";
// นำเข้าหน้าการตั้งค่าระบบสำหรับ Admin (AdminSettings)
import AdminSettings from "./pages/AdminSettings";
// นำเข้าหน้าหลักของผู้เรียน (StudentHome)
import StudentHome from "./pages/student/StudentHome";
// นำเข้าหน้าหลักของผู้สอน (InstructorHome)
import InstructorHome from "./pages/InstructorHome";
// นำเข้าหน้าหลักของผู้ดูแลระบบ (AdminHome)
import AdminHome from "./pages/AdminHome";

// คอมโพเนนต์หลัก App สำหรับกำหนด Routing และการป้องกันความปลอดภัย
function App() {
  // ดึงค่าสถานะจากระบบตรวจจับ Inactivity และแจ้งเตือนหมดเวลาใช้งาน
  const {
    isWarningOpen,
    countdown,
    extendSession,
    isGuestTimeout,
    closeGuestModal,
  } = useIdleTimeout();

  // แสดงผลโครงสร้าง Routing และ Modal แจ้งเตือน
  return (
    <>
      {/* กล่องแจ้งเตือน Session Timeout และ Guest Timeout */}
      <TimeoutModal
        isWarningOpen={isWarningOpen}
        countdown={countdown}
        onExtend={extendSession}
        isGuestTimeout={isGuestTimeout}
        onCloseGuest={closeGuestModal}
      />

      {/* กล่องกำหนดเส้นทางทั้งหมดของแอปพลิเคชัน */}
      <Routes>
        {/* 1. เส้นทางสาธารณะ Public Routes เข้าถึงได้ทุกคน */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 2. เส้นทางที่ต้องยืนยันตัวตน Protected Routes ตามบทบาท */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/home" element={<StudentHome />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["instructor"]} />}>
          <Route path="/instructor/home" element={<InstructorHome />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/home" element={<AdminHome />} />
        </Route>

        {/* เส้นทางสมาชิกที่ใช้งานผ่าน DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route path="/classrooms/:id" element={<ClassroomDetail />} />
            <Route
              path="/classrooms/:classroomId/lessons/:lessonId"
              element={<LessonDetail />}
            />
            <Route path="/journals" element={<JournalView />} />
            <Route path="/profile" element={<Profile />} />

            {/* เส้นทางเฉพาะ Admin เพิ่มเติม */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/roles" element={<AdminRoles />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Route>

        {/* เส้นทาง Fallback 404 ส่งกลับไปยังหน้าแรก */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

// ส่งออกคอมโพเนนต์ App
export default App;
