import { isValidElement, forwardRef } from "react";

// ======================================================
// Input Component (ช่องกรอกข้อมูลมาตรฐานตาม Design System)
// ======================================================
// รองรับ:
// - Label, Error message, Helper text
// - Left Icon, Right Icon / Action (เช่น สลับดูรหัสผ่าน)
// - Focus ring ธีม Jade (#ABD1C6)
// - สถานะ Disabled, Required, FullWidth

const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    error,
    helperText,
    icon: Icon = null,
    iconRight: IconRight = null,
    disabled = false,
    required = false,
    fullWidth = true,
    className = "",
    inputClassName = "",
    ...rest
  },
  ref
) {
  const inputId = id || name;

  return (
    <div className={`space-y-1.5 ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#26332F]"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-3.5 flex items-center text-[#6B7773]">
            {isValidElement(Icon) ? (
              Icon
            ) : typeof Icon === "function" ? (
              <Icon className="h-4 w-4" />
            ) : (
              Icon
            )}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#26332F] placeholder-[#6B7773]/60 transition outline-none
            ${Icon ? "pl-10" : ""}
            ${IconRight ? "pr-10" : ""}
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-[#E5E9E7] focus:border-[#ABD1C6] focus:ring-2 focus:ring-[#ABD1C6]/40"
            }
            ${disabled ? "cursor-not-allowed bg-gray-100 opacity-60" : ""}
            ${inputClassName}
          `.trim().replace(/\s+/g, " ")}
          {...rest}
        />

        {IconRight && (
          <div className="absolute right-3.5 flex items-center text-[#6B7773]">
            {isValidElement(IconRight) ? (
              IconRight
            ) : typeof IconRight === "function" ? (
              <IconRight className="h-4 w-4" />
            ) : (
              IconRight
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#6B7773]">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
