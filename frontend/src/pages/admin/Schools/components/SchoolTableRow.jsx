import { LuEye, LuPencil, LuTrash2, LuBuilding, LuGraduationCap, LuUsers } from "react-icons/lu";

/**
 * SchoolTableRow Component
 * Displays a single school record with status, counts, and action buttons
 * Respects Dynamic Permission Matrix: schools.edit, schools.delete
 */
function SchoolTableRow({
  school,
  onOpenDetailModal,
  onOpenEditModal,
  onOpenDeleteModal,
  canEditSchool,
  canDeleteSchool,
}) {
  const classroomCount = school.classroom_count || 0;
  const memberCount = school.member_count || 0;
  const hasLinkedData = classroomCount > 0 || memberCount > 0;

  return (
    <tr className="hover:bg-[#FAFAFA] transition duration-150">
      {/* School Name & Code */}
      <td className="px-6 py-4">
        <button
          type="button"
          onClick={() => onOpenDetailModal && onOpenDetailModal(school)}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-xs font-black text-[#004643] group-hover:bg-[#ABD1C6] transition">
            <LuBuilding className="h-4 w-4" />
          </span>
          <div>
            <span className="font-bold text-[#26332F] group-hover:text-[#004643] transition block">
              {school.name}
            </span>
            {school.code && (
              <span className="text-[11px] font-mono text-[#6B7773] block">
                รหัส: {school.code}
              </span>
            )}
          </div>
        </button>
      </td>

      {/* Contact Info */}
      <td className="px-6 py-4 text-xs text-[#6B7773] space-y-0.5">
        {school.contact_email ? (
          <div className="font-mono text-[#26332F]">{school.contact_email}</div>
        ) : (
          <div className="text-gray-400">-</div>
        )}
        {school.contact_phone && (
          <div className="text-[11px] text-[#6B7773]">{school.contact_phone}</div>
        )}
      </td>

      {/* Classrooms & Members Count */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2 py-0.5 text-[11px] font-bold text-teal-800">
            <LuGraduationCap className="h-3 w-3" />
            <span>{classroomCount} ห้องเรียน</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            <LuUsers className="h-3 w-3" />
            <span>{memberCount} สมาชิก</span>
          </span>
        </div>
      </td>

      {/* Status Badge */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${
            school.status === "active"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-gray-100 text-gray-700 border border-gray-300"
          }`}
        >
          {school.status === "active" ? "Active" : "Inactive"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {/* Detail Button */}
          <button
            type="button"
            onClick={() => onOpenDetailModal && onOpenDetailModal(school)}
            title="ดูรายละเอียดข้อมูลโรงเรียน"
            className="inline-flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#26332F] hover:bg-[#ABD1C6]/20 hover:border-[#ABD1C6] transition shadow-2xs cursor-pointer"
          >
            <LuEye className="h-3.5 w-3.5 text-[#004643]" />
            <span className="hidden sm:inline">ดูข้อมูล</span>
          </button>

          {/* Edit Button */}
          {canEditSchool && (
            <button
              type="button"
              onClick={() => onOpenEditModal && onOpenEditModal(school)}
              title="แก้ไขข้อมูลโรงเรียน"
              className="inline-flex items-center gap-1 rounded-xl border border-[#E5E9E7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#004643] hover:bg-[#ABD1C6]/30 hover:border-[#ABD1C6] transition shadow-2xs cursor-pointer"
            >
              <LuPencil className="h-3.5 w-3.5 text-[#004643]" />
              <span className="hidden sm:inline">แก้ไข</span>
            </button>
          )}

          {/* Delete Button */}
          {canDeleteSchool && (
            <button
              type="button"
              onClick={() => onOpenDeleteModal && onOpenDeleteModal(school)}
              title={
                hasLinkedData
                  ? "โรงเรียนนี้มีห้องเรียนหรือสมาชิกผูกอยู่ การลบจะถูกตรวจสอบความปลอดภัย"
                  : "ลบโรงเรียน"
              }
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition shadow-2xs cursor-pointer"
            >
              <LuTrash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">ลบ</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default SchoolTableRow;
