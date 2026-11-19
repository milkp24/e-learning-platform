import { LuBookMarked, LuPenLine } from "react-icons/lu";

function JournalHeader({ onOpenCreateModal }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
          <LuBookMarked className="h-6 w-6 text-[#004643]" aria-hidden="true" />
          <span>บันทึกการเรียนรู้ (Learning Journal)</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          จดบันทึก สรุปเนื้อหาสำคัญ และทบทวนความรู้ส่วนตัวของคุณ
        </p>
      </div>
      <button
        onClick={onOpenCreateModal}
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#004643] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#003835] active:scale-98 cursor-pointer"
      >
        <LuPenLine className="h-4 w-4" aria-hidden="true" />
        <span>เขียนบันทึกใหม่</span>
      </button>
    </div>
  );
}

export default JournalHeader;
