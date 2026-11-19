import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LuCheck, LuCircleAlert as LuAlertCircle } from "react-icons/lu";
import classroomService from "../../../services/classroomService";
import CoursesHeader from "./components/CoursesHeader";
import useUrlParam from "../../../hooks/useUrlParam";
import CourseListToolbar from "../../../features/courses/components/CourseListToolbar";
import CoursePagination from "../../../features/courses/components/CoursePagination";
import {
  filterCourses,
  getCategoryOptions,
  getInstructorOptions,
  paginate,
} from "../../../features/courses/utils/courseListFilters";
import CourseTable from "./components/CourseTable";
import CreateCourseModal from "./components/CreateCourseModal";
import EditCourseModal from "./components/EditCourseModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

/**
 * Courses Page Component (ระบบจัดการคอร์สเรียน)
 * ตามข้อกำหนดข้อ 1 และ 2 ของโจทย์:
 * - แสดงรายการคอร์สแบบ Card หรือ Table
 * - ข้อมูล: ชื่อคอร์ส, คำอธิบาย, รูปปก, ผู้สอน, จำนวนบทเรียน, จำนวนผู้เรียน, สถานะ, วันที่แก้ไขล่าสุด, การจัดการ
 * - Actions: ดู, แก้ไข, จัดการเนื้อหา, เผยแพร่, ยกเลิกการเผยแพร่, ลบ
 * - เมื่อสร้างคอร์สใหม่สำเร็จ นำทางเข้าสู่หน้า "จัดการเนื้อหา" ทันที
 */
function Courses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // ตัวกรอง / คำค้น / เลขหน้า เก็บใน URL เพื่อให้แก้ไขหรือย้อนกลับแล้วยังอยู่หน้าเดิม (FB-05)
  const [search, setSearch] = useUrlParam("q", "");
  const [statusFilter, setStatusFilter] = useUrlParam("status", "all");
  const [category, setCategory] = useUrlParam("category", "");
  const [view, setView] = useUrlParam("view", "all");
  const [instructor, setInstructor] = useUrlParam("instructor", "");
  const [page, setPage] = useUrlParam("page", 1);

  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  // Create Course Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createModalError, setCreateModalError] = useState("");

  // Edit Course Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editModalError, setEditModalError] = useState("");

  // Delete Confirm Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchCourses = async () => {
    try {
      const data = await classroomService.getClassrooms();
      setCourses(Array.isArray(data) ? data : data.classrooms || data.courses || []);
    } catch {
      setError("ไม่สามารถโหลดรายชื่อคอร์สเรียนได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchCourses();
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 1. สร้างคอร์สใหม่
  const handleCreateCourse = async (courseData) => {
    setIsCreating(true);
    setCreateModalError("");

    try {
      const res = await classroomService.createClassroom({
        title: courseData.title,
        description: courseData.description,
        thumbnail_url: courseData.thumbnail_url,
        status: courseData.status,
      });

      const created = res.classroom || res.course || res;
      const newId = created.classroom_id || created.id;

      setIsCreateModalOpen(false);
      showToast("success", "สร้างคอร์สใหม่เรียบร้อยแล้ว กำลังพาเข้าสู่หน้าจัดการเนื้อหา...");

      // ตามข้อกำหนด 3: "หลังจากสร้างคอร์สแล้ว ให้เข้าสู่หน้า: จัดการเนื้อหา"
      setTimeout(() => {
        navigate(`/classrooms/${newId}/manage`);
      }, 700);
    } catch (err) {
      setCreateModalError(err.response?.data?.message || "ไม่สามารถสร้างคอร์สเรียนได้");
    } finally {
      setIsCreating(false);
    }
  };

  // 2. แก้ไขข้อมูลคอร์ส
  const handleOpenEdit = (course) => {
    setSelectedCourse(course);
    setEditModalError("");
    setIsEditModalOpen(true);
  };

  const handleUpdateCourse = async (updateData) => {
    if (!selectedCourse) return;
    const courseId = selectedCourse.classroom_id || selectedCourse.id;

    setIsUpdating(true);
    setEditModalError("");

    try {
      await classroomService.updateClassroom(courseId, updateData);
      setIsEditModalOpen(false);
      showToast("success", "แก้ไขข้อมูลคอร์สเรียนเรียบร้อยแล้ว");
      fetchCourses();
    } catch (err) {
      setEditModalError(err.response?.data?.message || "ไม่สามารถแก้ไขคอร์สเรียนได้");
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. สลับสถานะ เผยแพร่ / ยกเลิกการเผยแพร่
  const handleTogglePublish = async (course, targetStatus) => {
    const courseId = course.classroom_id || course.id;
    try {
      await classroomService.updateClassroom(courseId, { status: targetStatus });
      const actionText = targetStatus === "active" ? "เผยแพร่คอร์สเรียนเรียบร้อยแล้ว" : "ยกเลิกการเผยแพร่คอร์สเรียนเรียบร้อยแล้ว";
      showToast("success", actionText);
      fetchCourses();
    } catch (err) {
      showToast("error", err.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะคอร์สได้");
    }
  };

  // 4. ลบคอร์สเรียน
  const handleOpenDelete = (course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    const courseId = courseToDelete.classroom_id || courseToDelete.id;

    setIsDeleting(true);
    try {
      await classroomService.deleteClassroom(courseId);
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      showToast("success", "ลบคอร์สเรียนเรียบร้อยแล้ว");
      fetchCourses();
    } catch (err) {
      showToast("error", err.response?.data?.message || "ไม่สามารถลบคอร์สเรียนได้");
    } finally {
      setIsDeleting(false);
    }
  };

  // ตัวกรอง: หมวดหมู่ → ขอบเขต → อาจารย์ → ค้นหา (ใช้ร่วมกับหน้าคอร์สเรียน) แล้วจึงกรองสถานะ
  const categories = useMemo(() => getCategoryOptions(courses, category), [courses, category]);
  const instructors = useMemo(() => getInstructorOptions(courses), [courses]);
  const baseFiltered = filterCourses(courses, { category, view, instructor, q: search });

  const filteredCourses = baseFiltered.filter((c) => {
    if (statusFilter === "all") return true;

    const cStatus = (c.status || "active").toLowerCase();
    if (statusFilter === "published") {
      return cStatus === "active" || cStatus === "published";
    }
    if (statusFilter === "draft") {
      return cStatus === "draft";
    }
    if (statusFilter === "pending") {
      return cStatus === "pending" || cStatus === "under_review";
    }
    if (statusFilter === "inactive") {
      return cStatus === "inactive" || cStatus === "archived";
    }

    return true;
  });

  const { pageItems, page: currentPage, pages } = paginate(filteredCourses, page);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Page Header */}
      <CoursesHeader
        totalCourses={courses.length}
        onOpenCreateModal={() => {
          setCreateModalError("");
          setIsCreateModalOpen(true);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`rounded-2xl p-4 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm transition-all animate-fadeIn ${
            toastMessage.type === "success"
              ? "bg-[#ABD1C6]/30 border border-[#ABD1C6] text-[#004643]"
              : "bg-rose-50 border border-rose-200 text-rose-700"
          }`}
        >
          {toastMessage.type === "success" ? (
            <LuCheck className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          ) : (
            <LuAlertCircle className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 2. ตัวกรองและค้นหา */}
      <CourseListToolbar
        categories={categories}
        category={category}
        onCategoryChange={withPageReset(setCategory)}
        viewOptions={[
          { value: "all", label: "คอร์สทั้งหมด" },
          { value: "mine", label: "คอร์สของฉัน" },
          { value: "owned", label: "คอร์สที่เป็นเจ้าของ" },
        ]}
        view={view}
        onViewChange={withPageReset(setView)}
        instructors={instructors}
        instructor={instructor}
        onInstructorChange={withPageReset(setInstructor)}
        search={search}
        onSearchChange={withPageReset(setSearch)}
        count={filteredCourses.length}
      >
        <select
          aria-label="สถานะคอร์ส"
          value={statusFilter}
          onChange={(e) => withPageReset(setStatusFilter)(e.target.value)}
          className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="published">เผยแพร่แล้ว</option>
          <option value="draft">ฉบับร่าง</option>
          <option value="pending">รอตรวจสอบ</option>
          <option value="inactive">ปิดการเผยแพร่</option>
        </select>
      </CourseListToolbar>

      {/* 3. ตาราง / การ์ดรายการคอร์สเรียน */}
      <CourseTable
        courses={pageItems}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        onEdit={handleOpenEdit}
        onTogglePublish={handleTogglePublish}
        onDelete={handleOpenDelete}
      />

      <CoursePagination page={currentPage} pages={pages} onPageChange={setPage} />

      {/* 4. Modal สร้างคอร์สใหม่ */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCourse}
        isCreating={isCreating}
        error={createModalError}
      />

      {/* 5. Modal แก้ไขคอร์ส */}
      <EditCourseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(null);
        }}
        course={selectedCourse}
        onSubmit={handleUpdateCourse}
        isUpdating={isUpdating}
        error={editModalError}
      />

      {/* 6. กล่องยืนยันการลบคอร์ส */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false);
            setCourseToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="ยืนยันการลบคอร์สเรียน"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบคอร์ส "${courseToDelete?.title || ""}"? บทเรียน ตอนย่อย และเนื้อหาทั้งหมดภายในคอร์สจะถูกลบอย่างถาวร`}
        confirmText="ลบคอร์สเรียน"
        cancelText="ยกเลิก"
        variant="danger"
      />
    </div>
  );
}

export default Courses;
