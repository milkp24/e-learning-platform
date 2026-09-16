import { useEffect } from "react";
import { Link } from "react-router-dom";

// ======================================================
// GuestLockModal Component
// ======================================================
// หน้าที่:
// - แสดงป๊อปอัปแจ้งเตือนเมื่อผู้เยี่ยมชม (Guest) คลิกฟังก์ชันที่ต้องเข้าสู่ระบบ
// - รองรับข้อความปรับเปลี่ยนได้ตามฟังก์ชัน (Course, Virtual Lab, Live, Quest, XP)
// - มีปุ่มไปยังหน้า "สมัครสมาชิก" (/register) และ "เข้าสู่ระบบ" (/login)
// - ใช้งาน Design System ของโปรเจกต์ (#004643, #ABD1C6, #26332F)

function GuestLockModal({
  isOpen = false,
  onClose,
  title = "กรุณาสมัครสมาชิกเพื่อใช้งานฟังก์ชันนี้",
  message = "ฟังก์ชันนี้สงวนสิทธิ์เฉพาะสมาชิกเท่านั้น สมัครสมาชิกฟรีเพื่อเริ่มเรียนรู้ ใช้งานห้องทดลองเสมือนจริง และสะสมคะแนน",
  badge = "สมาชิกเท่านั้น (Members Only)",
}) {
  // ดักจับปุ่ม Esc เพื่อปิด Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 text-center shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ปุ่มปิด Modal มุมขวาบน */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          ✕
        </button>

        {/* ไอคอนรูปกุญแจล็อก */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 text-2xl shadow-xs">
          🔒
        </div>

        {/* Badge แจ้งเตือนสิทธิ์ */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/70 px-3 py-1 text-xs font-bold text-amber-800">
          <span>{badge}</span>
        </div>

        {/* หัวข้อและคำอธิบาย */}
        <div className="space-y-2 mt-3">
          <h3 className="text-xl font-black text-[#1F2937] leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* ปุ่ม Action: สมัครสมาชิก และ เข้าสู่ระบบ */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="flex-1 rounded-xl bg-[#004643] py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#003835] active:scale-98 text-center"
          >
            สมัครสมาชิก
          </Link>

          <Link
            to="/login"
            className="flex-1 rounded-xl border border-gray-300 py-2.5 px-4 text-xs sm:text-sm font-bold text-gray-700 transition hover:bg-gray-100 text-center"
          >
            เข้าสู่ระบบ
          </Link>
        </div>

        {/* ปุ่มปิดเพื่อกลับไปดูต่อ */}
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition underline cursor-pointer"
          >
            สำรวจดูฟังก์ชันอื่นต่อในฐานะผู้เยี่ยมชม
          </button>
        </div>
      </div>
    </div>
  );
}

export default GuestLockModal;
