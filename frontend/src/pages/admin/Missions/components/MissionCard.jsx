
import { LuAward } from "react-icons/lu";

/**
 * MissionCard Component
 * Single mission card showing badge, title, category, status, xp, and completions.
 */
function MissionCard({ mission }) {
  const BadgeIcon = mission.badgeIcon || LuAward;

  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 shadow-2xs hover:shadow-sm transition space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
            <BadgeIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-[#26332F]">
              {mission.title}
            </h4>
            <span className="text-[11px] font-semibold text-[#6B7773]">
              {mission.category}
            </span>
          </div>
        </div>
        <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold uppercase text-emerald-800">
          {mission.status}
        </span>
      </div>

      <p className="text-xs text-[#6B7773] leading-relaxed">
        {mission.description}
      </p>

      <div className="flex items-center justify-between border-t border-[#E5E9E7] pt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[#ABD1C6] px-2.5 py-1 text-[11px] font-black text-[#26332F]">
            +{mission.xp} XP
          </span>
          <span className="font-bold text-[#26332F] flex items-center gap-1.5">
            <BadgeIcon className="h-3.5 w-3.5 text-[#004643]" aria-hidden="true" />
            <span>{mission.badge}</span>
          </span>
        </div>
        <span className="text-[#6B7773] font-medium">
          สำเร็จแล้ว <strong className="text-[#26332F]">{mission.completions}</strong> คน
        </span>
      </div>
    </div>
  );
}
export default MissionCard;
