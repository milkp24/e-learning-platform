import {
  LuShield,
  LuIdCard,
  LuCheck,
  LuLock,
} from "react-icons/lu";
import { resolveMediaUrl } from "../../../../utils/mediaUrl";

// ป้ายแสดงว่าฟิลด์นี้เป็นแบบอ่านอย่างเดียว (FB-08)
function ReadOnlyBadge() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-[#6B7773]"
      title="แก้ไขไม่ได้ หากต้องการเปลี่ยนกรุณาติดต่อผู้ดูแลระบบ"
    >
      <LuLock className="h-2.5 w-2.5" aria-hidden="true" />
      อ่านอย่างเดียว
    </span>
  );
}

/**
 * AccountDetailsSection Component
 * แสดงข้อมูลภาพรวมบัญชีและข้อมูลทางการที่ได้รับจากการลงทะเบียน (10 รายการตามข้อกำหนด):
 * 1. คำนำหน้าชื่อ (title)
 * 2. ชื่อจริง (first_name)
 * 3. นามสกุล (last_name)
 * 4. อีเมล (email)
 * 5. อาชีพ (occupation)
 * 6. ชื่อสถาบัน / โรงเรียน / มหาวิทยาลัย / องค์กร (institution_name)
 * 7. อีเมลสถาบัน (institution_email)
 * 8. ชื่อแสดงผล (display_name)
 * 9. บทบาทในระบบ (Role)
 * 10. สถานะบัญชี (status)
 */
function AccountDetailsSection({ user, displayName }) {
  const profile = user?.profile || {};

  const title = profile.title || "-";
  const firstName = profile.first_name || "-";
  const lastName = profile.last_name || "-";
  const fullName =
    profile.first_name || profile.last_name
      ? `${profile.title ? profile.title + " " : ""}${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : "-";

  const email = user?.email || "-";
  const occupation = profile.occupation || "-";
  const institutionName = profile.institution_name || "-";
  const institutionEmail = profile.institution_email || "-";
  const activeDisplayName = displayName || profile.display_name || user?.display_name || "-";
  const status = user?.status || "active";
  const roles = user?.roles || (user?.role ? [user.role] : ["student"]);

  return (
    <div className="rounded-3xl border border-[#E5E9E7] bg-white p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-black text-[#26332F]">ข้อมูลบัญชีและประวัติผู้ใช้งาน</h2>
          <p className="text-xs text-[#6B7773] mt-0.5">
            ข้อมูลที่สอดคล้องกับการลงทะเบียนและบันทึกในฐานข้อมูลระบบ
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
          <LuCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>สถานะบัญชี: {status === "active" ? "เปิดใช้งานปกติ" : status}</span>
        </span>
      </div>

      {/* 1. สรุปภาพรวมโปรไฟล์และรูปภาพ */}
      <div className="flex items-center gap-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E9E7] p-4">
        <img
          src={resolveMediaUrl(profile.profile_image) || "/images/default-avatar.svg"}
          alt="User avatar"
          className="h-16 w-16 rounded-full object-cover border-2 border-[#ABD1C6] bg-white shadow-2xs shrink-0"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/images/default-avatar.svg";
          }}
        />
        <div className="min-w-0">
          <h3 className="font-black text-[#26332F] text-base truncate">
            {activeDisplayName}
          </h3>
          <p className="text-xs text-[#6B7773] truncate">{email}</p>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {roles.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded-md bg-[#004643] px-2 py-0.5 text-[11px] font-bold text-[#ABD1C6] uppercase tracking-wider"
              >
                <LuShield className="h-3 w-3" />
                <span>{r}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ข้อมูลทางการจากการลงทะเบียน (Registered Identity) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#ABD1C6]/30 text-[#004643]">
            <LuIdCard className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#26332F]">
            ข้อมูลจากการลงทะเบียน (ข้อมูลทางการ)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
          {/* 1. คำนำหน้าชื่อ */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">1. คำนำหน้าชื่อ</span>
            <span className="font-bold text-[#26332F] text-sm mt-0.5 block">{title}</span>
          </div>

          {/* 2. ชื่อจริง */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">2. ชื่อจริง</span>
            <span className="font-bold text-[#26332F] text-sm mt-0.5 block">{firstName}</span>
          </div>

          {/* 3. นามสกุล */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">3. นามสกุล</span>
            <span className="font-bold text-[#26332F] text-sm mt-0.5 block">{lastName}</span>
          </div>

          {/* 4. อีเมลหลัก */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#6B7773]">
              <span>4. อีเมลสำหรับเข้าสู่ระบบ</span>
              <ReadOnlyBadge />
            </span>
            <span
              className="font-semibold text-[#26332F] text-xs mt-0.5 block truncate"
              title={email}
              aria-readonly="true"
              data-testid="profile-email-readonly"
            >
              {email}
            </span>
          </div>

          {/* 5. อาชีพ */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">5. อาชีพ</span>
            <span className="font-bold text-[#26332F] text-sm mt-0.5 block">{occupation}</span>
          </div>

          {/* 6. สถาบัน / องค์กร */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">6. สถาบัน / องค์กร</span>
            <span className="font-semibold text-[#26332F] text-xs mt-0.5 block truncate" title={institutionName}>
              {institutionName}
            </span>
          </div>

          {/* 7. อีเมลสถาบัน */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">7. อีเมลสถาบัน</span>
            <span className="font-semibold text-[#26332F] text-xs mt-0.5 block truncate" title={institutionEmail}>
              {institutionEmail}
            </span>
          </div>

          {/* 8. ชื่อแสดงผล (Display Name) */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="block text-[11px] font-medium text-[#6B7773]">8. ชื่อแสดงผล (Display Name)</span>
            <span className="font-bold text-[#004643] text-sm mt-0.5 block">{activeDisplayName}</span>
          </div>

          {/* 9. สิทธิ์ในระบบ (Role) */}
          <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
            <span className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#6B7773]">
              <span>9. บทบาทในระบบ (Role)</span>
              <ReadOnlyBadge />
            </span>
            <span
              className="font-bold text-[#26332F] text-sm mt-0.5 block uppercase"
              aria-readonly="true"
              data-testid="profile-role-readonly"
            >
              {roles.join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* 3. รายละเอียดระบบทางเทคนิค */}
      <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between text-[11px] text-[#6B7773] gap-2">
        <span className="font-mono">รหัสผู้ใช้: {user?.user_id || "-"}</span>
        <span>
          ชื่อ-สกุลเต็มทางการ: <strong className="text-[#26332F] font-semibold">{fullName}</strong>
        </span>
      </div>
    </div>
  );
}

export default AccountDetailsSection;
