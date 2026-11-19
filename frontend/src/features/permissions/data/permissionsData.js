/**
 * Permission System Data Specifications
 * 7 Modules with 37 granular actions
 * Used across Role Management, Staff Management, and Super Admin Dashboard
 */

export const PERMISSION_MODULES = [
  {
    id: "users",
    title: "ผู้ใช้งาน",
    description: "จัดการข้อมูลผู้ใช้งาน บัญชี และสถานะการใช้งาน",
    icon: "LuUsers",
    actions: [
      { id: "view", label: "ดูผู้ใช้งาน", description: "ดูรายชื่อและรายละเอียดข้อมูลผู้ใช้งาน" },
      { id: "create", label: "เพิ่มผู้ใช้งาน", description: "สร้างบัญชีผู้ใช้งานใหม่ในระบบ" },
      { id: "edit", label: "แก้ไขผู้ใช้งาน", description: "แก้ไขข้อมูลส่วนตัวและรายละเอียดบัญชี" },
      { id: "delete", label: "ลบผู้ใช้งาน", description: "ลบบัญชีผู้ใช้ออกจากระบบถาวร" },
      { id: "suspend", label: "ระงับบัญชี", description: "ระงับหรือเปิดการใช้งานบัญชีผู้ใช้" },
      { id: "reset_password", label: "รีเซ็ตรหัสผ่าน", description: "ส่งลิงก์หรือรีเซ็ตรหัสผ่านให้ผู้ใช้" },
      { id: "change_role", label: "เปลี่ยนบทบาท", description: "กำหนดหรือเปลี่ยนแปลงบทบาทของผู้ใช้" },
    ],
  },
  {
    id: "courses",
    title: "คอร์สเรียน",
    description: "จัดการหลักสูตรและคอร์สเรียนทั้งหมด",
    icon: "LuBookOpen",
    actions: [
      { id: "view", label: "ดูคอร์ส", description: "ดูรายชื่อและรายละเอียดคอร์สเรียน" },
      { id: "create", label: "สร้างคอร์ส", description: "สร้างหลักสูตรหรือคอร์สเรียนใหม่" },
      { id: "edit", label: "แก้ไขคอร์ส", description: "แก้ไขเนื้อหาและรายละเอียดของคอร์ส" },
      { id: "delete", label: "ลบคอร์ส", description: "ลบคอร์สเรียนออกจากระบบ" },
      { id: "publish", label: "เผยแพร่คอร์ส", description: "เปิดให้ผู้เรียนเข้าถึงคอร์สได้" },
      { id: "unpublish", label: "ยกเลิกการเผยแพร่", description: "ซ่อนคอร์สจากการแสดงผลสาธารณะ" },
    ],
  },
  {
    id: "lessons",
    title: "บทเรียน",
    description: "จัดการบทเรียนและสื่อการสอนในแต่ละคอร์ส",
    icon: "LuGraduationCap",
    actions: [
      { id: "view", label: "ดูบทเรียน", description: "ดูเนื้อหาและสื่อการสอนในบทเรียน" },
      { id: "create", label: "เพิ่มบทเรียน", description: "เพิ่มบทเรียนใหม่ลงในคอร์ส" },
      { id: "edit", label: "แก้ไขบทเรียน", description: "แก้ไขเนื้อหา วิดีโอ หรือเอกสารบทเรียน" },
      { id: "delete", label: "ลบบทเรียน", description: "ลบบทเรียนออกจากคอร์ส" },
      { id: "reorder", label: "จัดลำดับบทเรียน", description: "ปรับเปลี่ยนลำดับการแสดงผลของบทเรียน" },
    ],
  },
  {
    id: "quizzes",
    title: "แบบทดสอบ",
    description: "จัดการแบบฝึกหัด ข้อสอบ และเกณฑ์คะแนน",
    icon: "LuClipboardList",
    actions: [
      { id: "view", label: "ดูแบบทดสอบ", description: "ดูข้อสอบและคลังคำถาม" },
      { id: "create", label: "สร้างแบบทดสอบ", description: "สร้างชุดข้อสอบและคำถามใหม่" },
      { id: "edit", label: "แก้ไขแบบทดสอบ", description: "แก้ไขโจทย์ ตัวเลือก และเฉลย" },
      { id: "delete", label: "ลบแบบทดสอบ", description: "ลบชุดข้อสอบออกจากระบบ" },
      { id: "publish", label: "เผยแพร่แบบทดสอบ", description: "เปิดให้นักเรียนทำแบบทดสอบได้" },
    ],
  },
  {
    id: "missions",
    title: "ภารกิจ",
    description: "จัดการภารกิจ การบ้าน และความท้าทายการเรียนรู้",
    icon: "LuTarget",
    actions: [
      { id: "view", label: "ดูภารกิจ", description: "ดูรายการภารกิจและการบ้าน" },
      { id: "create", label: "สร้างภารกิจ", description: "สร้างภารกิจการเรียนรู้ใหม่" },
      { id: "edit", label: "แก้ไขภารกิจ", description: "แก้ไขเงื่อนไขและคะแนนของภารกิจ" },
      { id: "delete", label: "ลบภารกิจ", description: "ลบภารกิจออกจากระบบ" },
      { id: "toggle", label: "เปิด/ปิดภารกิจ", description: "เปิดหรือปิดการรับส่งภารกิจ" },
    ],
  },
  {
    id: "reports",
    title: "รายงาน",
    description: "ดูสถิติ กิจกรรมการเรียน และส่งออกข้อมูล",
    icon: "LuBarChart3",
    actions: [
      { id: "view", label: "ดูรายงาน", description: "ดูภาพรวมสถิติและรายงานผล" },
      { id: "user_stats", label: "ดูสถิติผู้ใช้งาน", description: "ดูสถิติการเข้าใช้งานและการเติบโต" },
      { id: "progress", label: "ดูความคืบหน้าการเรียน", description: "ดูอัตราการสำเร็จคอร์สและคะแนนเฉลี่ย" },
      { id: "export", label: "ส่งออกรายงาน", description: "ดาวน์โหลดข้อมูลเป็นไฟล์ Excel/CSV/PDF" },
    ],
  },
  {
    id: "security",
    title: "ความปลอดภัย",
    description: "ตรวจสอบประวัติการเข้าใช้งานและบันทึกระบบ",
    icon: "LuShield",
    actions: [
      { id: "view", label: "ดูภาพรวมความปลอดภัย", description: "ดูสถานะความปลอดภัยและการเชื่อมต่อ" },
      { id: "login_history", label: "ดูประวัติการเข้าสู่ระบบ", description: "ตรวจสอบบันทึก IP และอุปกรณ์ที่เข้าสู่ระบบ" },
      { id: "audit_log", label: "ดูบันทึกระบบ (Audit Log)", description: "ตรวจสอบประวัติการเปลี่ยนแปลงสิทธิ์และข้อมูล" },
      { id: "session_manage", label: "จัดการเซสชัน", description: "สั่งออกจากระบบหรือยกเลิกเซสชันที่น่าสงสัย" },
      { id: "account_suspend", label: "ระงับบัญชีฉุกเฉิน", description: "ระงับบัญชีที่พบความผิดปกติทันที" },
    ],
  },
  {
    id: "schools",
    title: "โรงเรียนและสถานศึกษา",
    description: "จัดการข้อมูลโรงเรียน สถานศึกษา และหน่วยงานในระบบ",
    icon: "LuBuilding",
    actions: [
      { id: "view", label: "ดูโรงเรียน", description: "ดูรายชื่อและรายละเอียดข้อมูลโรงเรียน" },
      { id: "create", label: "สร้างโรงเรียน", description: "เพิ่มโรงเรียนหรือสถานศึกษาใหม่ในระบบ" },
      { id: "edit", label: "แก้ไขโรงเรียน", description: "แก้ไขข้อมูล รายละเอียด หรือสถานะโรงเรียน" },
      { id: "delete", label: "ลบโรงเรียน", description: "ลบข้อมูลโรงเรียนออกจากระบบ" },
    ],
  },
];

// Helper: ดึงรายการคีย์สิทธิ์ทั้งหมด (37 รายการ)
export const getAllPermissionKeys = () => {
  const keys = [];
  PERMISSION_MODULES.forEach((mod) => {
    mod.actions.forEach((act) => {
      keys.push(`${mod.id}.${act.id}`);
    });
  });
  return keys;
};

// Helper: ดึงคีย์สิทธิ์ของโมดูลใดโมดูลหนึ่ง
export const getModulePermissionKeys = (moduleId) => {
  const mod = PERMISSION_MODULES.find((m) => m.id === moduleId);
  if (!mod) return [];
  return mod.actions.map((act) => `${mod.id}.${act.id}`);
};

// Presets สำหรับเลือกสิทธิ์อย่างรวดเร็ว
export const PERMISSION_PRESETS = [
  {
    id: "viewer",
    name: "ดูอย่างเดียว (Viewer)",
    description: "สิทธิ์เปิดดูข้อมูลในทุกโมดูล แต่ไม่สามารถสร้าง แก้ไข หรือลบข้อมูลได้",
    getPermissions: () =>
      getAllPermissionKeys().filter((k) => k.endsWith(".view")),
  },
  {
    id: "content_manager",
    name: "จัดการเนื้อหา (Content Manager)",
    description: "สิทธิ์จัดการคอร์สเรียน บทเรียน แบบทดสอบ และภารกิจครบวงจร",
    getPermissions: () => [
      ...getModulePermissionKeys("courses"),
      ...getModulePermissionKeys("lessons"),
      ...getModulePermissionKeys("quizzes"),
      ...getModulePermissionKeys("missions"),
      "users.view",
      "reports.view",
    ],
  },
  {
    id: "user_manager",
    name: "จัดการผู้ใช้งาน (User Manager)",
    description: "สิทธิ์จัดการข้อมูลผู้ใช้งาน รีเซ็ตรหัสผ่าน และตรวจสอบความปลอดภัย",
    getPermissions: () => [
      ...getModulePermissionKeys("users"),
      "security.view",
      "security.login_history",
      "security.account_suspend",
      "reports.user_stats",
      "reports.view",
    ],
  },
  {
    id: "report_manager",
    name: "จัดการรายงาน (Report Manager)",
    description: "สิทธิ์ดูรายงาน สถิติผู้เรียน และส่งออกข้อมูลวิเคราะห์",
    getPermissions: () => [
      ...getModulePermissionKeys("reports"),
      "users.view",
      "courses.view",
      "lessons.view",
      "quizzes.view",
      "missions.view",
      "security.view",
    ],
  },
  {
    id: "full_admin",
    name: "สิทธิ์ทั้งหมด (Full Access)",
    description: "ครอบคลุมทุกโมดูลและทุกการกระทำในระบบทั้งหมด (37 สิทธิ์)",
    getPermissions: () => getAllPermissionKeys(),
  },
];

// บทบาทเริ่มต้นในระบบ
export const INITIAL_ROLES = [
  {
    id: "super_admin",
    name: "Super Admin",
    description: "ผู้ดูแลระบบสูงสุด มีสิทธิ์เข้าถึงและควบคุมทุกฟังก์ชันในระบบอย่างสมบูรณ์",
    isSystem: true,
    status: "active",
    badgeColor: "emerald",
    permissions: getAllPermissionKeys(),
  },
  {
    id: "admin",
    name: "ผู้ดูแลระบบ (Admin)",
    description: "ผู้ดูแลระบบทั่วไป สามารถจัดการผู้ใช้งาน คอร์สเรียน และดูรายงานได้",
    isSystem: true,
    status: "active",
    badgeColor: "teal",
    permissions: getAllPermissionKeys().filter(
      (k) => !["security.session_manage", "users.delete", "schools.delete"].includes(k)
    ),
  },
  {
    id: "user_manager",
    name: "เจ้าหน้าที่จัดการผู้ใช้งาน",
    description: "ดูแลการลงทะเบียน บัญชีผู้ใช้ การรีเซ็ตรหัสผ่าน และระงับบัญชี",
    isSystem: false,
    status: "active",
    badgeColor: "blue",
    permissions: [
      ...getModulePermissionKeys("users"),
      "security.view",
      "security.login_history",
      "security.account_suspend",
      "reports.user_stats",
      "reports.view",
    ],
  },
  {
    id: "course_manager",
    name: "เจ้าหน้าที่จัดการคอร์ส",
    description: "สร้าง แก้ไข จัดการคอร์สเรียนและเผยแพร่บทเรียน",
    isSystem: false,
    status: "active",
    badgeColor: "amber",
    permissions: [
      ...getModulePermissionKeys("courses"),
      ...getModulePermissionKeys("lessons"),
      ...getModulePermissionKeys("quizzes"),
      "missions.view",
      "reports.view",
    ],
  },
  {
    id: "content_staff",
    name: "เจ้าหน้าที่ฝ่ายเนื้อหา",
    description: "จัดเตรียมและปรับปรุงบทเรียน แบบฝึกหัด และสื่อการสอน",
    isSystem: false,
    status: "active",
    badgeColor: "purple",
    permissions: [
      ...getModulePermissionKeys("lessons"),
      ...getModulePermissionKeys("quizzes"),
      ...getModulePermissionKeys("missions"),
      "courses.view",
    ],
  },
  {
    id: "report_viewer",
    name: "เจ้าหน้าที่ดูรายงาน",
    description: "ตรวจสอบสถิติการเรียน ผลคะแนน และส่งออกรายงานภาพรวม",
    isSystem: false,
    status: "active",
    badgeColor: "slate",
    permissions: [
      ...getModulePermissionKeys("reports"),
      "users.view",
      "courses.view",
      "lessons.view",
    ],
  },
];

// รายชื่อเจ้าหน้าที่เริ่มต้นในระบบ
export const INITIAL_STAFF = [
  {
    id: "staff_1",
    name: "กฤษฎา วงศ์สวัสดิ์",
    email: "superadmin@elearning.ac.th",
    roleId: "super_admin",
    status: "active",
    createdAt: "2026-01-15",
    customPermissions: {},
  },
  {
    id: "staff_2",
    name: "ชนิกานต์ รัตนเดช",
    email: "chanikan.r@elearning.ac.th",
    roleId: "admin",
    status: "active",
    createdAt: "2026-02-01",
    customPermissions: {},
  },
  {
    id: "staff_3",
    name: "ธนภัทร สุขสมบูรณ์",
    email: "thanapat.s@elearning.ac.th",
    roleId: "user_manager",
    status: "active",
    createdAt: "2026-03-10",
    customPermissions: {
      "users.reset_password": true,
      "security.session_manage": true,
    },
  },
  {
    id: "staff_4",
    name: "พิมพิกา อัครมงคล",
    email: "pimpika.a@elearning.ac.th",
    roleId: "course_manager",
    status: "active",
    createdAt: "2026-04-18",
    customPermissions: {},
  },
  {
    id: "staff_5",
    name: "วรเมธ เกียรติสกุล",
    email: "worameth.k@elearning.ac.th",
    roleId: "content_staff",
    status: "inactive",
    createdAt: "2026-05-22",
    customPermissions: {},
  },
  {
    id: "staff_6",
    name: "สุชาวดี แสงประทีป",
    email: "suchawadee.s@elearning.ac.th",
    roleId: "report_viewer",
    status: "active",
    createdAt: "2026-06-05",
    customPermissions: {},
  },
];

// ประวัติการเปลี่ยนแปลงเริ่มต้น (Audit Log)
export const INITIAL_AUDIT_LOGS = [
  {
    id: "log_1",
    operator: "Super Admin",
    action: "แก้ไขสิทธิ์รายบุคคล",
    target: "ธนภัทร สุขสมบูรณ์ (เจ้าหน้าที่จัดการผู้ใช้งาน)",
    details: "เปิดสิทธิ์พิเศษ: จัดการเซสชัน (security.session_manage)",
    timestamp: "2026-09-22 14:30:15",
  },
  {
    id: "log_2",
    operator: "Super Admin",
    action: "เปลี่ยนบทบาท",
    target: "พิมพิกา อัครมงคล",
    details: "เปลี่ยนบทบาทเป็น เจ้าหน้าที่จัดการคอร์ส",
    timestamp: "2026-09-21 11:20:00",
  },
  {
    id: "log_3",
    operator: "Super Admin",
    action: "เพิ่มเจ้าหน้าที่",
    target: "สุชาวดี แสงประทีป",
    details: "สร้างบัญชีเจ้าหน้าที่บทบาท เจ้าหน้าที่ดูรายงาน",
    timestamp: "2026-09-20 09:15:42",
  },
  {
    id: "log_4",
    operator: "Super Admin",
    action: "ปิดการใช้งาน",
    target: "วรเมธ เกียรติสกุล",
    details: "ระงับการเข้าสู่ระบบของเจ้าหน้าที่ชั่วคราว",
    timestamp: "2026-09-18 16:45:10",
  },
];
