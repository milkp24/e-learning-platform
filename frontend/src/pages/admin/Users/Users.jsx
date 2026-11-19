import { useState, useEffect } from "react";
import adminService from "../../../services/adminService";
import roleService from "../../../services/roleService";
import useAuthStore from "../../../store/useAuthStore";
import UsersHeader from "./components/UsersHeader";
import UserFilters from "./components/UserFilters";
import UserTable from "./components/UserTable";
import UserPagination from "./components/UserPagination";
import UserRoleModal from "./components/UserRoleModal";
import UserDetailModal from "./components/UserDetailModal";
import EditUserModal from "./components/EditUserModal";
import CreateUserModal from "./components/CreateUserModal";
import DeleteUserConfirmModal from "./components/DeleteUserConfirmModal";

/**
 * Admin Users Component (User Management)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 * Real database integration for viewing and editing user profile, roles, and status
 */
function Users() {
  const { hasPermission, isSuperAdmin, user: currentUser } = useAuthStore();
  const canEditUser = hasPermission("users.edit");
  const canCreateUser = hasPermission("users.create");
  const canDeleteUser = hasPermission("users.delete");

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Delete User Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Role Edit Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState("");

  // User Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // Edit User Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const data = await adminService.getUsers({
        search: search.trim(),
        role: roleFilter,
        status: statusFilter,
        page,
        per_page: 10,
      });
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setError("ไม่สามารถโหลดรายชื่อผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      const data = await roleService.getAllRoles();
      setAllRoles(data.roles || []);
    } catch {
      setAllRoles([
        { role_name: "student" },
        { role_name: "instructor" },
        { role_name: "admin" },
        { role_name: "super_admin" },
      ]);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );
      if (detailUser && detailUser.user_id === userId) {
        setDetailUser((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRoles([...(user.roles || [])]);
    setRoleModalError("");
    setIsRoleModalOpen(true);
  };

  const handleRoleToggle = (roleName) => {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleName));
    } else {
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  const handleSaveRoles = async (e) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      setRoleModalError("ผู้ใช้ต้องมีอย่างน้อย 1 บทบาท");
      return;
    }

    setIsSubmittingRole(true);
    setRoleModalError("");

    try {
      await adminService.updateUserRoles(selectedUser.user_id, selectedRoles);
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      setRoleModalError(err.response?.data?.message || "ไม่สามารถอัปเดตบทบาทได้");
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const openDetailModal = async (user) => {
    setDetailUser(user);
    setIsDetailModalOpen(true);
    // Fetch fresh user data from API
    try {
      const res = await adminService.getUserById(user.user_id);
      if (res?.user) {
        setDetailUser(res.user);
      }
    } catch {
      // Keep existing user object if single-fetch fails
    }
  };

  const openEditModal = (user) => {
    if (!canEditUser) {
      alert("คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลผู้ใช้งาน (ต้องการสิทธิ์: users.edit)");
      return;
    }
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    if (!canCreateUser) {
      alert("คุณไม่มีสิทธิ์ในการเพิ่มผู้ใช้ (ต้องการสิทธิ์: users.create)");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleOpenDeleteModal = (user) => {
    if (!canDeleteUser) {
      alert("คุณไม่มีสิทธิ์ในการลบบัญชีผู้ใช้ (ต้องการสิทธิ์: users.delete)");
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleUserDeleted = (deletedUserId) => {
    setUsers((prev) => prev.filter((u) => u.user_id !== deletedUserId));
    setTotal((prev) => Math.max(0, prev - 1));
    if (detailUser && detailUser.user_id === deletedUserId) {
      setIsDetailModalOpen(false);
      setDetailUser(null);
    }
    fetchUsers();
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === updatedUser.user_id ? { ...u, ...updatedUser } : u))
    );
    if (detailUser && detailUser.user_id === updatedUser.user_id) {
      setDetailUser((prev) => ({ ...prev, ...updatedUser }));
    }
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <UsersHeader
        total={total}
        onOpenCreate={handleOpenCreateModal}
        canCreateUser={canCreateUser}
      />

      {/* 2. Search & Filter Bar Card */}
      <UserFilters
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* 3. Users Table Card */}
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white shadow-2xs overflow-hidden">
        <UserTable
          users={users}
          isLoading={isLoading}
          error={error}
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            fetchUsers();
          }}
          onStatusChange={handleStatusChange}
          onOpenRoleModal={openRoleModal}
          onOpenDetailModal={openDetailModal}
          onOpenEditModal={openEditModal}
          onOpenDeleteModal={handleOpenDeleteModal}
          canEditUser={canEditUser}
          canDeleteUser={canDeleteUser}
          currentUserId={currentUser?.user_id || currentUser?.id}
          isSuperAdmin={isSuperAdmin()}
        />

        {/* Pagination Bar */}
        <UserPagination
          total={total}
          page={page}
          pages={pages}
          onPageChange={setPage}
        />
      </div>

      {/* 4. Role Assignment Modal */}
      <UserRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        selectedUser={selectedUser}
        allRoles={allRoles}
        selectedRoles={selectedRoles}
        onRoleToggle={handleRoleToggle}
        roleModalError={roleModalError}
        isSubmittingRole={isSubmittingRole}
        onSaveRoles={handleSaveRoles}
      />

      {/* 5. User Detail Modal */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={detailUser}
        onOpenEdit={(userToEdit) => openEditModal(userToEdit)}
        canEditUser={canEditUser}
      />

      {/* 6. Edit User Modal */}
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        onUserUpdated={handleUserUpdated}
      />

      {/* 7. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
        isSuperAdmin={isSuperAdmin()}
      />

      {/* 8. Delete User Confirm Modal */}
      <DeleteUserConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        user={userToDelete}
        onUserDeleted={handleUserDeleted}
      />
    </div>
  );
}

export default Users;
