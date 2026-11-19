import { LuShield, LuGraduationCap, LuBookOpen, LuUser } from "react-icons/lu";

/**
 * Helper to get badge style and description for a given role name.
 */
export const getRoleBadge = (roleName) => {
  switch (roleName?.toLowerCase()) {
    case "admin":
      return {
        bg: "bg-[#ABD1C6] text-[#26332F] border border-[#9bc3b7]",
        desc: "ผู้ดูแลระบบสูงสุด — มีสิทธิ์เต็มรูปแบบในการควบคุม จัดการห้องเรียน ผู้ใช้ และระบบทั้งหมด",
        icon: LuShield,
      };
    case "instructor":
      return {
        bg: "bg-teal-50 text-teal-800 border border-teal-200",
        desc: "ผู้สอน — สร้างและจัดการห้องเรียนของตนเอง อัปโหลดบทเรียน จัดการเนื้อหา และแบบทดสอบ",
        icon: LuGraduationCap,
      };
    case "student":
      return {
        bg: "bg-gray-100 text-gray-700 border border-gray-200",
        desc: "ผู้เรียน — ค้นหาและลงทะเบียนเรียน เข้าชมบทเรียน ทำแบบทดสอบ และบันทึก Journal",
        icon: LuBookOpen,
      };
    default:
      return {
        bg: "bg-gray-100 text-gray-700 border border-gray-200",
        desc: "บทบาททั่วไปในระบบ",
        icon: LuUser,
      };
  }
};
