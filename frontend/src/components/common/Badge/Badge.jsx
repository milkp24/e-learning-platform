import { isValidElement } from "react";

// ======================================================
// Badge Component (ป้ายกำกับสถานะตาม Design System)
// ======================================================
// รองรับ:
// - Variants: jade, pine, gray, warning, danger, info, success
// - Sizes: sm, md, lg
// - Optional Icon

function Badge({
  children,
  variant = "jade",
  size = "md",
  icon: Icon = null,
  className = "",
  ...rest
}) {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1 rounded-md",
    md: "px-2.5 py-1 text-xs gap-1.5 rounded-full font-bold",
    lg: "px-3.5 py-1.5 text-sm gap-2 rounded-full font-bold",
  };

  const variantStyles = {
    jade: "bg-[#ABD1C6]/35 text-[#004643] border border-[#ABD1C6]/60",
    pine: "bg-[#004643] text-white border border-[#004643]",
    gray: "bg-gray-100 text-[#26332F] border border-[#E5E9E7]",
    warning: "bg-amber-100/80 text-amber-800 border border-amber-200",
    danger: "bg-red-100/80 text-red-700 border border-red-200",
    info: "bg-sky-100/80 text-sky-800 border border-sky-200",
    success: "bg-emerald-100/80 text-emerald-800 border border-emerald-200",
  };

  return (
    <span
      className={`
        inline-flex items-center select-none font-semibold transition
        ${sizeStyles[size] || sizeStyles.md}
        ${variantStyles[variant] || variantStyles.jade}
        ${className}
      `.trim().replace(/\s+/g, " ")}
      {...rest}
    >
      {Icon && (
        <span className="shrink-0">
          {isValidElement(Icon) ? (
            Icon
          ) : typeof Icon === "function" ? (
            <Icon className="h-3 w-3" />
          ) : (
            Icon
          )}
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
