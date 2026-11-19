# E-Learning Platform - Full-Stack Handover Documentation

ยินดีต้อนรับสู่คู่มือการติดตั้งและการส่งมอบระบบ **E-Learning Platform** ระบบจัดการการเรียนรู้ออนไลน์แบบครบวงจร (Full-Stack LMS) พัฒนาด้วย **React + Vite** ในฝั่ง Frontend, **Flask (Python)** ในฝั่ง Backend และ **PostgreSQL** เป็นฐานข้อมูลหลัก

---

## สารบัญ (Table of Contents)
1. [ภาพรวมสถาปัตยกรรมระบบ (Architecture Overview)](#ภาพรวมสถาปัตยกรรมระบบ-architecture-overview)
2. [พอร์ตและ URL การเชื่อมต่อ (Ports & Service URLs)](#พอร์ตและ-url-การเชื่อมต่อ-ports--service-urls)
3. [ความต้องการของระบบ (Prerequisites)](#ความต้องการของระบบ-prerequisites)
4. [คู่มือการติดตั้งและเริ่มใช้งาน (Setup & Installation Guide)](#คู่มือการติดตั้งและเริ่มใช้งาน-setup--installation-guide)
   - [1. ฐานข้อมูล PostgreSQL](#1-ฐานข้อมูล-postgresql)
   - [2. การตั้งค่า Backend (Flask API)](#2-การตั้งค่า-backend-flask-api)
   - [3. การตั้งค่า Frontend (React / Vite)](#3-การตั้งค่า-frontend-react--vite)
5. [ตัวแปรสภาพแวดล้อม (Environment Variables)](#ตัวแปรสภาพแวดล้อม-environment-variables)
6. [ระดับสิทธิ์ผู้ใช้งานในระบบ (RBAC Matrix)](#ระดับสิทธิ์ผู้ใช้งานในระบบ-rbac-matrix)
7. [ฟีเจอร์หลักของระบบ (Key Features)](#ฟีเจอร์หลักของระบบ-key-features)
8. [คู่มือการรันชุดทดสอบ (Testing & Regression Suite)](#คู่มือการรันชุดทดสอบ-testing--regression-suite)
9. [การแก้ไขปัญหาที่พบบ่อย (Troubleshooting & FAQs)](#การแก้ไขปัญหาที่พบบ่อย-troubleshooting--faqs)

---

## ภาพรวมสถาปัตยกรรมระบบ (Architecture Overview)

```mermaid
flowchart TD
    Client["Client Browsers (Chrome / Edge / Firefox / Safari)"]
    Frontend["Frontend: React 19 + Vite (Port 5173)\nTailwind CSS, Zustand, React Router 7"]
    Backend["Backend: Flask API v1 (Port 5000)\nFlask-JWT-Extended, SQLAlchemy"]
    DB[("Database: PostgreSQL 14+\n(Port 5432)")]
    Storage["Media Storage Directory\n(uploads/videos, uploads/documents)"]

    Client -->|HTTP / SPA Navigation| Frontend
    Frontend -->|REST API Requests /api/v1| Backend
    Frontend <-->|BroadcastChannel + StorageEvent| Client
    Backend -->|SQL Queries / Connection Pool| DB
    Backend -->|Stream 206 Partial Content| Storage
```

---

## พอร์ตและ URL การเชื่อมต่อ (Ports & Service URLs)

| บริการ (Service) | URL / ที่อยู่การเชื่อมต่อ | คำอธิบาย (Description) |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | React Single Page Application (Vite Dev Server) |
| **Backend REST API** | `http://localhost:5000/api/v1` | Flask REST API พร้อม JWT และ CORS |
| **Media Stream Endpoint**| `http://localhost:5000/api/v1/media/uploads/` | สตรีมไฟล์ MP4/WebM (HTTP 206) และ PDF |
| **PostgreSQL Database** | `localhost:5432` | ฐานข้อมูลหลักชื่อ `elearning_db` |

---

## ความต้องการของระบบ (Prerequisites)

- **Node.js**: เวอร์ชัน `>= 18.0.0` (แนะนำ LTS v20+)
- **Python**: เวอร์ชัน `>= 3.10` (แนะนำ 3.11 หรือ 3.12)
- **PostgreSQL**: เวอร์ชัน `>= 14`
- **เบราว์เซอร์สำหรับการทดสอบ**: Chromium, Google Chrome, Microsoft Edge, Mozilla Firefox, WebKit

---

## คู่มือการติดตั้งและเริ่มใช้งาน (Setup & Installation Guide)

### 1. ฐานข้อมูล PostgreSQL

1. เปิด PostgreSQL Shell (`psql`) หรือ pgAdmin:
   ```bash
   psql -U postgres
   ```
2. สร้างฐานข้อมูล `elearning_db`:
   ```sql
   CREATE DATABASE elearning_db;
   ```

### 2. การตั้งค่า Backend (Flask API)

1. เข้าสู่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. สร้างและเปิดใช้งาน Virtual Environment:
   - **Windows PowerShell**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. ติดตั้ง Dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. คัดลอกและตั้งค่า `.env`:
   ```bash
   cp .env.example .env
   ```
   *ตรวจสอบ `DATABASE_URL` และรหัสผ่านฐานข้อมูล PostgreSQL ให้ถูกต้อง*
5. รันเซิร์ฟเวอร์ Backend:
   ```bash
   python app.py
   ```
   *(เซิร์ฟเวอร์จะเริ่มทำงานที่ `http://127.0.0.1:5000`)*

### 3. การตั้งค่า Frontend (React / Vite)

1. เข้าสู่โฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. คัดลอกและตั้งค่า `.env`:
   ```bash
   cp .env.example .env
   ```
   *ตรวจสอบให้ `VITE_API_BASE_URL=http://localhost:5000/api/v1`*
4. ติดตั้ง Browser Binaries สำหรับ Playwright E2E Testing (หากต้องการรันการทดสอบ):
   ```bash
   npx playwright install firefox webkit
   ```
5. รันเซิร์ฟเวอร์ Frontend:
   ```bash
   npm run dev
   ```
   *(แอปพลิเคชันจะเปิดที่ `http://localhost:5173`)*

---

## ตัวแปรสภาพแวดล้อม (Environment Variables)

### Backend (`backend/.env`)
| Key | คำอธิบาย | ค่าเริ่มต้นสำหรับ Development |
|---|---|---|
| `FLASK_APP` | ไฟล์หลักของแอปพลิเคชัน | `app.py` |
| `FLASK_DEBUG` | โหมดดีบัก | `True` |
| `SECRET_KEY` | คีย์เข้ารหัสเซสชัน | *(ข้อความลับ)* |
| `JWT_SECRET_KEY` | คีย์สำหรับลงนาม JWT | *(ข้อความลับ)* |
| `JWT_ACCESS_TOKEN_EXPIRES_MINUTES` | อายุของ Access Token (ตรงกับ Session Timeout) | `30` |
| `DB_USER` | ชื่อผู้ใช้ PostgreSQL | `postgres` |
| `DB_PASSWORD` | รหัสผ่าน PostgreSQL | `postgres` |
| `DB_HOST` | Host ของฐานข้อมูล | `localhost` |
| `DB_PORT` | พอร์ตของฐานข้อมูล | `5432` |
| `DB_NAME` | ชื่อฐานข้อมูล | `elearning_db` |
| `DATABASE_URL` | Connection String แบบเต็ม | `postgresql://postgres:postgres@localhost:5432/elearning_db` |
| `CORS_ORIGINS` | โดเมนที่อนุญาตให้เรียก API | `http://localhost:5173` |
| `FRONTEND_URL` | URL ของ Frontend สำหรับลิงก์อีเมล | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Key | คำอธิบาย | ค่าเริ่มต้นสำหรับ Development |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL สำหรับเชื่อมต่อ Flask REST API | `http://localhost:5000/api/v1` |

---

## ระดับสิทธิ์ผู้ใช้งานในระบบ (RBAC Matrix)

ระบบมีสิทธิ์ผู้ใช้งาน 5 ระดับ โดยแยกบทบาทและการเข้าถึงอย่างเคร่งครัด:

| หน้าที่ / ความสามารถ | Guest | Student | Instructor | Admin | Super Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| ดูแคตตาล็อกหลักสูตรสาธารณะ | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| เข้าเรียนบทเรียนและเล่นวิดีโอ/PDF | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| จัดการบันทึกการเรียนรู้ (Learning Journal) | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| แก้ไขข้อมูลโปรไฟล์ (Display Name, Avatar) | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| จัดการเนื้อหาหลักสูตรและอัปโหลดมีเดีย | :x: | :x: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| ดู Dashboard สถิติและจัดการสถานะผู้ใช้ | :x: | :x: | :x: | :white_check_mark: | :white_check_mark: |
| ปรับแต่งค่าระบบ (Session Timeout, System Settings) | :x: | :x: | :x: | :x: | :white_check_mark: |
| จัดการพนักงานและดู SuperAdmin Audit Logs | :x: | :x: | :x: | :x: | :white_check_mark: |

---

## ฟีเจอร์หลักของระบบ (Key Features)

1. **Authentication & Session Security**:
   - Access Token หมดอายุ 30 นาที สอดคล้องกับ Inactivity Timeout ในระบบ
   - Refresh Token หมดอายุ 7 วัน พร้อม Token Blocklist เมื่อออกจากระบบ
   - ป้องกันการเข้าถึง Route โดยไม่มีสิทธิ์ (Redirection to `/login`)
2. **Media & YouTube Player (UAT-021 & UAT-029)**:
   - รองรับการอัปโหลดไฟล์วิดีโอ MP4 / WebM โดยตรงเข้าสู่เซิร์ฟเวอร์ พร้อมตรวจสอบ MIME Type และขนาดไฟล์ไม่เกิน 50MB
   - รองรับ HTTP 206 Partial Content Streaming เพื่อให้ผู้เรียนสามารถเลื่อนข้ามเวลา (Seek) ได้อย่างลื่นไหล
   - รองรับ YouTube Safe Embed (`youtube-nocookie.com`) พร้อม Sandboxing
3. **Embedded PDF Viewer (UAT-028)**:
   - หน้าแสดงเอกสาร PDF ในตัวบทเรียนโดยตรง
   - มีปุ่ม "เปิดดูในแท็บใหม่" และ "ดาวน์โหลด PDF" สำหรับผู้เรียน
4. **Client Inactivity & Multi-Tab Synchronization (UAT-037)**:
   - ตรวจจับกิจกรรมผู้ใช้ (Mouse, Key, Touch, Scroll)
   - หน้าต่างแจ้งเตือนก่อนหมดเวลา 120 วินาที พร้อมปุ่มต่ออายุเซสชัน
   - เชื่อมโยงสถานะข้ามแท็บผ่าน `BroadcastChannel` และ `StorageEvent` (เมื่อออกจากระบบ หรือเซสชันหมดอายุในแท็บหนึ่ง แท็บอื่นๆ จะซิงค์ตามทันทีโดยไม่เกิดลูปซ้ำซ้อน)
5. **Learning Journal System (UAT-031)**:
   - บันทึกการสะท้อนความคิดของผู้เรียน บันทึกและดึงข้อมูลจาก PostgreSQL จริง

---

## คู่มือการรันชุดทดสอบ (Testing & Regression Suite)

ทุกชุดทดสอบใช้ข้อมูลจริงจากฐานข้อมูล PostgreSQL โดยไม่มีการ Mock Data:

### 1. การทดสอบฝั่ง Backend
```bash
# รัน Regression Test รวมทั้งระบบ (Auth, Timeout, RBAC, Journal, Admin, Sequencing)
python backend/test_regression_runner.py

# ทดสอบ UAT-021 Media Upload & Streaming
python backend/test_uat021_upload.py

# ทดสอบ UAT-024 Profile Validation & RBAC
python backend/test_uat024_profile.py
```

### 2. การทดสอบฝั่ง Frontend
```bash
# รัน UAT-037 Multi-Tab Session Synchronization Test
node frontend/scripts/test_uat037_multitab.js

# รัน UAT-047 Comprehensive Cross-Browser Test (Chromium, Chrome, Edge, Firefox, WebKit)
node frontend/scripts/test_uat047_crossbrowser.js

# รัน UI & End-to-End Regression Suite
node frontend/scripts/run_ui_regression_suite.js

# รัน Complete Automated UAT Runner
node frontend/scripts/execute_full_uat.js
```

---

## การแก้ไขปัญหาที่พบบ่อย (Troubleshooting & FAQs)

### 1. ปัญหาพอร์ตชนกัน (Port Conflicts)
- **พอร์ต 5000 ถูกใช้งานอยู่**: ตรวจสอบว่ามีเซิร์ฟเวอร์ Flask หรือ AirPlay / ระบบอื่นใช้งานอยู่หรือไม่:
  ```powershell
  Get-NetTCPConnection -LocalPort 5000
  ```
- **พอร์ต 5173 ถูกใช้งานอยู่**: Vite จะสลับไปใช้พอร์ต 5174 โดยอัตโนมัติ ให้ตรวจสอบและปรับ `VITE_API_BASE_URL` หรือยุติโพรเซสเดิม

### 2. การติดตั้ง Browser Binaries สำหรับ Playwright
หากรันชุดทดสอบแล้วแจ้งเตือนว่าไม่พบ Firefox หรือ WebKit:
```bash
cd frontend
npx playwright install firefox webkit
```

### 3. ปัญหาการแสดงผลภาษาไทยใน Windows Terminal
บน Windows PowerShell หากรัน Python สคริปต์แล้วพบ UnicodeEncodeError จากการพิมพ์ภาษาไทย ให้ตรวจสอบว่ามีคำสั่ง reconfigure ในสคริปต์:
```python
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
```

### 4. บัญชี Admin สำหรับการทดสอบ (Test Provisioning)
หากรัน `test_regression_runner.py` แล้วพบข้อผิดพลาดเกี่ยวกับบัญชี Admin ตรวจสอบให้แน่ใจว่าในตาราง `users` มีบัญชี `qa_admin@test.com` พร้อมบทบาท `admin` ในฐานข้อมูล `elearning_db`
