import StatCard from "./StatCard";

/**
 * CoursesOverviewSection Component
 * Domain 2: การจัดการหลักสูตรและเนื้อหา (Course Management)
 *
 * Rule: 1 Chart = 1 Domain = 1 Topic
 * Summary:
 * - Total Courses (หลักสูตรทั้งหมด)
 * - Published (เผยแพร่แล้ว)
 * - Draft (ฉบับร่าง)
 * - Archived (เก็บถาวร)
 *
 * Chart:
 * - Course Status distribution (Published vs Draft vs Archived)
 */
function CoursesOverviewSection({ stats }) {
  const total = stats.totalCourses || 0;
  const published = stats.publishedCourses || 0;
  const draft = stats.draftCourses || 0;
  const archived = stats.archivedCourses || 0;

  // Compute percentages based on total courses
  const publishedPct = total > 0 ? ((published / total) * 100).toFixed(1) : "0.0";
  const draftPct = total > 0 ? ((draft / total) * 100).toFixed(1) : "0.0";
  const archivedPct = total > 0 ? ((archived / total) * 100).toFixed(1) : "0.0";

  const statusDistribution = [
    {
      status: "เผยแพร่แล้ว",
      count: published,
      percentage: publishedPct,
      color: "#0D9488",
      barClass: "bg-teal-600",
      textClass: "text-teal-700",
      bgLight: "bg-teal-50",
      badge: "เผยแพร่",
      badgeClass: "bg-teal-100 text-teal-800",
    },
    {
      status: "ฉบับร่าง",
      count: draft,
      percentage: draftPct,
      color: "#94A3B8",
      barClass: "bg-slate-400",
      textClass: "text-slate-600",
      bgLight: "bg-slate-50",
      badge: "ฉบับร่าง",
      badgeClass: "bg-slate-100 text-slate-700",
    },
    {
      status: "เก็บถาวร",
      count: archived,
      percentage: archivedPct,
      color: "#64748B",
      barClass: "bg-slate-600",
      textClass: "text-slate-700",
      bgLight: "bg-slate-100/60",
      badge: "จัดเก็บแล้ว",
      badgeClass: "bg-slate-200 text-slate-800",
    },
  ];

  return (
    <section className="space-y-4">
      {/* Domain Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E5E9E7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
            <h2 className="text-lg sm:text-xl font-black text-[#26332F] tracking-tight">
              สถิติหลักสูตรและคอร์สเรียน
            </h2>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5 ml-4.5">
            ภาพรวมหลักสูตรและสถานะการเผยแพร่ในระบบ
          </p>
        </div>
        <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/50 px-2.5 py-1 rounded-full self-start sm:self-auto ml-4.5 sm:ml-0">
          การจัดการหลักสูตร
        </span>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="คอร์สทั้งหมด"
          value={stats.totalCourses}
          subtitle="หลักสูตรทั้งหมดในระบบ"
          domain="teal"
          iconType="courses"
        />
        <StatCard
          title="เผยแพร่แล้ว"
          value={stats.publishedCourses}
          subtitle="เปิดให้ผู้เรียนเข้าถึงได้"
          domain="teal"
          iconType="check"
        />
        <StatCard
          title="ฉบับร่าง"
          value={stats.draftCourses}
          subtitle="อยู่ระหว่างการจัดทำ"
          domain="slate"
          iconType="clock"
        />
        <StatCard
          title="เก็บถาวร"
          value={stats.archivedCourses}
          subtitle="ปิดการใช้งาน/เก็บถาวร"
          domain="slate"
          iconType="archive"
        />
      </div>

      {/* Domain Chart: Course Status (1 Chart = 1 Domain = 1 Topic) */}
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E9E7] gap-2">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              สัดส่วนสถานะหลักสูตร
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              การกระจายตัวของหลักสูตรตามวงจรชีวิตและสถานะการเผยแพร่
            </p>
          </div>
          <span className="text-xs font-bold text-[#6B7773] bg-[#FAFAFA] border border-[#E5E9E7] px-2.5 py-1 rounded-lg">
            รวม {total.toLocaleString()} คอร์ส
          </span>
        </div>

        {/* Multi-segment Distribution Bar */}
        <div className="mt-6">
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5">
            {total > 0 ? (
              statusDistribution.map((item) => {
                const widthNum = Number(item.percentage);
                if (widthNum <= 0) return null;
                return (
                  <div
                    key={item.status}
                    style={{ width: `${widthNum}%` }}
                    className={`h-full ${item.barClass} rounded-full transition-all duration-500`}
                    title={`${item.status}: ${item.count} (${item.percentage}%)`}
                  />
                );
              })
            ) : (
              <div className="h-full w-full bg-slate-200 rounded-full" />
            )}
          </div>
        </div>

        {/* Status Breakdown Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusDistribution.map((item) => (
            <div
              key={item.status}
              className={`p-4 rounded-xl border border-[#E5E9E7] ${item.bgLight} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-bold text-[#26332F]">
                    {item.status}
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.badgeClass}`}>
                  {item.badge}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xs text-[#6B7773]">สัดส่วน {item.percentage}%</span>
                <span className={`text-xl font-black ${item.textClass}`}>
                  {item.count.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-[#6B7773]">คอร์ส</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Note on Course Access */}
        <div className="mt-4 pt-3 border-t border-[#E5E9E7]/60 flex items-center justify-between text-xs text-[#6B7773]">
          <span>ผู้เรียนจะสามารถลงทะเบียนและเข้าเรียนได้เฉพาะคอร์สที่เผยแพร่แล้วเท่านั้น</span>
          <span className="text-teal-700 font-semibold">{published} คอร์สที่เปิดสอน</span>
        </div>
      </div>
    </section>
  );
}

export default CoursesOverviewSection;
