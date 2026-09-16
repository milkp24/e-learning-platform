import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";

// ======================================================
// Profile Page (หน้าโปรไฟล์ผู้ใช้งาน)
// ======================================================
// หน้านี้ทำหน้าที่:
// 1. แสดงข้อมูลประจำตัวของผู้ใช้ (User ID, Email, สถานะบัญชี และรายการ Roles)
// 2. มีฟอร์มแก้ไขชื่อแสดงผล (Display Name) และ URL รูปภาพโปรไฟล์ (Profile Image)
// 3. ส่งข้อมูลไปอัปเดตที่ Backend ผ่าน API PUT /api/v1/users/me/profile

function Profile() {
  const { user, updateProfile, fetchCurrentUser, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // โหลดข้อมูลเดิมของผู้ใช้มาใส่ในช่อง input เมื่อเปิดหน้า
  useEffect(() => {
    if (user?.profile) {
      setDisplayName(user.profile.display_name || "");
      setProfileImage(user.profile.profile_image || "");
    }
  }, [user]);

  // จัดการการส่งฟอร์มแก้ไขโปรไฟล์
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (!displayName.trim()) {
      setStatusMessage({ type: "error", text: "กรุณากรอกชื่อแสดงผล (Display Name)" });
      return;
    }

    // ส่งข้อมูลไปอัปเดตที่ Backend
    const result = await updateProfile({
      display_name: displayName.trim(),
      profile_image: profileImage.trim() || null,
    });

    if (result.success) {
      setStatusMessage({ type: "success", text: "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว!" });
      fetchCurrentUser(); // ดึงข้อมูลล่าสุดมาทบทวนอีกครั้ง
    } else {
      setStatusMessage({ type: "error", text: result.error });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* ส่วนหัว */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน (My Profile)</h1>
        <p className="text-sm text-gray-500 mt-1">
          จัดการข้อมูลส่วนตัวและตรวจสอบสิทธิ์การใช้งานในระบบ
        </p>
      </div>

      {/* กล่องแจ้งเตือนผลลัพธ์ */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* การ์ดแสดงข้อมูลบัญชี (Read-only Account Details) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">
          ข้อมูลบัญชีผู้ใช้
        </h2>

        {/* แสดง Avatar ของผู้ใช้ */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
          <img
            src={user?.profile?.profile_image || "/images/default-avatar.svg"}
            alt="User avatar"
            className="h-16 w-16 rounded-full object-cover border-2 border-[#ABD1C6]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/default-avatar.svg";
            }}
          />
          <div>
            <h3 className="font-bold text-gray-900 text-base">{displayName}</h3>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-gray-500 font-medium">อีเมล (Email)</span>
            <span className="text-gray-900 font-semibold">{user?.email || "-"}</span>
          </div>
          <div>
            <span className="block text-gray-500 font-medium">สถานะบัญชี (Status)</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
              ● {user?.status || "active"}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 font-medium">รหัสผู้ใช้ (User ID)</span>
            <span className="text-gray-600 font-mono text-xs">{user?.user_id || "-"}</span>
          </div>
          <div>
            <span className="block text-gray-500 font-medium">สิทธิ์ในระบบ (Roles)</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {user?.roles?.map((role) => (
                <span
                  key={role}
                  className="rounded-lg bg-[#ABD1C6]/30 px-2.5 py-0.5 text-xs font-bold text-[#20302C] uppercase"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* การ์ดแบบฟอร์มแก้ไขโปรไฟล์ (Edit Profile Form) */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">
          แก้ไขข้อมูลส่วนตัว
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* พรีวิวรูปโปรไฟล์ */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
            <img
              src={profileImage || "/images/default-avatar.svg"}
              alt="Profile preview"
              className="h-16 w-16 rounded-full object-cover border border-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/default-avatar.svg";
              }}
            />
            <span className="text-xs text-gray-500">ตัวอย่างรูปโปรไฟล์ที่จะแสดงผล</span>
          </div>

          {/* ช่องแก้ไข Display Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ชื่อแสดงผล (Display Name)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ระบุชื่อของคุณ"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[#ABD1C6] focus:ring-2 focus:ring-[#ABD1C6]/30"
            />
          </div>

          {/* ช่องแก้ไข URL/Path รูปภาพโปรไฟล์ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รูปภาพโปรไฟล์ (Profile Image Path/URL)
            </label>
            <input
              type="text"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="/images/default-avatar.svg หรือ URL รูปภาพ"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition focus:border-[#ABD1C6] focus:ring-2 focus:ring-[#ABD1C6]/30"
            />
            <p className="text-xs text-gray-400 mt-1">
              * สามารถระบุเป็นที่อยู่รูปภาพภายในโปรเจกต์ เช่น <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">/images/default-avatar.svg</code>
            </p>
          </div>

          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-[#ABD1C6] px-6 py-2.5 text-sm font-bold text-[#20302C] transition hover:bg-[#9CC5B9] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
