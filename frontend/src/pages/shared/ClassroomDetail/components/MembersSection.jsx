/**
 * MembersSection Component
 * Members table for regular classrooms with add member button and remove member action.
 */
function MembersSection({
  members,
  isOwnerOrAdmin,
  onOpenAddMemberModal,
  onRemoveMember,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">รายชื่อสมาชิก</h3>
        {isOwnerOrAdmin && (
          <button
            onClick={onOpenAddMemberModal}
            type="button"
            className="rounded-xl bg-[#ABD1C6] px-4 py-2 text-xs font-bold text-[#20302C] hover:bg-[#9CC5B9] cursor-pointer"
          >
            + เพิ่มสมาชิกด้วย User ID
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          ยังไม่มีสมาชิกในห้องเรียนนี้
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">ชื่อสมาชิก</th>
                <th className="px-6 py-3 text-left">User ID</th>
                <th className="px-6 py-3 text-left">วันที่เข้าร่วม</th>
                {isOwnerOrAdmin && <th className="px-6 py-3 text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => (
                <tr key={m.classroom_member_id} className="hover:bg-gray-50/60">
                  <td className="px-6 py-3 font-semibold text-gray-900">
                    {m.display_name || "ไม่ระบุชื่อ"}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-500">
                    {m.user_id}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString("th-TH") : "-"}
                  </td>
                  {isOwnerOrAdmin && (
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => onRemoveMember(m.user_id)}
                        type="button"
                        className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        นำออก
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MembersSection;
