import { useState, useEffect } from "react";
import { LuActivity } from "react-icons/lu";
import adminService from "../../../../services/adminService";
import { DEFAULT_RANGE, DailyTrendChart, describeRange, rangeToParams } from "../../../../features/reports";

/**
 * UsageOverviewSection (ข้อ 31)
 * ภาพรวมการใช้งานจากฐานข้อมูลจริง ตัวเลขและกราฟรายวันเปลี่ยนตามช่วงวันที่ที่เลือกที่หัว Dashboard
 * (เดิมอ่านค่าผิดตำแหน่ง ตัวเลขจึงเป็น 0 ตลอด และปุ่ม "กำหนดเอง" กดแล้วไม่มีอะไรเกิดขึ้น)
 */
export default function UsageOverviewSection({ dateFilter = DEFAULT_RANGE }) {
  const [usage, setUsage] = useState({
    logins: 0,
    activeLearners: 0,
    lessonViews: 0,
    quizzesSubmitted: 0,
    missionsCompleted: 0,
    engagementRate: "0%",
    uniqueLogins: 0,
    totalStudents: 0,
  });
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const data = await adminService.getUsageOverview(rangeToParams(dateFilter));
        if (isMounted && data) {
          setUsage({
            logins: data.logins ?? 0,
            activeLearners: data.activeLearners ?? 0,
            lessonViews: data.lessonViews ?? 0,
            quizzesSubmitted: data.quizzesSubmitted ?? 0,
            missionsCompleted: data.missionsCompleted ?? 0,
            engagementRate: data.engagementRate ?? "0%",
            uniqueLogins: data.uniqueLogins ?? 0,
            totalStudents: data.totalStudents ?? 0,
          });
          setSeries(data.series || []);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.response?.data?.message || "โหลดข้อมูลการใช้งานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
          setSeries([]);
          setUsage({
            logins: 0,
            activeLearners: 0,
            lessonViews: 0,
            quizzesSubmitted: 0,
            missionsCompleted: 0,
            engagementRate: "0%",
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, [dateFilter.range, dateFilter.start, dateFilter.end]);

  const current = usage;

  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5E9E7]/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
              ภาพรวมการใช้งานระบบ (Usage Overview)
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#ABD1C6]/30 text-[#004643]">
              <LuActivity className="h-3 w-3" aria-hidden="true" />
              Real-time
            </span>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5">
            สถิติการมีส่วนร่วมและการเข้าใช้งานหลักสูตร: {describeRange(dateFilter)}
          </p>
        </div>

        <span className="text-[11px] text-[#6B7773] self-start sm:self-auto">
          เปลี่ยนช่วงวันที่ได้ที่ด้านบนของหน้า
        </span>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {loadError}
        </p>
      )}

      {/* Grid of usage indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7773] block">
            การเข้าสู่ระบบ
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#26332F]">
            {current.logins}
          </div>
          <span className="text-[10px] text-[#6B7773]">
            ครั้ง · ไม่ซ้ำ {current.uniqueLogins} คน
          </span>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7773] block">
            ผู้เรียนที่เข้าใช้งาน
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#26332F]">
            {current.activeLearners}
          </div>
          <span className="text-[10px] text-[#6B7773]">คน</span>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7773] block">
            การเปิดดูบทเรียน
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#26332F]">
            {current.lessonViews}
          </div>
          <span className="text-[10px] text-[#6B7773]">ครั้ง</span>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7773] block">
            ส่งแบบทดสอบแล้ว
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#26332F]">
            {current.quizzesSubmitted}
          </div>
          <span className="text-[10px] text-[#6B7773]">ครั้ง</span>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7773] block">
            สำเร็จภารกิจ
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#26332F]">
            {current.missionsCompleted}
          </div>
          <span className="text-[10px] text-[#6B7773]">รายการ</span>
        </div>

        <div className="rounded-xl border border-[#E5E9E7] bg-[#ABD1C6]/15 p-3.5 space-y-1">
          <span className="text-[11px] font-bold text-[#004643] block">
            สัดส่วนผู้เรียนที่เข้าใช้งาน
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#004643]">
            {current.engagementRate}
          </div>
          <span className="text-[10px] text-[#004643] font-semibold">
            ของผู้เรียนทั้งหมด {current.totalStudents} คน
          </span>
        </div>
      </div>

      {/* กราฟรายวันตามช่วงที่เลือก (ข้อ 31) */}
      <DailyTrendChart series={series} isLoading={isLoading} title="แนวโน้มรายวัน" />
    </div>
  );
}
