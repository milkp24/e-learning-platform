import React, { useState, useEffect } from "react";
import adminService from "../services/adminService";
import roleService from "../services/roleService";

// ======================================================
// AdminUsers Component (หน้าจัดการผู้ใช้งานสำหรับ Admin)
// รองรับ UAT-021, UAT-022, UAT-023, UAT-024, UAT-025:
// - ค้นหาผู้ใช้ตาม Email / Display Name
// - กรองตาม Role ('student', 'instructor', 'admin')
// - กรองตาม Status ('active', 'inactive', 'suspended')
// - การแบ่งหน้า (Pagination)
// - เปลี่ยนสถานะ และเปลี่ยน Role
// ======================================================

function AdminUsers() {
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

  // Role Edit Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
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
    } catch (err) {
      setError("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      const data = await roleService.getAllRoles();
      setAllRoles(data.roles || []);
    } catch {
      // Fallback roles
      setAllRoles([
        { role_name: "student" },
        { role_name: "instructor" },
        { role_name: "admin" },
      ]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAllRoles();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // เปลี่ยนสถานะผู้ใช้ (active / inactive / suspended)
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  // เปิด Modal แก้ไข Role
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
      setRoleModalError("ผู้ใช้ต้องมีอย่างน้อย 1 บทบาท (Role)");
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-extrabold text-gray-900">
          👥 จัดการผู้ใช้งานระบบ (User Management)
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ค้นหา ตรวจสอบบทบาท และปรับเปลี่ยนสถานะการใช้งานของผู้ใช้ทั้งหมด
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาด้วยอีเมล หรือ ชื่อผู้ใช้..."
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#004643] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-white hover:bg-[#003835]"
          >
            ค้นหา
          </button>
        </form>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="user-role-filter" className="text-xs font-bold text-gray-600 whitespace-nowrap">บทบาท:</label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs focus:outline-none"
          >
            <option value="">ทุกบทบาท</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="user-status-filter" className="text-xs font-bold text-gray-600 whitespace-nowrap">สถานะ:</label>
          <select
            id="user-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs focus:outline-none"
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            กำลังโหลดข้อมูลผู้ใช้...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่กำหนด
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-4">ผู้ใช้งาน</th>
                  <th className="px-6 py-4">อีเมล</th>
                  <th className="px-6 py-4">บทบาท (Roles)</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {u.profile?.display_name || "ไม่ระบุ"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <span
                            key={r}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${
                              r === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : r === "instructor"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.status}
                        onChange={(e) => handleStatusChange(u.user_id, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase focus:outline-none ${
                          u.status === "active"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : u.status === "suspended"
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-gray-300 bg-gray-50 text-gray-700"
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openRoleModal(u)}
                        type="button"
                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
                      >
                        กำหนด Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
          <span className="text-xs text-gray-500">
            ทั้งหมด <strong className="text-gray-900">{total}</strong> คน (หน้า {page} จาก {pages})
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              type="button"
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              type="button"
              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>

      {/* Modal กำหนด Role */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              กำหนดบทบาท (Roles): {selectedUser.profile?.display_name || selectedUser.email}
            </h3>

            {roleModalError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {roleModalError}
              </div>
            )}

            <form onSubmit={handleSaveRoles} className="mt-4 space-y-4">
              <div className="space-y-2">
                {allRoles.map((role) => {
                  const rName = role.role_name;
                  const isChecked = selectedRoles.includes(rName);
                  return (
                    <label
                      key={rName}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                        isChecked
                          ? "border-[#004643] bg-teal-50/50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRoleToggle(rName)}
                        className="h-4 w-4 rounded text-[#004643] focus:ring-[#004643]"
                      />
                      <span className="text-sm font-bold uppercase text-gray-800">
                        {rName}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  type="button"
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="rounded-xl bg-[#004643] px-5 py-2 text-xs font-bold text-white hover:bg-[#003835] disabled:opacity-50"
                >
                  {isSubmittingRole ? "กำลังบันทึก..." : "บันทึกบทบาท"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
