import { LuSparkles, LuRocket } from "react-icons/lu";
import Button from "../../../../components/common/Button";
import { ProfileAvatarLink } from "../../../../components/common/UserAvatar";

function WelcomeSection({ displayName, user }) {
  return (
    <section className="rounded-3xl border border-[#E5E9E7] bg-gradient-to-r from-white via-white to-[#ABD1C6]/20 p-6 sm:p-8 shadow-xs space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#ABD1C6]/40 px-3.5 py-1 text-xs font-bold text-[#004643]">
        <LuSparkles className="h-3.5 w-3.5" aria-hidden="true" />
        <span>แดชบอร์ดผู้เรียน</span>
      </div>

      <div className="flex items-center gap-4">
        {/* ข้อ 34: รูปโปรไฟล์ด้านซ้าย กดเพื่อเพิ่ม/เปลี่ยนรูป */}
        <ProfileAvatarLink user={user} name={displayName} />
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-[#26332F]">
            สวัสดี คุณ <span className="text-[#004643]">{displayName}</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6B7773] font-semibold">
            พร้อมเรียนรู้บน E-learning Platform วันนี้หรือยัง?
          </p>
        </div>
      </div>

      <div>
        <Button
          to="/classrooms"
          variant="secondary"
          size="md"
          icon={LuRocket}
        >
          เริ่มต้นเข้าสู่ห้องเรียน
        </Button>
      </div>
    </section>
  );
}

export default WelcomeSection;
