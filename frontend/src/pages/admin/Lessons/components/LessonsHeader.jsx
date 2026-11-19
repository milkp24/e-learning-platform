import PageHeader from "../../../../components/layout/PageHeader";

/**
 * LessonsHeader Component
 * Admin lessons page header.
 */
function LessonsHeader() {
  return (
    <PageHeader
      title="บทเรียนและตอนย่อย"
      description="จัดการโครงสร้างบทเรียน ตอนย่อย และลำดับเนื้อหาการเรียนรู้ในหลักสูตร"
      badge="หลักสูตร"
    />
  );
}

export default LessonsHeader;
