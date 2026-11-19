import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import classroomService from "../../../services/classroomService";
import useAuthStore from "../../../store/useAuthStore";
import useUrlParam from "../../../hooks/useUrlParam";
import CourseListToolbar from "../../../features/courses/components/CourseListToolbar";
import CoursePagination from "../../../features/courses/components/CoursePagination";
import {
  filterCourses,
  getCategoryOptions,
  getInstructorOptions,
  paginate,
} from "../../../features/courses/utils/courseListFilters";
import ClassroomsHeader from "./components/ClassroomsHeader";
import ClassroomsActionAlert from "./components/ClassroomsActionAlert";
import ClassroomsGrid from "./components/ClassroomsGrid";
import CreateClassroomModal from "./components/CreateClassroomModal";

/**
 * Classrooms Page Component (หน้ารวมห้องเรียน)
 * Decomposed into:
 * 1. ClassroomsHeader
 * 2. ClassroomsActionAlert
 * 3. ClassroomsGrid (with IoT 101 core card & database cards)
 * 4. CreateClassroomModal
 */
function Classrooms() {
  const { user, hasRole, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // ตัวกรอง / คำค้น / เลขหน้า เก็บใน URL (FB-05, FB-04/09/10)
  // view=mine มาจากเมนู "คอร์สเรียนของฉัน", category มาจากปุ่ม "ดูคอร์ส" หน้าแรก
  const [category, setCategory] = useUrlParam("category", "");
  const [view, setView] = useUrlParam("view", "all");
  const [instructor, setInstructor] = useUrlParam("instructor", "");
  const [search, setSearch] = useUrlParam("q", "");
  const [page, setPage] = useUrlParam("page", 1);

  // เปลี่ยนตัวกรองแล้วกลับไปหน้า 1
  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // สถานะสำหรับเปิด/ปิด Modal สร้างห้องเรียน
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // สถานะการกด Join Classroom ของแต่ละห้อง
  const [joiningId, setJoiningId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // โหลดรายการห้องเรียนเมื่อเปิดหน้า
  const fetchClassrooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await classroomService.getClassrooms();
      setClassrooms(data.classrooms || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "ไม่สามารถดึงข้อมูลห้องเรียนได้"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  // ฟังก์ชันสร้างห้องเรียนใหม่ (เฉพาะ Instructor หรือ Admin)
  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await classroomService.createClassroom({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      });
      setNewTitle("");
      setNewDescription("");
      setIsCreateModalOpen(false);

      // FB-15: สร้างคอร์สเสร็จแล้วพาไปหน้าสร้างบทเรียนของคอร์สนั้นทันที
      const created = res?.classroom || res?.course || res;
      const newId = created?.classroom_id || created?.id;
      if (newId) {
        navigate(`/classrooms/${newId}/manage`);
        return;
      }
      setActionMessage({ type: "success", text: "สร้างคอร์สเรียนสำเร็จ!" });
      fetchClassrooms();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "สร้างห้องเรียนไม่สำเร็จ",
      });
    } finally {
      setCreating(false);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  // ฟังก์ชันขอเข้าร่วมห้องเรียน (เฉพาะ Student)
  const handleJoinClassroom = async (classroomId) => {
    setJoiningId(classroomId);
    try {
      await classroomService.joinClassroom(classroomId);
      setActionMessage({ type: "success", text: "เข้าร่วมห้องเรียนเรียบร้อยแล้ว!" });
      fetchClassrooms();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "ไม่สามารถเข้าร่วมห้องเรียนได้",
      });
    } finally {
      setJoiningId(null);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const canCreateClassroom = hasRole("instructor") || hasRole("admin");

  // ตัวเลือกขอบเขต: Guest เห็นแค่ทั้งหมด, Student มี "ของฉัน", ผู้สอน/แอดมิน มี "ที่เป็นเจ้าของ" เพิ่ม
  const viewOptions = !isAuthenticated
    ? []
    : canCreateClassroom
    ? [
        { value: "all", label: "คอร์สทั้งหมด" },
        { value: "mine", label: "คอร์สของฉัน" },
        { value: "owned", label: "คอร์สที่เป็นเจ้าของ" },
      ]
    : [
        { value: "all", label: "คอร์สทั้งหมด" },
        { value: "mine", label: "คอร์สของฉัน" },
      ];

  const categories = useMemo(() => getCategoryOptions(classrooms, category), [classrooms, category]);
  const instructors = useMemo(() => getInstructorOptions(classrooms), [classrooms]);
  const filtered = useMemo(
    () => filterCourses(classrooms, { category, view, instructor, q: search }),
    [classrooms, category, view, instructor, search]
  );
  const { pageItems, page: currentPage, pages } = paginate(filtered, page);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <ClassroomsHeader
        view={view}
        canCreateClassroom={canCreateClassroom}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 2. Action Message Banner */}
      <ClassroomsActionAlert actionMessage={actionMessage} />

      {/* 3. ตัวกรองและค้นหา */}
      {!loading && !error && classrooms.length > 0 && (
        <CourseListToolbar
          categories={categories}
          category={category}
          onCategoryChange={withPageReset(setCategory)}
          viewOptions={viewOptions}
          view={view}
          onViewChange={withPageReset(setView)}
          instructors={instructors}
          instructor={instructor}
          onInstructorChange={withPageReset(setInstructor)}
          search={search}
          onSearchChange={withPageReset(setSearch)}
          count={filtered.length}
        />
      )}

      {/* 4. Classrooms Grid (หน้าละ 9 คอร์ส) */}
      <ClassroomsGrid
        classrooms={pageItems}
        hasAnyCourse={classrooms.length > 0}
        loading={loading}
        error={error}
        onRetry={fetchClassrooms}
        user={user}
        hasRole={hasRole}
        onJoin={handleJoinClassroom}
        joiningId={joiningId}
      />

      <CoursePagination page={currentPage} pages={pages} onPageChange={setPage} />

      {/* 4. Create Classroom Modal */}
      <CreateClassroomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        newTitle={newTitle}
        onTitleChange={setNewTitle}
        newDescription={newDescription}
        onDescriptionChange={setNewDescription}
        onSubmit={handleCreateClassroom}
        creating={creating}
      />
    </div>
  );
}

export default Classrooms;
