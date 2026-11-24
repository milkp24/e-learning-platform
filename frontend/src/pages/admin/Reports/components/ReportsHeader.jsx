import PropTypes from "prop-types";
import { LuDownload, LuPrinter } from "react-icons/lu";
import PageHeader from "../../../../components/layout/PageHeader";

/**
 * ReportsHeader (ข้อ 32)
 * - ส่งออก CSV: ดาวน์โหลดไฟล์จาก Backend (ข้อมูลจริงตามช่วงวันที่ เปิดใน Excel ภาษาไทยได้)
 * - ส่งออก PDF: เปิดหน้าต่างพิมพ์ของเบราว์เซอร์ เลือก "บันทึกเป็น PDF" (จัดหน้าสำหรับพิมพ์ไว้แล้ว)
 */
function ReportsHeader({ onExportCsv, onExportPdf, isExporting = false, disabled = false }) {
  return (
    <PageHeader
      title="รายงานและสถิติวิเคราะห์"
      description="สถิติการใช้งานระบบ การลงทะเบียน อัตราเรียนจบ และกิจกรรมของผู้เรียน จากข้อมูลจริงในระบบ"
      badge="ข้อมูลสถิติ"
    >
      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={onExportCsv}
          disabled={disabled || isExporting}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-gray-50 active:scale-98 transition cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LuDownload className="h-4 w-4" aria-hidden="true" />
          {isExporting ? "กำลังสร้างไฟล์..." : "ส่งออก CSV"}
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LuPrinter className="h-4 w-4" aria-hidden="true" />
          ส่งออก PDF
        </button>
      </div>
    </PageHeader>
  );
}

ReportsHeader.propTypes = {
  onExportCsv: PropTypes.func.isRequired,
  onExportPdf: PropTypes.func.isRequired,
  isExporting: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ReportsHeader;
