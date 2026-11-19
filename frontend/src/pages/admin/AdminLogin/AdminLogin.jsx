import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LuShieldCheck,
  LuTriangleAlert as LuAlertTriangle,
  LuEye,
  LuEyeOff,
  LuArrowLeft,
  LuLock,
  LuMail,
} from "react-icons/lu";
import useAuthStore from "../../../store/useAuthStore";
import Button from "../../../components/common/Button";

/**
 * AdminLogin Component
 * หน้าเข้าสู่ระบบสำหรับผู้ดูแลระบบ (Super Admin & Staff)
 * ตรวจสอบสิทธิ์ผู้ดูแลระบบ (Role Admin) หากไม่มีสิทธิ์จะแจ้งเตือน "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้"
 */
function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout, isLoading, isAuthenticated, hasRole, role } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // หากผู้ใช้มีสิทธิ์ admin หรือ super_admin อยู่แล้ว ให้ redirect ไปยังหน้าที่เหมาะสม
  useEffect(() => {
    if (isAuthenticated) {
      if (role === "super_admin" || hasRole("super_admin")) {
        navigate("/admin/home", { replace: true });
      } else if (role === "admin" || hasRole("admin")) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, role, hasRole, navigate]);

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
      const state = useAuthStore.getState();
      const isSuper =
        result.role === "super_admin" ||
        state.role === "super_admin" ||
        state.user?.role === "super_admin" ||
        state.user?.roles?.includes("super_admin") ||
        state.hasRole("super_admin") ||
        state.isSuperAdmin();

      const isAdmin =
        result.role === "admin" ||
        state.role === "admin" ||
        state.user?.role === "admin" ||
        state.user?.roles?.includes("admin") ||
        state.hasRole("admin");

      if (isSuper) {
        navigate("/admin/home", { replace: true });
      } else if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        // หากผู้ใช้ไม่มีสิทธิ์ admin ให้ทำการ Logout ล้าง Session ทันที
        // และแสดงข้อความ "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" ตามข้อกำหนด
        await logout();
        setErrorMessage("คุณไม่มีสิทธิ์เข้าถึงส่วนนี้");
      }
    } else {
      setErrorMessage(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="relative min-h-screen bg-cloud flex items-center justify-center px-4 py-10 sm:py-14 overflow-hidden">
      {/* Decorative Ambient Floating Elements */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-jade/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-jade/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-jade/10 blur-[120px]" />

        {/* Subtle Decorative Accents */}
        <div className="absolute top-20 right-20 w-12 h-12 rounded-2xl bg-jade/20 border border-jade/30 rotate-12 hidden md:block" />
        <div className="absolute bottom-24 left-20 w-10 h-10 rounded-full bg-jade/15 border border-jade/25 -rotate-6 hidden md:block" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#E5E9E7] bg-white/95 backdrop-blur-sm p-6 sm:p-9 shadow-xl shadow-jade/10 animate-fadeIn">
        {/* Header ส่วนหัว */}
        <div className="text-left">
          {/* แบรนด์และ Badge ระบบดูแล */}
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 text-lg sm:text-xl font-black text-dark transition hover:opacity-90 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-jade/30 text-[#004643] shadow-xs ring-1 ring-jade/50 transition-transform group-hover:scale-105">
                <LuShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                E-learning <span className="text-[#004643]">Platform</span>
              </span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#004643] text-white shadow-2xs">
              <LuLock className="w-3 h-3" />
              Admin
            </span>
          </div>

          <h1 className="mt-6 sm:mt-7 text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
            เข้าสู่ระบบผู้ดูแลระบบ
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted">
            ระบบบริหารจัดการส่วนกลาง E-learning Platform
          </p>
        </div>

        {/* กล่องแจ้งเตือนข้อผิดพลาด (เช่น "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" หรือ "อีเมลหรือรหัสผ่านไม่ถูกต้อง") */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-2xl bg-red-50/90 p-4 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3 shadow-xs animate-fadeIn"
          >
            <LuAlertTriangle
              className="h-5 w-5 text-red-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* แบบฟอร์ม Login แอดมิน */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
              อีเมลผู้ดูแลระบบ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <LuMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                disabled={isLoading}
                required
                className="w-full rounded-2xl border border-[#E5E9E7] bg-cloud pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 transition-all duration-200 outline-none hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-semibold text-dark">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="relative">
              <LuLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                required
                style={
                  !showPassword
                    ? {
                        fontFamily:
                          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        letterSpacing: "0.15em",
                      }
                    : {}
                }
                className="w-full rounded-2xl border border-[#E5E9E7] bg-cloud pl-11 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 transition-all duration-200 outline-none hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                tabIndex="-1"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-dark hover:bg-jade/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-jade/40"
              >
                {showPassword ? (
                  <LuEyeOff className="h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <LuEye className="h-5 w-5 shrink-0" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="rounded-2xl shadow-md shadow-jade/25 hover:shadow-lg hover:shadow-jade/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-bold"
            >
              {isLoading ? "กำลังตรวจสอบสิทธิ์..." : "เข้าสู่ระบบผู้ดูแลระบบ"}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-[#E5E9E7] space-y-3">
          <p className="text-center text-xs sm:text-sm text-muted">
            ไม่ใช่ผู้ดูแลระบบ?{" "}
            <Link
              to="/login"
              className="font-bold text-[#004643] hover:underline transition-colors"
            >
              เข้าสู่ระบบสำหรับผู้เรียนและผู้สอน
            </Link>
          </p>

          <Link
            to="/"
            className="flex items-center justify-center gap-1.5 text-center text-xs sm:text-sm text-muted hover:text-dark transition-colors"
          >
            <LuArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
