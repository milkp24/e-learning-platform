/**
 * ClassroomsHeader Component
 * Title, role-adaptive description, and "+ สร้างคอร์สเรียนใหม่" button (for instructor/admin).
 */
function ClassroomsHeader({ view = "all", canCreateClassroom, onOpenCreateModal }) {
  const isMine = view === "mine" || view === "owned";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isMine ? "คอร์สเรียนของฉัน" : "คอร์สเรียนทั้งหมด"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isMine
            ? "คอร์สที่คุณลงทะเบียนเรียนหรือรับผิดชอบสอน"
            : "เลือกคอร์สเพื่อเข้าสู่บทเรียนและเนื้อหาการเรียนรู้"}
        </p>
      </div>

      {/* ปุ่มสร้างห้องเรียน: แสดงเฉพาะ Instructor หรือ Admin เท่านั้น */}
      {canCreateClassroom && (
        <button
          onClick={onOpenCreateModal}
          type="button"
          className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9] shadow-sm cursor-pointer"
        >
          + สร้างคอร์สเรียนใหม่
        </button>
      )}
    </div>
  );
}

export default ClassroomsHeader;
