// ======================================================
// main.jsx
// จุดเริ่มต้นของ React Application
// ======================================================


// นำ StrictMode จาก React มาใช้
import { StrictMode } from "react";


// นำ createRoot สำหรับสร้าง React Application
import { createRoot } from "react-dom/client";


// นำ BrowserRouter มาใช้
// BrowserRouter ทำให้ React Router สามารถจัดการ URL ได้
import { BrowserRouter } from "react-router-dom";


// นำ CSS หลักของเว็บไซต์
import "./index.css";


// นำ App Component
import App from "./App";


// ======================================================
// สร้าง React Application
// ======================================================


// เลือก element ที่มี id="root"
// จากไฟล์ index.html
createRoot(document.getElementById("root")).render(

  <StrictMode>

    {/* BrowserRouter ครอบ App
        เพื่อเปิดใช้งานระบบ Routing */}
    <BrowserRouter>

      {/* Component หลักของเว็บไซต์ */}
      <App />

    </BrowserRouter>

  </StrictMode>
);