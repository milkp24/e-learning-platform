import PropTypes from "prop-types";

/**
 * PopularCoursesSection (ข้อ 32): ผลรายคอร์สจากข้อมูลจริง
 * เรียงตามการลงทะเบียนในช่วงที่เลือก แล้วตามจำนวนผู้เรียนทั้งหมด
 */
const STATUS_LABELS = { active: "เผยแพร่แล้ว", draft: "ฉบับร่าง", pending: "รอตรวจสอบ" };

function PopularCoursesSection({ courses = [], isLoading = false }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#26332F]">ผลรายคอร์ส</h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            เรียงตามการลงทะเบียนในช่วงที่เลือก · อัตราเรียนจบนับจากผู้เรียนทั้งหมดของคอร์ส
          </p>
        </div>
        <span className="rounded-full bg-[#FAFAFA] border border-[#E5E9E7] px-3 py-1 font-mono text-xs font-bold text-[#26332F]">
          {courses.length} คอร์ส
        </span>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-xl bg-[#FAFAFA] animate-pulse" />
      ) : courses.length === 0 ? (
        <p className="py-10 text-center text-xs text-[#6B7773]">ยังไม่มีคอร์สในระบบ</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[#6B7773]">
              <tr className="border-b border-[#E5E9E7]">
                <th className="py-2 pr-3 text-left font-semibold">#</th>
                <th className="py-2 pr-3 text-left font-semibold">คอร์ส</th>
                <th className="py-2 px-3 text-right font-semibold">ลงทะเบียนในช่วงนี้</th>
                <th className="py-2 px-3 text-right font-semibold">ผู้เรียนทั้งหมด</th>
                <th className="py-2 px-3 text-right font-semibold">บทที่จบในช่วงนี้</th>
                <th className="py-2 pl-3 text-left font-semibold w-[28%]">อัตราเรียนจบ</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, idx) => (
                <tr key={c.course_id} className="border-b border-[#E5E9E7]/60 break-inside-avoid">
                  <td className="py-2.5 pr-3 font-mono text-[#6B7773]">{idx + 1}</td>
                  <td className="py-2.5 pr-3">
                    <p className="font-bold text-[#26332F]">{c.title}</p>
                    <p className="text-[11px] text-[#6B7773]">
                      {STATUS_LABELS[c.status] || c.status} · {c.lessonCount} บทเรียน
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#26332F]">{c.enrollmentsInRange}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#26332F]">{c.totalLearners}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#26332F]">{c.lessonsCompletedInRange}</td>
                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-[#E5E9E7] overflow-hidden" aria-hidden="true">
                        <div className="h-full rounded-full bg-[#004643]" style={{ width: `${c.completionRate}%` }} />
                      </div>
                      <span className="w-20 text-right font-mono text-[#26332F]">
                        {c.completionRate}% ({c.completedLearners}/{c.totalLearners})
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

PopularCoursesSection.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
};

export default PopularCoursesSection;
