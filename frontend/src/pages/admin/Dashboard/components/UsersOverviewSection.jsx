import StatCard from "./StatCard";

/**
 * UsersOverviewSection Component
 * Domain 1: บัญชีผู้ใช้และการจัดการผู้ใช้ (User Management)
 *
 * Rule: 1 Chart = 1 Domain = 1 Topic
 * Summary:
 * - Total Users (ผู้ใช้ทั้งหมด)
 * - Students (นักเรียน)
 * - Instructors (ผู้สอน)
 * - Admins (ผู้ดูแลระบบ)
 *
 * Chart:
 * - Users by Role distribution (Student vs Instructor vs Admin)
 */
function UsersOverviewSection({ stats }) {
  const total = stats.totalUsers || 0;
  const students = stats.studentsCount || 0;
  const instructors = stats.instructorsCount || 0;
  const admins = stats.adminsCount || 0;

  // Compute percentages based on total active users
  const studentPct = total > 0 ? ((students / total) * 100).toFixed(1) : "0.0";
  const instructorPct = total > 0 ? ((instructors / total) * 100).toFixed(1) : "0.0";
  const adminPct = total > 0 ? ((admins / total) * 100).toFixed(1) : "0.0";

  const roleDistribution = [
    {
      role: "ผู้เรียน",
      count: students,
      percentage: studentPct,
      color: "#ABD1C6",
      barClass: "bg-[#ABD1C6]",
      textClass: "text-[#004643]",
      bgLight: "bg-[#ABD1C6]/20",
    },
    {
      role: "อาจารย์ผู้สอน",
      count: instructors,
      percentage: instructorPct,
      color: "#64748B",
      barClass: "bg-slate-500",
      textClass: "text-slate-800",
      bgLight: "bg-slate-100",
    },
    {
      role: "ผู้ดูแลระบบ",
      count: admins,
      percentage: adminPct,
      color: "#004643",
      barClass: "bg-[#004643]",
      textClass: "text-[#004643]",
      bgLight: "bg-[#26332F]/10",
    },
  ];

  return (
    <section className="space-y-4">
      {/* Domain Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-[#E5E9E7] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ABD1C6]" />
            <h2 className="text-lg sm:text-xl font-black text-[#26332F] tracking-tight">
              สถิติผู้ใช้งานในระบบ
            </h2>
          </div>
          <p className="text-xs text-[#6B7773] mt-0.5 ml-4.5">
            ภาพรวมบัญชีผู้ใช้งานและการแบ่งตามบทบาทในระบบ
          </p>
        </div>
        <span className="text-xs font-semibold text-[#004643] bg-[#ABD1C6]/30 px-2.5 py-1 rounded-full self-start sm:self-auto ml-4.5 sm:ml-0">
          การจัดการผู้ใช้งาน
        </span>
      </div>

      {/* Summary Cards Grid (4 columns on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ผู้ใช้ทั้งหมด"
          value={stats.totalUsers}
          subtitle="ผู้ใช้ทั้งหมดในระบบ"
          domain="jade"
          iconType="users"
        />
        <StatCard
          title="ผู้เรียน"
          value={stats.studentsCount}
          subtitle="ผู้เรียนในระบบ"
          domain="jade"
          iconType="student"
        />
        <StatCard
          title="ผู้สอน"
          value={stats.instructorsCount}
          subtitle="ผู้สอนที่สร้างคอร์สได้"
          domain="slate"
          iconType="instructors"
        />
        <StatCard
          title="ผู้ดูแลระบบ"
          value={stats.adminsCount}
          subtitle="ผู้ดูแลระบบ"
          domain="darkJade"
          iconType="admin"
        />
      </div>

      {/* Domain Chart: Users by Role (1 Chart = 1 Domain = 1 Topic) */}
      <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E9E7] gap-2">
          <div>
            <h3 className="text-base font-black text-[#26332F]">
              สัดส่วนผู้ใช้งานตามบทบาท
            </h3>
            <p className="text-xs text-[#6B7773] mt-0.5">
              สัดส่วนการกระจายตัวของบัญชีผู้ใช้ตามสิทธิ์การเข้าถึงระบบ
            </p>
          </div>
          <span className="text-xs font-bold text-[#6B7773] bg-[#FAFAFA] border border-[#E5E9E7] px-2.5 py-1 rounded-lg">
            รวม {total.toLocaleString()} บัญชี
          </span>
        </div>

        {/* Multi-segment Distribution Bar */}
        <div className="mt-6">
          <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 p-0.5 gap-0.5">
            {roleDistribution.map((item) => {
              const widthNum = Number(item.percentage);
              if (widthNum <= 0) return null;
              return (
                <div
                  key={item.role}
                  style={{ width: `${widthNum}%` }}
                  className={`h-full ${item.barClass} rounded-full transition-all duration-500`}
                  title={`${item.role}: ${item.count} (${item.percentage}%)`}
                />
              );
            })}
          </div>
        </div>

        {/* Role Breakdown Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleDistribution.map((item) => (
            <div
              key={item.role}
              className={`p-4 rounded-xl border border-[#E5E9E7] ${item.bgLight} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-bold text-[#26332F]">
                    {item.role}
                  </span>
                </div>
                <span className="text-xs font-black text-[#26332F]">
                  {item.percentage}%
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-[#6B7773]">จำนวน</span>
                <span className={`text-xl font-black ${item.textClass}`}>
                  {item.count.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-[#6B7773]">คน</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Note */}
        <div className="mt-4 pt-3 border-t border-[#E5E9E7]/60 flex items-center justify-between text-xs text-[#6B7773]">
          <span>การกระจายตัวของบัญชีผู้ใช้ครอบคลุมทั้ง 3 บทบาทหลักในระบบ</span>
          <span className="text-[#004643] font-semibold">100% ครอบคลุมผู้ใช้</span>
        </div>
      </div>
    </section>
  );
}

export default UsersOverviewSection;
