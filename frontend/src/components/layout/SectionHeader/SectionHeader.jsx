import { Link } from "react-router-dom";

// ======================================================
// SectionHeader Component (ส่วนหัวของแต่ละหมวดหมู่)
// ใช้ซ้ำได้กับ Guest, Student, Instructor, Admin
// รองรับ: หัวข้อหลัก, คำอธิบายย่อย, Badge, และปุ่ม Action (Link หรือ Button)
// ======================================================

function SectionHeader({
  title,
  subtitle,
  badge,
  actionText,
  actionLink,
  onAction,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200/80 pb-4 ${className}`}
    >
      <div className="space-y-1">
        {badge && (
          <span className="inline-block rounded-full bg-[#ABD1C6]/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#004643]">
            {badge}
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1F2937]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Button / Link ทางขวามือ */}
      {actionText && (
        <div className="shrink-0">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#004643] transition hover:text-[#456F65] hover:underline"
            >
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              onClick={onAction}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs sm:text-sm font-bold text-[#20302C] shadow-sm transition hover:bg-[#9CC5B9] active:scale-98"
            >
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
