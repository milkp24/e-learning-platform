import { useState, useEffect } from "react";
import { LuRefreshCw, LuBan, LuShieldCheck, LuClock } from "react-icons/lu";
import SecurityHeader from "./components/SecurityHeader";
import SecurityMetricsSection from "./components/SecurityMetricsSection";
import SecurityPoliciesSection from "./components/SecurityPoliciesSection";
import SecurityAuditLogSection from "./components/SecurityAuditLogSection";
import adminService from "../../../services/adminService";

/**
 * Security Page Component (Admin System Security & Access Controls)
 * Follows the Jade Design System (#ABD1C6, #26332F, #6B7773, #FAFAFA, #E5E9E7)
 */
function Security() {
  const [securityData, setSecurityData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSecurity = async () => {
      try {
        const data = await adminService.getSecurityOverview();
        if (isMounted && data) {
          setSecurityData(data);
        }
      } catch (err) {
        console.error("Failed to load security overview:", err);
      }
    };
    fetchSecurity();
    return () => {
      isMounted = false;
    };
  }, []);

  const securityPolicies = [
    {
      title: "JWT Token Rotation",
      description: "เมื่อผู้ใช้ขอรีเฟรชโทเค็น โทเค็น Refresh เดิมจะถูกบันทึกเข้า Token Blocklist ทันที และออกโทเค็นคู่ใหม่",
      status: "Enforced",
      icon: LuRefreshCw,
      badge: "RFC 6749",
    },
    {
      title: "Token Blocklist (JTI Revocation)",
      description: "ระบบตรวจสอบความถูกต้องของโทเค็นในฐานข้อมูลทุกคำขอ หากผู้ใช้ออกจากระบบหรือโทเค็นถูกเพิกถอนจะใช้งานไม่ได้ทันที",
      status: "Active",
      icon: LuBan,
      badge: "Real-time",
    },
    {
      title: "Live Database RBAC Decorators",
      description: "Decorator @roles_required ดึงข้อมูลบทบาทสดจากฐานข้อมูลเสมอ ไม่พึ่งพา Role ใน JWT Payload เดิม",
      status: "Enforced",
      icon: LuShieldCheck,
      badge: "Zero Latency",
    },
    {
      title: "Dynamic Idle Inactivity Timeout",
      description: "ตรวจสอบการไม่เคลื่อนไหวของผู้ใช้ และแสดง Modal นับถอยหลังก่อนออกจากระบบเพื่อความปลอดภัย",
      status: "Synchronized",
      icon: LuClock,
      badge: "Client & Server",
    },
  ];

  const events = securityData?.recentEvents || [];

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <SecurityHeader />

      {/* 2. Security Metrics Summary */}
      <SecurityMetricsSection metrics={securityData} />

      {/* 3. Security Policies Grid */}
      <SecurityPoliciesSection policies={securityPolicies} />

      {/* 4. Security Audit Log Table */}
      <SecurityAuditLogSection events={events} />
    </div>
  );
}

export default Security;
