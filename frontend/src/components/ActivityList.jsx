import { Link } from "react-router-dom";

// ======================================================
// ActivityList Component (รายการกิจกรรมหรือบันทึกล่าสุด)
// ======================================================
// ใช้แสดงผลกิจกรรมล่าสุด:
// - Student: บันทึกการเรียนรู้ (Journal) ล่าสุด, บทเรียนที่เพิ่งเรียน
// - Instructor: นักเรียนที่เพิ่งลงทะเบียน, การอัปเดตบทเรียน
// - Admin: ผู้ใช้ที่เพิ่งสมัคร, กิจกรรมสำคัญในระบบ
// รองรับ Empty State และไอคอนแยกตามประเภทกิจกรรม

function ActivityList({
  items = [],
  title = "กิจกรรมล่าสุด",
  subtitle = null,
  emptyMessage = "ยังไม่มีกิจกรรมล่าสุดในขณะนี้",
  actionText = null,
  actionLink = null,
  maxItems = 5,
  className = "",
}) {
  const displayItems = items.slice(0, maxItems);

  // ฟังก์ชันเลือกสไตล์ไอคอนตามประเภทกิจกรรม
  const getActivityIcon = (type) => {
    switch (type) {
      case "journal":
        return {
          bg: "bg-[#ABD1C6]/30 text-[#004643]",
          svg: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          ),
        };
      case "lesson":
        return {
          bg: "bg-[#004643]/15 text-[#004643]",
          svg: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
      case "enrollment":
        return {
          bg: "bg-emerald-100 text-emerald-700",
          svg: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          ),
        };
      case "user":
        return {
          bg: "bg-blue-100 text-blue-700",
          svg: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          ),
        };
      default:
        return {
          bg: "bg-gray-100 text-gray-600",
          svg: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ),
        };
    }
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-sm ${className}`}
    >
      {/* ส่วนหัวของการ์ด */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#1F2937]">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actionText && actionLink && (
          <Link
            to={actionLink}
            className="text-xs font-bold text-[#004643] transition hover:underline"
          >
            {actionText} →
          </Link>
        )}
      </div>

      {/* รายการกิจกรรม */}
      {displayItems.length > 0 ? (
        <div className="mt-4 divide-y divide-gray-100">
          {displayItems.map((item, index) => {
            const iconConfig = getActivityIcon(item.type);
            const content = (
              <div className="group flex items-start gap-3.5 py-3 transition hover:bg-gray-50/80 -mx-2 px-2 rounded-xl">
                {/* ไอคอนประเภทกิจกรรม */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${iconConfig.bg}`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {iconConfig.svg}
                  </svg>
                </div>

                {/* ข้อความกิจกรรม */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#004643] transition">
                      {item.title}
                    </p>
                    {item.badge && (
                      <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="line-clamp-1 text-xs text-gray-500">
                      {item.description}
                    </p>
                  )}
                  {item.timestamp && (
                    <p className="text-[11px] text-gray-400">
                      {item.timestamp}
                    </p>
                  )}
                </div>
              </div>
            );

            return item.link ? (
              <Link key={item.id ?? index} to={item.link} className="block">
                {content}
              </Link>
            ) : (
              <div key={item.id ?? index}>{content}</div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-gray-500 font-medium">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
}

export default ActivityList;
