import { useState } from "react";
import {
  LuTriangleAlert as LuAlertTriangle,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuGraduationCap,
} from "react-icons/lu";
import Button from "../../../../components/common/Button";

function RegisterForm({
  title,
  setTitle,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  occupation,
  onOccupationChange,
  institutionName,
  setInstitutionName,
  institutionEmail,
  setInstitutionEmail,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  fieldErrors = {},
  setFieldErrors,
  isLoading,
  errorMessage,
  successMessage,
  isSuccess,
  onResetForm,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ตรวจสอบว่าอาชีพปัจจุบันต้องกรอกข้อมูลสถาบันหรือไม่
  const isInstitutionRequired =
    occupation === "นักเรียน" ||
    occupation === "นักศึกษา" ||
    occupation === "อาจารย์";

  // Helper สำหรับ clear error ของ field นั้นๆ เมื่อ user พิมพ์
  const handleInputChange = (setter, fieldName) => (e) => {
    setter(e.target.value);
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const titleOptions = ["นาย", "นาง", "นางสาว", "อื่น ๆ"];
  const occupationOptions = [
    "นักเรียน",
    "นักศึกษา",
    "อาจารย์",
    "พนักงานบริษัท",
    "ธุรกิจส่วนตัว",
    "ข้าราชการ",
    "อื่น ๆ",
  ];

  return (
    <>
      {/* กล่องแสดงข้อความผิดพลาดทั่วไปจากระบบ (General Error Alert) */}
      {errorMessage && (
        <div className="mt-6 rounded-2xl bg-red-50/90 p-4 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-3 shadow-xs animate-fadeIn">
          <LuAlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 font-semibold">{errorMessage}</div>
        </div>
      )}

      {/* กล่องแสดงข้อความสำเร็จ (Success Alert) */}
      {successMessage && (
        <div className="mt-6 rounded-2xl bg-emerald-50/90 p-4 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-start gap-3 shadow-xs animate-fadeIn">
          <LuCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold">{successMessage}</p>
            <p className="mt-1 text-xs text-emerald-700">
              คุณสามารถใช้ Email และ Password ที่ตั้งไว้เข้าสู่ระบบได้ทันที
            </p>
          </div>
        </div>
      )}

      {/* กรณีสมัครสำเร็จแล้ว ให้แสดงปุ่มเข้าสู่ระบบอย่างชัดเจน */}
      {isSuccess ? (
        <div className="mt-6 space-y-3">
          <Button
            to="/login"
            variant="primary"
            size="lg"
            fullWidth
            className="rounded-2xl shadow-md shadow-jade/25 hover:shadow-lg hover:shadow-jade/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-bold"
          >
            เข้าสู่ระบบ →
          </Button>
          <Button
            onClick={onResetForm}
            variant="outlineDark"
            size="md"
            fullWidth
            className="rounded-2xl font-semibold"
          >
            สมัครบัญชีอื่นเพิ่มเติม
          </Button>
        </div>
      ) : (
        /* แบบฟอร์มกรอกข้อมูลการสมัครสมาชิก */
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {/* แถวที่ 1: คำนำหน้า และ อาชีพ (2 Columns on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* คำนำหน้า */}
            <div>
              <label htmlFor="title" className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                คำนำหน้า <span className="text-red-500">*</span>
              </label>
              <select
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (fieldErrors.title) {
                    setFieldErrors((prev) => ({ ...prev, title: "" }));
                  }
                }}
                disabled={isLoading}
                className={`w-full rounded-2xl border bg-cloud px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.title
                    ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                    : "border-[#E5E9E7]"
                }`}
              >
                <option value="">-- เลือกคำนำหน้า --</option>
                {titleOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* อาชีพ */}
            <div>
              <label htmlFor="occupation" className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                อาชีพ <span className="text-red-500">*</span>
              </label>
              <select
                id="occupation"
                value={occupation}
                onChange={(e) => {
                  onOccupationChange(e.target.value);
                  if (fieldErrors.occupation) {
                    setFieldErrors((prev) => ({ ...prev, occupation: "" }));
                  }
                }}
                disabled={isLoading}
                className={`w-full rounded-2xl border bg-cloud px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.occupation
                    ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                    : "border-[#E5E9E7]"
                }`}
              >
                <option value="">-- เลือกอาชีพ --</option>
                {occupationOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {fieldErrors.occupation && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.occupation}
                </p>
              )}
            </div>
          </div>

          {/* แถวที่ 2: ชื่อ และ นามสกุล (2 Columns on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ชื่อ */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={handleInputChange(setFirstName, "firstName")}
                placeholder="ชื่อจริง"
                disabled={isLoading}
                className={`w-full rounded-2xl border bg-cloud px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.firstName
                    ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                    : "border-[#E5E9E7]"
                }`}
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            {/* นามสกุล */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={handleInputChange(setLastName, "lastName")}
                placeholder="นามสกุล"
                disabled={isLoading}
                className={`w-full rounded-2xl border bg-cloud px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.lastName
                    ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                    : "border-[#E5E9E7]"
                }`}
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* ส่วนข้อมูลสถาบัน (Conditional: แสดงเฉพาะเมื่อเป็นนักเรียนหรืออาจารย์) */}
          {/* ส่วนข้อมูลสถาบัน (Conditional: แสดงเฉพาะเมื่อเป็นนักเรียน, นักศึกษา, หรืออาจารย์) */}
          {isInstitutionRequired && (
            <div className="space-y-4 rounded-2xl border border-jade/40 bg-jade/10 p-4 sm:p-5 transition-all duration-300">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#004643]">
                <LuGraduationCap className="h-5 w-5 text-[#004643] shrink-0" aria-hidden="true" />
                <span>ข้อมูลสถาบันการศึกษา (สำหรับ {occupation})</span>
              </div>

              {/* ชื่อสถาบัน */}
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                  ชื่อสถาบัน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={handleInputChange(setInstitutionName, "institutionName")}
                  placeholder={
                    occupation === "นักเรียน"
                      ? "เช่น โรงเรียน..."
                      : "เช่น มหาวิทยาลัย..."
                  }
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.institutionName
                      ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                      : "border-[#E5E9E7]"
                  }`}
                />
                {fieldErrors.institutionName && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {fieldErrors.institutionName}
                  </p>
                )}
              </div>

              {/* อีเมลสถาบัน */}
              <div>
                <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                  อีเมลสถาบัน <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={institutionEmail}
                  onChange={handleInputChange(setInstitutionEmail, "institutionEmail")}
                  placeholder={
                    occupation === "นักเรียน"
                      ? "เช่น student@school.ac.th"
                      : occupation === "อาจารย์"
                      ? "เช่น teacher@university.ac.th"
                      : "เช่น student@university.ac.th"
                  }
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.institutionEmail
                      ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                      : "border-[#E5E9E7]"
                  }`}
                />
                {fieldErrors.institutionEmail && (
                  <p className="mt-1 text-xs text-red-600 font-medium">
                    {fieldErrors.institutionEmail}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* อีเมลบัญชีผู้ใช้ */}
          <div>
            <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
              อีเมลสำหรับเข้าสู่ระบบ <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={handleInputChange(setEmail, "email")}
              placeholder="example@domain.com"
              disabled={isLoading}
              className={`w-full rounded-2xl border bg-cloud px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                fieldErrors.email
                  ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                  : "border-[#E5E9E7]"
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* แถวรหัสผ่าน และ ยืนยันรหัสผ่าน (2 Columns on Desktop with Show/Hide Toggle) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* รหัสผ่าน */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleInputChange(setPassword, "password")}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  disabled={isLoading}
                  style={
                    !showPassword && password
                      ? {
                          fontFamily:
                            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          letterSpacing: "0.15em",
                        }
                      : {}
                  }
                  className={`w-full rounded-2xl border bg-cloud pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.password
                      ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                      : "border-[#E5E9E7]"
                  }`}
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-dark hover:bg-jade/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-jade/40"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? (
                    <LuEyeOff className="h-5 w-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <LuEye className="h-5 w-5 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* ยืนยันรหัสผ่าน */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-dark">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleInputChange(setConfirmPassword, "confirmPassword")}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  disabled={isLoading}
                  style={
                    !showConfirmPassword && confirmPassword
                      ? {
                          fontFamily:
                            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          letterSpacing: "0.15em",
                        }
                      : {}
                  }
                  className={`w-full rounded-2xl border bg-cloud pl-4 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm text-dark placeholder:text-muted/60 outline-none transition-all duration-200 hover:border-jade/60 focus:border-jade focus:bg-white focus:ring-4 focus:ring-jade/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.confirmPassword
                      ? "border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-200/50"
                      : "border-[#E5E9E7]"
                  }`}
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-dark hover:bg-jade/15 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-jade/40"
                  aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showConfirmPassword ? (
                    <LuEyeOff className="h-5 w-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <LuEye className="h-5 w-5 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* ปุ่มส่งข้อมูลการสมัครสมาชิก */}
          <div className="pt-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              className="rounded-2xl shadow-md shadow-jade/25 hover:shadow-lg hover:shadow-jade/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 font-bold"
            >
              {isLoading ? "กำลังตรวจสอบข้อมูล..." : "สมัครสมาชิก"}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}

export default RegisterForm;
