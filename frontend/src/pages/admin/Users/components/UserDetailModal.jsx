import { LuX, LuShield, LuIdCard, LuCheck, LuPencil, LuUser, LuMail, LuBuilding, LuBriefcase } from "react-icons/lu";

/**
 * UserDetailModal Component
 * Modal แสดงรายละเอียดข้อมูลผู้ใช้สำหรับ Admin / Super Admin
 * แสดง 10 ฟิลด์ตามข้อกำหนดข้อมูลทางการและข้อมูลระบบอย่างครบถ้วน
 */
function UserDetailModal({ isOpen, onClose, user, onOpenEdit, canEditUser }) {
  if (!isOpen || !user) return null;

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
  const activeDisplayName = profile.display_name || user?.display_name || user?.email?.split("@")[0] || "-";
  const status = user?.status || "active";
  const roles = user?.roles || (user?.role ? [user.role] : ["student"]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#26332F]/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-detail-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E5E9E7] bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E9E7] px-6 py-4.5 bg-[#FAFAFA]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ABD1C6]/30 text-[#004643]">
              <LuIdCard className="h-5 w-5" />
            </span>
            <div>
              <h2 id="user-detail-title" className="text-base font-black text-[#26332F]">
                รายละเอียดข้อมูลผู้ใช้งาน
              </h2>
              <p className="text-xs text-[#6B7773]">
                ข้อมูลบัญชีและประวัติผู้ใช้งานจากฐานข้อมูลระบบ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้ารายละเอียด"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E9E7] bg-white text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* 1. Header Profile Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E9E7] p-4.5">
            <div className="flex items-center gap-4">
              <img
                src={profile.profile_image || "/images/default-avatar.svg"}
                alt="User avatar"
                className="h-14 w-14 rounded-full object-cover border-2 border-[#ABD1C6] bg-white shadow-2xs shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/default-avatar.svg";
                }}
              />
              <div className="min-w-0">
                <h3 className="font-black text-[#26332F] text-base truncate">
                  {activeDisplayName}
                </h3>
                <p className="text-xs font-mono text-[#6B7773] truncate">{email}</p>
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

            <div className="self-start sm:self-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  status === "active"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : status === "suspended"
                    ? "bg-rose-50 border border-rose-200 text-rose-800"
                    : "bg-gray-100 border border-gray-200 text-gray-700"
                }`}
              >
                <LuCheck className="h-3.5 w-3.5" />
                <span>สถานะ: {status === "active" ? "เปิดใช้งานปกติ" : status === "suspended" ? "ระงับการใช้งาน" : "ปิดใช้งาน"}</span>
              </span>
            </div>
          </div>

          {/* 2. Grid of 10 Identity & Profile Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#ABD1C6]/30 text-[#004643]">
                  <LuUser className="h-3.5 w-3.5" />
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#26332F]">
                  ข้อมูลจากการลงทะเบียน (ข้อมูลทางการ)
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
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

              {/* 4. อีเมลเข้าสู่ระบบ */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3 sm:col-span-2 md:col-span-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7773]">
                  <LuMail className="h-3 w-3 text-[#6B7773]" />
                  <span>4. อีเมลสำหรับเข้าสู่ระบบ (Login Email)</span>
                </div>
                <span className="font-mono font-semibold text-[#26332F] text-xs mt-0.5 block truncate" title={email}>
                  {email}
                </span>
              </div>

              {/* 5. อาชีพ */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7773]">
                  <LuBriefcase className="h-3 w-3 text-[#6B7773]" />
                  <span>5. อาชีพ</span>
                </div>
                <span className="font-bold text-[#26332F] text-sm mt-0.5 block">{occupation}</span>
              </div>

              {/* 6. สถาบัน / องค์กร */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7773]">
                  <LuBuilding className="h-3 w-3 text-[#6B7773]" />
                  <span>6. สถาบัน / องค์กร</span>
                </div>
                <span className="font-semibold text-[#26332F] text-xs mt-0.5 block truncate" title={institutionName}>
                  {institutionName}
                </span>
              </div>

              {/* 7. อีเมลสถาบัน */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7773]">
                  <LuMail className="h-3 w-3 text-[#6B7773]" />
                  <span>7. อีเมลสถาบัน</span>
                </div>
                <span className="font-mono font-semibold text-[#26332F] text-xs mt-0.5 block truncate" title={institutionEmail}>
                  {institutionEmail}
                </span>
              </div>

              {/* 8. Display Name */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
                <span className="block text-[11px] font-medium text-[#6B7773]">8. ชื่อแสดงผล (Display Name)</span>
                <span className="font-bold text-[#004643] text-sm mt-0.5 block truncate">{activeDisplayName}</span>
              </div>

              {/* 9. Role */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
                <span className="block text-[11px] font-medium text-[#6B7773]">9. บทบาทในระบบ (Role)</span>
                <span className="font-bold text-[#26332F] text-sm mt-0.5 block uppercase">
                  {roles.join(", ")}
                </span>
              </div>

              {/* 10. Status */}
              <div className="rounded-xl border border-gray-100 bg-[#FAFAFA] p-3">
                <span className="block text-[11px] font-medium text-[#6B7773]">10. สถานะบัญชี (Status)</span>
                <span className="font-bold text-[#26332F] text-sm mt-0.5 block uppercase">
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* 3. รายละเอียดระบบและ Metadata */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-2 text-[11px] text-[#6B7773]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                รหัสประจำตัวผู้ใช้ (UUID):{" "}
                <strong className="font-mono text-[#26332F]">{user.user_id}</strong>
              </span>
              <span>
                ชื่อ-สกุลเต็มทางการ: <strong className="text-[#26332F] font-semibold">{fullName}</strong>
              </span>
            </div>
            {user.created_at && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/50 pt-2">
                <span>
                  วันที่สร้างบัญชี:{" "}
                  <strong className="text-[#26332F]">
                    {new Date(user.created_at).toLocaleString("th-TH")}
                  </strong>
                </span>
                {user.updated_at && (
                  <span>
                    แก้ไขล่าสุด:{" "}
                    <strong className="text-[#26332F]">
                      {new Date(user.updated_at).toLocaleString("th-TH")}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4. Notice: Security Shield */}
          <div className="rounded-xl border border-[#ABD1C6]/40 bg-[#ABD1C6]/10 px-4 py-3 text-xs text-[#26332F] flex items-center gap-2.5">
            <LuShield className="h-4 w-4 text-[#004643] shrink-0" />
            <p className="leading-relaxed">
              รหัสผ่าน (Password Hash) และโทเค็นรักษาความปลอดภัย (JWT Tokens)
              ได้รับการป้องกันและไม่สามารถดูหรือแก้ไขได้จากส่วนนี้เพื่อความปลอดภัยสูงสุด
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E5E9E7] bg-[#FAFAFA] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E9E7] bg-white px-4 py-2 text-xs font-bold text-[#6B7773] hover:bg-gray-100 hover:text-[#26332F] transition cursor-pointer"
          >
            ปิด
          </button>
          {canEditUser && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(user);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#004643] px-4 py-2 text-xs font-bold text-[#ABD1C6] hover:bg-[#003835] transition shadow-2xs cursor-pointer"
            >
              <LuPencil className="h-3.5 w-3.5" />
              <span>แก้ไขข้อมูลผู้ใช้</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDetailModal;
