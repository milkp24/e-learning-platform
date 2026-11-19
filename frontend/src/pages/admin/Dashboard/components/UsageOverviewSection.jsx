import { useState, useEffect } from "react";
import {
  LuTrendingUp,
  LuActivity,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";

/**
 * UsageOverviewSection
 * Displays platform usage trends with dynamic date filter from real backend database
 */
export default function UsageOverviewSection({ dateFilter = "7d", setDateFilter }) {
  const [usage, setUsage] = useState({
    logins: 0,
    activeLearners: 0,
    lessonViews: 0,
    quizzesSubmitted: 0,
    missionsCompleted: 0,
    engagementRate: "0%",
  });
  // Label for date range
  const rangeLabels = {
    today: "วันนี้ (24 ชั่วโมงที่ผ่านมา)",
    "7d": "7 วันที่ผ่านมา",
    "30d": "30 วันที่ผ่านมา",
    custom: "ช่วงเวลาที่กำหนดเอง",
  };

  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        const data = await adminService.getUsageOverview({ range: dateFilter });
        if (isMounted && data) {
          setUsage({
            logins: data.logins ?? 0,
            activeLearners: data.activeLearners ?? 0,
            lessonViews: data.lessonViews ?? 0,
            quizzesSubmitted: data.quizzesSubmitted ?? 0,
            missionsCompleted: data.missionsCompleted ?? 0,
            engagementRate: data.engagementRate ?? "0%",
          });
        }
      } catch (err) {
        console.error("Failed to fetch real usage overview:", err);
        if (isMounted) {
          setUsage({
            logins: 0,
            activeLearners: 0,
            lessonViews: 0,
            quizzesSubmitted: 0,
            missionsCompleted: 0,
            engagementRate: "0%",
          });
        }
      }
    };

    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, [dateFilter]);

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
            สถิติการมีส่วนร่วมและการเข้าใช้งานหลักสูตรในช่วง {rangeLabels[dateFilter]}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="inline-flex rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-1 self-start sm:self-auto">
          {[
            { id: "today", label: "วันนี้" },
            { id: "7d", label: "7 วัน" },
            { id: "30d", label: "30 วัน" },
            { id: "custom", label: "กำหนดเอง" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDateFilter?.(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                dateFilter === tab.id
                  ? "bg-white text-[#004643] shadow-2xs font-bold border border-[#E5E9E7]"
                  : "text-[#6B7773] hover:text-[#26332F]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of usage indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 space-y-1">
          <span className="text-[11px] font-semibold text-[#6B7773] block">
            การเข้าสู่ระบบ
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#26332F]">
            {current.logins}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
            <LuTrendingUp className="h-3 w-3" /> ปกติ
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
          <span className="text-[10px] text-emerald-600 font-semibold">
            ประเมินผลสำเร็จ
          </span>
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
            อัตราความต่อเนื่อง
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#004643]">
            {current.engagementRate}
          </div>
          <span className="text-[10px] text-[#004643] font-semibold">
            ระดับสูงมาก
          </span>
        </div>
      </div>
    </div>
  );
}
