import StatCard from "../../../../components/common/StatCard";

function InstructorStatsSection({ coursesCount, totalStudents, totalLessons }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="คอร์สที่รับผิดชอบ"
        value={coursesCount > 0 ? coursesCount : 1}
        theme="pine"
        description="คอร์สเรียนที่มีอยู่ในระบบ"
        actionLink="/classrooms"
        actionText="ดูคอร์สทั้งหมด"
      />
      <StatCard
        title="จำนวนนักเรียนรวม"
        value={totalStudents}
        theme="jade"
        trend="+12%"
        trendType="up"
        description="ผู้เรียนที่ลงทะเบียนในห้องของคุณ"
      />
      <StatCard
        title="บทเรียนและเนื้อหาทั้งหมด"
        value={totalLessons}
        theme="blue"
        description="ตอนย่อยเนื้อหา 4 ระดับชั้น"
      />
    </div>
  );
}

export default InstructorStatsSection;
