import CourseListPage from "../../../features/courses/components/CourseListPage";

/**
 * Admin Courses Page (/admin/courses)
 * ใช้หน้ารายการคอร์สกลาง CourseListPage เหมือนหน้า /classrooms
 * Admin เห็นทุกคอร์สและจัดการได้ทุกคอร์ส (ตรวจสิทธิ์ที่ Backend อีกชั้น)
 */
function Courses() {
  return <CourseListPage />;
}

export default Courses;
