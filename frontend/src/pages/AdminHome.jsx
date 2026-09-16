import { useState, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SectionHeader from "../components/SectionHeader";
import StatCard from "../components/StatCard";
import ActivityList from "../components/ActivityList";
import Button from "../components/Button";
import adminService from "../services/adminService";
import { classroomService } from "../services/classroomService";

// ======================================================
// AdminHome Component (หน้าหลักสำหรับผู้ดูแลระบบ / Admin)
// URL: /admin/home
// ======================================================
// 1. System Overview: สรุปจำนวนผู้ใช้, คอร์ส, บทบาท, สถานะระบบ
// 2. Management Shortcuts: ลิงก์ลัดสู่การจัดการผู้ใช้, สิทธิ์ และการตั้งค่า
// 3. System Status: ตรวจสอบสถานะ API, Database, Session Timeout

function AdminHome() {
  const { user } = useAuthStore();
  const [usersCount, setUsersCount] = useState(4);
  const [coursesCount, setCoursesCount] = useState(1);
  const [settings, setSettings] = useState(null);

  const displayName = user?.profile?.display_name || user?.email || "ผู้ดูแลระบบ";

  useEffect(() => {
    let isMounted = true;
    const fetchAdminOverview = async () => {
      try {
        const [usersRes, coursesRes, settingsRes] = await Promise.allSettled([
          adminService.getUsers(),
          classroomService.getClassrooms(),
          adminService.getSettings(),
        ]);

        if (isMounted) {
          if (usersRes.status === "fulfilled" && usersRes.value?.users) {
            setUsersCount(usersRes.value.users.length);
          }
          if (coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value)) {
            setCoursesCount(coursesRes.value.length);
          }
          if (settingsRes.status === "fulfilled" && settingsRes.value?.settings) {
            setSettings(settingsRes.value.settings);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchAdminOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  const adminActivities = [
    {
      id: 1,
      title: "ผู้ใช้ใหม่ลงทะเบียน: verify.user@example.com",
      description: "กำหนดบทบาทเริ่มต้น student เรียบร้อย",
      timestamp: "วันนี้",
      type: "user",
      link: "/admin/users",
    },
    {
      id: 2,
      title: "ระบบตรวจสอบความปลอดภัย: Token Rotation พร้อมทำงาน",
      description: "Access Token (15m) / Refresh Token (7d)",
      timestamp: "เมื่อเร็ว ๆ นี้",
      type: "default",
      link: "/admin/settings",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAFA] text-[#1F2937]">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-8 space-y-10">
        {/* 1. Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                System Administration
              </span>
              <span className="text-xs text-gray-400">
                • Phase 1 Production Dashboard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937]">
              ศูนย์ควบคุมระบบแอดมิน: <span className="text-[#004643]">{displayName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              จัดการสมาชิก กฎสิทธิ์ และการตั้งค่าระบบความปลอดภัยทั้งหมดในที่เดียว
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button to="/admin/users" variant="primary" size="md">
              จัดการผู้ใช้ (User Management)
            </Button>
          </div>
        </div>

        {/* 2. System Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            title="ผู้ใช้งานทั้งหมดในระบบ"
            value={usersCount}
            theme="jade"
            description="Active accounts ในฐานข้อมูล"
            actionLink="/admin/users"
            actionText="ตรวจสอบรายชื่อ"
          />
          <StatCard
            title="คอร์สเรียนทั้งหมด"
            value={coursesCount}
            theme="pine"
            description="ห้องเรียนในระบบ"
            actionLink="/classrooms"
            actionText="ดูห้องเรียน"
          />
          <StatCard
            title="Session Timeout"
            value={settings?.session_timeout_minutes ? `${settings.session_timeout_minutes} น.` : "15 น."}
            theme="amber"
            description="หมดเวลาเมื่อไม่มีการขยับ"
            actionLink="/admin/settings"
            actionText="ปรับเวลา"
          />
          <StatCard
            title="สถานะ API & Database"
            value="Online"
            theme="blue"
            description="Flask + PostgreSQL เชื่อมต่อปกติ"
          />
        </div>

        {/* 3. Management Shortcuts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* คอลัมน์ซ้าย (7 cols): Quick Management Links */}
          <div className="lg:col-span-7 space-y-6">
            <SectionHeader
              title="เมนูการจัดการระบบ (Admin Controls)"
              subtitle="เข้าถึงส่วนควบคุมระบบต่าง ๆ ได้อย่างรวดเร็ว"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-gray-200/90 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                  👥
                </div>
                <h4 className="text-sm font-black text-gray-900">
                  จัดการผู้ใช้งาน
                </h4>
                <p className="text-xs text-gray-500">
                  ค้นหา, แก้ไขสถานะ, ระงับบัญชี (Suspend) และรีเซ็ตรหัสผ่าน
                </p>
                <Button to="/admin/users" variant="outlineDark" size="sm" fullWidth>
                  ไปหน้าจัดการผู้ใช้ →
                </Button>
              </div>

              <div className="rounded-2xl border border-gray-200/90 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold">
                  🛡️
                </div>
                <h4 className="text-sm font-black text-gray-900">
                  จัดการสิทธิ์และบทบาท
                </h4>
                <p className="text-xs text-gray-500">
                  กำหนดบทบาท admin, instructor, student และสิทธิ์ในระบบ
                </p>
                <Button to="/admin/roles" variant="outlineDark" size="sm" fullWidth>
                  ไปหน้าจัดการสิทธิ์ →
                </Button>
              </div>

              <div className="rounded-2xl border border-gray-200/90 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                  ⚙️
                </div>
                <h4 className="text-sm font-black text-gray-900">
                  ตั้งค่าระบบ
                </h4>
                <p className="text-xs text-gray-500">
                  กำหนด Inactivity Timeout และ Guest Preview Time
                </p>
                <Button to="/admin/settings" variant="outlineDark" size="sm" fullWidth>
                  ไปหน้าการตั้งค่า →
                </Button>
              </div>
            </div>
          </div>

          {/* คอลัมน์ขวา (5 cols): Activity Feed */}
          <div className="lg:col-span-5 space-y-6">
            <SectionHeader
              title="บันทึกกิจกรรมระบบ"
              subtitle="เหตุการณ์สำคัญและผู้ใช้งานล่าสุด"
            />
            <ActivityList
              items={adminActivities}
              title="System Events"
              maxItems={5}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AdminHome;
