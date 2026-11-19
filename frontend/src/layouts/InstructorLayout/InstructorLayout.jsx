import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import InstructorHeader from "./components/InstructorHeader";
import Footer from "../../components/layout/Footer";
import useAuthStore from "../../store/useAuthStore";

// ======================================================
// InstructorLayout Component (โครงร่างหลักสำหรับผู้สอน)
// ======================================================
// โครงสร้าง:
// - Left: Shared Sidebar (role="instructor") (On-demand Slide-over Drawer ทุกขนาดหน้าจอ)
// - Top: InstructorHeader (มีปุ่มเปิด Sidebar, สลับมุมมอง, ข้อมูลผู้สอน)
// - Center: Outlet (หน้าจอเนื้อหาหลัก)
// - Bottom: Footer

function InstructorLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // ซิงค์ข้อมูลล่าสุดจาก Backend เมื่อเข้าใช้งาน
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#26332F] font-dashboard">
      {/* 1. Shared Sidebar ประจำบทบาท Instructor */}
      <Sidebar
        role="instructor"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. พื้นที่เนื้อหาและแถบนำทางด้านขวา (Full-width content) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <InstructorHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer simple={true} />
      </div>
    </div>
  );
}

export default InstructorLayout;
