import { useState } from "react";
import { resolveMediaUrl } from "../../../utils/mediaUrl";

// ======================================================
// UserAvatar — รูปโปรไฟล์ของผู้ใช้ (ข้อ 34) ใช้ที่ปุ่มโปรไฟล์มุมขวาบนทุกบทบาท
// ไม่มีรูป หรือรูปโหลดไม่ขึ้น → แสดงตัวอักษรแรกของชื่อแทน
// ======================================================

const SIZES = {
  sm: "h-7 w-7 text-xs rounded-lg",
  md: "h-9 w-9 text-sm rounded-xl",
  lg: "h-20 w-20 text-2xl rounded-full",
};

function UserAvatar({ user, name, size = "sm", className = "" }) {
  const src = resolveMediaUrl(user?.profile?.profile_image);
  const [failedSrc, setFailedSrc] = useState(null);
  const label = name || user?.profile?.display_name || user?.email || "?";
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  const box = `${SIZES[size] || SIZES.sm} shrink-0 overflow-hidden ${className}`;

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={`รูปโปรไฟล์ ${label}`}
        onError={() => setFailedSrc(src)}
        className={`${box} object-cover border border-[#ABD1C6] bg-white`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${box} flex items-center justify-center bg-[#ABD1C6]/40 font-black text-[#004643]`}
    >
      {initial}
    </span>
  );
}

export default UserAvatar;
