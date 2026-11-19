import { Link } from "react-router-dom";
import {
  LuBookCheck,
  LuUserCheck,
  LuArrowUpRight,
  LuShield,
} from "react-icons/lu";

export default function PendingActionsSection() {
  const actionItems = [
    {
      id: "staff-governance",
      title: "จัดการสิทธิ์และเจ้าหน้าที่",
      desc: "ตรวจสอบและปรับแต่งสิทธิ์การเข้าถึงสำหรับผู้ดูแลระบบและผู้สอน",
      badge: "ความปลอดภัย",
      to: "/admin/staff",
      actionText: "ไปที่จัดการเจ้าหน้าที่",
      icon: LuUserCheck,
    },
    {
      id: "course-management",
      title: "บริหารจัดการคอร์สเรียน",
      desc: "ตรวจดูหลักสูตร บทเรียน และเนื้อหา Interactive ที่เปิดสอนในระบบ",
      badge: "หลักสูตร",
      to: "/admin/courses",
      actionText: "ไปที่คอร์สเรียน",
      icon: LuBookCheck,
    },
    {
      id: "user-management",
      title: "จัดการผู้ใช้งานทั้งหมด",
      desc: "ตรวจสอบรายชื่อ สถานะบัญชี และบทบาทผู้ใช้งานจริงในฐานข้อมูล",
      badge: "ผู้ใช้งาน",
      to: "/admin/users",
      actionText: "ไปที่จัดการผู้ใช้",
      icon: LuShield,
    },
  ];

  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#E5E9E7]/60 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
            งานบริหารจัดการหลัก (Operational Actions)
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ABD1C6]/30 text-[#004643]">
            ทางลัดระบบ
          </span>
        </div>
        <span className="text-xs text-[#6B7773] hidden sm:inline">
          คลิกเพื่อนำทางไปยังหน้าจัดการโดยตรง
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {actionItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-4 flex flex-col justify-between hover:border-[#ABD1C6] hover:bg-white transition shadow-2xs group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#ABD1C6] bg-[#ABD1C6]/15 text-[#004643]">
                    {item.badge}
                  </span>
                  <Icon className="h-4 w-4 text-[#6B7773] group-hover:text-[#004643] transition" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#26332F] line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[#6B7773] leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[#E5E9E7]/60">
                <Link
                  to={item.to}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#004643] hover:underline"
                >
                  <span>{item.actionText}</span>
                  <LuArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
