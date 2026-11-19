import { Link } from "react-router-dom";
import { LuBot } from "react-icons/lu";

function RegisterHeader() {
  return (
    <div className="text-left">
      {/* โลโก้เว็บไซต์ */}
      <Link
        to="/"
        className="inline-flex items-center gap-3 text-xl sm:text-2xl font-black text-dark transition hover:opacity-90 group"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-jade/30 text-[#004643] shadow-xs ring-1 ring-jade/50 transition-transform group-hover:scale-105">
          <LuBot className="h-6 w-6" aria-hidden="true" />
        </span>
        <span>
          E-learning <span className="text-[#004643]">Platform</span>
        </span>
      </Link>

      {/* หัวข้อหน้าจอ */}
      <h1 className="mt-6 sm:mt-7 text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
        สมัครสมาชิก
      </h1>
      <p className="mt-1.5 text-xs sm:text-sm text-muted">
        สร้างบัญชีใหม่เพื่อเริ่มต้นการเรียนรู้
      </p>
    </div>
  );
}

export default RegisterHeader;
