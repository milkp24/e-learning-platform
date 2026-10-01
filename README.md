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

---

## 📁 Project Structure

```text
e-learning-platform/
├── frontend/
└── backend/
```

---

# 🚀 วิธีรันระบบ

ระบบต้องเปิด **Frontend และ Backend พร้อมกัน**

## 1. Backend

เปิด Terminal

```powershell
cd C:\Users\Milkp\Code\e-learning-platform\backend
```

เปิด Virtual Environment

```powershell
.\venv\Scripts\Activate
```

ติดตั้ง Dependencies ครั้งแรก

```powershell
pip install -r requirements.txt
```

รัน Backend

```powershell
python app.py
```

Backend:

```text
http://localhost:5000
```

API:

```text
http://localhost:5000/api/v1
```

---

## 2. Frontend

เปิด **Terminal ใหม่**

```powershell
cd C:\Users\Milkp\Code\e-learning-platform\frontend
```

ติดตั้ง Dependencies ครั้งแรก

```powershell
npm install
```

รัน Frontend

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🖥️ เปิดระบบ

เมื่อ Backend และ Frontend ทำงานแล้ว เปิด Browser ที่:

```text
http://localhost:5173
```

ระบบจะเชื่อมต่อ Frontend กับ Backend ผ่าน:

```text
http://localhost:5000/api/v1
```

---

# 🔄 รันระบบครั้งต่อไป

### Terminal 1 — Backend

```powershell
cd C:\Users\Milkp\Code\e-learning-platform\backend
.\venv\Scripts\Activate
python app.py
```

### Terminal 2 — Frontend

```powershell
cd C:\Users\Milkp\Code\e-learning-platform\frontend
npm run dev
```

---

## 🌐 URLs

| ระบบ     | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:5000        |
| API      | http://localhost:5000/api/v1 |

---

## 🔐 Environment

Frontend ใช้:

```text
frontend/.env
```

ตัวอย่าง:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Backend ใช้:

```text
backend/.env
```

สำหรับค่าการเชื่อมต่อ PostgreSQL และค่าความปลอดภัยของระบบ

> ไม่ควรนำ `.env`, Password, Secret Key หรือ API Key ขึ้น GitHub

---

## 🗄️ Database

Backend ใช้ **PostgreSQL**

ตรวจสอบให้แน่ใจว่า PostgreSQL ทำงานอยู่ และค่าการเชื่อมต่อใน `backend/.env` ถูกต้องก่อนรัน Backend

---

## 🔧 คำสั่งที่ใช้บ่อย

### Backend

```powershell
.\venv\Scripts\Activate
python app.py
```

### Frontend

```powershell
npm run dev
```

### Frontend Lint

```powershell
npm run lint
```

### Frontend Build

```powershell
npm run build
```

---

## ⚠️ หาก Login หรือ API ใช้งานไม่ได้

ตรวจสอบว่า:

1. Backend กำลังทำงาน
2. PostgreSQL กำลังทำงาน
3. `backend/.env` ถูกต้อง
4. `frontend/.env` มี `VITE_API_BASE_URL` ถูกต้อง
5. เปิด Browser Console ตรวจสอบ Error
6. ตรวจสอบ Error ใน Terminal ของ Backend

---

## 👩‍💻 Development Flow

```text
Browser
   ↓
Frontend (React + Vite)
   ↓
Axios / REST API
   ↓
Backend (Flask)
   ↓
PostgreSQL
```

---

## 📌 Notes

* ต้องเปิด Backend และ Frontend พร้อมกัน
* `venv/` และ `node_modules/` ไม่ควร Commit ขึ้น Git
* ไฟล์ `.env` ไม่ควรเผยแพร่ข้อมูลลับ
