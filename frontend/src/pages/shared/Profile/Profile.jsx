import { useState, useEffect } from "react";
import useAuthStore from "../../../store/useAuthStore";
import ProfileHeader from "./components/ProfileHeader";
import ProfileStatusAlert from "./components/ProfileStatusAlert";
import AccountDetailsSection from "./components/AccountDetailsSection";
import EditProfileSection from "./components/EditProfileSection";
import ChangePasswordSection from "./components/ChangePasswordSection";
import { notify } from "../../../store/useToastStore";

/**
 * Profile Page Component (หน้าโปรไฟล์ผู้ใช้งาน)
 * Decomposed into Modular Sections:
 * 1. ProfileHeader
 * 2. ProfileStatusAlert
 * 3. AccountDetailsSection (Read-only)
 * 4. EditProfileSection (Form: display_name, profile_image)
 * 5. ChangePasswordSection (Form: current_password, new_password, confirm_password)
 */
function Profile() {
  const { user, updateProfile, fetchCurrentUser, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // ดึงข้อมูลล่าสุดจาก API ทุกครั้งที่เข้าหน้านี้
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

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

    const cleanName = displayName.trim();
    if (!cleanName) {
      setStatusMessage({ type: "error", text: "กรุณาระบุชื่อแสดงผล" });
      return;
    }
    if (cleanName.length < 2) {
      setStatusMessage({ type: "error", text: "ชื่อแสดงผลต้องมีความยาวอย่างน้อย 2 ตัวอักษร" });
      return;
    }
    if (cleanName.length > 100) {
      setStatusMessage({ type: "error", text: "ชื่อแสดงผลต้องมีความยาวไม่เกิน 100 ตัวอักษร" });
      return;
    }

    // ส่งข้อมูลไปอัปเดตที่ Backend
    const result = await updateProfile({
      display_name: displayName.trim(),
      profile_image: profileImage.trim() || null,
    });

    if (result.success) {
      notify.success("อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว");
      fetchCurrentUser(); // ดึงข้อมูลล่าสุดมาทบทวนอีกครั้ง
    } else {
      setStatusMessage({ type: "error", text: result.error });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 1. Profile Header */}
      <ProfileHeader />

      {/* 2. Status Alert */}
      <ProfileStatusAlert statusMessage={statusMessage} />

      {/* 3. Account Details (Read-only) */}
      <AccountDetailsSection user={user} displayName={displayName} />

      {/* 4. Edit Profile Section */}
      <EditProfileSection
        user={user}
        displayName={displayName}
        onDisplayNameChange={setDisplayName}
        profileImage={profileImage}
        onProfileImageChange={setProfileImage}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* 5. Change Password Section (แยกการทำงานชัดเจน: แก้ไขข้อมูลส่วนตัว ≠ เปลี่ยนรหัสผ่าน) */}
      <ChangePasswordSection />
    </div>
  );
}

export default Profile;
