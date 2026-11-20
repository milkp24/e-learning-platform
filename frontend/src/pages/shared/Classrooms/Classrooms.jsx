import CourseListPage from "../../../features/courses/components/CourseListPage";

/**
 * Classrooms Page (/classrooms)
 * ใช้หน้ารายการคอร์สกลาง CourseListPage เหมือนหน้า /admin/courses
 * เพื่อให้ทุกหน้าและทุกบทบาทเห็นรูปแบบเดียวกัน (การ์ด/ตาราง, ตัวกรอง, ปุ่มจัดการ)
 */
function Classrooms() {
  return <CourseListPage />;
}

export default Classrooms;
