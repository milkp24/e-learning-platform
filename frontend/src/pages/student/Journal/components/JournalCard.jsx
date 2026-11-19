function JournalCard({ journal, onEdit, onDelete }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-[#004643]">
            {journal.course_title || "บันทึกทั่วไป"}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(journal.created_at).toLocaleDateString("th-TH")}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
          {journal.title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 whitespace-pre-line line-clamp-4">
          {journal.content}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          onClick={() => onEdit(journal)}
          type="button"
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
        >
          แก้ไข
        </button>
        <button
          onClick={() => onDelete(journal.journal_id)}
          type="button"
          className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
        >
          ลบ
        </button>
      </div>
    </div>
  );
}

export default JournalCard;
