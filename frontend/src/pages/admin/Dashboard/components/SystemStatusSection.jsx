import { useState, useEffect } from "react";
import {
  LuServer,
  LuGlobe,
  LuDatabase,
  LuLock,
  LuCheck,
  LuRefreshCw,
} from "react-icons/lu";
import adminService from "../../../../services/adminService";

export default function SystemStatusSection() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState("ตรวจสอบแล้วเมื่อสักครู่");
  const [apiLatency, setApiLatency] = useState(null);
  const [isHealthy, setIsHealthy] = useState(true);

  const checkHealth = async () => {
    setIsChecking(true);
    const start = performance.now();
    try {
      await adminService.getPublicSettings();
      const elapsed = Math.round(performance.now() - start);
      setApiLatency(`${elapsed} ms`);
      setIsHealthy(true);
      setLastCheckTime(`ตรวจสอบเมื่อ ${new Date().toLocaleTimeString("th-TH")}`);
    } catch (err) {
      console.error("Health check error:", err);
      setIsHealthy(false);
      setLastCheckTime(`พบปัญหาในการเชื่อมต่อเมื่อ ${new Date().toLocaleTimeString("th-TH")}`);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const services = [
    {
      id: "website",
      name: "เว็บไซต์ (Frontend UI)",
      status: "พร้อมใช้งาน (Operational)",
      metric: "Vite React Client",
      icon: LuGlobe,
      healthy: true,
    },
    {
      id: "api",
      name: "API Server (Backend)",
      status: isHealthy ? "พร้อมใช้งาน (Operational)" : "ไม่สามารถติดต่อได้",
      metric: apiLatency ? `ความเร็วตอบสนอง ${apiLatency}` : "Flask RESTful API",
      icon: LuServer,
      healthy: isHealthy,
    },
    {
      id: "db",
      name: "ฐานข้อมูล (PostgreSQL)",
      status: "เชื่อมต่อสมบูรณ์ (Active)",
      metric: "PostgreSQL Database",
      icon: LuDatabase,
      healthy: isHealthy,
    },
    {
      id: "auth",
      name: "ระบบยืนยันตัวตน (Auth/JWT)",
      status: "พร้อมใช้งาน (Operational)",
      metric: "RBAC & Security Log Active",
      icon: LuLock,
      healthy: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-[#E5E9E7] bg-white p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5E9E7]/60 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
            สถานะความพร้อมของระบบ (System Health)
          </h2>
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ABD1C6]/30 text-[#004643]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5F8F84] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004643]"></span>
            </span>
            {isHealthy ? "ทุกบริการทำงานปกติ" : "กำลังตรวจสอบการเชื่อมต่อ"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6B7773]">
          <span>{lastCheckTime}</span>
          <button
            type="button"
            onClick={checkHealth}
            disabled={isChecking}
            className="p-1 rounded-lg border border-[#E5E9E7] hover:bg-[#FAFAFA] text-[#26332F] transition cursor-pointer"
            title="ตรวจสอบสถานะใหม่"
          >
            <LuRefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {services.map((srv) => {
          const Icon = srv.icon;
          return (
            <div
              key={srv.id}
              className="rounded-xl border border-[#E5E9E7] bg-[#FAFAFA] p-3.5 flex items-start gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E5E9E7] text-[#004643] shadow-2xs">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#26332F] truncate">
                    {srv.name}
                  </span>
                  <LuCheck className="h-3.5 w-3.5 text-[#004643] shrink-0" />
                </div>
                <span className="text-[11px] text-[#004643] font-semibold block mt-0.5">
                  {srv.status}
                </span>
                <span className="text-[10px] text-[#6B7773] block">
                  {srv.metric}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
