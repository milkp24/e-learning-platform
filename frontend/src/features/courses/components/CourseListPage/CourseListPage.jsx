import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuCheck, LuCircleAlert } from "react-icons/lu";
import classroomService from "../../../../services/classroomService";
import useAuthStore from "../../../../store/useAuthStore";
import useUrlParam from "../../../../hooks/useUrlParam";
import PageHeader from "../../../../components/layout/PageHeader";
import PageHeaderButton from "../../../../components/layout/PageHeader/PageHeaderButton";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import CourseListToolbar from "../CourseListToolbar";
import CoursePagination from "../CoursePagination";
import CourseCollection from "../CourseCollection";
import CourseFormModal from "../CourseFormModal";
import useCourseLayout from "../../hooks/useCourseLayout";
import {
  filterCourses,
  getCategoryOptions,
  getInstructorOptions,
  paginate,
} from "../../utils/courseListFilters";
import { normalizeCourseStatus } from "../../utils/courseStatus";
import RejectCourseDialog from "./RejectCourseDialog";

// ======================================================
// CourseListPage — หน้ารายการคอร์สหน้าเดียว ใช้กับทุกเส้นทางและทุกบทบาท
//   /classrooms                 คอร์สเรียนทั้งหมด
//   /classrooms?view=mine       คอร์สเรียนของฉัน
//   /classrooms?view=drafts     คอร์สฉบับร่าง (ผู้สอน / แอดมิน)
//   /classrooms?view=pending    ตรวจคอร์สก่อนเผยแพร่ (ผู้ตรวจ) / คอร์สที่ส่งตรวจ (ผู้สอน)
//   /admin/courses              หน้าเดียวกัน (เมนูของแอดมิน)
// ทุกหน้าได้: สลับตาราง/การ์ด, ตัวกรองชุดเดียวกัน, ปุ่มสร้าง/แก้ไข/เผยแพร่/ลบ ตามสิทธิ์
// สิทธิ์จริงตรวจที่ Backend อีกชั้น ปุ่มที่นี่แค่ซ่อนสิ่งที่ผู้ใช้ทำไม่ได้
// ======================================================

const PAGE_TEXT = {
  all: {
    title: "คอร์สเรียนทั้งหมด",
    description: "เลือกคอร์สเพื่อเข้าสู่บทเรียนและเนื้อหาการเรียนรู้",
  },
  mine: {
    title: "คอร์สเรียนของฉัน",
    description: "คอร์สที่คุณลงทะเบียนเรียนหรือรับผิดชอบสอน",
  },
  owned: {
    title: "คอร์สเรียนของฉัน",
    description: "คอร์สที่คุณเป็นเจ้าของ",
  },
  drafts: {
    title: "คอร์สฉบับร่าง",
    description: "คอร์สที่ยังไม่เผยแพร่ ผู้เรียนและผู้เยี่ยมชมจะยังไม่เห็นจนกว่าจะเผยแพร่",
  },
  pending: {
    title: "คอร์สรอตรวจสอบ",
    description: "คอร์สที่ส่งขอเผยแพร่และรอผู้ดูแลตรวจสอบ",
  },
};

const REVIEW_PAGE_TEXT = {
  title: "ตรวจคอร์สก่อนเผยแพร่",
  description: "ตรวจเนื้อหาในคอร์สที่ผู้สอนส่งขอเผยแพร่ แล้วอนุมัติหรือส่งกลับพร้อมเหตุผล",
};

const STATUS_FILTERS = [
  { value: "all", label: "สถานะทั้งหมด" },
  { value: "published", label: "เผยแพร่แล้ว" },
  { value: "draft", label: "ฉบับร่าง" },
  { value: "pending", label: "รอตรวจสอบ" },
  { value: "archived", label: "เก็บถาวร" },
];

function matchesStatusFilter(course, filter) {
  if (filter === "all") return true;
  const s = normalizeCourseStatus(course.status);
  return filter === "published" ? s === "active" : s === filter;
}

function CourseListPage() {
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuthStore();

  const isAdmin = hasRole("admin") || hasRole("super_admin");
  const isInstructor = hasRole("instructor");
  const role = !isAuthenticated ? "guest" : isAdmin ? "admin" : isInstructor ? "instructor" : "student";
  const canCreate = isAdmin || isInstructor;

  // ตัวกรอง / คำค้น / เลขหน้า / มุมมอง เก็บใน URL (FB-05)
  const [category, setCategory] = useUrlParam("category", "");
  const [view, setView] = useUrlParam("view", "all");
  const [instructor, setInstructor] = useUrlParam("instructor", "");
  const [search, setSearch] = useUrlParam("q", "");
  const [statusFilter, setStatusFilter] = useUrlParam("status", "all");
  const [page, setPage] = useUrlParam("page", 1);
  const [layout, setLayout] = useCourseLayout();

  const withPageReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const [courses, setCourses] = useState([]);
  // สิทธิ์ระดับหน้า จาก Backend: can_publish (เผยแพร่เองได้), can_review (ตรวจคอร์สของคนอื่นได้)
  const [capabilities, setCapabilities] = useState({ can_publish: false, can_review: false });
  const [courseToReject, setCourseToReject] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ open: false, mode: "create", course: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await classroomService.getClassrooms();
      setCourses(Array.isArray(data) ? data : data.classrooms || data.courses || []);
      if (data?.capabilities) setCapabilities(data.capabilities);
    } catch (err) {
      setError(err.response?.data?.message || "โหลดรายการคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // ใช้สิทธิ์ที่ Backend คำนวณให้ต่อคอร์ส (เจ้าของคอร์ส หรือ Admin)
  const canManage = (course) => Boolean(course.can_manage ?? (isAdmin || (isInstructor && course.is_owner)));

  // ---------- สร้าง / แก้ไข ----------
  const openCreate = () => {
    setFormError("");
    setForm({ open: true, mode: "create", course: null });
  };
  const openEdit = (course) => {
    setFormError("");
    setForm({ open: true, mode: "edit", course });
  };
  const closeForm = () => {
    if (!isSubmitting) setForm((f) => ({ ...f, open: false }));
  };

  const handleSubmitForm = async (data) => {
    setIsSubmitting(true);
    setFormError("");
    try {
      if (form.mode === "create") {
        const res = await classroomService.createClassroom(data);
        const created = res?.classroom || res?.course || res;
        const newId = created?.classroom_id || created?.id;
        setForm((f) => ({ ...f, open: false }));
        // FB-15: สร้างคอร์สเสร็จแล้วพาไปหน้าสร้างบทเรียนทันที (ข้อความจาก Backend บอกสถานะที่ได้)
        if (newId) {
          navigate(`/classrooms/${newId}/manage`, { state: { notice: res?.message } });
          return;
        }
        showToast("success", res?.message || "สร้างคอร์สเรียบร้อยแล้ว");
      } else {
        const id = form.course.classroom_id || form.course.id;
        await classroomService.updateClassroom(id, data);
        setForm((f) => ({ ...f, open: false }));
        showToast("success", `บันทึกการแก้ไข "${data.title}" แล้ว`);
      }
      fetchCourses();
    } catch (err) {
      setFormError(err.response?.data?.message || "บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- ปุ่มสถานะ: เผยแพร่ / ส่งตรวจ / อนุมัติ / ไม่อนุมัติ / ยกเลิกเผยแพร่ / เก็บถาวร / กู้คืน ----------
  const handleStatusAction = async (course, action) => {
    if (action.key === "reject") {
      setCourseToReject(course);
      return;
    }
    const id = course.classroom_id || course.id;
    setBusyId(id);
    try {
      const res =
        action.key === "approve"
          ? await classroomService.reviewClassroom(id, true)
          : await classroomService.changeClassroomStatus(id, action.status);
      showToast("success", `"${course.title}": ${res?.message || "บันทึกแล้ว"}`);
      fetchCourses();
    } catch (err) {
      showToast("error", err.response?.data?.message || "เปลี่ยนสถานะคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (note) => {
    if (!courseToReject) return;
    setIsRejecting(true);
    try {
      const res = await classroomService.reviewClassroom(courseToReject.classroom_id || courseToReject.id, false, note);
      showToast("success", `"${courseToReject.title}": ${res?.message || "ส่งกลับให้ผู้สอนแล้ว"}`);
      setCourseToReject(null);
      fetchCourses();
    } catch (err) {
      showToast("error", err.response?.data?.message || "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsRejecting(false);
    }
  };

  // ---------- ลบ ----------
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await classroomService.deleteClassroom(courseToDelete.classroom_id || courseToDelete.id);
      showToast("success", `ลบคอร์ส "${courseToDelete.title}" แล้ว`);
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) {
      showToast("error", err.response?.data?.message || "ลบคอร์สไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- ลงทะเบียนเรียน (ผู้เรียน) ----------
  const handleJoin = async (courseId) => {
    setJoiningId(courseId);
    try {
      await classroomService.joinClassroom(courseId);
      showToast("success", "ลงทะเบียนเรียนเรียบร้อยแล้ว");
      fetchCourses();
    } catch (err) {
      showToast("error", err.response?.data?.message || "ลงทะเบียนเรียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setJoiningId(null);
    }
  };

  // ---------- ตัวกรอง ----------
  const viewOptions = !isAuthenticated
    ? []
    : canCreate
    ? [
        { value: "all", label: "คอร์สทั้งหมด" },
        { value: "mine", label: "คอร์สของฉัน" },
        { value: "owned", label: "คอร์สที่เป็นเจ้าของ" },
        { value: "drafts", label: "คอร์สฉบับร่าง" },
        { value: "pending", label: capabilities.can_review ? "รอตรวจก่อนเผยแพร่" : "คอร์สรอตรวจสอบ" },
      ]
    : [
        { value: "all", label: "คอร์สทั้งหมด" },
        { value: "mine", label: "คอร์สของฉัน" },
      ];

  const categories = useMemo(() => getCategoryOptions(courses, category), [courses, category]);
  const instructors = useMemo(() => getInstructorOptions(courses), [courses]);
  const filtered = useMemo(
    () =>
      filterCourses(courses, { category, view, instructor, q: search }).filter((c) =>
        canCreate ? matchesStatusFilter(c, statusFilter) : true
      ),
    [courses, category, view, instructor, search, statusFilter, canCreate]
  );
  const { pageItems, page: currentPage, pages } = paginate(filtered, page);

  const text = view === "pending" && capabilities.can_review ? REVIEW_PAGE_TEXT : PAGE_TEXT[view] || PAGE_TEXT.all;
  const emptyText =
    view === "pending"
      ? "ไม่มีคอร์สที่รอตรวจสอบในขณะนี้"
      : view === "drafts"
      ? "ไม่มีคอร์สฉบับร่าง คอร์สที่สร้างแบบฉบับร่างจะอยู่ที่หน้านี้จนกว่าจะเผยแพร่"
      : view === "mine" || view === "owned"
      ? "ยังไม่มีคอร์สของคุณ หรือไม่มีคอร์สที่ตรงกับตัวกรอง"
      : courses.length === 0
      ? "ยังไม่มีคอร์สที่เปิดให้เรียนในขณะนี้ กรุณากลับมาตรวจสอบอีกครั้ง"
      : "ไม่พบคอร์สที่ตรงกับตัวกรอง ลองเปลี่ยนหมวดหมู่หรือคำค้นหา";

  return (
    <div className="space-y-6">
      <PageHeader title={text.title} description={text.description}>
        {canCreate && (
          <PageHeaderButton onClick={openCreate}>สร้างคอร์สเรียนใหม่</PageHeaderButton>
        )}
      </PageHeader>

      {toast && (
        <div
          role="status"
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs sm:text-sm font-bold shadow-sm ${
            toast.type === "success"
              ? "border border-[#ABD1C6] bg-[#ABD1C6]/30 text-[#004643]"
              : "border border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.type === "success" ? (
            <LuCheck className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
          ) : (
            <LuCircleAlert className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

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
      >
        {canCreate && (
          <select
            aria-label="สถานะคอร์ส"
            value={statusFilter}
            onChange={(e) => withPageReset(setStatusFilter)(e.target.value)}
            className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#26332F] focus:border-[#ABD1C6] focus:bg-white focus:outline-none transition cursor-pointer"
          >
            {STATUS_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </CourseListToolbar>

      <CourseCollection
        courses={pageItems}
        totalCount={filtered.length}
        layout={layout}
        onLayoutChange={setLayout}
        isLoading={isLoading}
        error={error}
        onRetry={fetchCourses}
        emptyText={emptyText}
        role={role}
        canManage={canManage}
        onJoin={handleJoin}
        joiningId={joiningId}
        onEdit={openEdit}
        onStatusAction={handleStatusAction}
        onDelete={setCourseToDelete}
        busyId={busyId}
      />

      <CoursePagination page={currentPage} pages={pages} onPageChange={setPage} />

      <CourseFormModal
        isOpen={form.open}
        mode={form.mode}
        course={form.course}
        onClose={closeForm}
        onSubmit={handleSubmitForm}
        isSubmitting={isSubmitting}
        error={formError}
        canPublish={capabilities.can_publish}
      />

      <RejectCourseDialog
        course={courseToReject}
        onClose={() => !isRejecting && setCourseToReject(null)}
        onConfirm={handleConfirmReject}
        loading={isRejecting}
      />

      <ConfirmDialog
        isOpen={Boolean(courseToDelete)}
        onClose={() => !isDeleting && setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="ยืนยันการลบคอร์สเรียน"
        message={`ลบคอร์ส "${courseToDelete?.title || ""}" ใช่หรือไม่? บทเรียน ตอนย่อย และเนื้อหาทั้งหมดในคอร์สจะถูกลบถาวร`}
        confirmText="ลบคอร์สเรียน"
        cancelText="ยกเลิก"
        variant="danger"
      />
    </div>
  );
}

export default CourseListPage;
