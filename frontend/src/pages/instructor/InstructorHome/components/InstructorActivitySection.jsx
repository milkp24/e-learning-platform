import SectionHeader from "../../../../components/layout/SectionHeader";
import ActivityList from "../../../../features/courses/components/ActivityList";

function InstructorActivitySection({ activities }) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="กิจกรรมล่าสุดของผู้เรียน"
        subtitle="การลงทะเบียนและส่งงานใหม่ในห้องเรียน"
      />
      <ActivityList
        items={activities}
        title="กิจกรรมของผู้สอนและผู้เรียน"
        maxItems={5}
      />
    </div>
  );
}

export default InstructorActivitySection;
