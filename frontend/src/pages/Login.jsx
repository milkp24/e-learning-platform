// นำเข้า React Hooks สำหรับ State และ Lifecycle
import { useState, useEffect } from "react";
// นำเข้า Link, useNavigate, useLocation จาก React Router
import { Link, useNavigate, useLocation } from "react-router-dom";
// นำเข้า useAuthStore สำหรับจัดการ Authentication State
import useAuthStore from "../store/useAuthStore";
// นำเข้าคอมโพเนนต์ Button สำหรับปุ่มกด
import Button from "../components/Button";

// คอมโพเนนต์หน้าเข้าสู่ระบบ (Login Page)
function Login() {
  // ฟังก์ชัน navigate สำหรับนำทาง
  const navigate = useNavigate();
  // ข้อมูล Location ปัจจุบันเพื่อดึง Query String หรือ State เดิม
  const location = useLocation();

  // ดึงค่าฟังก์ชันและสถานะจาก Zustand Auth Store
  const { login, isLoading, isAuthenticated, user, hasRole } = useAuthStore();

  // State สำหรับเก็บอีเมล
  const [email, setEmail] = useState("");
  // State สำหรับเก็บรหัสผ่าน
  const [password, setPassword] = useState("");
  // State สำหรับควบคุมการแสดงหรือซ่อนรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  // State สำหรับข้อความผิดพลาด
  const [errorMessage, setErrorMessage] = useState("");
  // State สำหรับข้อความแจ้งเตือนเซสชันหมดอายุ
  const [expiredNotice, setExpiredNotice] = useState("");

  // ฟังก์ชันหาหน้า Home ที่เหมาะสมตาม Role ของผู้ใช้
  const getRoleHome = (currentUser) => {
    if (!currentUser) return "/";
    if (hasRole("student")) return "/student/home";
    if (hasRole("instructor")) return "/instructor/home";
    if (hasRole("admin")) return "/admin/home";
    return "/";
  };

  // ตรวจสอบ Parameter expired=true ใน URL (UAT-015 Session Timeout)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired") === "true") {
      setExpiredNotice("เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
    }
  }, [location.search]);

  // หากผู้ใช้ Login อยู่แล้ว นำทางไปยังหน้าของ Role นั้นทันที
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetHome = getRoleHome(user);
      navigate(targetHome, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ฟังก์ชันจัดการการส่งแบบฟอร์มเข้าสู่ระบบ
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
      const fromPath = location.state?.from?.pathname || defaultRoleHome;
      navigate(fromPath, { replace: true });
    } else {
      setErrorMessage(result.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  // แสดงผลโครงสร้าง JSX ของหน้า Login
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-lg">
        {/* โลโก้และชื่อระบบ E-learning Platform */}
        <Link to="/" className="flex items-center gap-2.5 text-2xl font-bold text-[#26332F]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xl text-[#004643]">
            🤖
          </span>
          <span>
            E-learning <span className="text-[#004643]">Platform</span>
          </span>
        </Link>

        {/* หัวข้อหน้าเข้าสู่ระบบ */}
        <h1 className="mt-8 text-3xl font-extrabold text-[#26332F]">
          ยินดีต้อนรับกลับ
        </h1>
        <p className="mt-2 text-sm text-[#6B7773]">
          เข้าสู่ระบบเพื่อเริ่มต้นการเรียนรู้
        </p>

        {/* กล่องแจ้งเตือนเซสชันหมดอายุ (UAT-015) */}
        {expiredNotice && (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-300 text-sm text-amber-900 flex items-start gap-3">
            <span className="text-base">⏰</span>
            <div className="flex-1 font-medium">{expiredNotice}</div>
          </div>
        )}

        {/* กล่องแจ้งเตือนข้อผิดพลาด (UAT-012) */}
        {errorMessage && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-700 flex items-start gap-3">
            <span className="text-base">⚠️</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* แบบฟอร์ม Login */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#26332F]">
              อีเมล (Email) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              disabled={isLoading}
              className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white focus:ring-2 focus:ring-[#ABD1C6]/30 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-semibold text-[#26332F]">
                รหัสผ่าน (Password) <span className="text-red-500">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-[#004643] hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 pr-11 text-[#26332F] outline-none transition focus:border-[#ABD1C6] focus:bg-white focus:ring-2 focus:ring-[#ABD1C6]/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7773] hover:text-[#26332F] transition focus:outline-none cursor-pointer"
              >
                {showPassword ? "🙈" : "👁️"}
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
            >
              {isLoading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ (Login)"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-[#6B7773]">
          ยังไม่มีบัญชีผู้ใช้งาน?{" "}
          <Link
            to="/register"
            className="font-bold text-[#004643] hover:underline"
          >
            สมัครสมาชิก (Register)
          </Link>
        </p>

        <Link
          to="/"
          className="mt-4 block text-center text-sm text-[#6B7773] hover:text-[#004643]"
        >
          ← กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}

// ส่งออกคอมโพเนนต์ Login
export default Login;
