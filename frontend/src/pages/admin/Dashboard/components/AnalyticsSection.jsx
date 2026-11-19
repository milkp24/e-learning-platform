import ActivityChart from "./ActivityChart";

/**
 * AnalyticsSection (Deprecated - Replaced by Domain Sections)
 * Kept for backward compatibility
 */
function AnalyticsSection() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <ActivityChart />
    </div>
  );
}

export default AnalyticsSection;
