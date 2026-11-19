// นำเข้า React Hooks สำหรับ State และ Lifecycle
import { useState, useEffect, useCallback } from "react";
// นำเข้า Link, useNavigate, useLocation จาก React Router
import { Link, useNavigate, useLocation } from "react-router-dom";
// นำเข้า useAuthStore สำหรับจัดการ Authentication State
import useAuthStore from "../../../store/useAuthStore";
// Section Components
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";

// คอมโพเนนต์หน้าเข้าสู่ระบบ (Login Page)
function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isLoading, isAuthenticated, user, hasRole } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expiredNotice, setExpiredNotice] = useState("");

  const getRoleHome = useCallback((currentUser) => {
    if (!currentUser) return "/";
    const primaryRole =
      currentUser?.role ||
      useAuthStore.getState().role ||
      "";
    const normalized = String(primaryRole).toLowerCase();

    // ลำดับความสำคัญ: super_admin > admin > instructor > student ตาม Database จริง
    if (normalized === "super_admin" || hasRole("super_admin") || currentUser?.isSuperAdmin) return "/admin/home";
    if (normalized === "admin" || hasRole("admin")) return "/admin/dashboard";
    if (normalized === "instructor" || hasRole("instructor")) return "/instructor/home";
    if (normalized === "student" || hasRole("student")) return "/student/home";
    return "/";
  }, [hasRole]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired") === "true") {
      setExpiredNotice("เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
    }
  }, [location.search]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const targetHome = getRoleHome(user);
      navigate(targetHome, { replace: true });
    }
  }, [isAuthenticated, user, navigate, getRoleHome]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    const result = await login(trimmedEmail, password);

    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      const defaultRoleHome = getRoleHome(currentUser);
      const fromPath = location.state?.from?.pathname;

      // ตรวจสอบความถูกต้องของ fromPath ป้องกัน Redirect Loop หรือเข้าหน้าที่ไม่มีสิทธิ์
      let targetPath = defaultRoleHome;
      if (
        fromPath &&
        fromPath !== "/login" &&
        fromPath !== "/register" &&
        fromPath !== "/forgot-password" &&
        fromPath !== "/reset-password"
      ) {
        const isAdminPath = fromPath.startsWith("/admin");
        const isInstructorPath = fromPath.startsWith("/instructor");
        const isStudentPath = fromPath.startsWith("/student") || fromPath.startsWith("/journals");

        if (isAdminPath && !hasRole("admin") && result.role !== "admin") {
          targetPath = defaultRoleHome;
        } else if (isInstructorPath && !hasRole("instructor") && result.role !== "instructor") {
          targetPath = defaultRoleHome;
        } else if (isStudentPath && !hasRole("student") && result.role !== "student") {
          targetPath = defaultRoleHome;
        } else {
          targetPath = fromPath;
        }
      }

      navigate(targetPath, { replace: true });
    } else {
      setErrorMessage(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="relative min-h-screen bg-cloud flex items-center justify-center px-4 py-10 sm:py-14 overflow-hidden">
      {/* Decorative Ambient Floating Elements */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none" aria-hidden="true">
        {/* Soft Ambient Jade Glow Blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-jade/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-jade/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-jade/10 blur-[120px]" />

        {/* Cute Educational Accents */}
        <div className="absolute top-20 right-20 w-12 h-12 rounded-2xl bg-jade/20 border border-jade/30 rotate-12 transition-transform duration-1000 hidden md:block" />
        <div className="absolute bottom-24 left-20 w-10 h-10 rounded-full bg-jade/15 border border-jade/25 -rotate-6 hidden md:block" />
        <div className="absolute top-1/3 left-12 w-6 h-6 rounded-lg bg-jade/20 rotate-45 hidden lg:block" />
        <div className="absolute bottom-1/3 right-16 w-8 h-8 rounded-full border border-dashed border-jade/40 hidden lg:block" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white/95 backdrop-blur-sm p-6 sm:p-9 shadow-xl shadow-jade/10 animate-fadeIn">
        {/* ส่วนหัวของหน้า Login */}
        <LoginHeader />

        {/* แบบฟอร์ม Login */}
        <LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isLoading={isLoading}
          errorMessage={errorMessage}
          expiredNotice={expiredNotice}
          onSubmit={handleSubmit}
        />

        <p className="mt-6 text-center text-xs sm:text-sm text-muted">
          ยังไม่มีบัญชีผู้ใช้งาน?{" "}
          <Link
            to="/register"
            className="font-bold text-[#004643] hover:underline transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </p>

        <Link
          to="/"
          className="mt-4 block text-center text-xs sm:text-sm text-muted hover:text-dark transition-colors"
        >
          ← กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}

export default Login;
