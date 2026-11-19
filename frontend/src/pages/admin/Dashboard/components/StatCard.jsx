/**
 * StatCard Component for Admin Dashboard
 * Displays metric count, domain-specific color accents, and Jade-themed styling.
 * Supports "Coming Soon" badges and descriptive subtitles.
 *
 * Adheres strictly to the Jade Design System:
 * Primary: #ABD1C6, Text: #26332F, Muted: #6B7773, Border: #E5E9E7, Bg: #FFFFFF
 */
function StatCard({
  title,
  value,
  subtitle,
  badge,
  badgeType = "info", // "info" | "warning" | "comingSoon"
  domain = "jade", // "jade" | "teal" | "darkJade" | "slate" | "green" | "amber" | "red"
  icon: IconComponent,
  iconType = "users",
}) {
  // Domain color configs for icon background and highlights
  const domainConfig = {
    jade: {
      iconBg: "bg-[#ABD1C6]/30",
      iconColor: "text-[#004643]",
    },
    teal: {
      iconBg: "bg-teal-50",
      iconColor: "text-teal-700",
    },
    darkJade: {
      iconBg: "bg-[#26332F]/10",
      iconColor: "text-[#26332F]",
    },
    slate: {
      iconBg: "bg-slate-100",
      iconColor: "text-slate-700",
    },
    green: {
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    red: {
      iconBg: "bg-rose-50",
      iconColor: "text-rose-700",
    },
  };

  const currentDomain = domainConfig[domain] || domainConfig.jade;

  // Render SVG Icon if custom component not passed
  const renderIcon = () => {
    if (IconComponent) {
      return typeof IconComponent === "function" ? (
        <IconComponent className="h-6 w-6" />
      ) : (
        IconComponent
      );
    }

    switch (iconType) {
      case "users":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case "student":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
      case "courses":
      case "book":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "instructors":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "admin":
      case "shield":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case "check":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "clock":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "archive":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      case "alert":
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "activity":
      default:
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const isComingSoon = badge === "Coming Soon" || badge === "เร็วๆ นี้" || badgeType === "comingSoon";

  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs hover:shadow-xs transition duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-[#6B7773] truncate">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#26332F]">
              {value !== null && value !== undefined ? value : "—"}
            </h3>
          </div>
        </div>

        {/* Domain-tinted Icon Box */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${currentDomain.iconBg} ${currentDomain.iconColor} shadow-2xs`}
        >
          {renderIcon()}
        </div>
      </div>

      {/* Subtitle / Badge Row */}
      {(subtitle || badge) && (
        <div className="mt-4 pt-3 border-t border-[#E5E9E7]/60 flex items-center justify-between text-xs gap-2">
          {subtitle && (
            <span className="text-[#6B7773] truncate">{subtitle}</span>
          )}
          {badge && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                isComingSoon
                  ? "bg-amber-100/70 text-amber-800 border border-amber-200/60"
                  : "bg-[#ABD1C6]/30 text-[#004643]"
              }`}
            >
              {isComingSoon && (
                <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{badge}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
