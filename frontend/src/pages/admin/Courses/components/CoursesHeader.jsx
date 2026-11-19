import PageHeader from "../../../../components/layout/PageHeader";

/**
 * CoursesHeader Component
 * ส่วนหัวหน้าจัดการคอร์สเรียน พร้อมปุ่ม "+ เพิ่มคอร์ส"
 */
function CoursesHeader({ totalCourses, onOpenCreateModal }) {
  return (
    <PageHeader
      title="คอร์สเรียน"
      description="สร้างและจัดการคอร์สเรียน โครงสร้างบทเรียน ตอนย่อย และเนื้อหาทั้งหมดในระบบ"
      badge={`คอร์สเรียนทั้งหมด ${totalCourses} คอร์ส`}
    >
      <button
        type="button"
        onClick={onOpenCreateModal}
        className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#20302C] hover:bg-[#9bc3b7] active:scale-98 transition cursor-pointer shadow-sm"
      >
        + เพิ่มคอร์ส
      </button>
    </PageHeader>
  );
}

export default CoursesHeader;
