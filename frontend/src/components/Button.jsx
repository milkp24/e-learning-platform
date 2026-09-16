import { isValidElement } from "react";
import { Link } from "react-router-dom";

// ======================================================
// Button Component (ปุ่มมาตรฐานตาม Design System)
// ======================================================
// ยึด Palette สีหลัก:
// - Primary: #ABD1C6 (Jade) ตัวหนังสือสี #20302C
// - Secondary: #004643 (Deep Pine) ตัวหนังสือสีขาว
// - Outline: ขอบสี #ABD1C6 หรือเทา ตัวหนังสือ #004643
// - Ghost: พื้นหลังโปร่งใส เน้น hover
// - Danger: สีแดงสำหรับ Action ที่มีความเสี่ยง
// รองรับ: Link (to), External Link (href), Button ปกติ, Loading Spinner, และ Icon

function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  to,
  href,
  onClick,
  disabled = false,
  loading = false,
  icon: Icon = null,
  iconRight: IconRight = null,
  fullWidth = false,
  className = "",
  ...rest
}) {
  // สไตล์ขนาดของปุ่ม
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-6 py-3.5 text-base font-bold rounded-xl gap-2.5",
  };

  // สไตล์สีและ Variant ของปุ่ม
  const variantStyles = {
    primary:
      "bg-[#ABD1C6] text-[#20302C] font-bold shadow-sm hover:bg-[#9CC5B9] active:scale-98 focus:ring-2 focus:ring-[#ABD1C6]/50",
    secondary:
      "bg-[#004643] text-white font-bold shadow-sm hover:bg-[#003835] active:scale-98 focus:ring-2 focus:ring-[#004643]/50",
    outline:
      "border-2 border-[#ABD1C6] text-[#004643] font-bold hover:bg-[#ABD1C6]/15 active:scale-98 focus:ring-2 focus:ring-[#ABD1C6]/50",
    outlineDark:
      "border border-gray-300 text-[#26332F] font-medium hover:bg-gray-50 active:scale-98 focus:ring-2 focus:ring-gray-200",
    ghost:
      "text-[#004643] font-bold hover:bg-gray-100 active:scale-98 focus:ring-2 focus:ring-gray-200",
    danger:
      "bg-red-600 text-white font-bold shadow-sm hover:bg-red-700 active:scale-98 focus:ring-2 focus:ring-red-300",
  };

  const baseStyle =
    "inline-flex items-center justify-center transition duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-inherit";

  const appliedClass = `
    ${baseStyle}
    ${sizeStyles[size] || sizeStyles.md}
    ${variantStyles[variant] || variantStyles.primary}
    ${fullWidth ? "w-full" : ""}
    ${className}
  `.trim().replace(/\s+/g, " ");

  // Spinner ขณะกำลังโหลดข้อมูล
  const spinner = (
    <svg
      className="animate-spin h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const content = (
    <>
      {loading ? (
        spinner
      ) : Icon ? (
        isValidElement(Icon) ? (
          Icon
        ) : typeof Icon === "function" ? (
          <Icon className="shrink-0" />
        ) : (
          Icon
        )
      ) : null}
      <span>{children}</span>
      {!loading && IconRight ? (
        isValidElement(IconRight) ? (
          IconRight
        ) : typeof IconRight === "function" ? (
          <IconRight className="shrink-0" />
        ) : (
          IconRight
        )
      ) : null}
    </>
  );

  // กรณีเป็น React Router Link
  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={appliedClass} {...rest}>
        {content}
      </Link>
    );
  }

  // กรณีเป็น External Anchor tag
  if (href && !disabled && !loading) {
    return (
      <a href={href} className={appliedClass} {...rest}>
        {content}
      </a>
    );
  }

  // กรณีเป็นปุ่ม HTML ธรรมดา
  return (
    <button
      type={type}
      className={appliedClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {content}
    </button>
  );
}

export default Button;
