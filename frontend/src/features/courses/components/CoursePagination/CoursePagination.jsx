/**
 * CoursePagination — เปลี่ยนหน้ารายการคอร์ส (หน้าละ 9 คอร์ส)
 * เลขหน้าถูกเก็บใน URL (?page=) โดยหน้าที่เรียกใช้ จึงย้อนกลับมาแล้วยังอยู่หน้าเดิม
 */
function CoursePagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const btn =
    "rounded-xl border border-[#E5E9E7] bg-white px-3 py-1.5 text-xs font-bold text-[#26332F] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      <button type="button" className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ก่อนหน้า
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPageChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={
            n === page
              ? "rounded-xl bg-[#ABD1C6] px-3 py-1.5 text-xs font-bold text-[#004643] shadow-xs"
              : btn
          }
        >
          {n}
        </button>
      ))}
      <button type="button" className={btn} disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        ถัดไป
      </button>
    </div>
  );
}

export default CoursePagination;
