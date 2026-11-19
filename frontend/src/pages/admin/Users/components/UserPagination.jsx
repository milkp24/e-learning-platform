function UserPagination({ total, page, pages, onPageChange }) {
  return (
    <div className="flex items-center justify-between border-t border-[#E5E9E7] bg-[#FAFAFA] px-6 py-3.5">
      <span className="text-xs text-[#6B7773] font-medium">
        ทั้งหมด <strong className="text-[#26332F]">{total}</strong> คน (หน้า {page} จาก {pages})
      </span>
      <div className="flex gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          type="button"
          className="rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
        >
          ก่อนหน้า
        </button>
        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page >= pages}
          type="button"
          className="rounded-xl border border-[#E5E9E7] bg-white px-3.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}

export default UserPagination;
