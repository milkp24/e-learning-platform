import { Link } from "react-router-dom";

// ======================================================
// Footer Component (ส่วนท้ายของเว็บไซต์)
// ใช้งานร่วมกันทั้ง Guest Home และหน้าสมาชิก
// มีทั้งโหมดเต็ม (Full) และโหมดมินิมอล (Simple)
// ======================================================

function Footer({ simple = false }) {
  if (simple) {
    return (
      <footer className="border-t border-gray-200 bg-white py-6 px-6 text-center text-xs text-gray-500">
        <p>
          © {new Date().getFullYear()} E-learning Platform. สงวนลิขสิทธิ์ทุกประการ
        </p>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[#E5E9E7] bg-white px-6 py-10 sm:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Logo & About */}
          <div className="space-y-3 max-w-sm">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/images/logo.svg"
                alt="Logo"
                className="h-8 w-8 rounded-xl object-contain object-center shadow-xs"
              />
              <span className="text-xl font-bold tracking-tight text-[#26332F]">
                E-learning <span className="text-[#004643]">Platform</span>
              </span>
            </Link>
            <p className="text-xs text-[#6B7773] leading-relaxed">
              แพลตฟอร์มสำหรับเรียนรู้ Coding และพัฒนาทักษะผ่านการลงมือทำ ครอบคลุมบทเรียนคุณภาพ แบบฝึกหัดจริง และระบบติดตามความคืบหน้าอย่างเป็นระบบ
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs text-[#6B7773]">
            <div>
              <h4 className="font-bold text-[#26332F] uppercase tracking-wider mb-3">
                การเรียนรู้
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/classrooms" className="hover:text-[#004643] transition">
                    คอร์สเรียน
                  </Link>
                </li>
                <li>
                  <a href="#why-us" className="hover:text-[#004643] transition">
                    เกี่ยวกับเรา
                  </a>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#004643] transition">
                    สมัครสมาชิก
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#004643] transition">
                    เข้าสู่ระบบ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#26332F] uppercase tracking-wider mb-3">
                บทบาทในระบบ
              </h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-[#6B7773]">ผู้เรียน (Student)</span>
                </li>
                <li>
                  <span className="text-[#6B7773]">อาจารย์ผู้สอน (Instructor)</span>
                </li>
                <li>
                  <Link
                    to="/admin/login"
                    className="text-[#6B7773] hover:text-[#004643] transition"
                  >
                    ผู้ดูแลระบบ (Admin)
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#26332F] uppercase tracking-wider mb-3">
                เกี่ยวกับระบบ
              </h4>
              <ul className="space-y-2">
                <li className="text-[#6B7773]">การฝึกปฏิบัติการจริง</li>
                <li className="text-[#6B7773]">ความปลอดภัยข้อมูล</li>
                <li>
                  <Link to="/help" className="hover:text-[#004643] transition">
                    คำถามที่พบบ่อย
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E5E9E7] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7773]">
          <p>© {new Date().getFullYear()} E-learning Platform. สงวนลิขสิทธิ์ทุกประการ</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[#004643] transition">นโยบายความเป็นส่วนตัว</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-[#004643] transition">ข้อกำหนดการใช้งาน</Link>
            <span>•</span>
            <Link to="/help" className="hover:text-[#004643] transition">ศูนย์ช่วยเหลือ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
