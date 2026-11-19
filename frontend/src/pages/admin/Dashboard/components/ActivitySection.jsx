import RecentActivity from "./RecentActivity";
import QuickActions from "./QuickActions";

function ActivitySection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div className="lg:col-span-7 flex flex-col">
        <RecentActivity />
      </div>
      <div className="lg:col-span-5 flex flex-col">
        <QuickActions />
      </div>
    </div>
  );
}

export default ActivitySection;
