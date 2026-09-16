import { Link } from "react-router-dom";

// ======================================================
// StatCard Component (การ์ดแสดงตัวเลขสถิติ)
// ======================================================
// ใช้แสดงผล Key Metric บน Dashboard ของทุกบทบาท:
// - Student: คอร์สที่ลงทะเบียน, บทเรียนที่เรียนจบ, บันทึกการเรียนรู้ (Journal)
// - Instructor: คอร์สที่รับผิดชอบ, จำนวนนักเรียนรวม, บทเรียนทั้งหมด
// - Admin: ผู้ใช้ทั้งหมด, จำนวนคอร์ส, บทบาทในระบบ, สถานะเซสชัน

function StatCard({
  title,
  value,
  icon: Icon = null,
  trend = null,
  trendType = "neutral", // "up" | "down" | "neutral"
  theme = "jade", // "jade" | "pine" | "blue" | "amber" | "gray"
  description = null,
  actionLink = null,
  actionText = "ดูเพิ่มเติม",
  className = "",
}) {
  // ธีมสีสำหรับกล่องไอคอน
  const themeStyles = {
    jade: {
      iconBg: "bg-[#ABD1C6]/30 text-[#004643]",
      border: "hover:border-[#ABD1C6]/60",
    },
    pine: {
      iconBg: "bg-[#004643]/10 text-[#004643]",
      border: "hover:border-[#004643]/40",
    },
    blue: {
      iconBg: "bg-blue-50 text-blue-600",
      border: "hover:border-blue-200",
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-200",
    },
    gray: {
      iconBg: "bg-gray-100 text-gray-600",
      border: "hover:border-gray-300",
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.jade;

  // สีของเทรนด์ (บวก / ลบ / ปกติ)
  const trendColor = {
    up: "text-emerald-600 bg-emerald-50",
    down: "text-rose-600 bg-rose-50",
    neutral: "text-gray-600 bg-gray-50",
  }[trendType] || "text-gray-600 bg-gray-50";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm transition duration-200 hover:shadow-md ${currentTheme.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#1F2937]">
              {value}
            </span>
          </div>
        </div>

        {/* กล่องไอคอน */}
        {Icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${currentTheme.iconBg}`}
          >
            {typeof Icon === "function" || typeof Icon === "object" ? (
              <Icon className="h-6 w-6" />
            ) : (
              Icon
            )}
          </div>
        )}
      </div>

      {/* ส่วนเทรนด์ หรือคำอธิบายเพิ่มเติม */}
      {(trend || description) && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          {trend && (
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${trendColor}`}>
              {trendType === "up" && "↑ "}
              {trendType === "down" && "↓ "}
              {trend}
            </span>
          )}
          {description && (
            <span className="text-gray-500">{description}</span>
          )}
        </div>
      )}

      {/* ปุ่มนำทางไปหน้ารายละเอียด (ถ้ามี) */}
      {actionLink && (
        <div className="mt-4 border-t border-gray-100 pt-3">
          <Link
            to={actionLink}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#004643] hover:underline"
          >
            <span>{actionText}</span>
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default StatCard;
