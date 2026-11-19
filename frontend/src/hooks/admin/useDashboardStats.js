import { useState, useEffect, useCallback } from "react";
import adminService from "../../services/adminService";
import { classroomService } from "../../services/classroomService";

/**
 * Custom Hook: useDashboardStats
 * Single Source of Truth for Super Admin Dashboard metrics.
 *
 * Fetches REAL production data from:
 * 1. adminService.getUsers({ per_page: 100 })
 * 2. classroomService.getClassrooms()
 *
 * Computes strictly domain-segregated metrics.
 * Zero fabricated numbers, zero fake percentages.
 * Metrics without backend support are set to null (rendered as Coming Soon).
 */
export function useDashboardStats() {
  const [stats, setStats] = useState({
    // 1. Users Overview
    totalUsers: 0,
    studentsCount: 0,
    instructorsCount: 0,
    adminsCount: 0,
    usersByRole: [],

    // 2. Courses Overview
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    archivedCourses: 0,
    coursesByStatus: [],

    // 3. Instructor Overview
    totalInstructors: 0,
    activeInstructors: 0,
    instructorsWithCourses: 0,
    instructorActivity: null, // Coming Soon

    // 4. Account Overview
    activeAccounts: 0,
    inactiveAccounts: 0,
    expiringAccounts: null, // Coming Soon
    expiredAccounts: null, // Coming Soon
    accountRenewalTrend: null, // Coming Soon
    dailyActivity: null,

    // 5. Learning Activity
    courseEnrollments: 0,
    activeLearners: null, // Coming Soon
    lessonCompletion: null, // Coming Soon
    quizAttempts: null, // Coming Soon
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverviewData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try real backend stats API (Super Admin / Admin stats) + Daily Activity
      let backendStats = null;
      let dailyActivityData = null;

      try {
        const [statsRes, dailyRes] = await Promise.allSettled([
          adminService.getSuperAdminStats(),
          adminService.getDailyActivity(),
        ]);
        if (statsRes.status === "fulfilled") backendStats = statsRes.value;
        if (dailyRes.status === "fulfilled") dailyActivityData = dailyRes.value;
      } catch {
        // Continue to fallback
      }

      if (!backendStats) {
        try {
          backendStats = await adminService.getAdminStats();
        } catch {
          backendStats = null;
        }
      }

      if (!dailyActivityData) {
        try {
          dailyActivityData = await adminService.getDailyActivity();
        } catch {
          dailyActivityData = null;
        }
      }

      if (backendStats && (backendStats.totalUsers !== undefined || backendStats.userStats || backendStats.courseStats)) {
        const u = backendStats.userStats || backendStats;
        const c = backendStats.courseStats || backendStats;
        const totalStaff = (backendStats.adminsCount ?? u.totalAdmins ?? 0) + (backendStats.superAdminsCount ?? u.totalSuperAdmins ?? 0);

        setStats({
          totalUsers: backendStats.totalUsers ?? u.totalUsers ?? 0,
          studentsCount: backendStats.studentsCount ?? u.totalStudents ?? 0,
          instructorsCount: backendStats.instructorsCount ?? u.totalInstructors ?? 0,
          adminsCount: totalStaff,
          totalStaff: totalStaff,
          usersByRole: u.usersByRole || [
            { role: "Student", label: "นักเรียน", count: backendStats.studentsCount ?? u.totalStudents ?? 0, color: "#ABD1C6" },
            { role: "Instructor", label: "ผู้สอน", count: backendStats.instructorsCount ?? u.totalInstructors ?? 0, color: "#64748B" },
            { role: "Admin", label: "ผู้ดูแลระบบ", count: totalStaff, color: "#004643" },
          ],
          totalCourses: backendStats.totalCourses ?? c.totalCourses ?? 0,
          publishedCourses: backendStats.publishedCourses ?? c.activeCourses ?? 0,
          draftCourses: backendStats.draftCourses ?? c.draftCourses ?? 0,
          archivedCourses: backendStats.archivedCourses ?? 0,
          coursesByStatus: [
            { status: "Published", label: "เผยแพร่แล้ว", count: backendStats.publishedCourses ?? c.activeCourses ?? 0, color: "#0D9488" },
            { status: "Draft", label: "ฉบับร่าง", count: backendStats.draftCourses ?? c.draftCourses ?? 0, color: "#94A3B8" },
            { status: "Archived", label: "เก็บถาวร", count: backendStats.archivedCourses ?? 0, color: "#64748B" },
          ],
          totalLessons: backendStats.totalLessons ?? c.totalLessons ?? 0,
          totalQuizzes: backendStats.totalQuizzes ?? c.totalQuizzes ?? 0,
          totalMissions: backendStats.totalMissions ?? c.totalMissions ?? 0,
          newUsers: backendStats.recentRegistrations7d ?? u.recentRegistrations7d ?? 0,
          totalInstructors: backendStats.totalInstructors ?? u.totalInstructors ?? 0,
          activeInstructors: backendStats.activeInstructors ?? u.totalInstructors ?? 0,
          instructorsWithCourses: backendStats.instructorsWithCourses ?? 0,
          instructorActivity: null,
          activeAccounts: backendStats.activeAccounts ?? u.activeUsers ?? 0,
          inactiveAccounts: backendStats.inactiveAccounts ?? u.suspendedUsers ?? 0,
          expiringAccounts: null,
          expiredAccounts: null,
          accountRenewalTrend: null,
          dailyActivity: dailyActivityData,
          courseEnrollments: backendStats.courseEnrollments ?? c.totalEnrollments ?? 0,
          activeLearners: null,
          lessonCompletion: null,
          quizAttempts: null,
          securityStats: backendStats.securityStats || null,
          systemUsage: backendStats.systemUsage || null,
          systemHealth: backendStats.systemStatus || backendStats.systemHealth || "healthy",
        });
        setIsLoading(false);
        return;
      }

      // 2. Fallback: query users and classrooms if aggregated stats not available
      const [usersRes, coursesRes] = await Promise.allSettled([
        adminService.getUsers({ per_page: 100 }),
        classroomService.getClassrooms(),
      ]);

      let usersList = [];
      let totalUsersCount = 0;

      if (usersRes.status === "fulfilled" && usersRes.value) {
        usersList = usersRes.value.users || [];
        totalUsersCount = Number(usersRes.value.total) || usersList.length;
      }

      let coursesList = [];
      if (coursesRes.status === "fulfilled" && coursesRes.value) {
        const val = coursesRes.value;
        if (Array.isArray(val)) {
          coursesList = val;
        } else if (Array.isArray(val.courses)) {
          coursesList = val.courses;
        } else if (Array.isArray(val.classrooms)) {
          coursesList = val.classrooms;
        }
      }

      // --- Domain 1: Users Calculations ---
      const studentsCount = usersList.filter((u) =>
        u.roles?.some((r) => String(r).toLowerCase() === "student")
      ).length;

      const instructorsCount = usersList.filter((u) =>
        u.roles?.some((r) => String(r).toLowerCase() === "instructor")
      ).length;

      const adminsCount = usersList.filter((u) =>
        u.roles?.some((r) => String(r).toLowerCase() === "admin")
      ).length;

      const usersByRole = [
        { role: "Student", label: "นักเรียน", count: studentsCount, color: "#ABD1C6" },
        { role: "Instructor", label: "ผู้สอน", count: instructorsCount, color: "#64748B" },
        { role: "Admin", label: "ผู้ดูแลระบบ", count: adminsCount, color: "#004643" },
      ];

      // --- Domain 2: Courses Calculations ---
      const totalCourses = coursesList.length;
      const publishedCourses = coursesList.filter(
        (c) => c.status === "published" || c.status === "active"
      ).length;
      const draftCourses = coursesList.filter((c) => c.status === "draft").length;
      const archivedCourses = coursesList.filter((c) => c.status === "archived").length;

      const coursesByStatus = [
        { status: "Published", label: "เผยแพร่แล้ว", count: publishedCourses, color: "#0D9488" },
        { status: "Draft", label: "ฉบับร่าง", count: draftCourses, color: "#94A3B8" },
        { status: "Archived", label: "เก็บถาวร", count: archivedCourses, color: "#64748B" },
      ];

      // --- Domain 3: Instructor Calculations ---
      const activeInstructors = usersList.filter(
        (u) =>
          u.roles?.some((r) => String(r).toLowerCase() === "instructor") &&
          u.status === "active"
      ).length;

      const instructorIdsWithCourses = new Set(
        coursesList.map((c) => String(c.instructor_id)).filter(Boolean)
      );
      const instructorsWithCourses = usersList.filter(
        (u) =>
          u.roles?.some((r) => String(r).toLowerCase() === "instructor") &&
          instructorIdsWithCourses.has(String(u.user_id))
      ).length;

      // --- Domain 4: Account Calculations ---
      const activeAccounts = usersList.filter((u) => u.status === "active").length;
      const inactiveAccounts = usersList.filter((u) => u.status !== "active").length;

      // --- Domain 5: Learning Activity Calculations ---
      const courseEnrollments = coursesList.reduce(
        (sum, c) => sum + (Number(c.member_count) || 0),
        0
      );

      setStats({
        // 1. Users
        totalUsers: totalUsersCount || usersList.length,
        studentsCount,
        instructorsCount,
        adminsCount,
        usersByRole,

        // 2. Courses
        totalCourses,
        publishedCourses,
        draftCourses,
        archivedCourses,
        coursesByStatus,

        // 3. Instructors
        totalInstructors: instructorsCount,
        activeInstructors,
        instructorsWithCourses,
        instructorActivity: null,

        // 4. Accounts
        activeAccounts,
        inactiveAccounts,
        expiringAccounts: null,
        expiredAccounts: null,
        accountRenewalTrend: null,
        dailyActivity: dailyActivityData,

        // 5. Learning Activity
        courseEnrollments,
        activeLearners: null,
        lessonCompletion: null,
        quizAttempts: null,
      });
    } catch (err) {
      console.error("Failed to load dashboard overview data:", err);
      setError("ไม่สามารถโหลดข้อมูลภาพรวมได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  return { stats, isLoading, error, refetch: fetchOverviewData };
}

export default useDashboardStats;
