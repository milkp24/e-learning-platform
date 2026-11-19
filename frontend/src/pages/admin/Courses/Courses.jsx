import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuCheck, LuCircleAlert as LuAlertCircle } from "react-icons/lu";
import classroomService from "../../../services/classroomService";
import CoursesHeader from "./components/CoursesHeader";
import CourseFilters from "./components/CourseFilters";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // ตัวกรองค้นหาและสถานะ
  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.instructor_name?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

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

      {/* 2. ค้นหาและกรองสถานะ */}
      <CourseFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        count={filteredCourses.length}
      />

      {/* 3. ตาราง / การ์ดรายการคอร์สเรียน */}
      <CourseTable
        courses={filteredCourses}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        onEdit={handleOpenEdit}
        onTogglePublish={handleTogglePublish}
        onDelete={handleOpenDelete}
      />

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
