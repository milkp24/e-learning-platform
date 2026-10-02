# E-learning Platform

ระบบการเรียนรู้การเขียนโปรแกรมแบบโต้ตอบผ่านเว็บ
Interactive Web-Based Programming Learning Platform

---

## 🛠️ Technologies

### Frontend

* React
* Vite
* Tailwind CSS
* Zustand
* Axios
* React Router
* CodeMirror

### Backend

* Python
* Flask
* REST API
* JWT Authentication
* PostgreSQL
* Docker

---

## 📁 Project Structure

```text
e-learning-platform/
├── frontend/
└── backend/
```

---

# 🚀 วิธีรันระบบ

ระบบประกอบด้วย 3 ส่วนที่ต้องทำงานร่วมกัน:

1. PostgreSQL — Database
2. Backend — Flask API
3. Frontend — React + Vite

---

# 1. 🗄️ Database — PostgreSQL

โปรเจกต์ใช้ PostgreSQL ผ่าน Docker

เปิด **Docker Desktop** ก่อน

ตรวจสอบ PostgreSQL Container:

```cmd
docker ps
```

ควรพบ:

```text
elearning-postgres
```

และมี Port:

```text
5432->5432
```

หาก Container ยังไม่ทำงาน ให้ใช้:

```cmd
docker start elearning-postgres
```

PostgreSQL:

```text
localhost:5432
```

> PostgreSQL ต้องทำงานก่อนเริ่ม Backend

---

# 2. 🔙 Backend

เปิด **Terminal / CMD**

เข้าโฟลเดอร์ Backend:

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\backend
```

เปิด Virtual Environment:

```cmd
.\venv\Scripts\Activate
```

ติดตั้ง Dependencies **ครั้งแรกเท่านั้น**:

```cmd
pip install -r requirements.txt
```

รัน Backend:

```cmd
python app.py
```

เมื่อสำเร็จจะเห็น:

```text
Running on http://127.0.0.1:5000
```

Backend:

```text
http://localhost:5000
```

API:

```text
http://localhost:5000/api/v1
```

> ต้องเปิด Terminal หน้านี้ค้างไว้ขณะใช้งานระบบ

---

# 3. 🎨 Frontend

เปิด **Terminal / CMD ใหม่**

เข้าโฟลเดอร์ Frontend:

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\frontend
```

ติดตั้ง Dependencies **ครั้งแรกเท่านั้น**:

```cmd
npm install
```

รัน Frontend:

```cmd
npm run dev
```

Frontend:

```text
http://localhost:5173
```

> ต้องเปิด Terminal หน้านี้ค้างไว้ขณะใช้งานระบบ

---

# 🖥️ เปิดระบบ

เมื่อ PostgreSQL, Backend และ Frontend ทำงานแล้ว
เปิด Browser ที่:

```text
http://localhost:5173
```

ระบบจะเชื่อมต่อ:

```text
Frontend
    ↓
http://localhost:5000/api/v1
    ↓
Backend
    ↓
PostgreSQL :5432
```

---

# 🔄 รันระบบครั้งต่อไป

ไม่ต้องติดตั้ง Dependencies ใหม่

### Docker / PostgreSQL

เปิด Docker Desktop แล้วตรวจสอบ:

```cmd
docker ps
```

ถ้า `elearning-postgres` ยังไม่ทำงาน:

```cmd
docker start elearning-postgres
```

### Terminal 1 — Backend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\backend
.\venv\Scripts\Activate
python app.py
```

### Terminal 2 — Frontend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\frontend
npm run dev
```

จากนั้นเปิด:

```text
http://localhost:5173
```

---

## 🌐 URLs

| ระบบ       | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:5173        |
| Backend    | http://localhost:5000        |
| API        | http://localhost:5000/api/v1 |
| PostgreSQL | localhost:5432               |

---

## 🔐 Environment

### Frontend

ใช้ไฟล์:

```text
frontend/.env
```

ตัวอย่าง:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Backend

ใช้ไฟล์:

```text
backend/.env
```

สำหรับ:

* PostgreSQL Database
* JWT Secret
* Security Configuration
* Environment Configuration

> ไม่ควรนำ `.env`, Password, Secret Key หรือ API Key ขึ้น GitHub

---

## 🗄️ Database

Backend ใช้ **PostgreSQL ผ่าน Docker**

Container:

```text
elearning-postgres
```

Port:

```text
5432
```

ตรวจสอบสถานะ:

```cmd
docker ps
```

หากพบ:

```text
elearning-postgres
```

และมี:

```text
5432->5432
```

แสดงว่า PostgreSQL กำลังทำงาน

---

## 🔧 คำสั่งที่ใช้บ่อย

### Backend

```cmd
.\venv\Scripts\Activate
python app.py
```

### Frontend

```cmd
npm run dev
```

### Frontend Lint

```cmd
npm run lint
```

### Frontend Build

```cmd
npm run build
```

### ตรวจ PostgreSQL

```cmd
docker ps
```

### เริ่ม PostgreSQL Container

```cmd
docker start elearning-postgres
```

### หยุด PostgreSQL Container

```cmd
docker stop elearning-postgres
```

---

## ⚠️ หาก Login หรือ API ใช้งานไม่ได้

ตรวจสอบตามลำดับ:

1. Docker Desktop เปิดอยู่หรือไม่
2. `elearning-postgres` ทำงานอยู่หรือไม่
3. Backend กำลังทำงานอยู่หรือไม่
4. Backend แสดง `Running on http://127.0.0.1:5000` หรือไม่
5. `backend/.env` มีค่าการเชื่อมต่อ PostgreSQL ถูกต้องหรือไม่
6. `frontend/.env` มี `VITE_API_BASE_URL` ถูกต้องหรือไม่
7. ตรวจสอบ Error ใน Browser Console
8. ตรวจสอบ Error ใน Terminal ของ Backend

---

## 👩‍💻 Development Flow

```text
Browser
   ↓
Frontend
React + Vite
   ↓
Axios / REST API
   ↓
Backend
Flask
   ↓
PostgreSQL
Docker
```

---

## 📌 Notes

* ต้องเปิด Docker Desktop ก่อนใช้งาน Database
* ต้องเปิด PostgreSQL ก่อนรัน Backend
* ต้องเปิด Backend และ Frontend พร้อมกัน
* `venv/` และ `node_modules/` ไม่ควร Commit ขึ้น Git
* ไฟล์ `.env` ไม่ควรเผยแพร่ข้อมูลลับ
* ไม่จำเป็นต้องรัน `netstat`, `tasklist` หรือ `sc query` ในการเปิดระบบตามปกติ
* หากปิด Terminal ของ Backend หรือ Frontend ส่วนนั้นจะหยุดทำงาน

---

## 🚀 Quick Start

### Database

```cmd
docker start elearning-postgres
```

### Backend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\backend
.\venv\Scripts\Activate
python app.py
```

### Frontend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\frontend
npm run dev
```

### Open

```text
http://localhost:5173
```
