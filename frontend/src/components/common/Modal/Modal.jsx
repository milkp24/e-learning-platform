import { useEffect } from "react";
import { LuX } from "react-icons/lu";

// ======================================================
// Modal Component (หน้าต่างป๊อปอัปมาตรฐานตาม Design System)
// ======================================================
// รองรับ:
// - Backdrop click & ESC key dismissal
// - Size variants: sm, md, lg, xl, full
// - Smooth appearance & responsive
// - Optional title, description, close button

function Modal({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  size = "md",
  showClose = true,
  className = "",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    full: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          relative w-full overflow-hidden rounded-3xl border border-[#E5E9E7] bg-white p-6 shadow-2xl transition-all
          ${sizeClasses[size] || sizeClasses.md}
          ${className}
        `.trim().replace(/\s+/g, " ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ปุ่มปิด Modal มุมบนขวา */}
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-[#6B7773] transition hover:bg-gray-100 hover:text-[#26332F] cursor-pointer"
          >
            <LuX className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {/* ส่วนหัว Title & Description */}
        {(title || description) && (
          <div className="mb-4 pr-6 space-y-1">
            {title && (
              <h3 className="text-lg sm:text-xl font-black text-[#26332F]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-[#6B7773]">
                {description}
              </p>
            )}
          </div>
        )}

        {/* เนื้อหาภายใน Modal */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
