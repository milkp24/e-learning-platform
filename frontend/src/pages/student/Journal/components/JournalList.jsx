import { LuFileText } from "react-icons/lu";
import JournalCard from "./JournalCard";

function JournalList({
  journals,
  isLoading,
  error,
  onOpenCreateModal,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-gray-500">
        กำลังโหลดบันทึกการเรียนรู้...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-center text-red-600 border border-red-200">
        {error}
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <LuFileText className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
        <h3 className="mt-3 text-base font-bold text-gray-800">
          ยังไม่มีบันทึกการเรียนรู้
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          เริ่มต้นจดบันทึกแรกของคุณเพื่อเก็บเกี่ยวความรู้ที่ได้เรียนมา
        </p>
        <button
          onClick={onOpenCreateModal}
          type="button"
          className="mt-4 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#003835] cursor-pointer"
        >
          สร้างบันทึกแรก
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {journals.map((j) => (
        <JournalCard
          key={j.journal_id}
          journal={j}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default JournalList;
