import MissionCard from "./MissionCard";

/**
 * MissionsList Component
 * Grid displaying list of mission cards.
 */
function MissionsList({ missions }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {missions.map((m) => (
        <MissionCard key={m.id} mission={m} />
      ))}
    </div>
  );
}


export default MissionsList;
