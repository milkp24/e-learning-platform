import { Link } from "react-router-dom";
import { LuCamera } from "react-icons/lu";
import UserAvatar from "./UserAvatar";

// ======================================================
// ProfileAvatarLink — รูปโปรไฟล์ด้านซ้ายของส่วนทักทายในหน้า Home (ข้อ 34)
// กดแล้วไปหน้าโปรไฟล์เพื่อเพิ่มหรือเปลี่ยนรูป
// ======================================================

function ProfileAvatarLink({ user, name }) {
  const hasImage = Boolean(user?.profile?.profile_image);
  return (
    <Link
      to="/profile"
      title={hasImage ? "เปลี่ยนรูปโปรไฟล์" : "เพิ่มรูปโปรไฟล์"}
      aria-label={hasImage ? "เปลี่ยนรูปโปรไฟล์" : "เพิ่มรูปโปรไฟล์"}
      className="group relative shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004643]"
    >
      <UserAvatar user={user} name={name} size="xl" className="shadow-sm" />
      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#004643] text-white shadow-sm transition group-hover:scale-110">
        <LuCamera className="h-3 w-3" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default ProfileAvatarLink;
