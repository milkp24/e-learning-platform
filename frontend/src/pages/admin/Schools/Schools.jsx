import { useState, useEffect } from "react";
import adminService from "../../../services/adminService";
import useAuthStore from "../../../store/useAuthStore";
import SchoolsHeader from "./components/SchoolsHeader";
import SchoolFilters from "./components/SchoolFilters";
import SchoolTable from "./components/SchoolTable";
import SchoolPagination from "./components/SchoolPagination";
import CreateSchoolModal from "./components/CreateSchoolModal";
import EditSchoolModal from "./components/EditSchoolModal";
import SchoolDetailModal from "./components/SchoolDetailModal";
import DeleteSchoolConfirmModal from "./components/DeleteSchoolConfirmModal";
import useUrlParam from "../../../hooks/useUrlParam";

/**
 * Admin Schools Component (School Management - Module 9.2)
 * Follows the Jade Design System (#ABD1C6, #004643, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * Integrated with real PostgreSQL database via adminService
 */
function Schools() {
  const { hasPermission } = useAuthStore();
  const canCreateSchool = hasPermission("schools.create");
  const canEditSchool = hasPermission("schools.edit");
  const canDeleteSchool = hasPermission("schools.delete");

  const [schools, setSchools] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useUrlParam("page", 1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useUrlParam("q", "");
  const [statusFilter, setStatusFilter] = useUrlParam("status", "");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSchool, setDetailSchool] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSchool, setDeletingSchool] = useState(null);

  const fetchSchools = async () => {
    try {
      const data = await adminService.getSchools({
        search: search.trim(),
        status: statusFilter,
        page,
        per_page: 10,
      });
      setSchools(data.schools || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("ไม่สามารถโหลดรายชื่อโรงเรียนได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    fetchSchools();
  };

  const handleOpenCreateModal = () => {
    if (!canCreateSchool) {
      alert("คุณไม่มีสิทธิ์ในการสร้างโรงเรียน (ต้องการสิทธิ์: schools.create)");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleOpenDetailModal = async (school) => {
    setDetailSchool(school);
    setIsDetailModalOpen(true);
    try {
      const res = await adminService.getSchoolById(school.school_id);
      if (res && res.school) {
        setDetailSchool(res.school);
      }
    } catch {
      // Keep existing data on single fetch failure
    }
  };

  const handleOpenEditModal = (school) => {
    if (!canEditSchool) {
      alert("คุณไม่มีสิทธิ์ในการแก้ไขโรงเรียน (ต้องการสิทธิ์: schools.edit)");
      return;
    }
    setEditingSchool(school);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (school) => {
    if (!canDeleteSchool) {
      alert("คุณไม่มีสิทธิ์ในการลบโรงเรียน (ต้องการสิทธิ์: schools.delete)");
      return;
    }
    setDeletingSchool(school);
    setIsDeleteModalOpen(true);
  };

  const handleSchoolCreated = () => {
    fetchSchools();
  };

  const handleSchoolUpdated = (updated) => {
    setSchools((prev) =>
      prev.map((s) => (s.school_id === updated.school_id ? { ...s, ...updated } : s))
    );
    if (detailSchool && detailSchool.school_id === updated.school_id) {
      setDetailSchool((prev) => ({ ...prev, ...updated }));
    }
    fetchSchools();
  };

  const handleSchoolDeleted = (deletedId) => {
    setSchools((prev) => prev.filter((s) => s.school_id !== deletedId));
    setTotal((prev) => Math.max(0, prev - 1));
    if (detailSchool && detailSchool.school_id === deletedId) {
      setIsDetailModalOpen(false);
      setDetailSchool(null);
    }
    fetchSchools();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <SchoolsHeader
        total={total}
        onOpenCreate={handleOpenCreateModal}
        canCreateSchool={canCreateSchool}
      />

      {/* 2. Search & Filter Bar */}
      <SchoolFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={(v) => { setStatusFilter(v); setPage(1); }}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* 3. School Table Card */}
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden">
        <SchoolTable
          schools={schools}
          isLoading={isLoading}
          error={error}
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            fetchSchools();
          }}
          onOpenDetailModal={handleOpenDetailModal}
          onOpenEditModal={handleOpenEditModal}
          onOpenDeleteModal={handleOpenDeleteModal}
          canEditSchool={canEditSchool}
          canDeleteSchool={canDeleteSchool}
        />

        {/* Pagination Bar */}
        <SchoolPagination
          total={total}
          page={page}
          pages={pages}
          onPageChange={setPage}
        />
      </div>

      {/* 4. Create School Modal */}
      <CreateSchoolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSchoolCreated={handleSchoolCreated}
      />

      {/* 5. Edit School Modal */}
      <EditSchoolModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        school={editingSchool}
        onSchoolUpdated={handleSchoolUpdated}
      />

      {/* 6. School Detail Modal */}
      <SchoolDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        school={detailSchool}
        onOpenEdit={(sc) => handleOpenEditModal(sc)}
        canEditSchool={canEditSchool}
        onSchoolDataChanged={fetchSchools}
      />

      {/* 7. Delete School Confirm Modal */}
      <DeleteSchoolConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingSchool(null);
        }}
        school={deletingSchool}
        onSchoolDeleted={handleSchoolDeleted}
      />
    </div>
  );
}

export default Schools;
