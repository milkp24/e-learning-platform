import { Link } from "react-router-dom";
import { LuClock, LuTriangleAlert as LuAlertTriangle, LuEye, LuEyeOff } from "react-icons/lu";
import Button from "../../../../components/common/Button";

function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  errorMessage,
  expiredNotice,
  onSubmit,
}) {
  return (
    <>
      {/* กล่องแจ้งเตือนเซสชันหมดอายุ */}
      {expiredNotice && (
        <div className="mt-6 rounded-2xl bg-amber-50/90 p-4 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-3 shadow-xs animate-fadeIn">
          <LuClock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 font-medium">{expiredNotice}</div>
        </div>
      )}

      {/* กล่องแจ้งเตือนข้อผิดพลาด */}
      {errorMessage && (
        <div className="mt-6 rounded-2xl bg-red-50/90 p-4 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3 shadow-xs animate-fadeIn">
          <LuAlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* แบบฟอร์ม Login */}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
            อีเมล <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@domain.com"
            disabled={isLoading}
            className="w-full rounded-2xl border border-[#E5E9E7] bg-cloud px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 transition-all duration-200 outline-none hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-semibold text-dark">
              รหัสผ่าน <span className="text-red-500">*</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#004643] hover:underline transition-colors"
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
              style={
                !showPassword
                  ? {
                      fontFamily:
                        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                      letterSpacing: "0.15em",
                    }
                  : {}
              }
              className="w-full rounded-2xl border border-[#E5E9E7] bg-cloud pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 transition-all duration-200 outline-none hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
            {isLoading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ"}
          </Button>
        </div>
      </form>
    </>
  );
}

export default LoginForm;
