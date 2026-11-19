import { isValidElement } from "react";
import { LuInbox } from "react-icons/lu";

// ======================================================
// EmptyState Component (แสดงผลเมื่อไม่พบข้อมูล)
// ======================================================
// รองรับ:
// - Icon (SVG Component)
// - Title & Description
// - Action element (เช่น Button สำหรับเพิ่มข้อมูลใหม่)

function EmptyState({
  icon = <LuInbox className="h-8 w-8 text-[#004643]" aria-hidden="true" />,
  title = "ไม่พบข้อมูล",
  description = "ยังไม่มีรายการในขณะนี้",
  action = null,
  className = "",
}) {
  const renderIcon = () => {
    if (isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === "function") {
      const IconComponent = icon;
      return <IconComponent className="h-8 w-8 text-[#004643]" aria-hidden="true" />;
    }
    return <span>{icon}</span>;
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E5E9E7] bg-white p-8 sm:p-12 text-center
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ABD1C6]/30 text-3xl shadow-xs">
        {renderIcon()}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#26332F]">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#6B7773] leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
