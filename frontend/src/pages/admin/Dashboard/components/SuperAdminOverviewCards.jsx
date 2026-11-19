import {
  LuUsers,
  LuUserCheck,
  LuShieldCheck,
  LuBookOpen,
  LuGraduationCap,
  LuClipboardList,
  LuTarget,
  LuUserPlus,
} from "react-icons/lu";
import usePermissionStore from "../../../../features/permissions/store/usePermissionStore";

/**
 * SuperAdminOverviewCards
 * Renders 8 Production-grade Overview Cards
 */
export default function SuperAdminOverviewCards({ stats }) {
  const { staffList } = usePermissionStore();

  const totalUsers = stats?.totalUsers ?? 0;
  const activeUsers = stats?.activeAccounts ?? 0;
  const totalStaff = stats?.totalStaff ?? (staffList?.length || stats?.adminsCount || 0);
  const totalCourses = stats?.totalCourses ?? 0;
  const totalLessons = stats?.totalLessons ?? 0;
  const totalQuizzes = stats?.totalQuizzes ?? 0;
  const totalMissions = stats?.totalMissions ?? 0;
  const newUsers = stats?.newUsers ?? 0;

  const cards = [
    {
      id: "users",
      title: "ผู้ใช้งานทั้งหมด",
      value: totalUsers,
      subtext: "บัญชีในระบบ",
      icon: LuUsers,
      accentColor: "#004643",
      bgTint: "bg-[#ABD1C6]/25",
    },
    {
      id: "active_users",
      title: "ผู้ใช้งานที่กำลังใช้งาน",
      value: activeUsers,
      subtext: "สถานะปกติ (Active)",
      icon: LuUserCheck,
      accentColor: "#0D9488",
      bgTint: "bg-emerald-50",
    },
    {
      id: "staff",
      title: "เจ้าหน้าที่",
      value: totalStaff,
      subtext: "ผู้ดูแลและเจ้าหน้าที่",
      icon: LuShieldCheck,
      accentColor: "#0284C7",
      bgTint: "bg-sky-50",
    },
    {
      id: "courses",
      title: "คอร์สเรียน",
      value: totalCourses,
      subtext: `${stats?.publishedCourses || 0} เผยแพร่แล้ว`,
      icon: LuBookOpen,
      accentColor: "#D97706",
      bgTint: "bg-amber-50",
    },
    {
      id: "lessons",
      title: "บทเรียน",
      value: totalLessons,
      subtext: "เนื้อหาในหลักสูตร",
      icon: LuGraduationCap,
      accentColor: "#7C3AED",
      bgTint: "bg-purple-50",
    },
    {
      id: "quizzes",
      title: "แบบทดสอบ",
      value: totalQuizzes,
      subtext: "แบบประเมินและควิซ",
      icon: LuClipboardList,
      accentColor: "#E11D48",
      bgTint: "bg-rose-50",
    },
    {
      id: "missions",
      title: "ภารกิจ",
      value: totalMissions,
      subtext: "ภารกิจการเรียนรู้",
      icon: LuTarget,
      accentColor: "#EA580C",
      bgTint: "bg-orange-50",
    },
    {
      id: "new_users",
      title: "ผู้ใช้งานใหม่",
      value: `+${newUsers}`,
      subtext: "ในรอบ 7 วันที่ผ่านมา",
      icon: LuUserPlus,
      accentColor: "#059669",
      bgTint: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
          ภาพรวมข้อมูลระบบหลัก
        </h2>
        <span className="text-xs text-[#6B7773]">
          8 ตัวชี้วัดสำคัญ
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="rounded-2xl border border-[#E5E9E7] bg-white p-4 shadow-2xs hover:shadow-xs transition hover:border-[#ABD1C6]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#6B7773] truncate pr-2">
                  {card.title}
                </span>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.bgTint}`}
                  style={{ color: card.accentColor }}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-[#26332F] font-mono tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] text-[#6B7773] font-medium truncate">
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
