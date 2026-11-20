import PageHeader from "../../../../components/layout/PageHeader";
import PageHeaderButton from "../../../../components/layout/PageHeader/PageHeaderButton";

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
      <PageHeaderButton onClick={onCreateQuiz}>สร้างแบบทดสอบ</PageHeaderButton>
    </PageHeader>
  );
}


export default QuizzesHeader;
