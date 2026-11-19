/**
 * ClassroomsHeader Component
 * Title, role-adaptive description, and "+ สร้างห้องเรียนใหม่" button (for instructor/admin).
 */
function ClassroomsHeader({ isStudentOnly, canCreateClassroom, onOpenCreateModal }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isStudentOnly
            ? "คอร์สเรียนของฉัน"
            : "ห้องเรียนทั้งหมด"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isStudentOnly
            ? "รายวิชาและห้องเรียนที่คุณกำลังศึกษา เข้าสู่บทเรียนเพื่อเรียนรู้ต่อได้ทันที"
            : "เลือกห้องเรียนเพื่อเข้าสู่บทเรียนและเนื้อหาการเรียนรู้"}
        </p>
      </div>

      {/* ปุ่มสร้างห้องเรียน: แสดงเฉพาะ Instructor หรือ Admin เท่านั้น */}
      {canCreateClassroom && (
        <button
          onClick={onOpenCreateModal}
          type="button"
          className="rounded-xl bg-[#ABD1C6] px-5 py-2.5 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9] shadow-sm cursor-pointer"
        >
          + สร้างห้องเรียนใหม่
        </button>
      )}
    </div>
  );
}

export default ClassroomsHeader;
