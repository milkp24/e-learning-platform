# รายงานการเปรียบเทียบ Feature List กับข้อกำหนดความต้องการซอฟต์แวร์ (Feature List vs SRS v2.4)

> **โครงการ:** แพลตฟอร์มการเรียนรู้ผ่านสื่ออิเล็กทรอนิกส์ (E-Learning Platform)  
> **เอกสารอ้างอิง:** Software Requirements Specification (SRS) เวอร์ชัน 2.4 (Phase 2), วันที่ 15 กันยายน 2026  
> **เกณฑ์การเปรียบเทียบ:** Feature List 10 Modules (61 รายการ) เทียบกับ SRS และการกระจายขอบเขตงาน (Phase 1 vs Phase 2)

---

## 1. บทวิเคราะห์การจัดสรรขอบเขตงานตาม SRS (Scope Allocation Analysis)

จากเอกสาร SRS v2.4 หัวข้อ 1.2 ได้มีการแบ่งขอบเขตการพัฒนาโครงการออกเป็นระยะอย่างชัดเจน ดังนี้:

### 1.1 ขอบเขตงาน Phase 1 (SRS ข้อ 1.2.1, 4.1 - 4.4)
1. **Authentication & Access Control Security:** สมัครสมาชิก, เข้าสู่ระบบด้วย JWT, การควบคุมเซสชัน (Inactivity Timeout), จำกัดเวลาใช้งาน Guest, จัดการโปรไฟล์และรหัสผ่าน, ตรวจสอบอายุสิทธิ์การใช้งาน และการบริหารจัดการบทบาทผู้ใช้ (RBAC)
2. **LMS Core & Content Management:** โครงสร้างหลักสูตรแบบลำดับขั้น (Course → Chapter → Episode → Content), คลังสื่อ Multi-format (PDF, Video, YouTube Embed, Code), การลงทะเบียน และพื้นที่การเรียนรู้ (Learning Workspace)
3. **Admin System & Security Management:** บริหารจัดการ Users/Roles, ตั้งค่าระบบ Config Panel (Timeout), Security Audit Logs, การป้องกัน Super Admin และระบบล้างข้อมูลประวัติอัตโนมัติ

### 1.2 ขอบเขตงาน Phase 2 (SRS ข้อ 1.2.2, 4.5)
1. **Exercise & Interactive Task System:** แบบฝึกหัดทบทวนทักษะหลังเรียน รองรับจับคู่ (Matching), เรียงลำดับ (Ordering) และสร้างระบบ IoT (Module 8.1)
2. **Post-Lesson Quiz System:** ระบบแบบทดสอบประเมินผลท้ายบทเรียน (Module 8.2)
3. **Quiz Condition & Configuration Management:** จำกัดเวลา (Time Limit), จำกัดจำนวนครั้ง (Attempt Limit), เกณฑ์คะแนนผ่านขั้นต่ำ (Passing Score) (Module 8.3)
4. **Results & Feedback Processing:** ระบบตรวจข้อสอบอัตโนมัติบนเซิร์ฟเวอร์ (Server-side Auto-grading), คำนวณคะแนน และแสดงคำอธิบายเฉลย (Module 8.4)
5. **Progress & Lesson Unlocking:** คำนวณเปอร์เซ็นต์ความก้าวหน้า (% Progress) และปลดล็อกบทเรียนถัดไปเมื่อสอบผ่าน (Module 4.1, 4.2)
6. **Exercise XP Reward:** มอบ XP สะสมแบบครั้งเดียว ป้องกันการฟาร์ม XP ซ้ำ (Module 5.1)

### 1.3 ขอบเขตนอกเหนือ Phase 1 และ Phase 2 (Phase 3 / Future Scope)
* **Module 3 (Streaming):** ถ่ายทอดสดผ่านเว็บ, ตาราง Live, แชต, บันทึกการสอนย้อนหลัง, สิทธิ์ไมโครโฟน
* **Module 7 (Virtual Simulator / Lab):** พื้นที่ต่อวงจร Drag & Drop, จำลองเซนเซอร์และ Actuator แบบ Real-time
* **Module 5.2 - 5.7 (Advanced Gamification):** ระบบ Level Progression, Badge/Achievement, Streak, Leaderboard, Standalone Missions, Rewards
* **Module 6 (Story Framework):** เครื่องมือกำหนดฉาก แผนที่ และไดอะล็อกโดยผู้สอน
* **Module 10 (AI Assistant):** แชตบอตผู้ช่วย AI และการตั้งค่า Token Limit

---

## 2. ตารางเปรียบเทียบ Feature List vs SRS (ครบถ้วน 61 รายการ)

| Feature ID | ชื่อฟีเจอร์ตาม Feature List | สอดคล้องกับ SRS Section | Requirement ID / นิยามใน SRS | ขอบเขตตาม SRS | สถานะความสอดคล้อง | ข้อวิเคราะห์และข้อค้นพบเชิงเทคนิค |
|:---:|:---|:---:|:---|:---:|:---:|:---|
| **1.1** | สมัครสมาชิก | SRS 4.1, 5.5.1 | REQ-AUTH-01 (สมัครสมาชิกผ่านอีเมล/รหัสผ่าน) | Phase 1 | **ตรงตามสเปค 100%** | มี Endpoint `/api/v1/auth/register`, Hash รหัสผ่าน scrypt, บันทึกลง `users` |
| **1.2** | เข้าสู่ระบบ | SRS 4.1, 5.3.1, 5.5.1 | REQ-AUTH-02 (ล็อกอิน, ออก Access Token 15 นาที + Refresh Token 7 วัน) | Phase 1 | **ตรงตามสเปค 100%** | รองรับ Stateless JWT + Stateful Rotation ใน `refresh_tokens` |
| **1.3** | ออกจากระบบ | SRS 4.1, 5.3.1 | REQ-AUTH-03 (เพิกถอน Token และบันทึก Blocklist) | Phase 1 | **ตรงตามสเปค 100%** | มีตาราง `token_blocklist`, ล้างคุกกี้ และเพิกถอนใน DB ถาวร |
| **1.4** | ลืม/รีเซ็ตรหัสผ่าน | SRS 4.1, 5.3.1 | REQ-AUTH-04 (รีเซ็ตรหัสผ่าน One-time token 15 นาที ผ่านอีเมล) | Phase 1 | **ตรงตามสเปค 100%** | จัดเก็บ SHA-256 Hash ใน `password_reset_tokens` ส่งผ่าน SMTP จริง |
| **1.5** | จัดการโปรไฟล์ | SRS 4.1, 3.0 | REQ-USER-01 (ดูและแก้ไขข้อมูลส่วนตัว อัปโหลดภาพ) | Phase 1 | **ตรงตามสเปค 100%** | ตาราง `user_profiles`, API `/api/v1/users/me/profile`, หน้า UI Profile |
| **1.6** | เปลี่ยนรหัสผ่าน | SRS 4.1, 4.4 | REQ-USER-02 (เปลี่ยนรหัสผ่านตนเอง พร้อม Audit Log) | Phase 1 | **ตรงตามสเปค 100%** | เปลี่ยนรหัสผ่านสำเร็จ เพิกถอน Refresh Token เดิมทั้งหมด |
| **1.7** | กำหนดอายุสิทธิ์การใช้งาน | SRS 4.1, 4.4, 5.3.1 | REQ-AUTH-05 (ตรวจสอบอายุสิทธิ์บัญชี, ตัดเซสชัน Inactivity Timeout) | Phase 1 | **ความหมายซ้อนทับ (Partial)** | **ประเด็นสำคัญ:** การตัด Session Inactivity Timeout (30 น.) ทำงานสมบูรณ์ (UAT-015) แต่การตัดสิทธิ์ตามวันหมดอายุบัญชี (`user_access.expires_at`) มีเฉพาะใน Model ยังไม่มี API/UI ใช้งานจริง |
| **1.8** | จัดการบัญชีผู้ใช้ | SRS 4.3 | REQ-ADM-01 (เพิ่ม แก้ไข ระงับ ลบ ผู้ใช้งาน) | Phase 1 | **ตรงตามสเปค 100%** | มี API `/api/v1/admin/users`, หน้า UI จัดการ, ป้องกัน Super Admin |
| **1.9** | การจัดการสิทธิ์และการเข้าถึง | SRS 3.0, 4.3, 5.3.1 | REQ-RBAC-01 (กำหนด Role และ Permission Matrix) | Phase 1 | **ตรงตามสเปค 100%** | มี Role Matrix 37 สิทธิ์, ตาราง `role_permissions`, บล็อกสิทธิ์ Admin |
| **2.1** | บริหารจัดการหลักสูตรและโครงสร้าง | SRS 4.2 | REQ-LMS-01 (สร้าง แก้ไข ลบ จัดการบทเรียน Chapter/Episode) | Phase 1 | **ตรงตามสเปค 100%** | โครงสร้าง 4 ระดับ `Course -> Chapter -> Lesson -> Episode` สมบูรณ์ |
| **2.2** | การลงทะเบียนเข้าเรียน | SRS 4.2 | REQ-LMS-02 (ระบบลงทะเบียนเรียนตามสิทธิ์) | Phase 1 | **ตรงตามสเปค 100%** | ตาราง `classroom_members`, API `/join`, ตรวจสอบการลงทะเบียน |
| **2.3** | จัดการคลังสื่อและเนื้อหาบทเรียน | SRS 4.2, 5.2.1 | REQ-LMS-03 (สื่อ Multi-format: PDF, Video, YouTube, Code) | Phase 1 | **ตรงตามสเปค 100%** | ตาราง `contents` รองรับ Dual-Pointer และ YouTube Safe Embed |
| **2.3.1** | อัปโหลดไฟล์สื่อ | SRS 4.2, 5.2.1 | REQ-MED-01 (อัปโหลดรูปภาพ, วิดีโอ, PDF) | Phase 1 | **ตรงตามสเปค 100%** | มี Blueprint `/api/v1/media/upload`, รองรับ MIME type และจัดเก็บไฟล์ |
| **2.3.2** | จัดการไฟล์ | SRS 4.2 | REQ-MED-02 (ดู แก้ไข ลบไฟล์สื่อ) | Phase 1 | **ตรงตามสเปค 100%** | MediaService รองรับการเข้าถึงและจัดการไฟล์ |
| **2.3.3** | เพิ่มเนื้อหา Text / Code | SRS 4.2 | REQ-LMS-04 (เนื้อหาโค้ดและข้อความประกอบบทเรียน) | Phase 1 | **ตรงตามสเปค 100%** | มี Sanitizer แยกประเภท ไม่ลบ HTML tag ในโค้ด แต่กรอง XSS ใน Text |
| **2.4** | ติดตามผลและดูสรุปคะแนนผู้เรียน | SRS 4.5 | REQ-PROG-01 (สรุปผลคะแนนแบบฝึกหัด/ภารกิจ) | Phase 2 Scope | **ข้อขัดแย้งในเอกสารเดิม** | ใน Phase 1 เดิม รหัสนี้ถูกใช้กับ **Learning Journal** (`journals.py`) แต่ใน Feature List หมายถึง **Progress/Grade Tracking** ซึ่งจัดอยู่ใน Phase 2 |
| **2.5** | บันทึกการเข้าเรียน | SRS 4.4, 5.3.1 | REQ-DATA-01 (บันทึกเวลา สถานะ และ Session Log) | Phase 1 / 2 | **พบโค้ดบางส่วน** | มี Model `LearningActivity`, แต่ไม่มีหน้าจอแสดงประวัติการเข้าเรียนรายบุคคล |
| **2.6** | รายงานสถิติภาพรวมหลักสูตร | SRS 4.3 | REQ-ADM-04 (Dashboard สถิติภาพรวม) | Phase 1 | **พบโค้ดบางส่วน** | หน้า `/admin/reports` เป็น Limitation Banner ยังไม่มี Export จริง |
| **2.7** | ประเมินและให้คะแนนบทเรียน | - | - | Out of Scope | **ไม่พบในโค้ด** | ไม่มีใน SRS และไม่มี Model/API ในระบบ |
| **2.8** | บริหารจัดการผลประเมินและรีวิว | - | - | Out of Scope | **ไม่พบในโค้ด** | ไม่มีใน SRS และไม่มี Model/API ในระบบ |
| **3.1 - 3.6** | ระบบสตรีมมิ่ง (สด, ตาราง, แชต, บันทึก, ไมค์, แจ้งเตือน) | SRS 5.2.2 | ระบุชัดเจนว่า "Live Classroom/WebRTC ยังไม่รวมอยู่ในขอบเขต" | Out of Scope | **อยู่นอก Scope (มีเฉพาะ Model)** | มี Model ใน `streaming.py` แต่ไม่มี Backend Streaming Server จริง |
| **4.1** | แสดงความก้าวหน้าการเรียน | SRS 4.5, 5.5.7 | REQ-E2E-01 (คำนวณ % Progress รายบทเรียน และปลดล็อก) | Phase 2 Scope | **Implement แล้วใน Phase 2** | ในตารางลง "ยังไม่เริ่ม 0%" แต่ในโค้ดจริงมี Model `LearningProgress` และคำนวณ Progress อัตโนมัติใน Quiz/Exercise Service |
| **4.2** | ปลดล็อกทักษะ | SRS 4.5 | REQ-E2E-02 (ปลดล็อกเนื้อหา/ทักษะเมื่อสอบผ่าน) | Phase 2 Scope | **Implement แล้วใน Phase 2** | มี Model `Skill`, `UserSkill` และมีตรรกะปลดล็อกใน `QuizService` |
| **4.3** | สรุปผลการเรียน | - | - | Out of Scope | **พบเฉพาะ Model** | มี Model `LearningSummary` ใน `progress.py` แต่ไม่มีหน้ารายงานเฉพาะ |
| **5.1** | ระบบคะแนน XP | SRS 4.5 | REQ-GAM-01 (ให้ XP จากการทำแบบฝึกหัด ป้องกันปั๊มแต้ม) | Phase 2 Scope | **Implement แล้วใน Phase 2** | ตารางลง "ยังไม่เริ่ม 0%" แต่มีโค้ดจริงใน `ExerciseService` + Anti-farming |
| **5.2 - 5.7** | Gamification (Level, Badge, Streak, Leaderboard, Mission, Rewards) | SRS 5.3.1 | ไม่ได้ระบุเป็น Core Requirement ใน Phase 1 & 2 | Out of Scope | **พบเฉพาะ Model** | มีโครงสร้างตารางครบใน `gamification.py` แต่ไม่มี Engine ประมวลผล |
| **6.1** | ตัวจัดการฉากและไดอะล็อก (Story Framework) | SRS 4.5 | ไม่ได้กำหนดเป็นระบบสร้างไดนามิก | Out of Scope | **พบเฉพาะ Model + Seed Data** | มี Model ใน `story.py`, แสดงผลเฉพาะในคอร์สตัวอย่าง IoT 101 |
| **6.2** | ระบบรับ-ส่งภารกิจ (Mission Trigger) | SRS 4.5 | เชื่อมโยงกับ Interactive Task ใน Phase 2 | Out of Scope | **พบเฉพาะ Component** | มี `MissionActivity.jsx` ใน Exercise แต่ไม่มีระบบกักกันก่อนเข้า Lab |
| **6.3** | บันทึกความคืบหน้าของฉากเนื้อเรื่อง | - | - | Out of Scope | **พบเฉพาะ Model** | มี Model `StoryProgress` ใน `story.py` |
| **7.1 - 7.4** | Simulator / Virtual Lab | SRS 5.2.2 | ระบุชัดเจนว่า "Sandbox ภายนอก ยังไม่รวมอยู่ในขอบเขต" | Out of Scope | **อยู่นอก Scope (มีเฉพาะ Model)** | มี Model ใน `virtuallab.py`, หน้าระบบแสดงเป็น Mockup |
| **8.1** | แบบฝึกหัด Matching, Ordering, IoT Build | SRS 1.2.2, 4.5 | REQ-EX-01 (แบบฝึกหัดทบทวนทักษะ 3 รูปแบบ) | Phase 2 Scope | **Implement แล้วใน Phase 2** | มีโค้ดสมบูรณ์ทั้ง Frontend Builder/Player และ Backend Grading API |
| **8.2** | แบบทดสอบท้ายบทเรียน | SRS 1.2.2, 4.5 | REQ-QZ-01 (แบบทดสอบประเมินผลท้ายบท) | Phase 2 Scope | **Implement แล้วใน Phase 2** | รองรับ 5 รูปแบบคำถาม มีระบบคลังข้อสอบและ Take Exam UI |
| **8.3** | เงื่อนไขแบบทดสอบ (เวลา, จำนวนครั้ง, คะแนนผ่าน) | SRS 1.2.2, 4.5 | REQ-QZ-02 (Quiz Configuration Management) | Phase 2 Scope | **Implement แล้วใน Phase 2** | ตรวจสอบเงื่อนไข Time Limit และ Attempt Limit บน Server 100% |
| **8.4** | แสดงผลคะแนน, Feedback และคำอธิบาย | SRS 1.2.2, 4.5 | REQ-QZ-03 (Auto-Grading & Feedback Review) | Phase 2 Scope | **Implement แล้วใน Phase 2** | ซ่อนเฉลยฝั่ง Backend (Sanitized) และส่ง Feedback หลังตรวจเสร็จ |
| **9.1** | จัดการบัญชีผู้ใช้และสิทธิ์ | SRS 4.3 | REQ-ADM-01 (เพิ่ม แก้ไข ระงับ ลบ กำหนด Role) | Phase 1 | **ตรงตามสเปค 100%** | มี UI และ API สมบูรณ์ พร้อมระบบ Self-Protection ของ Super Admin |
| **9.2** | การจัดการโรงเรียน ห้องเรียน และสมาชิก | SRS 4.3 | REQ-ADM-02 (จัดการข้อมูลโรงเรียนและห้องเรียน) | Phase 1 | **ตรงตามสเปค 100%** | มี API `/api/v1/admin/schools` และ UI School Management |
| **9.3** | จัดการและกำกับดูแลบทเรียน | SRS 4.3 | REQ-ADM-03 (ตรวจสอบ อนุมัติ ปิดการมองเห็นบทเรียน) | Phase 1 | **ตรงตามสเปค 100%** | ปรับเปลี่ยนสถานะ Course/Lesson `published/draft/archived` |
| **9.4** | จัดการคลังข้อสอบภาพรวม | SRS 4.5 | REQ-QZ-04 (Quiz Bank Overview) | Phase 2 Scope | **Implement แล้วใน Phase 2** | มีหน้า Admin Quizzes (`/admin/quizzes`) แสดงคลังข้อสอบภาพรวม |
| **9.5** | จัดการภารกิจภาพรวม | - | - | Out of Scope | **UI Mockup** | หน้า `/admin/missions` แสดง Mock Data ยังไม่มี Backend Route |
| **9.6** | จัดการคลัง Interactive Components | SRS 4.2 | REQ-LMS-05 (Dynamic Templates & Interactive Components) | Phase 1 | **พบเฉพาะ Model** | มี Model `InteractiveComponent` ใน `admin.py` |
| **9.7** | Dashboard ภาพรวมทั้งแพลตฟอร์ม | SRS 4.3 | REQ-ADM-04 (Dashboard สถิติภาพรวมระบบ) | Phase 1 | **ตรงตามสเปค 100%** | มี Endpoint `/api/v1/admin/dashboard/*` แสดงสถิติจริง |
| **9.8** | จัดการระบบแจ้งเตือนและประกาศ | - | - | Out of Scope | **พบเฉพาะ Model** | มี Model `Announcement`, `Notification` ใน `admin.py` |
| **9.9** | ตั้งค่าระบบการเรียน Gamification & Notification | SRS 4.3 | REQ-ADM-05 (System Config Panel) | Phase 1 | **พบโค้ดบางส่วน** | ปรับแต่ง Timeout ได้จริง แต่ยังไม่มีแถบตั้งค่า Gamification |
| **9.10** | Security (จัดการนโยบายความปลอดภัย) | SRS 4.3, 4.4, 5.3 | REQ-SEC-01 (Security Overview & Policies) | Phase 1 | **Implement แล้วใน Phase 1** | ในตารางลง "ยังไม่เริ่ม 0%" แต่มีหน้าจอ `/admin/security` และ API ครบถ้วน |
| **9.11** | Audit Log | SRS 4.3, 4.4, 5.3.1 | REQ-SEC-02 (Security Audit Logs) | Phase 1 | **ตรงตามสเปค 100%** | มีตาราง `audit_logs`, API `/admin/audit-logs`, โมดอลค้นหาและฟิลเตอร์ |
| **9.12** | Backup / Recovery | SRS 4.4 | REQ-SEC-03 (สำรองและกู้คืนข้อมูล) | Out of Scope | **พบเฉพาะ Model** | ในระบบไม่มี UI และ Route (UAT รายงานสถานะเป็น NOT FOUND) |
| **9.13** | Maintenance Mode | SRS 2.2.2 | REQ-SYS-01 (โหมดบำรุงรักษาระบบ) | Out of Scope | **พบเฉพาะ Model** | มี Key ใน `SystemSetting` แต่ไม่มี Middleware ตัดการทำงานผู้ใช้ |
| **10.1** | AI Assistant | SRS 5.2.2 | ระบุชัดเจนว่า "External AI Engine ยังไม่รวมอยู่ในขอบเขต" | Out of Scope | **อยู่นอก Scope (มีเฉพาะ Model)** | มี Model ใน `ai.py` แต่ไม่มีการเชื่อมต่อ LLM ภายนอก |
| **10.2** | การตั้งค่าระบบผู้ช่วย AI | SRS 5.2.2 | - | Out of Scope | **อยู่นอก Scope (มีเฉพาะ Model)** | มี Model `AIConfiguration` ใน `ai.py` แต่ไม่มี API/UI ควบคุม |

---

## 3. สรุปประเด็นความขัดแย้งและการจัดการ (Resolution of Architectural Discrepancies)

### ประเด็นที่ 1: ความขัดแย้งของ Feature 2.4 (Journal vs Learning Progress)
* **ข้อเท็จจริง:** ในเอกสาร Feature List ต้นฉบับ Feature 2.4 ถูกระบุว่า *"ติดตามผลและดูสรุปคะแนนผู้เรียน (ติดตามความก้าวหน้ารายบุคคล ดูผลคะแนนอัตโนมัติจากแบบฝึกหัด/ภารกิจ)"* แต่ในเอกสารสรุปการพัฒนารุ่นแรกและรายงาน UAT-031 ถึง UAT-033 Feature 2.4 ถูกเรียกแทนด้วย **Learning Journal (สมุดบันทึกการเรียนรู้)**
* **ข้อตัดสินใจ:** ตาราง `journals` และฟังก์ชัน Learning Journal ได้รับการรับรองในฐานะ Supporting Feature (ตาม `DATABASE_MAPPING_DECISIONS.md` Decision 4) ส่วนการติดตามความก้าวหน้าถูกแยกไปอยู่ใน Module 4 (Feature 4.1) และ Module 8 เพื่อไม่ให้โค้ดส่วนของ Journal สูญหาย

### ประเด็นที่ 2: ความสัมพันธ์ของ Feature 1.7 กับ Account Validity, Session, Token และ Timeout
* **Session Inactivity Timeout (30 นาที สำหรับ Student / 15 นาที สำหรับ Guest):** มีการ Implement และทดสอบผ่านจริงทั้ง Client Hook (`useIdleTimeout.js`) และการปรับค่าผ่าน Admin Panel (`SystemSetting`) (UAT-015, UAT-035)
* **JWT Token Lifespan (15 นาที Access Token, 7 วัน Refresh Token Rotation):** มีการ Implement และทดสอบผ่านจริง (UAT-011, UAT-014)
* **Account Validity Expiration (การหมดอายุบัญชีผู้ใช้):** มีเฉพาะคอลัมน์ `expires_at` ในตาราง `user_access` แต่ยังไม่มี API หรือ Cron Job ที่ทำการตรวจสอบและล้างข้อมูลผู้ใช้อัตโนมัติตาม SRS ข้อ 4.4 ดังนั้นสถานะของข้อนี้จึงเป็น **"พบโค้ดบางส่วน แต่ยังไม่ได้ทดสอบในส่วน Account Lifetime"**

### ประเด็นที่ 3: การแยกหลักฐานระหว่าง Phase 1 และ Phase 2
* ชุดทดสอบใน `test_uat_exercise_suite.py`, `test_uat_exam_suite.py`, `test_exam_progress_unlock_stability.py` เป็นหลักฐานการทำงานของ **Phase 2 (Module 4 และ Module 8)** จึงต้องไม่นำมาเหมารวมเป็นหลักฐานผ่านของ Phase 1 Core (Module 1, 2, 9) แม้ว่าจะอยู่ใน Repository เดียวกัน
