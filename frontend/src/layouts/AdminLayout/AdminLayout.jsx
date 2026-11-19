import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import AdminHeader from "./components/AdminHeader";
import useAuthStore from "../../store/useAuthStore";

/**
 * AdminLayout Component
 * Central shared layout for all Super Admin pages
 * Provides unified AdminHeader and shared Sidebar across the entire admin panel
 */
function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#26332F] font-dashboard antialiased selection:bg-[#ABD1C6] selection:text-[#26332F]">
      {/* 1. Shared Admin Sidebar (Slide-over drawer on all viewports) */}
      <Sidebar
        role="admin"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 2. Main Workspace & Header area (Full-width content) */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
