import { LuLightbulb } from "react-icons/lu";

/**
 * RolesInfoCard Component
 * Informational note for Super Admin explaining UUID lookup and database decoration.
 */
function RolesInfoCard() {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 text-xs text-[#6B7773] leading-relaxed shadow-2xs space-y-1.5">
      <div className="flex items-center gap-2 font-bold text-[#26332F]">
        <LuLightbulb className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />
        <span>ข้อมูลเพิ่มเติมสำหรับผู้ดูแลระบบ:</span>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          คุณสามารถดูรหัสผู้ใช้ (User ID) ของแต่ละบัญชีได้จากหน้า{" "}
          <strong className="text-[#26332F]">ผู้ใช้งานทั้งหมด</strong> หรือหน้ารายละเอียดโปรไฟล์
        </li>
        <li>
          การปรับเปลี่ยนบทบาทของผู้ใช้งานจะมีผลทันทีในทุกส่วนของระบบ โดยผู้ใช้จะได้รับสิทธิ์เข้าถึงฟังก์ชันใหม่ตามบทบาทที่ได้รับมอบหมาย
        </li>
      </ul>
    </div>
  );
}

export default RolesInfoCard;
