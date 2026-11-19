import DailyQuestItem from "./DailyQuestItem";

function DailyQuestsSection({ dailyQuests, onToggleQuest }) {
  const completedCount = dailyQuests.filter((q) => q.completed).length;

  return (
    <section id="quest" className="rounded-3xl border border-[#E5E9E7] bg-white p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-base font-black text-[#26332F]">
          ภารกิจประจำวัน (คลิกเพื่อบันทึกสถานะ)
        </h3>
        <span className="text-xs font-bold text-[#004643] bg-[#ABD1C6]/30 px-2.5 py-1 rounded-md">
          {completedCount} / {dailyQuests.length} สำเร็จ
        </span>
      </div>

      <div className="space-y-2.5">
        {dailyQuests.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#6B7773]">
            ไม่มีภารกิจประจำวันในขณะนี้
          </div>
        ) : (
          dailyQuests.map((quest) => (
            <DailyQuestItem
              key={quest.id}
              quest={quest}
              onToggle={onToggleQuest}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default DailyQuestsSection;
