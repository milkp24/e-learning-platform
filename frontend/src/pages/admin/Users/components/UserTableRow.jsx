import { LuEye, LuPencil, LuShield, LuTrash2 } from "react-icons/lu";
import { RowActionGroup, RowTextButton, RowIconButton } from "../../../../components/common/RowActions";

function UserTableRow({
  user,
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
  const dName = user.profile?.display_name || user.email.split("@")[0];

  const isSelf = Boolean(
    currentUserId &&
      (String(user.user_id) === String(currentUserId) ||
        String(user.id) === String(currentUserId))
  );
  const targetIsSuperAdmin = Boolean(
    user.roles?.includes("super_admin") || user.role === "super_admin"
  );
  const isDeleteDisabled = isSelf || (targetIsSuperAdmin && !isSuperAdmin);
  // #22: Admin ทั่วไปห้ามแก้ไขบัญชี Super Admin (Backend ตอบ 403 เช่นกัน)
  const isProtectedSuperAdmin = targetIsSuperAdmin && !isSuperAdmin;
  const canModifyTarget = canEditUser && !isProtectedSuperAdmin;

  return (
    <tr className="hover:bg-[#FAFAFA] transition duration-150">
      {/* Name & Avatar (Clickable to view detail) */}
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={() => onOpenDetailModal && onOpenDetailModal(user)}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xs font-black text-[#26332F] group-hover:bg-[#ABD1C6] transition">
            {dName.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <span className="font-bold text-[#26332F] group-hover:text-[#004643] transition block">
              {user.profile?.display_name || "ไม่ระบุ"}
            </span>
            {(user.profile?.first_name || user.profile?.last_name) && (
              <span className="text-[11px] text-[#6B7773] block">
                {`${user.profile?.title ? user.profile.title + " " : ""}${user.profile?.first_name || ""} ${user.profile?.last_name || ""}`.trim()}
              </span>
            )}
          </div>
        </button>
      </td>

      {/* Email */}
      <td className="px-6 py-4 font-mono text-xs text-[#6B7773]">
        {user.email}
      </td>

      {/* Roles */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          {user.roles?.map((r) => (
            <span
              key={r}
              className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                r === "super_admin"
                  ? "bg-[#004643] text-[#ABD1C6]"
                  : r === "admin"
                  ? "bg-[#ABD1C6] text-[#26332F]"
                  : r === "instructor"
                  ? "bg-teal-50 text-teal-800 border border-teal-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      </td>

      {/* Status Dropdown */}
      <td className="px-6 py-4">
        <select
          value={user.status}
          disabled={!canModifyTarget}
          title={isProtectedSuperAdmin ? "เฉพาะ Super Admin เท่านั้นที่แก้ไขบัญชี Super Admin ได้" : undefined}
          onChange={(e) => onStatusChange(user.user_id, e.target.value)}
          className={`rounded-lg border px-2.5 py-1 text-xs font-bold uppercase focus:outline-none transition ${
            !canModifyTarget ? "cursor-not-allowed opacity-70 " : "cursor-pointer "
          }${
            user.status === "active"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : user.status === "suspended"
              ? "border-rose-300 bg-rose-50 text-rose-800"
              : "border-[#E5E9E7] bg-gray-50 text-gray-700"
          }`}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </td>

      {/* Actions: [บทบาท] [ดู] [แก้ไข] [ลบ] รูปแบบเดียวกับทุกตารางในระบบ (RowActions) */}
      <td className="px-6 py-4 text-right">
        <RowActionGroup>
          <RowTextButton
            icon={LuShield}
            onClick={() => onOpenRoleModal(user)}
            disabled={isProtectedSuperAdmin}
            disabledReason="เฉพาะ Super Admin เท่านั้นที่แก้ไขบทบาทของ Super Admin ได้"
            title="กำหนดบทบาท"
          >
            บทบาท
          </RowTextButton>
          <RowIconButton
            icon={LuEye}
            label="ดูรายละเอียดข้อมูลผู้ใช้"
            onClick={() => onOpenDetailModal && onOpenDetailModal(user)}
          />
          <RowIconButton
            icon={LuPencil}
            label="แก้ไขข้อมูลผู้ใช้"
            onClick={() => onOpenEditModal && onOpenEditModal(user)}
            disabled={!canModifyTarget}
            disabledReason={
              isProtectedSuperAdmin
                ? "Admin แก้ไขบัญชี Super Admin ไม่ได้"
                : "คุณไม่มีสิทธิ์แก้ไขผู้ใช้"
            }
          />
          {canDeleteUser && (
            <RowIconButton
              icon={LuTrash2}
              tone="danger"
              label="ลบบัญชีผู้ใช้"
              onClick={() => onOpenDeleteModal && onOpenDeleteModal(user)}
              disabled={isDeleteDisabled}
              disabledReason={
                isSelf
                  ? "ไม่สามารถลบบัญชีของตนเองได้"
                  : "เฉพาะ Super Admin เท่านั้นที่สามารถลบบัญชี Super Admin ได้"
              }
            />
          )}
        </RowActionGroup>
      </td>
    </tr>
  );
}

export default UserTableRow;
