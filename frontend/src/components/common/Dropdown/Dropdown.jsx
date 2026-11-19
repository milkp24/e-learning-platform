import { useState, useRef, useEffect } from "react";

// ======================================================
// Dropdown Component (เมนูแบบป๊อปอัปตาม Design System)
// ======================================================
// รองรับ:
// - Trigger element (ปุ่ม หรือ JSX ใดๆ)
// - ปิดอัตโนมัติเมื่อคลิกนอก Element หรือกด ESC
// - การจัดตำแหน่งเมนู (align: 'left' | 'right')

function Dropdown({
  trigger,
  children,
  align = "right",
  className = "",
  contentClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* ส่วนกด Trigger */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="cursor-pointer inline-flex"
      >
        {typeof trigger === "function" ? trigger({ isOpen, setIsOpen }) : trigger}
      </div>

      {/* กล่องเนื้อหา Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute mt-2 min-w-[180px] rounded-2xl border border-[#E5E9E7] bg-white p-2 shadow-xl z-50 animate-fadeIn
            ${align === "right" ? "right-0" : "left-0"}
            ${contentClassName}
          `.trim().replace(/\s+/g, " ")}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
