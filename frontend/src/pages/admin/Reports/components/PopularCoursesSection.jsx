
/**
 * PopularCoursesSection Component
 * Ranking cards and progress bars for top performing courses.
 */
function PopularCoursesSection({ courses }) {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E9E7] pb-4">
        <div>
          <h3 className="text-base font-bold text-[#26332F]">
            หลักสูตรยอดนิยม (Top Performing Courses)
          </h3>
          <p className="text-xs text-[#6B7773] mt-0.5">
            จัดอันดับตามจำนวนผู้ลงทะเบียนและอัตราความสำเร็จ
          </p>
        </div>
        <span className="rounded-full bg-[#FAFAFA] border border-[#E5E9E7] px-3 py-1 font-mono text-xs font-bold text-[#26332F]">
          Top {courses.length} Courses
        </span>
      </div>

      <div className="space-y-4">
        {courses.map((c, idx) => (
          <div
            key={idx}
            className="rounded-[14px] border border-[#E5E9E7] bg-[#FAFAFA] p-4.5 transition hover:bg-white hover:shadow-2xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6] text-xs font-black text-[#26332F]">
                  #{idx + 1}
                </span>
                <h4 className="text-sm font-bold text-[#26332F]">
                  {c.title}
                </h4>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#6B7773]">
                  ลงทะเบียน: <strong className="text-[#26332F]">{c.enrollments}</strong> คน
                </span>
                <span className="text-[#6B7773]">
                  เรียนสะสม: <strong className="text-[#26332F]">{c.hours}</strong> ชม.
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#6B7773]">Completion Rate</span>
                <span className="text-[#26332F]">{c.completionRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E5E9E7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#ABD1C6]"
                  style={{ width: `${c.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default PopularCoursesSection;
