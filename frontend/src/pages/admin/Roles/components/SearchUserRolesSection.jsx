
/**
 * SearchUserRolesSection Component
 * Form to input and search User UUID to lookup roles.
 */
function SearchUserRolesSection({
  targetUserId,
  onTargetUserIdChange,
  onSearch,
  searching,
}) {
  return (
    <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          value={targetUserId}
          onChange={(e) => onTargetUserIdChange(e.target.value)}
          placeholder="ระบุรหัสผู้ใช้ (User ID เช่น 123e4567-e89b-12d3-a456-426614174000)"
          className="w-full rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-2.5 font-mono text-xs sm:text-sm text-[#26332F] placeholder-[#6B7773]/70 focus:border-[#ABD1C6] focus:outline-none transition shadow-2xs"
        />
      </div>
      <button
        type="submit"
        disabled={searching}
        className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#26332F] hover:bg-[#9bc3b7] active:scale-98 disabled:opacity-50 transition cursor-pointer shadow-2xs"
      >
        {searching ? "กำลังค้นหา..." : "ตรวจสอบสิทธิ์"}
      </button>
    </form>
  );
}


export default SearchUserRolesSection;
