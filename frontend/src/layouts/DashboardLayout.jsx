import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import useAuthStore from "../store/useAuthStore";

// ======================================================
// DashboardLayout Component (โครงร่างหลักสำหรับหน้าที่ Login แล้ว)
// ======================================================
// คอมโพเนนต์นี้ทำหน้าที่จัดระเบียบหน้าจอสำหรับสมาชิก:
// - ทางซ้าย: แสดงแถบเมนูนำทาง (Sidebar)
// - ทางขวา: แสดงเนื้อหาของแต่ละหน้าผ่าน <Outlet />
// - เมื่อโหลดเข้ามา จะเรียก fetchCurrentUser เพื่อซิงค์ข้อมูล Profile & Roles จาก Backend

function DashboardLayout() {
  const { fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    // ดึงข้อมูลผู้ใช้ล่าสุดจาก Backend เพื่อให้ Role และ Display Name เป็นปัจจุบัน
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* แถบเมนูด้านซ้าย */}
      <Sidebar />

      {/* พื้นที่เนื้อหาหลักด้านขวา */}
      <main className="ml-64 flex-1 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;