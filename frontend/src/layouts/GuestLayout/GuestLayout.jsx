import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import GuestHeader from "./components/GuestHeader";
import Sidebar from "../../components/layout/Sidebar";
import GuestLockModal from "../../features/auth/components/GuestLockModal";
import Footer from "../../components/layout/Footer";

// ======================================================
// GuestLayout Component (โครงร่างหลักสำหรับผู้เยี่ยมชม / ยังไม่ Login)
// ======================================================
// โครงสร้าง Unified Architecture:
// - Left: Shared Sidebar (role="guest") (On-demand Slide-over Drawer ทุกขนาดหน้าจอ)
// - Top: GuestHeader (มีปุ่ม Hamburger สำหรับมือถือ/แท็บเล็ต/เดสก์ท็อป)
// - Center: Outlet (Landing Page เป็น Full-width, หน้าอื่นเป็น max-w-7xl เหมือน StudentLayout)
// - Footer: Reusable Footer
// - Modal: GuestLockModal รองรับการคลิกเมนูที่ล็อก
// ======================================================

function GuestLayout() {
  const location = useLocation();
  const isLandingHome = location.pathname === "/";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lockModalState, setLockModalState] = useState({
    isOpen: false,
    title: "ฟังก์ชันนี้สำหรับสมาชิก",
    message: "กรุณาสมัครสมาชิกหรือเข้าสู่ระบบก่อนใช้งาน",
    badge: "สำหรับสมาชิกเท่านั้น",
  });

  const handleOpenLockModal = (featureName = "คอร์สเรียน") => {
    setLockModalState({
      isOpen: true,
      title: `ฟังก์ชัน ${featureName} สำหรับสมาชิก`,
      message:
        "สมัครสมาชิกฟรีเพื่อเริ่มเรียนรู้ ทดลองห้องทดลองเสมือนจริง และสะสมคะแนน",
      badge: "สำหรับสมาชิกเท่านั้น",
    });
  };

  const handleCloseLockModal = () => {
    setLockModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#26332F]">
      {/* 1. Shared Sidebar ประจำบทบาท Guest */}
      <Sidebar
        role="guest"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenLockModal={handleOpenLockModal}
      />

      {/* 2. พื้นที่เนื้อหาและแถบนำทางด้านขวา */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Navigation: GuestHeader with Left Hamburger and Right Actions */}
        <GuestHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Main Content Area: Landing Page ใช้ Full-width, หน้าห้องเรียนใช้โครงสร้างมาตรฐานเดียวกับ Student */}
        <main
          className={`flex-1 w-full ${
            isLandingHome
              ? ""
              : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          }`}
        >
          <Outlet context={{ openLockModal: handleOpenLockModal }} />
        </main>

        {/* Global Footer */}
        <Footer />
      </div>

      {/* Guest Lock Modal สำหรับแจ้งเตือนเมื่อคลิกเมนูที่ล็อกใน Sidebar */}
      <GuestLockModal
        isOpen={lockModalState.isOpen}
        onClose={handleCloseLockModal}
        title={lockModalState.title}
        message={lockModalState.message}
        badge={lockModalState.badge}
      />
    </div>
  );
}

export default GuestLayout;
