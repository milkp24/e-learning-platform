import { useState } from "react";
import useDashboardStats from "../../../hooks/admin/useDashboardStats";
import DashboardHeader from "./components/DashboardHeader";
import SuperAdminOverviewCards from "./components/SuperAdminOverviewCards";
import UsageOverviewSection from "./components/UsageOverviewSection";
import StaffPermissionSummarySection from "./components/StaffPermissionSummarySection";
import PendingActionsSection from "./components/PendingActionsSection";
import SystemStatusSection from "./components/SystemStatusSection";
import RecentActivity from "./components/RecentActivity";
import QuickActions from "./components/QuickActions";
import UsersOverviewSection from "./components/UsersOverviewSection";
import CoursesOverviewSection from "./components/CoursesOverviewSection";
import InstructorOverviewSection from "./components/InstructorOverviewSection";
import AccountOverviewSection from "./components/AccountOverviewSection";
import LearningActivitySection from "./components/LearningActivitySection";
import Loading from "../../../components/common/Loading";
import AuditLogModal from "../../../features/permissions/components/AuditLogModal/AuditLogModal";

/**
 * Super Admin Dashboard Page Component
 * Production-grade Super Admin Console
 *
 * Requirements:
 * - Thai Greeting & Current Date
 * - 8 High-Impact Overview Cards
 * - Usage Overview with Date Filter Tabs (วันนี้, 7 วัน, 30 วัน, กำหนดเอง)
 * - Staff Permission Governance & Overview
 * - Pending Actions with direct links
 * - Production Domain Metrics
 * - Recent Activities with Audit Log Modal
 * - System Status Health Check UI
 */
function Dashboard() {
  const { stats, isLoading, error, refetch } = useDashboardStats();
  const [dateFilter, setDateFilter] = useState("7d");
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  if (isLoading && !stats.totalUsers && !stats.totalCourses) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Loading text="กำลังโหลดข้อมูลภาพรวมระบบผู้ดูแลระบบ..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dashboard Header */}
      <DashboardHeader
        onRefresh={refetch}
        isLoading={isLoading}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      {/* Error Alert Banner if any */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between text-xs text-rose-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={refetch}
            className="font-bold underline cursor-pointer hover:text-rose-900"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* 2. 8 High-Impact Overview Cards */}
      <SuperAdminOverviewCards stats={stats} />

      {/* 3. Usage Overview with Date Filter */}
      <UsageOverviewSection
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      {/* 4. Staff Permission Governance Summary */}
      <StaffPermissionSummarySection />

      {/* 5. Pending Actions Section */}
      <PendingActionsSection />

      {/* 6. Deep Domain Analytics (Users & Courses) */}
      <div className="space-y-6 pt-2 border-t border-[#E5E9E7]/70">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-[#26332F]">
            การวิเคราะห์เชิงลึกตามมิติข้อมูล
          </h2>
          <span className="text-xs text-[#6B7773]">
            ข้อมูลจริงจากฐานข้อมูล
          </span>
        </div>
        <UsersOverviewSection stats={stats} />
        <CoursesOverviewSection stats={stats} />
        <InstructorOverviewSection stats={stats} />
        <AccountOverviewSection stats={stats} />
        <LearningActivitySection stats={stats} />
      </div>

      {/* 7. System Health Status UI */}
      <SystemStatusSection />

      {/* 8. Recent Activities & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-[#E5E9E7]/70">
        <div className="lg:col-span-2">
          <RecentActivity onViewAll={() => setIsAuditModalOpen(true)} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}

export default Dashboard;
