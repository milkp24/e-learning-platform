import { LuCheck } from "react-icons/lu";

function DailyQuestItem({ quest, onToggle }) {
  return (
    <div
      onClick={() => onToggle(quest.id)}
      className={`cursor-pointer flex items-center justify-between p-3.5 rounded-2xl border transition select-none ${
        quest.completed
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : "bg-[#FAFAFA] border-[#E5E9E7] hover:border-[#ABD1C6] text-gray-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-gray-300 bg-white text-xs font-bold text-emerald-600">
          {quest.completed ? <LuCheck className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" /> : null}
        </span>
        <span className={`text-xs font-bold ${quest.completed ? "line-through opacity-70" : ""}`}>
          {quest.title}
        </span>
      </div>
      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
        +{quest.xp} XP
      </span>
    </div>
  );
}

export default DailyQuestItem;
