import { useState, useEffect } from "react";
import { LuActivity, LuCalendar, LuChartColumn } from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * ActivityChart Component
 *
 * กราฟสำหรับหน้า Dashboard ของ Super Admin
 * แสดงจำนวนบัญชีที่มีการใช้งานระบบจริงในแต่ละวันจาก PostgreSQL (audit_logs + refresh_tokens)
 *
 * Single Source of Truth:
 * ข้อมูลดึงจากฐานข้อมูลจริงผ่าน API GET /api/v1/admin/dashboard/daily-activity
 * หากยังไม่มีประวัติการใช้งานจะแสดงสถานะ "ยังไม่มีข้อมูลกิจกรรมรายวัน"
 */
function ActivityChart({ dailyActivity: propDailyActivity }) {
  const [activityData, setActivityData] = useState(propDailyActivity || null);
  const [isLoading, setIsLoading] = useState(!propDailyActivity);
  const [activeDay, setActiveDay] = useState(null);

  useEffect(() => {
    if (propDailyActivity !== undefined && propDailyActivity !== null) {
      setActivityData(propDailyActivity);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await adminService.getDailyActivity();
        if (isMounted) setActivityData(data);
      } catch (err) {
        console.error("Failed to load daily activity:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [propDailyActivity]);

  const daysData = activityData?.days || [];
  const hasData = Boolean(activityData?.hasData && daysData.some((d) => Number(d.count) > 0));

  // กำหนดวันที่เลือกเริ่มต้นเป็นวันล่าสุด
  const currentActiveIndex =
    activeDay !== null && activeDay >= 0 && activeDay < daysData.length
      ? activeDay
      : daysData.length > 0
      ? daysData.length - 1
      : 0;

  // หาจำนวนบัญชีสูงสุดเพื่อคำนวณความสูงแท่งกราฟ
  const maxVal = Math.max(...daysData.map((item) => Number(item.count) || 0), 1);

  // คำนวณค่าเฉลี่ย
  const total = daysData.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const average =
    activityData?.average !== undefined
      ? activityData.average
      : daysData.length > 0
      ? Math.round((total / daysData.length) * 10) / 10
      : 0;

  // หาวันที่มีจำนวนสูงสุด
  const peakDay =
    activityData?.peakDay ||
    (daysData.length > 0
      ? daysData.reduce((peak, item) => (item.count > peak.count ? item : peak))
      : null);

  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-full">
      {/* =====================================================
          ส่วนหัวของกราฟ
      ====================================================== */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E9E7]">
        <div>
          <div className="flex items-center gap-2">
            <LuActivity className="h-4 w-4 text-[#004643]" aria-hidden="true" />
            <h3 className="text-base sm:text-lg font-black text-[#26332F]">
              บัญชีที่ใช้งานอยู่ (Active Accounts)
            </h3>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5">
            จำนวนบัญชีที่มีการใช้งานระบบจริงรายวัน (PostgreSQL)
          </p>
        </div>

        {/* ช่วงเวลาของข้อมูล */}
        <div className="shrink-0 flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-2.5 py-1 text-xs font-semibold text-[#26332F]">
          <LuCalendar className="h-3 w-3 text-[#5F8F84]" aria-hidden="true" />
          <span>7 วันย้อนหลัง</span>
        </div>
      </div>

      {/* =====================================================
          พื้นที่แสดงผล (กราฟจริง หรือ สถานะว่าง)
      ====================================================== */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#ABD1C6] border-t-transparent animate-spin mb-2" />
          <p className="text-xs text-[#6B7773]">กำลังโหลดข้อมูลกิจกรรม...</p>
        </div>
      ) : !hasData ? (
        <div className="py-14 flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ABD1C6]/20 border border-[#ABD1C6]/30 flex items-center justify-center text-[#004643] mb-3">
            <LuChartColumn className="w-6 h-6" aria-hidden="true" />
          </div>
          <h4 className="text-sm font-bold text-[#26332F]">
            ยังไม่มีข้อมูลกิจกรรมรายวัน
          </h4>
          <p className="text-xs text-[#6B7773] mt-1 max-w-xs leading-relaxed">
            ระบบจะบันทึกและแสดงสถิติการใช้งานจริงเมื่อมีผู้ใช้งานเข้าสู่ระบบหรือทำกิจกรรมในระบบ
          </p>
        </div>
      ) : (
        <div className="pt-8 pb-3">
          <div className="relative h-48 w-full flex items-end justify-between gap-2 sm:gap-4 px-2">
            {/* เส้นแนวนอนสำหรับช่วยอ่านค่าของกราฟ */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={line} className="w-full border-b border-[#E5E9E7]" />
              ))}
            </div>

            {/* แสดงแท่งกราฟของแต่ละวัน */}
            {daysData.map((item, index) => {
              const countNum = Number(item.count) || 0;
              // คำนวณความสูงแท่งกราฟ (ขั้นต่ำ 6% เพื่อให้มองเห็นแท่งที่มีค่า 0)
              const heightPercent =
                countNum === 0
                  ? 4
                  : Math.max((countNum / maxVal) * 100, 8);

              const isSelected = currentActiveIndex === index;

              return (
                <div
                  key={item.date || item.day || index}
                  className="relative z-10 flex-1 flex flex-col items-center group cursor-pointer h-full justify-end"
                  onMouseEnter={() => setActiveDay(index)}
                  onFocus={() => setActiveDay(index)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${item.day}: ${item.label || `${countNum} บัญชี`}`}
                >
                  {/* Tooltip แสดงข้อมูล */}
                  <div
                    className={`
                      absolute
                      -top-10
                      px-2.5
                      py-1.5
                      rounded-lg
                      bg-[#26332F]
                      text-white
                      text-[11px]
                      font-bold
                      shadow-md
                      whitespace-nowrap
                      transition-all
                      duration-150
                      pointer-events-none
                      ${
                        isSelected
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95"
                      }
                    `}
                  >
                    {item.label || `${countNum} บัญชี`}
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-[#26332F]" />
                  </div>

                  {/* แท่งกราฟ */}
                  <div className="w-full max-w-[40px] h-full flex items-end justify-center rounded-t-xl overflow-hidden bg-[#F3F6F5]">
                    <div
                      style={{
                        height: `${heightPercent}%`,
                      }}
                      className={`
                        w-full
                        rounded-t-xl
                        transition-all
                        duration-300
                        ${
                          isSelected
                            ? "bg-[#5F8F84] shadow-sm"
                            : countNum > 0
                            ? "bg-[#ABD1C6] group-hover:bg-[#7EADA2]"
                            : "bg-[#D1DDD9]"
                        }
                      `}
                    />
                  </div>

                  {/* ชื่อวัน */}
                  <span
                    className={`
                      mt-3
                      text-xs
                      font-bold
                      transition
                      ${
                        isSelected
                          ? "text-[#26332F]"
                          : "text-[#6B7773]"
                      }
                    `}
                  >
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================
          สรุปข้อมูลด้านล่างกราฟ
      ====================================================== */}
      <div className="mt-4 pt-3 border-t border-[#E5E9E7] grid grid-cols-2 gap-4">
        {/* จำนวนเฉลี่ย */}
        <div>
          <p className="text-[10px] uppercase tracking-wide font-bold text-[#6B7773]">
            ค่าเฉลี่ย
          </p>
          <p className="mt-0.5 text-sm font-black text-[#26332F]">
            {hasData ? `${average.toLocaleString()} บัญชี/วัน` : "-"}
          </p>
        </div>

        {/* วันที่มีจำนวนสูงที่สุด */}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide font-bold text-[#6B7773]">
            สูงสุด
          </p>
          <p className="mt-0.5 text-sm font-black text-[#26332F]">
            {hasData && peakDay
              ? `${peakDay.day} (${(Number(peakDay.count) || 0).toLocaleString()} บัญชี)`
              : "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ActivityChart;
