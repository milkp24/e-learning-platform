import useAuthStore from "../../store/useAuthStore";
import GuestLayout from "../GuestLayout/GuestLayout";
import StudentLayout from "../StudentLayout/StudentLayout";
import InstructorLayout from "../InstructorLayout/InstructorLayout";
import AdminLayout from "../AdminLayout/AdminLayout";

// ======================================================
// RoleAdaptiveLayout Component (Role-based Layout Dispatcher)
// ======================================================
// ใช้สำหรับ Route ที่แชร์ใช้งานร่วมกันระหว่างหลาย Role:
// - /classrooms
// - /classrooms/:id
// - /courses/:id
// - /classrooms/:classroomId/lessons/:lessonId (ครอบด้วย ProtectedRoute)
// - /profile (ครอบด้วย ProtectedRoute)
//
// ตรวจสอบ Role จาก useAuthStore เพื่อเลือก Layout ประจำบทบาทอย่างแม่นยำ:
// - guest      → GuestLayout (GuestHeader + GuestSidebar)
// - admin      → AdminLayout (AdminHeader + AdminSidebar)
// - instructor → InstructorLayout (InstructorHeader + InstructorSidebar)
// - student    → StudentLayout (StudentHeader + StudentSidebar)
//
// ป้องกัน Layout Leakage 100% โดยไม่ต้องเปลี่ยน URL เดิม และไม่ต้องสร้าง Page ซ้ำ

function RoleAdaptiveLayout() {
  const { hasRole, isAuthenticated } = useAuthStore();

  // 1. ผู้เยี่ยมชม (Guest / ยังไม่ได้เข้าสู่ระบบ)
  if (!isAuthenticated) {
    return <GuestLayout />;
  }

  // 2. ตรวจสอบสิทธิ์ Admin และ Super Admin
  if (hasRole("admin") || hasRole("super_admin")) {
    return <AdminLayout />;
  }

  // 3. ตรวจสอบสิทธิ์ Instructor
  if (hasRole("instructor")) {
    return <InstructorLayout />;
  }

  // 4. บทบาทผู้เรียน Student และสมาชิกทั่วไป
  return <StudentLayout />;
}

export default RoleAdaptiveLayout;
