import { LuShield } from "react-icons/lu";

/**
 * SecurityPolicyInfoCard Component
 * Explains session timeout propagation and sync behavior.
 */
function SecurityPolicyInfoCard() {
  return (
    <div className="rounded-[16px] border border-[#E5E9E7] bg-white p-5 text-xs text-[#6B7773] leading-relaxed shadow-2xs space-y-1.5">
      <div className="flex items-center gap-2 font-bold text-[#26332F]">
        <LuShield className="h-4 w-4 text-[#004643] shrink-0" aria-hidden="true" />
        <span>ข้อสังเกตเกี่ยวกับความปลอดภัยของเซสชัน:</span>
      </div>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          การเปลี่ยนแปลงเวลา Timeout จะมีผลทันทีกับผู้ใช้ใหม่ที่เข้าสู่ระบบ หรือเมื่อผู้ใช้เดิมมีการต่ออายุเซสชัน
        </li>
        <li>
          ฝั่ง Backend และ Frontend มีการซิงค์เวลา Timeout ผ่าน API{" "}
          <code className="bg-[#FAFAFA] border border-[#E5E9E7] px-1 py-0.5 rounded font-mono text-[#26332F]">
            GET /api/v1/settings/public
          </code>{" "}
          เพื่อความแม่นยำสูงสุด
        </li>
      </ul>
    </div>
  );
}

export default SecurityPolicyInfoCard;
