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
          © {new Date().getFullYear()} E-learning Platform — Phase 1 Architecture. สงวนลิขสิทธิ์
        </p>
      </footer>
    );
  }

  return (
    <footer className="border-t border-gray-200 bg-white px-6 py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Logo & About */}
          <div className="space-y-3 max-w-sm">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/images/logo.svg"
                alt="Logo"
                className="h-8 w-8 rounded-xl object-contain shadow-sm"
              />
              <span className="text-xl font-bold tracking-tight text-[#1F2937]">
                E-learning <span className="text-[#6FA99A]">Platform</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              แพลตฟอร์มการเรียนรู้ออนไลน์ระดับมืออาชีพ รองรับสถาปัตยกรรม 4 ลำดับชั้น: Course → Chapter → Episode → Content พร้อมระบบความปลอดภัยระดับมาตรฐานสากล
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs text-gray-600">
            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">
                การเรียนรู้
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/classrooms" className="hover:text-[#004643] transition">
                    คอร์สเรียนทั้งหมด
                  </Link>
                </li>
                <li>
                  <Link to="/journals" className="hover:text-[#004643] transition">
                    บันทึกการเรียนรู้
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">
                บทบาทในระบบ
              </h4>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-500">Student (ผู้เรียน)</span>
                </li>
                <li>
                  <span className="text-gray-500">Instructor (ผู้สอน)</span>
                </li>
                <li>
                  <span className="text-gray-500">Admin (ผู้ดูแลระบบ)</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3">
                ความปลอดภัย
              </h4>
              <ul className="space-y-2">
                <li className="text-gray-500">JWT Token Rotation</li>
                <li className="text-gray-500">Safe YouTube Sandbox</li>
                <li className="text-gray-500">Session Idle Timeout</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} E-learning Platform — Phase 1 Scope. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>สภาพแวดล้อม: Development</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">PostgreSQL & Flask RESTful API</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
