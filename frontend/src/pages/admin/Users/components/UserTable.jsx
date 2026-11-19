import { LuUsers } from "react-icons/lu";
import UserTableRow from "./UserTableRow";

function UserTable({
  users,
  isLoading,
  error,
  onRetry,
  onStatusChange,
  onOpenRoleModal,
  onOpenDetailModal,
  onOpenEditModal,
  onOpenDeleteModal,
  canEditUser,
  canDeleteUser,
  currentUserId,
  isSuperAdmin,
}) {
  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-3 border-[#E5E9E7] border-t-[#ABD1C6]" />
        <p className="text-xs sm:text-sm font-medium text-[#6B7773]">
          กำลังโหลดข้อมูลผู้ใช้งาน...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center space-y-3 px-4">
        <p className="text-sm font-bold text-rose-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9bc3b7] transition cursor-pointer"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center space-y-2">
        <LuUsers className="mx-auto h-8 w-8 text-[#6B7773]" aria-hidden="true" />
        <h4 className="text-sm font-bold text-[#26332F]">No data available</h4>
        <p className="text-xs text-[#6B7773]">
          ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่กำหนด
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#26332F]">
        <thead className="border-b border-[#E5E9E7] bg-[#FAFAFA] text-xs font-bold uppercase tracking-wider text-[#6B7773]">
          <tr>
            <th className="px-6 py-4">ผู้ใช้งาน</th>
            <th className="px-6 py-4">อีเมล</th>
            <th className="px-6 py-4">บทบาท</th>
            <th className="px-6 py-4">สถานะ</th>
            <th className="px-6 py-4 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E9E7]">
          {users.map((u) => (
            <UserTableRow
              key={u.user_id}
              user={u}
              onStatusChange={onStatusChange}
              onOpenRoleModal={onOpenRoleModal}
              onOpenDetailModal={onOpenDetailModal}
              onOpenEditModal={onOpenEditModal}
              onOpenDeleteModal={onOpenDeleteModal}
              canEditUser={canEditUser}
              canDeleteUser={canDeleteUser}
              currentUserId={currentUserId}
              isSuperAdmin={isSuperAdmin}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
