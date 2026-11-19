/**
 * ProfileHeader Component
 * Profile page title and brief explanation.
 */
function ProfileHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน (My Profile)</h1>
      <p className="text-sm text-gray-500 mt-1">
        จัดการข้อมูลส่วนตัวและตรวจสอบสิทธิ์การใช้งานในระบบ
      </p>
    </div>
  );
}

export default ProfileHeader;
