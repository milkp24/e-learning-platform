import PageHeader from "../../../../components/layout/PageHeader";

/**
 * ReportsHeader Component
 * Admin Reports page header with export buttons.
 */
function ReportsHeader({ onExport }) {
  return (
    <PageHeader
      title="รายงานและสถิติวิเคราะห์"
      description="สถิติการใช้งานระบบ รายงานการลงทะเบียน อัตราความสำเร็จ และการเติบโตของผู้เรียน"
      badge="ข้อมูลสถิติ"
    >
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onExport("CSV")}
          className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-gray-50 active:scale-98 transition cursor-pointer shadow-2xs"
        >
          ส่งออก CSV
        </button>
        <button
          type="button"
          onClick={() => onExport("PDF")}
          className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-2xs"
        >
          ส่งออก PDF
        </button>
      </div>
    </PageHeader>
  );
}


export default ReportsHeader;
