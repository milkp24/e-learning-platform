import {
  LuHouse as LuHome,
  LuBookOpen,
  LuFlaskConical,
  LuRadio,
  LuTrophy,
  LuClipboardList,
  LuTrendingUp,
  LuAward,
  LuFlame,
  LuShield,
  LuShieldCheck,
  LuChartBar as LuBarChart3,
  LuUsers,
  LuBookMarked,
  LuTarget,
  LuSettings,
  LuLock,
  LuBuilding,
} from "react-icons/lu";

/**
 * Navigation Configuration for Sidebar
 * Defines menu categories and items for each role:
 * - Guest
 * - Student
 * - Instructor
 * - Admin & Super Admin
 */

// 1. Guest Menu Configuration
export const getGuestMenu = () => [
  {
    title: "เมนูหลัก",
    items: [
      {
        label: "หน้าหลัก",
        path: "/",
        icon: LuHome,
        type: "link",
      },
      {
        label: "คอร์สเรียน",
        path: "/classrooms",
        icon: LuBookOpen,
        type: "link",
      },
      {
        label: "ห้องแล็บจำลอง",
        icon: LuFlaskConical,
        type: "locked",
        featureName: "ห้องแล็บจำลอง",
      },
      {
        label: "ห้องเรียนสด",
        icon: LuRadio,
        type: "locked",
        featureName: "ห้องเรียนสด",
      },
      {
        label: "ภารกิจท้าทาย",
        icon: LuTrophy,
        type: "locked",
        featureName: "ภารกิจท้าทาย",
      },
    ],
  },
];

// 2. Student Menu Configuration
export const getStudentMenu = ({ isAdmin = false, isSuperAdmin = false } = {}) => {
  const sections = [
    {
      title: "เมนูหลัก",
      items: [
        {
          label: "แดชบอร์ดผู้เรียน",
          path: "/student/home",
          icon: LuHome,
          type: "link",
        },
      ],
    },
    {
      title: "คอร์สเรียน",
      items: [
        {
          label: "คอร์สเรียนทั้งหมด",
          path: "/classrooms",
          icon: LuBookOpen,
          type: "link",
        },
        {
          label: "คอร์สเรียนของฉัน",
          path: "/classrooms?view=mine",
          icon: LuBookMarked,
          type: "link",
        },
        {
          label: "บันทึกการเรียนรู้",
          path: "/journals",
          icon: LuClipboardList,
          type: "link",
        },
        {
          label: "ห้องแล็บจำลอง",
          path: "/student/home",
          hash: "#lab",
          icon: LuFlaskConical,
          type: "hash",
        },
        {
          label: "ห้องเรียนสด",
          path: "/student/home",
          hash: "#live",
          icon: LuRadio,
          type: "hash",
        },
      ],
    },
    {
      title: "การเรียนรู้",
      hasDivider: true,
      items: [
        {
          label: "ภารกิจท้าทาย",
          path: "/student/home",
          hash: "#quest",
          icon: LuTrophy,
          type: "hash",
        },
        {
          label: "ความคืบหน้า",
          path: "/student/home",
          hash: "#progress",
          icon: LuTrendingUp,
          type: "hash",
        },
        {
          label: "ความสำเร็จ",
          path: "/student/home",
          hash: "#achievement",
          icon: LuAward,
          type: "hash",
        },
        {
          label: "สถิติการเรียน",
          path: "/student/home",
          hash: "#streak",
          icon: LuFlame,
          type: "hash",
        },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: "ผู้ดูแลระบบ",
      titleColor: "text-amber-700",
      isSpecialAdmin: true,
      items: [
        {
          label: "แดชบอร์ดผู้ดูแลระบบ",
          path: isSuperAdmin ? "/admin/home" : "/admin/dashboard",
          icon: LuShield,
          type: "adminShortcut",
        },
      ],
    });
  }

  return sections;
};

// 3. Instructor Menu Configuration
export const getInstructorMenu = ({ isAdmin = false, isSuperAdmin = false } = {}) => {
  const sections = [
    {
      title: "การจัดการผู้สอน",
      items: [
        {
          label: "ภาพรวมการสอน",
          path: "/instructor/home",
          icon: LuBarChart3,
          type: "link",
        },
      ],
    },
    {
      title: "คอร์สเรียน",
      items: [
        {
          label: "คอร์สเรียนทั้งหมด",
          path: "/classrooms",
          icon: LuBookOpen,
          type: "link",
        },
        {
          label: "คอร์สเรียนของฉัน",
          path: "/classrooms?view=mine",
          icon: LuBookMarked,
          type: "link",
        },
      ],
    },
    {
      title: "การติดตามและประเมินผล",
      hasDivider: true,
      items: [
        {
          label: "นักเรียน & ความคืบหน้า",
          path: "/instructor/home",
          hash: "#students",
          icon: LuUsers,
          type: "hash",
        },
        {
          label: "คลังข้อสอบ & แบบฝึกหัด",
          path: "/instructor/home",
          hash: "#quizzes",
          icon: LuClipboardList,
          type: "hash",
        },
        {
          label: "รายงานผลการเรียน",
          path: "/instructor/home",
          hash: "#reports",
          icon: LuTrendingUp,
          type: "hash",
        },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: "ผู้ดูแลระบบ",
      titleColor: "text-amber-700",
      isSpecialAdmin: true,
      items: [
        {
          label: "แดชบอร์ดผู้ดูแลระบบ",
          path: isSuperAdmin ? "/admin/home" : "/admin/dashboard",
          icon: LuShield,
          type: "adminShortcut",
        },
      ],
    });
  }

  return sections;
};

// 4. Admin & Super Admin Menu Configuration
export const getAdminMenu = ({ isSuperAdmin = false } = {}) => {
  const userManagementItems = [
    {
      label: "ผู้ใช้งานทั้งหมด",
      path: "/admin/users",
      icon: LuUsers,
      type: "link",
    },
    {
      label: "โรงเรียนและสถานศึกษา",
      path: "/admin/schools",
      icon: LuBuilding,
      type: "link",
    },
  ];

  if (isSuperAdmin) {
    userManagementItems.push(
      {
        label: "เจ้าหน้าที่",
        path: "/admin/staff",
        icon: LuShieldCheck,
        type: "link",
      },
      {
        label: "สิทธิ์และบทบาท",
        path: "/admin/roles",
        icon: LuLock,
        type: "link",
      }
    );
  }

  const systemItems = [];
  if (isSuperAdmin) {
    systemItems.push(
      {
        label: "ตั้งค่าระบบ",
        path: "/admin/settings",
        icon: LuSettings,
        type: "link",
      },
      {
        label: "ความปลอดภัยระบบ",
        path: "/admin/security",
        icon: LuShield,
        type: "link",
      }
    );
  }
  systemItems.push({
    label: "รายงานและสถิติวิเคราะห์",
    path: "/admin/reports",
    icon: LuBarChart3,
    type: "link",
  });

  return [
    {
      title: "เมนูหลัก",
      items: [
        {
          label: isSuperAdmin ? "Super Admin Console" : "แดชบอร์ด",
          path: isSuperAdmin ? "/admin/home" : "/admin/dashboard",
          icon: LuHome,
          type: "link",
        },
      ],
    },
    {
      title: "การจัดการผู้ใช้งาน",
      items: userManagementItems,
    },
    {
      title: "คอร์สเรียน",
      items: [
        {
          label: "คอร์สเรียนทั้งหมด",
          path: "/admin/courses",
          altPath: "/classrooms",
          icon: LuBookOpen,
          type: "link",
        },
        {
          label: "คอร์สเรียนของฉัน",
          path: "/classrooms?view=mine",
          icon: LuBookMarked,
          type: "link",
        },
      ],
    },
    {
      title: "การจัดการการเรียนรู้",
      items: [
        {
          label: "บทเรียนและตอนย่อย",
          path: "/admin/lessons",
          icon: LuBookMarked,
          type: "link",
        },
        {
          label: "แบบทดสอบ",
          path: "/admin/quizzes",
          icon: LuClipboardList,
          type: "link",
        },
        {
          label: "ภารกิจท้าทาย",
          path: "/admin/missions",
          icon: LuTarget,
          type: "link",
        },
      ],
    },
    {
      title: "ระบบและการตั้งค่า",
      items: systemItems,
    },
  ];
};

/**
 * Resolves the navigation sections array based on the active role and privileges
 */
export const getNavSections = ({
  role,
  isAdmin = false,
  isSuperAdmin = false,
}) => {
  switch (role) {
    case "guest":
      return getGuestMenu();
    case "student":
      return getStudentMenu({ isAdmin, isSuperAdmin });
    case "instructor":
      return getInstructorMenu({ isAdmin, isSuperAdmin });
    case "admin":
      return getAdminMenu({ isSuperAdmin });
    default:
      return [];
  }
};
