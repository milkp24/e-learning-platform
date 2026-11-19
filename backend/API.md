# E-learning Platform — REST API Documentation

ระบบ API สำหรับ **Interactive Web-Based Programming Learning Platform** พัฒนาด้วย Python + Flask รองรับสถาปัตยกรรม RESTful API, การยืนยันตัวตนด้วย JSON Web Tokens (JWT) และการควบคุมสิทธิ์ตามบทบาท (Role-Based Access Control - RBAC)

---

## สารบัญ

1. [ข้อมูลทั่วไปและการยืนยันตัวตน (Overview & Authentication)](#1-ข้อมูลทั่วไปและการยืนยันตัวตน)
2. [ระบบยืนยันตัวตนและจัดการบัญชี (Authentication & Account)](#2-ระบบยืนยันตัวตนและจัดการบัญชี)
3. [โปรไฟล์ผู้ใช้และสถิติภาพรวม (User Profile & Dashboard)](#3-โปรไฟล์ผู้ใช้และสถิติภาพรวม)
4. [ระบบบทบาทและสิทธิ์การเข้าถึง (Roles & Dynamic Permission Matrix)](#4-ระบบบทบาทและสิทธิ์การเข้าถึง)
5. [การจัดการคอร์สเรียน (Classrooms & Courses)](#5-การจัดการคอร์สเรียน)
6. [บทเรียน ตอนย่อย และเนื้อหา (Lessons, Episodes & Contents)](#6-บทเรียน-ตอนย่อย-และเนื้อหา)
7. [บันทึกการเรียนรู้ (Learning Journals)](#7-บันทึกการเรียนรู้)
   * [7.1 แบบทดสอบและการประมวลผลข้อสอบ (Quizzes & Examination Engine)](#71-แบบทดสอบและการประมวลผลข้อสอบ-quizzes--examination-engine)
8. [มัลติมีเดียและไฟล์แนบ (Media Uploads)](#8-มัลติมีเดียและไฟล์แนบ)
9. [การบริหารจัดการระบบและสถิติผู้ดูแลระบบ (Admin & Governance)](#9-การบริหารจัดการระบบและสถิติผู้ดูแลระบบ)
10. [การจัดการโรงเรียนและสถาบัน (School Management)](#10-การจัดการโรงเรียนและสถาบัน)
11. [รหัสสถานะและการจัดการข้อผิดพลาด (Status Codes & Errors)](#11-รหัสสถานะและการจัดการข้อผิดพลาด)

---

## 1. ข้อมูลทั่วไปและการยืนยันตัวตน

* **Base URL**: `http://localhost:5000/api/v1`
* **Default Port**: `5000` (Flask Backend)
* **Response Format**: `application/json; charset=utf-8`
* **CORS Allowed Origins**: `http://localhost:5173`, `http://127.0.0.1:5173`

### การส่ง Token ยืนยันตัวตน (JWT Authentication)

เมื่อผู้ใช้เข้าสู่ระบบสำเร็จ Client จะได้รับ `access_token` (อายุ 30 นาที) ให้นำมาแนบใน HTTP Header:

```http
Authorization: Bearer <access_token>
```

และได้รับ `refresh_token` ผ่าน **HttpOnly Cookie** (`refresh_token_cookie`) ซึ่งมีความปลอดภัยสูงจากการโจมตีประเภท XSS

---

## 2. ระบบยืนยันตัวตนและจัดการบัญชี

### 2.1 ตรวจสอบสถานะเซิร์ฟเวอร์ (Health Check)
* **Method**: `GET`
* **URL**: `/`
* **Auth**: ไม่ต้องระบุ (Public)
* **Response (200 OK)**:
  ```json
  {
    "message": "E-Learning API is running",
    "status": "healthy"
  }
  ```

### 2.2 ลงทะเบียนผู้ใช้ใหม่ (Register)
* **Method**: `POST`
* **URL**: `/api/v1/auth/register`
* **Auth**: ไม่ต้องระบุ (Public)
* **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "Password123!",
    "display_name": "Somchai Jaidee",
    "role": "student"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "message": "ลงทะเบียนสำเร็จ",
    "user": {
      "id": "uuid-v4",
      "email": "student@example.com",
      "display_name": "Somchai Jaidee",
      "role": "student"
    }
  }
  ```

### 2.3 เข้าสู่ระบบ (Login)
* **Method**: `POST`
* **URL**: `/api/v1/auth/login`
* **Auth**: ไม่ต้องระบุ (Public)
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "เข้าสู่ระบบสำเร็จ",
    "access_token": "jwt-token-string",
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "display_name": "Somchai Jaidee",
      "role": "student",
      "roles": ["student"],
      "isSuperAdmin": false
    }
  }
  ```
  *(แนบ Set-Cookie: refresh_token_cookie=...; HttpOnly; SameSite=Lax)*

### 2.4 ต่ออายุ Access Token (Refresh Token)
* **Method**: `POST`
* **URL**: `/api/v1/auth/refresh`
* **Auth**: ผ่าน HttpOnly Cookie (`refresh_token_cookie`)
* **Response (200 OK)**:
  ```json
  {
    "access_token": "new-jwt-token-string"
  }
  ```

### 2.5 ออกจากระบบ (Logout)
* **Method**: `POST`
* **URL**: `/api/v1/auth/logout`
* **Auth**: `Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  {
    "message": "ออกจากระบบสำเร็จ"
  }
  ```

### 2.6 ดึงข้อมูลผู้ใช้ปัจจุบัน (Get Current User / Auth Me)
* **Method**: `GET`
* **URL**: `/api/v1/auth/me`
* **Auth**: `Bearer <access_token>`
* **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "uuid-v4",
      "email": "user@example.com",
      "display_name": "Somchai Jaidee",
      "roles": ["student"],
      "primary_role": "student",
      "isSuperAdmin": false,
      "profile_image": null
    }
  }
  ```

### 2.7 เปลี่ยนรหัสผ่านขณะล็อกอิน (Change Password)
* **Method**: `POST`
* **URL**: `/api/v1/auth/change-password`
* **Auth**: `Bearer <access_token>`
* **Request Body**:
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewPassword123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "เปลี่ยนรหัสผ่านสำเร็จ"
  }
  ```

### 2.8 ขอลิงก์รีเซ็ตรหัสผ่าน (Forgot Password)
* **Method**: `POST`
* **URL**: `/api/v1/auth/forgot-password`
* **Auth**: ไม่ต้องระบุ (Public)
* **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "หากมีอีเมลนี้ในระบบ ระบบจะจัดส่งคำแนะนำในการตั้งรหัสผ่านใหม่ไปให้"
  }
  ```

### 2.9 ตั้งรหัสผ่านใหม่ผ่านโทเคน (Reset Password)
* **Method**: `POST`
* **URL**: `/api/v1/auth/reset-password`
* **Auth**: ไม่ต้องระบุ (Public)
* **Request Body**:
  ```json
  {
    "token": "reset-token-received-via-email",
    "new_password": "NewSecurePassword123!"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "ตั้งรหัสผ่านใหม่สำเร็จ สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที"
  }
  ```

---

## 3. โปรไฟล์ผู้ใช้และสถิติภาพรวม

### 3.1 ข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน
* **Method**: `GET`
* **URL**: `/api/v1/users/me`
* **Auth**: `Bearer <access_token>`

### 3.2 อัปเดตข้อมูลโปรไฟล์
* **Method**: `PUT`
* **URL**: `/api/v1/users/me/profile`
* **Auth**: `Bearer <access_token>`
* **Request Body**:
  ```json
  {
    "display_name": "New Name",
    "profile_image": "http://localhost:5000/api/v1/media/uploads/avatar.png"
  }
  ```

### 3.3 แดชบอร์ดภาพรวมผู้ใช้ (Unified User Dashboard)
* **Method**: `GET`
* **URL**: `/api/v1/users/me/dashboard`
* **Auth**: `Bearer <access_token>`

---

## 4. ระบบบทบาทและสิทธิ์การเข้าถึง

### 4.1 รายการบทบาททั้งหมดในระบบ
* **Method**: `GET`
* **URL**: `/api/v1/roles`
* **Auth**: `Bearer <access_token>` (Admin, Super Admin)

### 4.2 ตารางสิทธิ์ทั้งหมด (Dynamic Permission Matrix)
* **Method**: `GET`
* **URL**: `/api/v1/roles/matrix`
* **Auth**: `Bearer <access_token>` (Admin, Super Admin)
* **Response (200 OK)**:
  ```json
  {
    "matrix": {
      "student": ["course:read", "lesson:read", "journal:manage"],
      "instructor": ["course:create", "course:edit", "lesson:create", "media:upload"],
      "admin": ["user:manage", "course:manage", "school:manage"],
      "super_admin": ["*"]
    }
  }
  ```

### 4.3 ดึงสิทธิ์ของบทบาทที่กำหนด
* **Method**: `GET`
* **URL**: `/api/v1/roles/<role_identifier>/permissions`
* **Auth**: `Bearer <access_token>` (Admin, Super Admin)

### 4.4 แก้ไขสิทธิ์ของบทบาท (Update Role Permissions)
* **Method**: `PUT`
* **URL**: `/api/v1/roles/<role_identifier>/permissions`
* **Auth**: `Bearer <access_token>` (Super Admin Only)
* **Request Body**:
  ```json
  {
    "permissions": ["course:read", "course:create", "lesson:edit"]
  }
  ```

### 4.5 จัดการบทบาทรายบุคคล (User Roles)
* `GET /api/v1/users/<user_id>/roles`: ดูบทบาทของผู้ใช้
* `POST /api/v1/users/<user_id>/roles`: มอบหมายบทบาทเพิ่มเติม
* `DELETE /api/v1/users/<user_id>/roles/<role_name>`: ถอดถอนบทบาทของผู้ใช้

---

## 5. การจัดการคอร์สเรียน

### 5.1 สถิติแพลตฟอร์มสำหรับหน้าแรก (Platform Stats)
* **Method**: `GET`
* **URL**: `/api/v1/classrooms/platform-stats` (Alias: `/api/v1/classrooms/public/stats`)
* **Auth**: ไม่ต้องระบุ (Public)
* **Response (200 OK)**:
  ```json
  {
    "total_courses": 12,
    "total_learners": 150,
    "total_instructors": 5,
    "total_lessons": 48
  }
  ```

### 5.2 รายการคอร์สเรียน (List Classrooms)
* **Method**: `GET`
* **URL**: `/api/v1/classrooms`
* **Auth**: ไม่ต้องระบุ (Public) หรือระบุ Token
* **Query Parameters**:
  - `status`: `all` | `published` | `draft`
  - `page`: default `1`
  - `per_page`: default `10`
  - `search`: ค้นหาตามชื่อคอร์ส

### 5.3 สร้างคอร์สเรียนใหม่ (Create Classroom)
* **Method**: `POST`
* **URL**: `/api/v1/classrooms`
* **Auth**: `Bearer <access_token>` (Instructor, Admin, Super Admin)
* **Request Body**:
  ```json
  {
    "name": "Full-Stack Web Development with React & Python",
    "description": "คอร์สเรียนรู้การพัฒนาเว็บแบบครบวงจร",
    "level": "intermediate",
    "category": "Programming",
    "thumbnail_url": "https://example.com/thumb.jpg",
    "price": 0
  }
  ```

### 5.4 ดึงข้อมูลรายละเอียดคอร์ส
* **Method**: `GET`
* **URL**: `/api/v1/classrooms/<classroom_id>`
* **Auth**: Public / Authenticated

### 5.5 อัปเดตคอร์สเรียน
* **Method**: `PUT`
* **URL**: `/api/v1/classrooms/<classroom_id>`
* **Auth**: `Bearer <access_token>` (Owner Instructor หรือ Admin)

### 5.6 ลบคอร์สเรียน
* **Method**: `DELETE`
* **URL**: `/api/v1/classrooms/<classroom_id>`
* **Auth**: `Bearer <access_token>` (Owner Instructor หรือ Super Admin)

### 5.7 ลงทะเบียนเรียน (Self-Enrollment)
* **Method**: `POST`
* **URL**: `/api/v1/classrooms/<classroom_id>/join`
* **Auth**: `Bearer <access_token>` (Student)

### 5.8 รายการคอร์สที่ลงทะเบียนไว้ (My Enrollments)
* **Method**: `GET`
* **URL**: `/api/v1/classrooms/my-enrollments`
* **Auth**: `Bearer <access_token>` (Student)

### 5.9 แดชบอร์ดผู้สอน (Instructor Dashboard)
* **Method**: `GET`
* **URL**: `/api/v1/instructor/dashboard` (Alias: `/api/v1/classrooms/instructor/dashboard`)
* **Auth**: `Bearer <access_token>` (Instructor, Admin, Super Admin)

---

## 6. บทเรียน ตอนย่อย และเนื้อหา

ระบบจัดการเนื้อหาถูกแบ่งลำดับขั้นแบบ 3 ระดับ: **Chapter (Lesson) -> Episode -> Content Item**

### 6.1 ลำดับขั้น Chapter (Lesson)
* `GET /api/v1/classrooms/<classroom_id>/lessons`: แสดงรายการบทเรียนทั้งหมดในคอร์ส
* `POST /api/v1/classrooms/<classroom_id>/lessons`: สร้างบทเรียนใหม่
* `GET /api/v1/lessons/<lesson_id>`: ดึงข้อมูลบทเรียนพร้อมรายการ Episodes
* `PUT /api/v1/lessons/<lesson_id>`: แก้ไขบทเรียน
* `DELETE /api/v1/lessons/<lesson_id>`: ลบบทเรียน (ลบแบบ Cascade ทั้งหมด)

### 6.2 ลำดับขั้น ตอนย่อย (Episode)
* `GET /api/v1/lessons/<lesson_id>/episodes`: รายการตอนย่อยในบทเรียน
* `POST /api/v1/lessons/<lesson_id>/episodes`: สร้างตอนย่อยใหม่ (`title`, `sequence_no`)
* `GET /api/v1/episodes/<episode_id>`: รายละเอียดตอนย่อยพร้อมชิ้นเนื้อหาทั้งหมด
* `PUT /api/v1/episodes/<episode_id>`: แก้ไขตอนย่อย
* `DELETE /api/v1/episodes/<episode_id>`: ลบตอนย่อย

### 6.3 ลำดับขั้น เนื้อหา (Content Item)
* `GET /api/v1/episodes/<episode_id>/contents`: แสดงชิ้นเนื้อหาเรียงตาม `sequence_no`
* `POST /api/v1/episodes/<episode_id>/contents`: เพิ่มเนื้อหาใหม่
  - Supported Types: `video`, `document`, `code`, `text`
* `GET /api/v1/contents/<content_id>`: ดึงรายละเอียดเนื้อหา
* `PUT /api/v1/contents/<content_id>`: แก้ไขเนื้อหาพร้อม Type-Specific Sanitizer
* `DELETE /api/v1/contents/<content_id>`: ลบเนื้อหา

---

## 7. บันทึกการเรียนรู้

* `GET /api/v1/journals`: รายการบันทึกการเรียนรู้ของผู้ใช้ปัจจุบัน (รองรับ `page`, `per_page`)
* `POST /api/v1/journals`: บันทึกข้อความใหม่ (`title`, `content`, `tags`, `mood`)
* `GET /api/v1/journals/<journal_id>`: ดึงรายละเอียดบันทึก
* `PUT /api/v1/journals/<journal_id>`: แก้ไขบันทึก
* `DELETE /api/v1/journals/<journal_id>`: ลบบันทึก

---

## 7.1 แบบทดสอบและการประมวลผลข้อสอบ (Quizzes & Examination Engine)

ระบบประมวลผลข้อสอบฝั่งหลังบ้าน (Backend Evaluation Engine) รองรับคำถามประเภท Multiple Choice, Matching (Partial Credit), Ordering (Partial Credit) พร้อมระบบเกณฑ์ผ่าน และการตรวจคำตอบ/เฉลย

### 7.1.1 ดึงข้อมูลแบบทดสอบสำหรับผู้เรียน (Get Quiz for Taking)
* **Method**: `GET`
* **URL**: `/api/v1/quizzes/<quiz_id>` (Alias: `/api/v1/quiz/<quiz_id>`)
* **Auth**: `Bearer <access_token>` (Enrolled Student, Instructor, Admin)
* **Note**: ซ่อนข้อมูล `is_correct` ใน Options เพื่อความปลอดภัย ป้องกันข้อสอบรั่วไหล

### 7.1.2 เริ่มทำแบบทดสอบ (Start Quiz Attempt)
* **Method**: `POST`
* **URL**: `/api/v1/quizzes/<quiz_id>/attempts` (Alias: `/api/v1/quiz/<quiz_id>/start`)
* **Auth**: `Bearer <access_token>`
* **Response (201 Created / 200 OK)**:
  ```json
  {
    "message": "Quiz attempt started successfully.",
    "attempt": {
      "attempt_id": "uuid-v4",
      "quiz_id": "uuid-v4",
      "user_id": "uuid-v4",
      "status": "in_progress",
      "started_at": "2026-10-05T03:45:00.000000+00:00"
    }
  }
  ```

### 7.1.3 ส่งคำตอบและประมวลผลคะแนน (Submit Quiz)
* **Method**: `POST`
* **URL**: `/api/v1/quizzes/<quiz_id>/submit` (Alias: `/api/v1/quiz/<quiz_id>/submit`)
* **Auth**: `Bearer <access_token>`
* **Request Body**:
  ```json
  {
    "attempt_id": "uuid-v4 (optional)",
    "answers": [
      {
        "question_id": "uuid-v4",
        "option_id": "uuid-v4"
      },
      {
        "question_id": "uuid-v4",
        "matches": [
          {"left": "Python", "right": "Guido van Rossum"},
          {"left": "JavaScript", "right": "Brendan Eich"}
        ]
      },
      {
        "question_id": "uuid-v4",
        "ordered_option_ids": ["uuid-opt1", "uuid-opt2", "uuid-opt3"]
      }
    ]
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "ส่งแบบทดสอบและประมวลผลสำเร็จ",
    "attempt_id": "uuid-v4",
    "quiz_id": "uuid-v4",
    "user_id": "uuid-v4",
    "score": 3.0,
    "total_score": 3.0,
    "percentage": 100.0,
    "passing_score": 70.0,
    "is_passed": true,
    "feedback": "ยินดีด้วย! คุณผ่านแบบทดสอบด้วยคะแนน 100.00% (เกณฑ์ผ่าน 70.00%)",
    "submitted_at": "2026-10-05T03:45:30.000000+00:00",
    "questions_evaluated": 3
  }
  ```

### 7.1.4 ดูผลคะแนนล่าสุด / ราย Attempt (Get Quiz Result)
* **Method**: `GET`
* **URL**: `/api/v1/quizzes/<quiz_id>/result` (Alias: `/api/v1/quiz/<quiz_id>/result`)
* **URL (Specific Attempt)**: `/api/v1/quizzes/<quiz_id>/attempts/<attempt_id>`
* **Auth**: `Bearer <access_token>` (Attempt Owner, Instructor, Admin)

### 7.1.5 ตรวจคำตอบและเฉลยพร้อมคำอธิบาย (Answer Review)
* **Method**: `GET`
* **URL**: `/api/v1/quizzes/<quiz_id>/answer-review` (Aliases: `/api/v1/quiz/<quiz_id>/answer-review`, `/api/v1/quizzes/<quiz_id>/attempts/<attempt_id>/review`)
* **Auth**: `Bearer <access_token>` (Attempt Owner, Instructor, Admin)
* **Note**: แสดงเฉลยเฉพาะ Attempt ที่ส่งแล้วเสร็จสิ้นเท่านั้น (`status: completed`)

### 7.1.6 สร้างแบบทดสอบและเพิ่มคำถาม (Instructor & Admin Management)
* `GET  /api/v1/classrooms/<classroom_id>/quizzes`: รายการแบบทดสอบในคอร์ส
* `POST /api/v1/classrooms/<classroom_id>/quizzes`: สร้างแบบทดสอบใหม่สำหรับคอร์ส
* `POST /api/v1/quizzes/<quiz_id>/questions`: เพิ่มคำถามและตัวเลือกเข้าสู่แบบทดสอบ (รองรับ `multiple_choice`, `matching`, `ordering`)

---

## 8. มัลติมีเดียและไฟล์แนบ

### 8.1 อัปโหลดไฟล์ (Upload Media)
* **Method**: `POST`
* **URL**: `/api/v1/media/upload`
* **Auth**: `Bearer <access_token>`
* **Content-Type**: `multipart/form-data`
* **Form Field**: `file` (MP4, WebM, PDF, PNG, JPG, JPEG)
* **Response (201 Created)**:
  ```json
  {
    "message": "อัปโหลดไฟล์สำเร็จ",
    "filename": "uuid_original_name.mp4",
    "url": "http://localhost:5000/api/v1/media/uploads/uuid_original_name.mp4",
    "file_size": 1048576,
    "mime_type": "video/mp4"
  }
  ```

### 8.2 ให้บริการไฟล์มัลติมีเดีย (Serve / Stream Media)
* **Method**: `GET`
* **URL**: `/api/v1/media/uploads/<filename>`
* **Auth**: Public / Cache Control

---

## 9. การบริหารจัดการระบบและสถิติผู้ดูแลระบบ

### 9.1 ค่าตั้งค่าระบบสาธารณะ (Public Settings)
* **Method**: `GET`
* **URL**: `/api/v1/settings/public`
* **Auth**: Public

### 9.2 สถิติแอดมินทั่วไป (Admin Dashboard Stats)
* **Method**: `GET`
* **URL**: `/api/v1/admin/dashboard/admin-stats`
* **Auth**: `Bearer <access_token>` (Admin, Super Admin)

### 9.3 สถิติขั้นสูง Super Admin (Super Admin Stats)
* **Method**: `GET`
* **URL**: `/api/v1/admin/dashboard/superadmin-stats`
* **Auth**: `Bearer <access_token>` (Super Admin Only)

### 9.4 กิจกรรมรายวัน (Daily Active Users Trend)
* **Method**: `GET`
* **URL**: `/api/v1/admin/dashboard/daily-activity`
* **Auth**: `Bearer <access_token>` (Admin, Super Admin)

### 9.5 ภาพรวมการใช้งานตามช่วงเวลา (Usage Overview)
* **Method**: `GET`
* **URL**: `/api/v1/admin/usage-overview`
* **Auth**: `Bearer <access_token>` (Admin, Super Admin)
* **Query Parameters**: `range` (`today` | `7d` | `30d` | `custom`)

### 9.6 จัดการผู้ใช้งานในระบบ (Admin User Management)
* `GET /api/v1/admin/users`: ค้นหาและดูรายชื่อผู้ใช้ทั้งหมด (รองรับ `role`, `status`, `search`, `page`, `per_page`)
* `POST /api/v1/admin/users`: แอดมินสร้างบัญชีผู้ใช้ใหม่
* `GET /api/v1/admin/users/<user_id>`: ดูข้อมูลเชิงลึกของผู้ใช้
* `PATCH /api/v1/admin/users/<user_id>`: อัปเดตข้อมูลบัญชีและโปรไฟล์
* `PUT /api/v1/admin/users/<user_id>/roles`: อัปเดตชุดบทบาทของผู้ใช้
* `PUT /api/v1/admin/users/<user_id>/status`: ระงับหรือเปิดใช้งานบัญชี (`active` / `suspended`)
* `DELETE /api/v1/admin/users/<user_id>`: ลบบัญชีผู้ใช้

### 9.7 รายการเจ้าหน้าที่ระบบ (Staff List)
* **Method**: `GET`
* **URL**: `/api/v1/admin/staff`
* **Auth**: `Bearer <access_token>` (Super Admin Only)

### 9.8 ประวัติการกระทำในระบบ (Audit Logs)
* **Method**: `GET`
* **URL**: `/api/v1/admin/audit-logs`
* **Auth**: `Bearer <access_token>` (Super Admin Only)
* **Query Parameters**: `page`, `per_page`, `action`, `search`

### 9.9 ภาพรวมความปลอดภัย (Security Overview)
* **Method**: `GET`
* **URL**: `/api/v1/admin/security/overview`
* **Auth**: `Bearer <access_token>` (Super Admin Only)

### 9.10 การตั้งค่าระบบ (System Settings)
* `GET /api/v1/admin/settings`: ดึงค่าคอนฟิกทั้งหมดของระบบ (Super Admin Only)
* `PUT /api/v1/admin/settings`: บันทึกการแก้ไขคอนฟิกระบบ (Super Admin Only)

---

## 10. การจัดการโรงเรียนและสถาบัน

* `GET /api/v1/admin/schools`: รายชื่อโรงเรียน/สถาบันการศึกษา
* `POST /api/v1/admin/schools`: สร้างสถาบันใหม่ (`name`, `code`, `description`)
* `GET /api/v1/admin/schools/<school_id>`: ข้อมูลสถาบัน
* `PATCH /api/v1/admin/schools/<school_id>`: แก้ไขข้อมูลสถาบัน
* `DELETE /api/v1/admin/schools/<school_id>`: ลบสถาบัน
* `GET /api/v1/admin/schools/<school_id>/classrooms`: รายชื่อห้องเรียนในสถาบัน
* `POST /api/v1/admin/schools/<school_id>/classrooms`: มอบหมายห้องเรียนเข้าสถาบัน
* `PATCH /api/v1/admin/schools/<school_id>/classrooms/<classroom_id>`: ปรับปรุงสถานะห้องเรียนในสถาบัน
* `DELETE /api/v1/admin/schools/<school_id>/classrooms/<classroom_id>`: ปลดห้องเรียนออกจากสถาบัน
* `GET /api/v1/admin/schools/<school_id>/members`: รายชื่อสมาชิกในสถาบัน
* `POST /api/v1/admin/schools/<school_id>/members`: เพิ่มสมาชิกเข้าสถาบัน
* `PATCH /api/v1/admin/schools/<school_id>/members/<membership_id>`: ปรับเปลี่ยนตำแหน่งสมาชิกในสถาบัน
* `DELETE /api/v1/admin/schools/<school_id>/members/<membership_id>`: นำสมาชิกออกจากสถาบัน
* `GET /api/v1/admin/schools/available-users`: รายชื่อผู้ใช้ที่สามารถเพิ่มเข้าสถาบันได้

---

## 11. รหัสสถานะและการจัดการข้อผิดพลาด

| HTTP Status | คำอธิบาย | สาเหตุตัวอย่าง |
|---|---|---|
| `200 OK` | สำเร็จ | การดึงข้อมูล ค้นหา หรืออัปเดตข้อมูลสำเร็จ |
| `201 Created` | สร้างสำเร็จ | สร้างผู้ใช้, คอร์ส, ตอน หรืออัปโหลดไฟล์สำเร็จ |
| `400 Bad Request` | ข้อมูลคำขอไม่ถูกต้อง | ข้อมูลขาดหาย, รูปแบบฟิลด์ผิด หรือรหัสผ่านไม่ผ่านเกณฑ์ |
| `401 Unauthorized` | ขาดสิทธิ์ยืนยันตัวตน | ไม่มี Access Token, โทเคนหมดอายุ หรือไม่ถูกต้อง |
| `403 Forbidden` | ถูกปฏิเสธการเข้าถึง | บทบาทไม่ได้รับอนุญาต (เช่น User ทั่วไปเข้าถึง Endpoint เฉพาะ Super Admin) |
| `404 Not Found` | ไม่พบทรัพยากร | ID ของบทเรียน คอร์ส หรือผู้ใช้ ไม่มีอยู่ในฐานข้อมูล |
| `409 Conflict` | ข้อมูลซ้ำซ้อน | อีเมลนี้ถูกลงทะเบียนไว้แล้วในระบบ |
| `429 Too Many Requests` | เกินอัตราที่กำหนด | เรียก API ถี่เกิน Limit ของระบบ (Rate Limiting) |
| `500 Internal Error` | ข้อผิดพลาดภายในเซิร์ฟเวอร์ | ข้อผิดพลาดทางเทคนิคของฐานข้อมูลหรือโค้ดหลังบ้าน |

---

เอกสารนี้สร้างขึ้นโดยอิงตามเส้นทาง API จริงในโค้ด Flask (`backend/app/routes/`) และได้รับการตรวจสอบแล้ว 100%
