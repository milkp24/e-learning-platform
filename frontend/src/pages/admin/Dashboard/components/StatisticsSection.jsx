import StatCard from "./StatCard";

/**
 * StatisticsSection (Deprecated - Replaced by Domain Sections)
 * Kept for backward compatibility with safe fallbacks
 */
function StatisticsSection({ stats = {} }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCard
        title="Total Users"
        value={stats?.totalUsers ?? 0}
        subtitle="ผู้ใช้ทั้งหมด"
        domain="jade"
        iconType="users"
      />
      <StatCard
        title="Total Courses"
        value={stats?.totalCourses ?? 0}
        subtitle="หลักสูตรทั้งหมด"
        domain="teal"
        iconType="courses"
      />
      <StatCard
        title="Instructors"
        value={stats?.totalInstructors ?? 0}
        subtitle="ผู้สอน"
        domain="slate"
        iconType="instructors"
      />
      <StatCard
        title="Course Enrollments"
        value={stats?.courseEnrollments ?? 0}
        subtitle="การลงทะเบียน"
        domain="green"
        iconType="student"
      />
    </div>
  );
}

export default StatisticsSection;
