function UserRoleModal({
  isOpen,
  onClose,
  selectedUser,
  allRoles,
  selectedRoles,
  onRoleToggle,
  roleModalError,
  isSubmittingRole,
  onSaveRoles,
}) {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4 transition-all">
      <div className="w-full max-w-md rounded-[16px] border border-[#E5E9E7] bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-3">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              กำหนดบทบาท (Edit Roles)
            </h3>
            <p className="text-xs text-[#6B7773] truncate max-w-xs">
              {selectedUser.profile?.display_name || selectedUser.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#6B7773] hover:text-[#26332F] text-lg font-bold p-1 cursor-pointer"
          >
            ×
          </button>
        </div>

        {roleModalError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            {roleModalError}
          </div>
        )}

        <form onSubmit={onSaveRoles} className="space-y-4">
          <div className="space-y-2">
            {allRoles.map((role) => {
              const rName = role.role_name;
              const isChecked = selectedRoles.includes(rName);
              return (
                <label
                  key={rName}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    isChecked
                      ? "border-[#ABD1C6] bg-[#ABD1C6]/15 font-bold"
                      : "border-[#E5E9E7] hover:bg-[#FAFAFA]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onRoleToggle(rName)}
                    className="h-4 w-4 rounded text-[#26332F] accent-[#26332F] focus:ring-[#ABD1C6]"
                  />
                  <span className="text-xs sm:text-sm font-bold uppercase text-[#26332F]">
                    {rName}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E9E7]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#26332F] hover:bg-gray-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmittingRole}
              className="rounded-xl bg-[#ABD1C6] px-5 py-2 text-xs font-bold text-[#26332F] hover:bg-[#9bc3b7] disabled:opacity-50 transition cursor-pointer shadow-2xs"
            >
              {isSubmittingRole ? "กำลังบันทึก..." : "บันทึกบทบาท"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserRoleModal;
