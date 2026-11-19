import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/useAuthStore";
import RegisterHeader from "./components/RegisterHeader";
import RegisterForm from "./components/RegisterForm";

// =====================================================================
// Register.jsx: หน้าจอสมัครสมาชิก (Registration Page) - UAT-010
// รองรับข้อมูลส่วนตัว (คำนำหน้า, ชื่อ, นามสกุล, อาชีพ)
// และข้อมูลสถาบันแบบ Conditional (เฉพาะ นักเรียน, อาจารย์)
// =====================================================================

function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuthStore();

  // ฟิลด์ข้อมูลส่วนตัว
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [occupation, setOccupation] = useState("");

  // ฟิลด์ข้อมูลสถาบันการศึกษา (Conditional)
  const [institutionName, setInstitutionName] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");

  // ฟิลด์ข้อมูลบัญชีผู้ใช้
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // สถานะข้อผิดพลาดและการแจ้งเตือน
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // หากล็อกอินอยู่แล้ว ให้ redirect ไปหน้าแรกของนักเรียน
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/student/home", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // เมื่อเปลี่ยนอาชีพ: หากเปลี่ยนไปเป็นอาชีพอื่นที่ไม่ใช่ นักเรียน/นักศึกษา/อาจารย์ ให้เคลียร์ข้อมูลสถาบันทันที
  const handleOccupationChange = (newOccupation) => {
    setOccupation(newOccupation);
    const requiresInstitution =
      newOccupation === "นักเรียน" ||
      newOccupation === "นักศึกษา" ||
      newOccupation === "อาจารย์";
    if (!requiresInstitution) {
      setInstitutionName("");
      setInstitutionEmail("");
      setFieldErrors((prev) => ({
        ...prev,
        institutionName: "",
        institutionEmail: "",
      }));
    }
  };

  // รีเซ็ตฟอร์มเพื่อสมัครสมาชิกใหม่
  const handleResetForm = () => {
    setIsSuccess(false);
    setSuccessMessage("");
    setErrorMessage("");
    setTitle("");
    setFirstName("");
    setLastName("");
    setOccupation("");
    setInstitutionName("");
    setInstitutionEmail("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const errors = {};

    // 1. ตรวจสอบคำนำหน้า
    if (!title) {
      errors.title = "กรุณาเลือกคำนำหน้า";
    }

    // 2. ตรวจสอบชื่อ
    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) {
      errors.firstName = "กรุณากรอกชื่อ";
    }

    // 3. ตรวจสอบนามสกุล
    const trimmedLastName = lastName.trim();
    if (!trimmedLastName) {
      errors.lastName = "กรุณากรอกนามสกุล";
    }

    // 4. ตรวจสอบอาชีพ
    if (!occupation) {
      errors.occupation = "กรุณาเลือกอาชีพ";
    }

    // 5. ตรวจสอบข้อมูลสถาบันแบบมีเงื่อนไข (Conditional Validation)
    const isInstitutionRequired =
      occupation === "นักเรียน" ||
      occupation === "นักศึกษา" ||
      occupation === "อาจารย์";
    const trimmedInstName = institutionName.trim();
    const trimmedInstEmail = institutionEmail.trim();

    if (isInstitutionRequired) {
      if (!trimmedInstName) {
        errors.institutionName = "กรุณากรอกชื่อสถาบัน";
      }
      if (!trimmedInstEmail) {
        errors.institutionEmail = "กรุณากรอกอีเมลสถาบัน";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedInstEmail)) {
          errors.institutionEmail = "รูปแบบอีเมลสถาบันไม่ถูกต้อง";
        }
      }
    }

    // 6. ตรวจสอบอีเมลหลัก
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "กรุณากรอกอีเมล";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
      }
    }

    // 7. ตรวจสอบรหัสผ่าน
    if (!password) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    } else if (password.length < 6) {
      errors.password = "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร";
    }

    // 8. ตรวจสอบยืนยันรหัสผ่าน
    if (!confirmPassword) {
      errors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

    // หากพบ Error ให้หยุดและแสดงผล
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMessage("กรุณาตรวจสอบข้อมูลที่ระบุให้ครบถ้วนถูกต้อง");
      return;
    }

    setFieldErrors({});

    // จัดเตรียม Payload ส่งไปยัง Backend
    // หากเป็นอาชีพอื่น จะไม่ส่ง institution_name และ institution_email ไป
    const payload = {
      email: trimmedEmail,
      password,
      title,
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      occupation,
    };

    if (isInstitutionRequired) {
      payload.institution_name = trimmedInstName;
      payload.institution_email = trimmedInstEmail;
    }

    const regResult = await register(payload);

    if (regResult.success) {
      setIsSuccess(true);
      setSuccessMessage(regResult.message || "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบเพื่อเริ่มต้นใช้งาน");
      setPassword("");
      setConfirmPassword("");
    } else {
      setIsSuccess(false);
      setErrorMessage(regResult.error || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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

      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-[#E5E9E7] bg-white/95 backdrop-blur-sm p-6 sm:p-9 shadow-xl shadow-jade/10 animate-fadeIn">
        <RegisterHeader />

        <RegisterForm
          title={title}
          setTitle={setTitle}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          occupation={occupation}
          onOccupationChange={handleOccupationChange}
          institutionName={institutionName}
          setInstitutionName={setInstitutionName}
          institutionEmail={institutionEmail}
          setInstitutionEmail={setInstitutionEmail}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          isLoading={isLoading}
          errorMessage={errorMessage}
          successMessage={successMessage}
          isSuccess={isSuccess}
          onResetForm={handleResetForm}
          onSubmit={handleSubmit}
        />

        <p className="mt-6 text-center text-xs sm:text-sm text-muted">
          มีบัญชีผู้ใช้งานอยู่แล้ว?{" "}
          <Link
            to="/login"
            className="font-bold text-[#004643] hover:underline transition-colors"
          >
            เข้าสู่ระบบ
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

export default Register;
