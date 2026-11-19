import { useState, useEffect } from "react";
import classroomService from "../../../services/classroomService";
import useAuthStore from "../../../store/useAuthStore";
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
  const { user, hasRole } = useAuthStore();

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
      await classroomService.createClassroom({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
      });
      setNewTitle("");
      setNewDescription("");
      setIsCreateModalOpen(false);
      setActionMessage({ type: "success", text: "สร้างห้องเรียนสำเร็จ!" });
      fetchClassrooms(); // รีเฟรชรายการห้องเรียนใหม่
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

  const isStudentOnly = hasRole("student") && !hasRole("instructor") && !hasRole("admin");
  const canCreateClassroom = hasRole("instructor") || hasRole("admin");

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <ClassroomsHeader
        isStudentOnly={isStudentOnly}
        canCreateClassroom={canCreateClassroom}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* 2. Action Message Banner */}
      <ClassroomsActionAlert actionMessage={actionMessage} />

      {/* 3. Classrooms Grid */}
      <ClassroomsGrid
        classrooms={classrooms}
        loading={loading}
        error={error}
        onRetry={fetchClassrooms}
        user={user}
        hasRole={hasRole}
        onJoin={handleJoinClassroom}
        joiningId={joiningId}
      />

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
