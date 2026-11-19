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

### Backend

* Python
* Flask
* REST API
* JWT Authentication
* SQLAlchemy
* PostgreSQL (Docker / Local Service)

---

## 📁 Project Structure

```text
e-learning-platform/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   ├── venv/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   └── ...
│
└── README.md
```

---

# 🚀 วิธีรันระบบ

ระบบประกอบด้วย 3 ส่วน:

1. PostgreSQL Database
2. Backend — Flask API
3. Frontend — React + Vite

ต้องเปิดทั้ง 3 ส่วนเพื่อให้ระบบทำงานครบ

---

# 1. 🗄️ Database — PostgreSQL

โปรเจกต์ใช้ PostgreSQL ผ่าน Docker

### เปิด Docker

เปิด **Docker Desktop** ก่อน

จากนั้นเปิด Terminal แล้วตรวจสอบ:

```cmd
docker ps
```

ควรพบ Container:

```text
elearning-postgres
```

และ Port:

```text
5432->5432
```

หาก Container ยังไม่ทำงาน:

```cmd
docker start elearning-postgres
```

PostgreSQL:

```text
Host: localhost
Port: 5432
```

> ต้องเปิด PostgreSQL ก่อนรัน Backend

---

# 2. 🔙 Backend

เปิด **Terminal ที่ 1**

### เข้าโฟลเดอร์ Backend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\backend
```

### เปิด Virtual Environment

```cmd
.\venv\Scripts\Activate
```

เมื่อสำเร็จจะเห็น:

```text
(venv)
```

ด้านหน้า Terminal

### ติดตั้ง Dependencies

ใช้ครั้งแรก หรือเมื่อ Dependencies มีการเปลี่ยนแปลง:

```cmd
pip install -r requirements.txt
```

### รัน Backend

```cmd
python app.py
```

เมื่อสำเร็จจะเห็น:

```text
* Running on http://127.0.0.1:5000
```

Backend:

```text
http://localhost:5000
```

API:

```text
http://localhost:5000/api/v1
```

> ต้องเปิด Terminal นี้ค้างไว้ขณะใช้งานระบบ

---

# 3. 🎨 Frontend

เปิด **Terminal ที่ 2**

### เข้าโฟลเดอร์ Frontend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\frontend
```

### ติดตั้ง Dependencies

ใช้ครั้งแรก:

```cmd
npm install
```

### รัน Frontend

```cmd
npm run dev
```

เมื่อสำเร็จจะได้:

```text
http://localhost:5173
```

เปิด Browser ที่:

```text
http://localhost:5173
```

> ต้องเปิด Terminal นี้ค้างไว้ขณะใช้งานระบบ

---

# 🔄 รันระบบครั้งต่อไป

หลังจากติดตั้ง Dependencies แล้ว ไม่ต้องรัน `pip install` หรือ `npm install` ทุกครั้ง

### 1. Docker / PostgreSQL

เปิด Docker Desktop

ตรวจสอบ:

```cmd
docker ps
```

ถ้า `elearning-postgres` ยังไม่ทำงาน:

```cmd
docker start elearning-postgres
```

### 2. Terminal 1 — Backend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\backend
.\venv\Scripts\Activate
python app.py
```

### 3. Terminal 2 — Frontend

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\frontend
npm run dev
```

### 4. เปิดเว็บไซต์

```text
http://localhost:5173
```

---

# 🌐 URLs

| ระบบ       | URL                          |
| ---------- | ---------------------------- |
| Frontend   | http://localhost:5173        |
| Backend    | http://localhost:5000        |
| API        | http://localhost:5000/api/v1 |
| PostgreSQL | localhost:5432               |

---

# 🔐 Environment

## Frontend

ไฟล์:

```text
frontend/.env
```

ตัวอย่าง:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Backend

ไฟล์:

```text
backend/.env
```

ใช้สำหรับค่าต่าง ๆ เช่น:

* PostgreSQL
* Database User / Password
* JWT Secret
* Security Configuration

> ไม่ควรนำ `.env`, Password, Secret Key หรือ API Key ขึ้น GitHub

---

# 🗄️ Database

PostgreSQL ทำงานผ่าน Docker Container:

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

เริ่ม Database:

```cmd
docker start elearning-postgres
```

หยุด Database:

```cmd
docker stop elearning-postgres
```

---

# 🔧 คำสั่งที่ใช้บ่อย

## Backend

Activate Virtual Environment:

```cmd
.\venv\Scripts\Activate
```

Run Backend:

```cmd
python app.py
```

Install Dependencies:

```cmd
pip install -r requirements.txt
```

Check Python:

```cmd
python --version
```

Check pip:

```cmd
pip --version
```

---

## Frontend

Install Dependencies:

```cmd
npm install
```

Run Development Server:

```cmd
npm run dev
```

Lint:

```cmd
npm run lint
```

Build:

```cmd
npm run build
```

---

## PostgreSQL

Check Container:

```cmd
docker ps
```

Start Container:

```cmd
docker start elearning-postgres
```

Stop Container:

```cmd
docker stop elearning-postgres
```

---

# ⚠️ Troubleshooting

## Login หรือ API ใช้งานไม่ได้

ตรวจสอบตามลำดับ:

### 1. PostgreSQL

```cmd
docker ps
```

ต้องพบ:

```text
elearning-postgres
```

### 2. PostgreSQL Port

```cmd
netstat -ano | findstr :5432
```

ควรมี:

```text
LISTENING
```

### 3. Backend

ตรวจสอบ Terminal ของ Backend ว่ามี:

```text
Running on http://127.0.0.1:5000
```

### 4. Frontend

ตรวจสอบว่าเปิดที่:

```text
http://localhost:5173
```

### 5. Environment

ตรวจสอบ:

```text
frontend/.env
backend/.env
```

ให้ค่าต่าง ๆ ถูกต้อง

### 6. Error Logs

หากยังมีปัญหา ให้ตรวจ:

* Browser Console
* Terminal ของ Frontend
* Terminal ของ Backend
* Docker Container Logs

---

# 👩‍💻 Development Flow

```text
Browser
   ↓
Frontend
React + Vite
   ↓
Axios
   ↓
REST API
   ↓
Backend
Flask
   ↓
PostgreSQL
Docker
```

---

# 🛑 หยุดระบบ

### Frontend

กด:

```text
Ctrl + C
```

ใน Terminal ของ Frontend

### Backend

กด:

```text
Ctrl + C
```

ใน Terminal ของ Backend

### PostgreSQL

```cmd
docker stop elearning-postgres
```

---

# 📌 Notes

* ต้องเปิด Docker Desktop ก่อนใช้งาน Database
* PostgreSQL ทำงานผ่าน Docker
* PostgreSQL ใช้ Port `5432`
* Backend ใช้ Port `5000`
* Frontend ใช้ Port `5173`
* ต้อง Activate `venv` ก่อนรัน Backend
* ต้องเปิด Backend และ Frontend พร้อมกันเพื่อใช้งานระบบ
* `venv/` และ `node_modules/` ไม่ควร Commit ขึ้น GitHub
* `.env` ไม่ควรเผยแพร่ข้อมูลลับ
* ไม่จำเป็นต้องรัน `netstat`, `tasklist` หรือ `sc query` ในการเปิดระบบตามปกติ

---

# 🚀 Quick Start

### Database

```cmd
docker start elearning-postgres
```

### Backend — Terminal 1

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\backend
.\venv\Scripts\Activate
python app.py
```

### Frontend — Terminal 2

```cmd
cd C:\Users\Milkp\Code\e-learning-platform\frontend
npm run dev
```

### Open Browser

```text
http://localhost:5173
```
