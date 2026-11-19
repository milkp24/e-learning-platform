import StatCard from "../../../../components/common/StatCard";

// ข้อ 29: แยกจำนวนบทเรียนกับจำนวนเนื้อหาให้ชัดเจน
// - บทเรียน = บท (Lesson/Chapter) ในคอร์สของผู้สอน
// - เนื้อหา = ชิ้นเนื้อหา (ข้อความ รูป วิดีโอ ไฟล์) ภายในบทเรียนทั้งหมด
function InstructorStatsSection({ coursesCount, totalStudents, totalLessons, totalContents = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="คอร์สที่รับผิดชอบ"
        value={coursesCount}
        theme="pine"
        description="คอร์สที่คุณเป็นเจ้าของ"
        actionLink="/classrooms?view=owned"
        actionText="ดูคอร์สของฉัน"
      />
      <StatCard
        title="จำนวนนักเรียนรวม"
        value={totalStudents}
        theme="jade"
        description="ผู้เรียนที่ลงทะเบียนในคอร์สของคุณ"
      />
      <StatCard
        title="จำนวนบทเรียน"
        value={totalLessons}
        theme="blue"
        description="บทเรียนทั้งหมดในคอร์สของคุณ"
      />
      <StatCard
        title="จำนวนเนื้อหา"
        value={totalContents}
        theme="amber"
        description="ข้อความ รูปภาพ วิดีโอ และไฟล์ในทุกบทเรียน"
      />
    </div>
  );
}

export default InstructorStatsSection;
