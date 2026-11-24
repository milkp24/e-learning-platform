import { useEffect, useState } from "react";
import ReportsHeader from "./components/ReportsHeader";
import ReportsMetricsSection from "./components/ReportsMetricsSection";
import PopularCoursesSection from "./components/PopularCoursesSection";
import adminService from "../../../services/adminService";
import { notify } from "../../../store/useToastStore";
import {
  DEFAULT_RANGE,
  DailyTrendChart,
  DateRangeFilter,
  describeRange,
  rangeToParams,
} from "../../../features/reports";

/**
 * Reports Page (ข้อ 31, 32): รายงานและสถิติจากข้อมูลจริง
 * - เลือกช่วงวันที่ได้ (วันนี้ / 7 วัน / 30 วัน / กำหนดเอง) ทุกตัวเลขและกราฟเปลี่ยนตามช่วง
 * - API: GET /api/v1/admin/reports/summary และ /api/v1/admin/reports/export (CSV)
 * - PDF: พิมพ์หน้านี้ด้วยเบราว์เซอร์ (ซ่อนเมนูและปุ่มตอนพิมพ์) แล้วเลือก "บันทึกเป็น PDF"
 */
function Reports() {
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError("");
    adminService
      .getReportsSummary(rangeToParams(range))
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((err) => {
        if (active) {
          setReport(null);
          setError(err.response?.data?.message || "โหลดรายงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range.range, range.start, range.end]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const filename = await adminService.downloadReportCsv(rangeToParams(range));
      notify.show("success", `ดาวน์โหลด ${filename} แล้ว`);
    } catch (err) {
      notify.show("error", err.response?.data?.message || "ส่งออก CSV ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    notify.show("info", 'เลือกปลายทาง "บันทึกเป็น PDF" ในหน้าต่างพิมพ์');
    setTimeout(() => window.print(), 300);
  };

  const generatedAt = report?.generatedAt
    ? new Date(report.generatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
    : "";

  return (
    <div className="space-y-6 report-print">
      <ReportsHeader
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        disabled={isLoading || !report}
      />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="text-xs text-[#6B7773]">
          <p className="font-bold text-[#26332F] text-sm">ช่วงวันที่: {describeRange(range)}</p>
          {generatedAt && <p className="mt-0.5">ข้อมูล ณ {generatedAt}</p>}
        </div>
        <div className="print:hidden">
          <DateRangeFilter value={range} onChange={setRange} showCaption={false} />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <ReportsMetricsSection metrics={report?.metrics} isLoading={isLoading} />

      <div className="break-inside-avoid">
        <DailyTrendChart series={report?.series || []} isLoading={isLoading} title="กิจกรรมรายวัน" />
      </div>

      <PopularCoursesSection courses={report?.courses || []} isLoading={isLoading} />
    </div>
  );
}

export default Reports;
