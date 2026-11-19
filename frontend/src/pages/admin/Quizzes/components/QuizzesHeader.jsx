import PageHeader from "../../../../components/layout/PageHeader";

/**
 * QuizzesHeader Component
 * Admin Quizzes page header with action button.
 */
function QuizzesHeader({ onCreateQuiz }) {
  return (
    <PageHeader
      title="แบบทดสอบ"
      description="จัดการแบบทดสอบ ข้อสอบวัดระดับ และเกณฑ์การประเมินผลสำหรับแต่ละหลักสูตร"
      badge="การวัดผล"
    >
      <button
        type="button"
        onClick={onCreateQuiz}
        className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-2xs"
      >
        + สร้างแบบทดสอบ
      </button>
    </PageHeader>
  );
}


export default QuizzesHeader;
